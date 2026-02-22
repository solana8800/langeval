import os
import httpx
from base64 import b64encode

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "mock_client_id")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "mock_client_secret")
PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")

BASE_URL = "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"

PAYPAL_PRO_PLAN_ID = os.getenv("PAYPAL_PRO_PLAN_ID", "P-0MD61176KG488245ENA4XY3I")
PAYPAL_ENTERPRISE_PLAN_ID = os.getenv("PAYPAL_ENTERPRISE_PLAN_ID", "P-0MD61176KG488245ENA4XY3I")

PAYPAL_PRO_ANNUAL_PLAN_ID = os.getenv("PAYPAL_PRO_ANNUAL_PLAN_ID", "P-0MD61176KG488245ENA4XY3I")
PAYPAL_ENTERPRISE_ANNUAL_PLAN_ID = os.getenv("PAYPAL_ENTERPRISE_ANNUAL_PLAN_ID", "P-0MD61176KG488245ENA4XY3I")

# The following IDs should match the ones created in your PayPal Developer Sandbox Dashboard
PAYPAL_PLAN_MAPPING = {
    "Pro_monthly": PAYPAL_PRO_PLAN_ID,
    "Enterprise_monthly": PAYPAL_ENTERPRISE_PLAN_ID,
    "Pro_yearly": PAYPAL_PRO_ANNUAL_PLAN_ID,
    "Enterprise_yearly": PAYPAL_ENTERPRISE_ANNUAL_PLAN_ID
}

async def get_access_token() -> str:
    """Gets an OAuth2 access token from PayPal."""
    if PAYPAL_CLIENT_ID == "mock_client_id":
        return "mock_access_token"

    headers = {
        "Accept": "application/json",
        "Accept-Language": "en_US",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/v1/oauth2/token",
            data={"grant_type": "client_credentials"},
            headers=headers,
            auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
        )
        if response.status_code != 200:
             print(f"Failed PayPal Auth (Status {response.status_code}): {response.text}", flush=True)
        response.raise_for_status()
        return response.json()["access_token"]

async def create_subscription(plan_name: str, workspace_id: str, return_url: str, cancel_url: str, is_yearly: bool = False) -> dict:
    """Creates a PayPal subscription and returns the approval URL."""
    cycle = "yearly" if is_yearly else "monthly"
    mapping_key = f"{plan_name}_{cycle}"
    paypal_plan_id = PAYPAL_PLAN_MAPPING.get(mapping_key)
    
    # Fallback to monthly if yearly not found (though it should be)
    if not paypal_plan_id:
        paypal_plan_id = PAYPAL_PLAN_MAPPING.get(f"{plan_name}_monthly")
        
    if not paypal_plan_id:
        raise ValueError(f"No PayPal Plan ID mapped for {plan_name} ({cycle})")

    if PAYPAL_CLIENT_ID == "mock_client_id":
        # Simulate successful response for testing without real credentials
        return {
            "id": f"I-MOCKSUB{workspace_id[:8]}",
            "status": "APPROVAL_PENDING",
            "links": [
                {"href": f"https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=TEST-{workspace_id}", "rel": "approve"}
            ]
        }

    token = await get_access_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    payload = {
        "plan_id": paypal_plan_id,
        "custom_id": str(workspace_id), # We store workspace_id here to link it when webhook fires
        "application_context": {
            "brand_name": "Langeval Platform",
            "locale": "en-US",
            "shipping_preference": "NO_SHIPPING",
            "user_action": "SUBSCRIBE_NOW",
            "return_url": return_url,
            "cancel_url": cancel_url
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/v1/billing/subscriptions",
            json=payload,
            headers=headers
        )
        if response.status_code not in [200, 201]:
             print(f"Failed PayPal Sub Create (Status {response.status_code}): {response.text}", flush=True)
        response.raise_for_status()
        return response.json()

async def verify_subscription_transaction(subscription_id: str) -> dict:
    """Gets subscription details to verify payment and latest transaction."""
    if PAYPAL_CLIENT_ID == "mock_client_id":
        return {
            "status": "ACTIVE",
            "last_payment_amount": 90.0,
            "currency": "USD",
            "transaction_id": f"MOCK-TXN-{subscription_id[-8:]}"
        }

    token = await get_access_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        # First get the subscription details to check status
        sub_resp = await client.get(
            f"{BASE_URL}/v1/billing/subscriptions/{subscription_id}",
            headers=headers
        )
        sub_resp.raise_for_status()
        sub_data = sub_resp.json()
        
        status = sub_data.get("status")
        next_billing_time = sub_data.get("billing_info", {}).get("next_billing_time")
        
        # Then get the transactions for this subscription to get actual paid amount
        # We look at the past 3 days to catch the recent payment
        import datetime
        end_time = datetime.datetime.utcnow().isoformat() + "Z"
        start_time = (datetime.datetime.utcnow() - datetime.timedelta(days=3)).isoformat() + "Z"
        
        txn_resp = await client.get(
            f"{BASE_URL}/v1/billing/subscriptions/{subscription_id}/transactions?start_time={start_time}&end_time={end_time}",
            headers=headers
        )
        txn_resp.raise_for_status()
        txn_data = txn_resp.json()
        
        transactions = txn_data.get("transactions", [])
        
        result = {
            "status": status,
            "next_billing_time": next_billing_time,
            "last_payment_amount": 0.0,
            "currency": "USD",
            "transaction_id": None
        }
        
        # Find the latest COMPLETED transaction
        for txn in transactions:
            if txn.get("status") == "COMPLETED":
                amount_info = txn.get("amount_with_breakdown", {}).get("gross_amount", {})
                result["last_payment_amount"] = float(amount_info.get("value", 0))
                result["currency"] = amount_info.get("currency_code", "USD")
                result["transaction_id"] = txn.get("id")
                break
                
        return result
