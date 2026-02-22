from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlmodel import Session, select
import uuid
import httpx
import os

from core.db import get_session
from core.security import verify_token
from models.models import Plan, Subscription, Workspace, User, Transaction
from services.paypal import create_subscription, verify_subscription_transaction

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/google")

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return payload.get("sub")

def get_current_user(user_id: str = Depends(get_current_user_id), session: Session = Depends(get_session)):
    user = session.get(User, uuid.UUID(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/plans")
def list_plans(session: Session = Depends(get_session)):
    plans = session.exec(select(Plan)).all()
    return plans

@router.get("/subscription")
async def get_current_subscription(
    workspace_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    sub = session.exec(select(Subscription).where(Subscription.workspace_id == workspace_id)).first()
    if not sub:
        free_plan = session.exec(select(Plan).where(Plan.name == "Free")).first()
        if not free_plan:
             raise HTTPException(status_code=500, detail="System configuration error: Free plan not found")
             
        sub = Subscription(
            workspace_id=workspace_id,
            plan_id=free_plan.id,
            status="active"
        )
        session.add(sub)
        session.commit()
        session.refresh(sub)
    elif sub.status == "active" and sub.paypal_sub_id and not sub.period_end:
        # Sync period_end if missing for older subscriptions
        try:
            verification = await verify_subscription_transaction(sub.paypal_sub_id)
            if verification.get("next_billing_time"):
                import datetime
                sub.period_end = datetime.datetime.fromisoformat(verification.get("next_billing_time").replace("Z", "+00:00")).replace(tzinfo=None)
                session.add(sub)
                session.commit()
                session.refresh(sub)
        except Exception as e:
            print(f"Sync period_end error: {e}")
            
    return {"subscription": sub, "plan": sub.plan}

class CheckoutRequest(BaseModel):
    workspace_id: uuid.UUID
    plan_id: uuid.UUID
    is_yearly: bool = False

@router.post("/checkout")
async def create_checkout_session(
    req: CheckoutRequest,
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    print(f"Debug: Received checkout request for workspace {req.workspace_id}, plan {req.plan_id}", flush=True)
    plan = session.get(Plan, req.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if plan.name == "Free":
        raise HTTPException(status_code=400, detail="Cannot checkout Free plan")
    
    # Generate redirect URLs for frontend
    # In production, this should be the frontend's base URL
    origin = request.headers.get("origin", "http://localhost:3000")
    # Pass plan_id so the frontend knows what plan was just paid for
    return_url = f"{origin}/settings/billing?success=true&workspace_id={req.workspace_id}&plan_id={req.plan_id}&is_yearly={str(req.is_yearly).lower()}"
    cancel_url = f"{origin}/settings/billing?canceled=true"

    try:
        sub_response = await create_subscription(plan.name, str(req.workspace_id), return_url, cancel_url, req.is_yearly)
        # Find the 'approve' link
        approve_link = next((link["href"] for link in sub_response.get("links", []) if link["rel"] == "approve"), None)
        
        if not approve_link:
            raise HTTPException(status_code=500, detail="PayPal did not return an approval link")
            
        return {
            "status": "success",
            "checkout_url": approve_link,
            "subscription_id": sub_response.get("id"),
            "gateway": "paypal"
        }
    except Exception as e:
        print(f"Checkout Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

from typing import Optional

class CheckoutSuccessRequest(BaseModel):
    workspace_id: uuid.UUID
    subscription_id: str
    plan_id: Optional[uuid.UUID] = None
    is_yearly: bool = False

@router.post("/checkout/success")
async def checkout_success(
    req: CheckoutSuccessRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    sub = session.exec(select(Subscription).where(Subscription.workspace_id == req.workspace_id)).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    plan = None
    if req.plan_id:
        plan = session.get(Plan, req.plan_id)
        if not plan:
             raise HTTPException(status_code=404, detail="Plan not found")
             
    try:
        # Verify transaction and payment status directly with PayPal
        verification = await verify_subscription_transaction(req.subscription_id)
        
        status = verification.get("status")
        next_billing_time = verification.get("next_billing_time")
        paid_amount = verification.get("last_payment_amount", 0.0)
        currency = verification.get("currency", "USD")
        txn_id = verification.get("transaction_id")
        
        if status != "ACTIVE":
             raise ValueError("Subscription is not active on PayPal")
             
        # Optional: update amount from plan if PayPal is extremely delayed
        if paid_amount == 0 and plan:
             paid_amount = plan.price_annual if req.is_yearly else plan.price_monthly
             
        # Update Subscription
        is_same_plan = sub.plan_id == plan.id if plan else False
        sub.status = "active"
        sub.paypal_sub_id = req.subscription_id
        if plan:
            sub.plan_id = plan.id
            
        import datetime
        now = datetime.datetime.utcnow()
        if is_same_plan and sub.period_end and sub.period_end > now:
            # Extending existing plan manually
            days_to_add = 365 if req.is_yearly else 30
            sub.period_end = sub.period_end + datetime.timedelta(days=days_to_add)
        elif next_billing_time:
            # New or replaced plan
            try:
                sub.period_end = datetime.datetime.fromisoformat(next_billing_time.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception as e:
                print(f"Failed to parse next_billing_time {next_billing_time}: {e}")
            
        session.add(sub)
        
        # Prevent duplicate transactions generated by frontend double-firing
        recent_txn = session.exec(
            select(Transaction)
            .where(Transaction.workspace_id == req.workspace_id)
            .where(Transaction.subscription_id == sub.id)
            .where(Transaction.created_at > datetime.datetime.utcnow() - datetime.timedelta(seconds=30))
            .order_by(Transaction.created_at.desc())
        ).first()

        if recent_txn:
            # Update if we got better data this time
            if txn_id and not recent_txn.paypal_transaction_id:
                recent_txn.paypal_transaction_id = txn_id
                recent_txn.amount = paid_amount
                recent_txn.currency = currency
                if paid_amount > 0 or txn_id:
                    recent_txn.status = "completed"
                session.add(recent_txn)
                session.commit()
            return {"status": "success", "transaction_id": str(recent_txn.id)}
            
        # Determine status: If no tx_id, it might be heavily pending from PayPal
        tx_status = "completed" if txn_id else "pending"

        # Record Transaction
        txn = Transaction(
            workspace_id=req.workspace_id,
            subscription_id=sub.id,
            amount=paid_amount,
            currency=currency,
            status=tx_status,
            paypal_transaction_id=txn_id
        )
        session.add(txn)
        
        session.commit()
        return {"status": "success", "transaction_id": str(txn.id)}
        
    except ValueError as e:
        print(f"Verification Check Failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error checking out success: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify payment")

@router.get("/transactions")
async def get_transactions(
    workspace_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Retrieve all transactions for the workspace
    transactions = session.exec(
        select(Transaction)
        .where(Transaction.workspace_id == workspace_id)
        .order_by(Transaction.created_at.desc())
    ).all()
    
    changed = False
    for txn in transactions:
        # Sync if it's pending or amount is $0 (PayPal Sandbox delay workaround)
        if txn.status == "pending" or not txn.paypal_transaction_id or txn.amount == 0:
            if txn.subscription_id:
                sub = session.get(Subscription, txn.subscription_id)
                if sub and sub.paypal_sub_id:
                    try:
                        verification = await verify_subscription_transaction(sub.paypal_sub_id)
                        
                        paid_amount = verification.get("last_payment_amount", 0.0)
                        if paid_amount == 0 and sub.plan:
                            paid_amount = sub.plan.price_monthly # Fallback
                            
                        # Update txn properties
                        if verification.get("transaction_id"):
                            txn.paypal_transaction_id = verification.get("transaction_id")
                            
                        if txn.amount == 0 and paid_amount > 0:
                            txn.amount = paid_amount
                            
                        if txn.currency == "USD" and verification.get("currency"):
                            txn.currency = verification.get("currency")
                            
                        if txn.paypal_transaction_id and txn.amount > 0:
                            txn.status = "completed"
                            
                        # Background update subscription
                        if verification.get("next_billing_time") and not sub.period_end:
                            import datetime
                            try:
                                sub.period_end = datetime.datetime.fromisoformat(verification.get("next_billing_time").replace("Z", "+00:00")).replace(tzinfo=None)
                                session.add(sub)
                            except:
                                pass
                                
                        session.add(txn)
                        changed = True
                    except Exception as e:
                        print(f"Error syncing pending txn {txn.id}: {e}")

    if changed:
        session.commit()
        for txn in transactions:
            session.refresh(txn)

    return transactions

@router.post("/webhook")
async def paypal_webhook(request: Request, session: Session = Depends(get_session)):
    payload = await request.json()
    event_type = payload.get("event_type")
    resource = payload.get("resource", {})
    
    print(f"Received PayPal Webhook: {event_type}")

    if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
        custom_id = resource.get("custom_id") # This is workspace_id
        paypal_sub_id = resource.get("id")
        plan_id_paypal = resource.get("plan_id")
        
        if custom_id:
            try:
                ws_uuid = uuid.UUID(custom_id)
                sub = session.exec(select(Subscription).where(Subscription.workspace_id == ws_uuid)).first()
                if sub:
                    sub.status = "active"
                    sub.paypal_sub_id = paypal_sub_id
                    # Need to verify which DB plan this paypal_plan_id maps to
                    # For now, if they paid, we assume Pro (hardcoded mapping matching the request)
                    # Real implementation should look up Plan ID
                    pro_plan = session.exec(select(Plan).where(Plan.name == "Pro")).first()
                    if pro_plan:
                        sub.plan_id = pro_plan.id
                    session.add(sub)
                    session.commit()
                    print(f"Successfully activated subscription {paypal_sub_id} for workspace {custom_id}")
            except Exception as e:
                print(f"Error updating subscription on ACTIVATED: {e}")

    elif event_type in ["BILLING.SUBSCRIPTION.CANCELLED", "BILLING.SUBSCRIPTION.SUSPENDED"]:
        custom_id = resource.get("custom_id")
        if custom_id:
            try:
                ws_uuid = uuid.UUID(custom_id)
                sub = session.exec(select(Subscription).where(Subscription.workspace_id == ws_uuid)).first()
                if sub:
                    # Revert to Free Plan
                    free_plan = session.exec(select(Plan).where(Plan.name == "Free")).first()
                    if free_plan:
                        sub.plan_id = free_plan.id
                    sub.status = "canceled"
                    session.add(sub)
                    session.commit()
                    print(f"Successfully canceled subscription for workspace {custom_id}")
            except Exception as e:
                print(f"Error updating subscription on CANCELLED: {e}")
        
    return {"status": "success"}
