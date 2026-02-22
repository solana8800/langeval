from fastapi import APIRouter, BackgroundTasks, Depends
from typing import Dict, Any, List
import uuid
import os
import json
from datetime import datetime
# from langfuse.callback import CallbackHandler
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import CreateCampaignRequest, CampaignResponse
from app.services.workflow import build_dynamic_graph
from app.services.checkpointer import get_checkpointer, get_redis_client
from app.db.engine import get_db
from app.db.repository import CampaignRepository

from fastapi import HTTPException, Header
import httpx

async def check_workspace_quota(workspace_id: str):
    if not workspace_id:
        return # Skip if no workspace provided in internal mode
    try:
        url = f"http://billing-service:8000/api/v1/billing/subscription?workspace_id={workspace_id}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                plan = data.get("plan", {})
                max_runs = plan.get("features", {}).get("max_runs_per_month", 50)
                
                if max_runs == -1:
                    return # Unlimited plan
                    
                redis = get_redis_client()
                current_month = datetime.now().strftime('%Y-%m')
                usage_key = f"usage:{workspace_id}:{current_month}:runs"
                
                # Get current usage
                count = await redis.get(usage_key)
                current_count = int(count) if count else 0
                
                if current_count >= max_runs:
                    raise HTTPException(
                        status_code=403, 
                        detail=f"Quota Exceeded. You have used {current_count}/{max_runs} runs. Please upgrade your plan."
                    )
                
                # Increment usage for this run
                await redis.incr(usage_key)
                # optionally set expiry to next month
                if current_count == 0:
                     await redis.expire(usage_key, 60*60*24*31) # 31 days
                     
    except httpx.RequestError as e:
        print(f"Warning: Could not connect to Billing Service to check quota: {e}")

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "orchestrator", "persistence": "redis"}

async def run_campaign_background(campaign_id: str, req: CreateCampaignRequest):
    print(f"DEBUG: run_campaign_background started for {campaign_id}", flush=True)
    print(f"DEBUG: req dump: {req.model_dump()}", flush=True)
    try:
        # Fetch Agent Data if agent_id is present
        agent_id = req.agent_id or req.metadata.get("agent_id")
        if agent_id:
            try:
                import httpx
                from app.core.security import decrypt_value
                
                url = f"http://resource-service:8000/resource/agents/{agent_id}"
                print(f"Fetching Agent (httpx) from: {url}")
                
                async with httpx.AsyncClient() as client:
                    resp = await client.get(url, timeout=10)
                    if resp.status_code == 200:
                        agent_data = resp.json()
                        print(f"Loaded Agent: {agent_data.get('name')}")
                        
                        # Decrypt API Key
                        api_key = decrypt_value(agent_data.get("api_key_encrypted"))
                        lf_secret_key = decrypt_value(agent_data.get("langfuse_secret_key_encrypted"))
                        
                        # Map to target_config
                        target_config = {
                            "api_key": api_key,
                            "base_url": agent_data.get("endpoint_url"),
                            "model": agent_data.get("meta_data", {}).get("model"), # Fix Model Key
                            "provider": agent_data.get("meta_data", {}).get("provider", "DeepSeek"),
                            "langfuse_public_key": agent_data.get("langfuse_public_key"),
                            "langfuse_secret_key": lf_secret_key,
                            "langfuse_host": agent_data.get("langfuse_host"),
                            "langfuse_project_id": agent_data.get("langfuse_project_id")
                        }
                        
                        # Update metadata with target_config (merge if exists)
                        current_target = req.metadata.get("target_config", {})
                        req.metadata["target_config"] = {**target_config, **current_target}
                        req.metadata["agent_name"] = agent_data.get("name")
                        
                    else:
                        print(f"Failed to fetch agent {agent_id}: {resp.status_code}")
            except Exception as e:
                print(f"Error fetching agent: {e}")

        # Fetch Scenario Details from Resource Service
        import httpx
        scenario_data = None
        if req.scenario_id:
            print(f"DEBUG: Handling scenario_id: {req.scenario_id}", flush=True)
            try:
                import urllib.request
                import json
                url = f"http://resource-service:8000/resource/scenarios/{req.scenario_id}"
                print(f"Fetching Scenario (urllib) from: {url}", flush=True)
                with urllib.request.urlopen(url) as response:
                    if response.status == 200:
                        data = response.read()
                        scenario_data = json.loads(data)
                        print(f"Loaded Scenario: {scenario_data.get('name')}", flush=True)
                    else:
                        print(f"Failed to load scenario {req.scenario_id}: {response.status}", flush=True)
            except Exception as e:
                print(f"Error fetching scenario (urllib): {e}", flush=True)
        else:
            print("DEBUG: req.scenario_id is missing or empty!", flush=True)

        # Init Graph dynamically based on scenario data
        app = build_dynamic_graph(scenario_data)

        # Initialize Checkpointer (Create indices)
        if hasattr(app, 'checkpointer') and app.checkpointer:
            print("Running checkpointer setup...")
            await app.checkpointer.asetup()
            print("Checkpointer setup complete.")
        
        # Checkpointer configuration
        config = {
            "configurable": {
                "thread_id": campaign_id,
                "checkpoint_ns": "" 
            }
        }
        
        if not config.get("callbacks"):
            config["callbacks"] = []
        # config["callbacks"].append(langfuse_handler)

        # Initial State
        # Count expectations for score normalization
        exp_count = 0
        if scenario_data and "nodes" in scenario_data:
            for n in scenario_data["nodes"]:
                n_type = (n.get("data", {}).get("category") or n.get("type", "")).lower()
                if n_type == "expectation":
                    exp_count += 1
        
        if exp_count == 0: exp_count = 1 # Avoid division by zero
        
        initial_state = {
            "campaign_id": campaign_id,
            "scenario_id": req.scenario_id,
            "messages": [], # Annotated[operator.add] will append new messages
            "status": "running",
            "raw_score_sum": 0.0, # Counter for normalization
            "current_score": 0.0, # Scaled score [0-10] for display
            "metrics": {}, # Annotated[merge_metrics] will merge metrics
            "metadata": {
                **req.metadata,
                "scenario_name": req.scenario_name,
                "agent_id": req.agent_id,
                "language": req.language
            },
            "error": None,
            "retry_count": 0,
            "_condition_result": "false",
            "expectations_count": exp_count
        }
        
        # Invoke Graph (Async)
        print(f"Starting background execution for {campaign_id} (ainvoke)...")
        try:
            await app.ainvoke(initial_state, config=config)
            print(f"Finished background execution for {campaign_id}")
        except Exception as inv_err:
             print(f"Error during ainvoke for {campaign_id}: {inv_err}")
             import traceback
             traceback.print_exc()
        
    except Exception as e:
        print(f"Graph Execution Error for {campaign_id}: {e}")
        # In a robust system, we should save this error state to Redis manually here

@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(
    req: CreateCampaignRequest, 
    background_tasks: BackgroundTasks,
    workspace_id: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Khởi tạo một Campaign mới (Async Background) với Quota Limit Check.
    """
    # 0. Check Quota / Rate Limit before proceeding
    await check_workspace_quota(workspace_id)

    campaign_id = str(uuid.uuid4())
    
    # 1. Save to Postgres via Repository
    try:
        repo = CampaignRepository(db)
        await repo.create_campaign({
            "id": campaign_id,
            "scenario_id": req.scenario_id,
            "name": req.scenario_name or "Untitled",
            "agent_id": req.agent_id,
            "status": "queued",
            "metadata_info": req.metadata,
            "created_by": req.metadata.get("created_by", {})
        })
    except Exception as e:
        print(f"DB Error (Non-blocking): {e}")

    # 2. Save metadata to Redis List for listing
    redis = get_redis_client()
    meta = {
        "id": campaign_id,
        "scenario_id": req.scenario_id,
        "name": req.scenario_name or "Untitled",
        "agent_id": req.agent_id,
        "created_at": datetime.now().isoformat(),
        "status": "queued",
        "created_by": req.metadata.get("created_by") # Store executor info
    }
    # LPUSH adds to the head of the list (newest first)
    await redis.lpush("campaigns:list", json.dumps(meta))
    
    # Backup metadata for direct access and fallback
    await redis.set(f"campaign:{campaign_id}:meta", json.dumps(meta))
    
    # Trigger background execution
    background_tasks.add_task(run_campaign_background, campaign_id, req)

    return {
        "campaign_id": campaign_id,
        "status": "queued",
        "current_score": 0.0,
        "messages": []
    }

@router.get("/campaigns")
async def list_campaigns(limit: int = 20, offset: int = 0):
    redis = get_redis_client()
    # Redis List: 0 is start, -1 is end
    items = await redis.lrange("campaigns:list", offset, offset + limit - 1)
    
    # Enrich with live status from Checkpointer
    # This allows us to see real-time status and score in the list view
    app = build_dynamic_graph()
    
    result = []
    for item in items:
        try:
            meta = json.loads(item)
            campaign_id = meta.get("id")
            
            # Query checkpointer for latest state
            config = {"configurable": {"thread_id": campaign_id}}
            state_snapshot = await app.aget_state(config)
            
            if state_snapshot.values:
                current_values = state_snapshot.values
                # Override/Enrich meta
                meta["status"] = current_values.get("status", meta.get("status", "unknown"))
                meta["current_score"] = current_values.get("current_score", 0.0)
                # Add updated_at from state snapshot timestamp
                if state_snapshot.created_at:
                    meta["updated_at"] = state_snapshot.created_at
                # Can add more summary fields here
        except Exception as e:
            # Fallback to stored meta if checkpointer query fails
            print(f"Failed to fetch live state for {meta.get('id')}: {e}")
            pass
            
        result.append(meta)
        
    return result

@router.get("/campaigns/{id}")
async def get_campaign(id: str):
    """
    Get single campaign details (alias to state for now).
    """
    return await get_campaign_state(id)

@router.get("/campaigns/{id}/state")
async def get_campaign_state(id: str):
    """
    Fetch historical state from Redis Checkpointer.
    """
    try:
        app = build_dynamic_graph() # Load graph definition
        config = {"configurable": {"thread_id": id}}
        
        # Get latest state from Redis
        state_snapshot = await app.aget_state(config)
        
        if not state_snapshot.values:
            # Fallback for "queued" state (before graph starts background thread)
            redis = get_redis_client()
            meta_raw = await redis.get(f"campaign:{id}:meta")
            if meta_raw:
                meta = json.loads(meta_raw)
                return {
                    "status": meta.get("status", "queued"),
                    "campaign_id": id,
                    "created_at": meta.get("created_at"),
                    "values": {
                        "metadata": meta.get("metadata", {}),
                        "messages": [],
                        "metrics": {},
                        "current_score": 0.0
                    }
                }
            return {"status": "not_found", "msg": "No state found for this campaign"}
            
        current_values = state_snapshot.values
        
        # Serialize messages to ensure JSON compatibility
        raw_messages = current_values.get("messages", [])
        serialized_messages = []
        for m in raw_messages:
            if hasattr(m, 'content'):
                # Map LangChain message types to simple role/content
                role = "user" 
                if hasattr(m, 'type'):
                    if m.type == "human": role = "user"
                    elif m.type == "ai": role = "assistant"
                    elif m.type == "system": role = "system"
                
                serialized_messages.append({
                    "role": role, 
                    "content": m.content,
                    "type": getattr(m, 'type', 'unknown')
                })
            elif isinstance(m, dict):
                serialized_messages.append(m)
            else:
                serialized_messages.append({"role": "unknown", "content": str(m)})

        # Prepare response
        response_values = current_values.copy()
        response_values["messages"] = serialized_messages

        return {
             "campaign_id": id,
             "status": current_values.get("status", "paused"),
             "step": state_snapshot.next,
             "created_at": state_snapshot.created_at,
             "values": response_values
        }
    except Exception as e:
         print(f"Error fetching state for {id}: {e}")
         
         # Robust Fallback: Try to fetch metadata from Redis if Checkpointer failed
         try:
             redis = get_redis_client()
             meta_raw = await redis.get(f"campaign:{id}:meta")
             if meta_raw:
                 meta = json.loads(meta_raw)
                 return {
                     "status": meta.get("status", "unknown"),
                     "campaign_id": id,
                     "created_at": meta.get("created_at"),
                     "values": {
                         "metadata": {
                              "scenario_name": meta.get("name"),
                              "created_by": meta.get("created_by")
                         },
                         "messages": [], # Cannot recover messages without checkpointer
                         "metrics": {},
                         "current_score": 0.0
                     }
                 }
         except Exception as fallback_err:
             print(f"Fallback failed: {fallback_err}")
             
         return {"status": "error", "msg": str(e)}

# --- Red Teaming Endpoints ---

from app.services.red_teaming_workflow import build_red_teaming_graph

async def run_red_teaming_background(campaign_id: str, req: CreateCampaignRequest):
    print(f"DEBUG: run_red_teaming_background started for {campaign_id}", flush=True)
    try:
        # Fetch Agent Data if agent_id is present
        agent_id = req.agent_id or req.metadata.get("agent_id")
        target_config = {}
        if agent_id:
            try:
                import httpx
                from app.core.security import decrypt_value
                
                url = f"http://resource-service:8000/resource/agents/{agent_id}"
                print(f"DEBUG: Fetching Agent for RT from: {url}")
                
                async with httpx.AsyncClient() as client:
                    resp = await client.get(url, timeout=10)
                    if resp.status_code == 200:
                        agent_data = resp.json()
                        print(f"DEBUG: Loaded Agent for RT: {agent_data.get('name')}")
                        
                        api_key = decrypt_value(agent_data.get("api_key_encrypted"))
                        lf_secret_key = decrypt_value(agent_data.get("langfuse_secret_key_encrypted"))
                        target_config = {
                            "api_key": api_key,
                            "base_url": agent_data.get("endpoint_url"),
                            "model": agent_data.get("meta_data", {}).get("model"),
                            "provider": agent_data.get("meta_data", {}).get("provider", "DeepSeek"),
                            "langfuse_public_key": agent_data.get("langfuse_public_key"),
                            "langfuse_secret_key": lf_secret_key,
                            "langfuse_host": agent_data.get("langfuse_host"),
                            "langfuse_project_id": agent_data.get("langfuse_project_id")
                        }
                    else:
                        print(f"WARNING: Failed to fetch agent {agent_id}: {resp.status_code}")
            except Exception as e:
                print(f"ERROR fetching agent for RT: {e}")

        # --- RESTORE GRAPH INIT ---
        from app.services.red_teaming_workflow import build_red_teaming_graph
        app = build_red_teaming_graph()
        
        if hasattr(app, 'checkpointer') and app.checkpointer:
            await app.checkpointer.asetup()
            
        config = {
            "configurable": {
                "thread_id": campaign_id,
                "checkpoint_ns": "red_teaming" 
            }
        }
        # ---------------------------

        # Initial State chuyên biệt cho Red Teaming
        initial_state = {
            "campaign_id": campaign_id,
            "agent_id": agent_id,
            "status": "queued",
            "progress": 0,
            "total_probes": 0,
            "successful_attacks": 0,
            "blocked_attacks": 0,
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "messages": [],
            "logs": [],
            "metadata": {
                **req.metadata,
                "strategy": req.metadata.get("strategy", "jailbreak"),
                "intensity": req.metadata.get("intensity", 75),
                "target_config": target_config # Quan trọng: Truyền config thực tế vào đây
            }
        }
        
        print(f"Invoking Red Teaming Graph for {campaign_id}...")
        await app.ainvoke(initial_state, config=config)
        print(f"Finished Red Teaming Graph for {campaign_id}")
        
    except Exception as e:
        print(f"Red Teaming Graph Execution Error: {e}")
        import traceback
        traceback.print_exc()

@router.post("/red-teaming", response_model=CampaignResponse)
async def create_red_teaming_campaign(
    req: CreateCampaignRequest,
    background_tasks: BackgroundTasks,
    workspace_id: str = Header(None)
):
    """
    Khởi chạy một chiến dịch Red Teaming mới với Quota Limit Check.
    """
    # 0. Check Quota / Rate Limit before proceeding
    await check_workspace_quota(workspace_id)

    # Campaign ID được sinh ra từ Resource Service đã được client gửi lên  
    # trong metadata hoặc ta sinh mới và map lại.
    # Trong flow này, client (Frontend) gọi Resource Service trước để lấy campaign_id,
    # sau đó gọi Orchestrator để trigger.
    campaign_id = req.metadata.get("campaign_id") or str(uuid.uuid4())
    
    # Trigger background
    background_tasks.add_task(run_red_teaming_background, campaign_id, req)
    
    return {
        "campaign_id": campaign_id,
        "status": "queued",
        "current_score": 0.0,
        "messages": []
    }
@router.get("/red-teaming/campaigns")
async def list_red_teaming_campaigns(page: int = 1, size: int = 20):
    """
    Proxy request lấy danh sách lịch sử Red Teaming và làm giàu tên Agent.
    """
    import httpx
    async with httpx.AsyncClient() as client:
        try:
            # 1. Lấy danh sách campaigns
            url_campaigns = f"http://resource-service:8000/resource/red-teaming/campaigns?page={page}&size={size}"
            resp_campaigns = await client.get(url_campaigns, timeout=10)
            data = resp_campaigns.json() if resp_campaigns.status_code == 200 else {"items": []}
            
            # 2. Lấy danh sách agents để map tên
            url_agents = "http://resource-service:8000/resource/agents"
            resp_agents = await client.get(url_agents, timeout=10)
            
            # Parse agents response - có thể là list hoặc dict
            agents_data = resp_agents.json() if resp_agents.status_code == 200 else []
            
            # Xử lý cả trường hợp list và dict
            if isinstance(agents_data, list):
                agents = agents_data
            elif isinstance(agents_data, dict) and "items" in agents_data:
                agents = agents_data["items"]
            else:
                agents = []
            
            agent_map = {a["id"]: a["name"] for a in agents if isinstance(a, dict)}
            
            # 3. Enrich
            for item in data.get("items", []):
                item["agent_name"] = agent_map.get(item.get("agent_id"), "Unknown Agent")
                
            return data
        except Exception as e:
            print(f"Error proxying enriched RT campaigns: {e}")
            import traceback
            traceback.print_exc()
            return {"items": [], "total": 0, "page": page, "size": size, "pages": 0}
