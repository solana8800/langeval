from langgraph.graph import StateGraph, END
from typing import Annotated, Dict, Any, List
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import asyncio
import json
import os
import httpx
from datetime import datetime
import operator

# Kafka Topics from Environment
SIMULATION_TOPIC = os.getenv("KAFKA_TOPIC_SIMULATION_REQUESTS", "simulation.requests")
EVALUATION_TOPIC = os.getenv("KAFKA_TOPIC_EVALUATION_REQUESTS", "evaluation.requests")

from app.models.schemas import CampaignState
import app.core.resources as resources
from app.services.checkpointer import get_checkpointer

# --- Helper Functions ---
def substitute_template(text: str, variables: dict) -> str:
    """
    Thay thế biến {{variable}} trong text bằng giá trị từ variables dict.
    """
    if not text or not isinstance(text, str):
        return text
    
    # Simple replacement for now
    for key, value in variables.items():
        placeholder = "{{" + key + "}}"
        if placeholder in text:
            text = text.replace(placeholder, str(value))
    return text

async def update_campaign_status(campaign_id: str, status: str, score: float = None, metrics: dict = None):
    try:
        from app.db.engine import AsyncSessionLocal
        from app.db.repository import CampaignRepository
        
        async with AsyncSessionLocal() as session:
            repo = CampaignRepository(session)
            await repo.update_status(campaign_id, status, score, metrics)
            print(f"DB Updated: {campaign_id} -> {status}")
    except Exception as e:
        print(f"DB Update Failed for {campaign_id}: {e}")

# --- Node Handlers ---

# 1. Start Node
async def node_start(state: CampaignState):
    print(f"--- START NODE: Campaign {state['campaign_id']} ---")
    await update_campaign_status(state['campaign_id'], "running")
    return {"status": "running"}

# 2. Persona Node (Send to Simulator to initialize context)
async def node_persona(state: CampaignState, config: dict):
    print(f"--- PERSONA NODE: {config.get('label', 'Unnamed')} ---")
    
    # Store peronsa config in state for later tasks
    persona_data = config.get("data", {})
    return {
        "metadata": {
            **state.get("metadata", {}),
            "persona": persona_data,
            "user_name": persona_data.get("name") or config.get("label", "User Simulator")
        }
    }

# 3. Task Node (Send to Simulator)
async def node_task(state: CampaignState, config: dict):
    campaign_id = state['campaign_id']
    print(f"--- TASK NODE: {config.get('label')} ---")
    
    if not resources.producer:
        return {"error": "Kafka Producer Not Ready"}

    # Prepare Context
    metadata = state.get("metadata", {})
    variables = metadata.get("variables", {}) # Custom variables from previous outputs
    persona_data = metadata.get("persona", {})
    
    # Config Data
    node_data = config.get("data", {})
    raw_instruction = node_data.get("instruction") or node_data.get("prompt", "")
    timeout_seconds = int(node_data.get("timeout", 60))
    output_variable = node_data.get("output_variable")
    
    # Template Substitution
    instruction = substitute_template(raw_instruction, variables)
    
    # Target Config (from Campaign metadata or Agent ID)
    target_config = metadata.get("target_config", {})
    agent_id = state.get("agent_id") or metadata.get("agent_id")
    
    # --- DYNAMIC MODEL INJECTION ---
    # Check if a model_id is specified in metadata or campaign
    model_id = metadata.get("model_id")
    
    # If model_id exists, fetch it
    model_config = None
    if model_id:
        from app.services.resource_client import get_model_config, decrypt_key
        model_ref = await get_model_config(model_id)
        if model_ref:
            # Decrypt Key
            raw_key = decrypt_key(model_ref.get("api_key_encrypted"))
            model_config = {
                "model": model_ref.get("name") or target_config.get("model", "gpt-3.5-turbo"),
                "api_key": raw_key,
                "base_url": model_ref.get("base_url") or "https://api.openai.com/v1",
                "provider": model_ref.get("provider")
            }
            print(f"DEBUG: Injected Dynamic Model: {model_config.get('model')}")

    # Fallback to defaults if no dynamic model
    if not model_config and not target_config.get("api_key") and agent_id:
         target_config["api_key"] = "mock-key-from-agent-id"
    
    language = metadata.get("language", "en")
    
    payload = {
        "campaign_id": campaign_id,
        "node_id": config.get("id"),
        "agent_id": agent_id,
        "persona": persona_data, # Full persona config
        "instruction": instruction, # Current task (Substituted)
        "target_config": target_config,
        "model_config": model_config, # NEW FIELD
        "history": [m.dict() if hasattr(m, 'dict') else m for m in state.get("messages", [])],
        "language": language
    }
    
    # Send to Kafka
    print(f"DEBUG: Sending Task Payload to Kafka: {json.dumps(payload)}", flush=True)
    await resources.producer.send_and_wait(SIMULATION_TOPIC, json.dumps(payload).encode('utf-8'))
    
    # Wait for Result (Sync block using Redis BLPOP)
    redis_key = f"campaign:{campaign_id}:node:{config['id']}:result"
    
    if not resources.redis_client:
         return {"error": "Redis Client Not Ready"}

    result_raw = await resources.redis_client.blpop(redis_key, timeout=timeout_seconds)
    
    if not result_raw:
        return {"error": "Task Timeout"}
        
    result_data = json.loads(result_raw[1])
    
    # Update Messages in State
    new_messages = result_data.get("new_messages", [])
    
    # Handle Output Variable (if task returns a specific result, usually the last message content)
    updates = {
        "messages": new_messages
    }
    
    if output_variable and new_messages:
        # Assuming the last message from the bot/simulator is the result
        last_msg = new_messages[-1]
        content = last_msg.get("content", "") if isinstance(last_msg, dict) else getattr(last_msg, "content", "")
        
        updates["metadata"] = {
            **metadata,
            "variables": {
                **variables,
                output_variable: content
            }
        }
    
    # Append to history
    updates["metrics"] = result_data.get("metrics", {})
    
    return updates

# 4. Condition Node
async def node_condition(state: CampaignState, config: dict):
    print(f"--- CONDITION NODE: {config.get('label')} ---")
    data = config.get("data", {})
    logic_type = data.get("logicType", "keyword")
    
    # Get Context
    messages = state.get("messages", [])
    metadata = state.get("metadata", {})
    variables = metadata.get("variables", {})
    
    last_msg = messages[-1] if messages else None
    content = ""
    if last_msg:
        if isinstance(last_msg, dict):
            content = last_msg.get("content", "")
        elif hasattr(last_msg, "content"):
            content = last_msg.content
    
    result = "false"
    
    if logic_type == "keyword":
        condition_value = data.get("conditionValue", "").lower()
        if condition_value in content.lower():
            result = "true"
            
    elif logic_type == "expression":
        expression = data.get("expression", "")
        # Safe eval context
        eval_context = {
            "content": content,
            "variables": variables,
            "len": len,
            "metadata": metadata
        }
        try:
            # WARNING: eval is dangerous. In production use simpleeval or similar.
            # Allowing basic python expressions for demo.
            if eval(expression, {"__builtins__": {}}, eval_context):
                result = "true"
            else:
                result = "false"
        except Exception as e:
            print(f"Expression Eval Failed: {e}")
            result = "error"

    # Allow other logic types here (LLM Judge etc)
    
    print(f"Condition ({logic_type}): -> {result}")
    return {"_condition_result": result}

# 5. Wait Node
async def node_wait(state: CampaignState, config: dict):
    print(f"--- WAIT NODE: {config.get('label')} ---")
    data = config.get("data", {})
    duration = int(data.get("duration", 5))
    print(f"Sleeping for {duration} seconds...")
    await asyncio.sleep(duration)
    return {}

# 6. Expectation Node
async def node_expectation(state: CampaignState, config: dict):
    campaign_id = state['campaign_id']
    print(f"--- EXPECTATION NODE: {config.get('label')} ---")
    
    if not resources.producer:
         return {"error": "Kafka Producer Not Ready"}

    data = config.get("data", {})
    
    # --- DYNAMIC MODEL INJECTION FOR EVALUATION ---
    metadata = state.get("metadata", {})
    model_id = metadata.get("model_id")
    model_config = None
    if model_id:
        from app.services.resource_client import get_model_config, decrypt_key
        model_ref = await get_model_config(model_id)
        if model_ref:
            raw_key = decrypt_key(model_ref.get("api_key_encrypted"))
            model_config = {
                "model": model_ref.get("name"), # Judge Model Name e.g. "gpt-4"
                "api_key": raw_key,
                "base_url": model_ref.get("base_url"),
                "provider": model_ref.get("provider")
            }
            
    payload = {
        "campaign_id": campaign_id,
        "node_id": config.get("id"),
        "history": [m.dict() if hasattr(m, 'dict') else m for m in state.get("messages", [])],
        "eval_config": data, # Contains provider, metrics, criteria
        "model_config": model_config # NEW FIELD
    }

    # Send to Kafka
    await resources.producer.send_and_wait(EVALUATION_TOPIC, json.dumps(payload).encode('utf-8'))
    
    # Wait for Result
    redis_key = f"campaign:{campaign_id}:node:{config['id']}:result"
    print(f"Waiting for Eval result on {redis_key}...")
    
    result_raw = await resources.redis_client.blpop(redis_key, timeout=60)
    
    if not result_raw:
        return {"error": "Evaluation Timeout"}
        
    result_data = json.loads(result_raw[1])
    # Handle key mismatch: EvaluationWorker uses 'total_score'
    score = result_data.get("total_score")
    if score is None:
        score = result_data.get("score", 0.0)
    
    metrics = result_data.get("metrics", {})
    passed = result_data.get("passed", True)
    
    # Calculate live display score
    prev_sum = state.get("raw_score_sum", 0.0)
    current_sum = prev_sum + float(score)
    count = state.get("expectations_count", 1)
    live_display_score = (current_sum / count) * 10.0

    # Results for state update (Reducers will handle summation/merging)
    return {
        "raw_score_sum": float(score),
        "current_score": live_display_score,
        "metrics": metrics,
        "status": "failed" if not passed else "running"
    }

# 7. Tool Node (HTTP Request)
async def node_tool(state: CampaignState, config: dict):
    print(f"--- TOOL NODE: {config.get('label')} ---")
    data = config.get("data", {})
    
    # Context
    metadata = state.get("metadata", {})
    variables = metadata.get("variables", {})
    
    # Config
    url = substitute_template(data.get("endpointUrl", ""), variables)
    method = data.get("method", "GET")
    output_var = data.get("outputVar")
    
    headers_str = substitute_template(data.get("headers", "{}"), variables)
    body_str = substitute_template(data.get("bodyTemplate", "{}"), variables)
    
    try:
        headers = json.loads(headers_str) if headers_str else {}
        body = json.loads(body_str) if body_str else {}
    except json.JSONDecodeError as e:
        print(f"Tool JSON Parse Error: {e}")
        return {"error": f"Invalid JSON in headers/body: {e}"}

    print(f"Executing Tool: {method} {url}")
    
    try:
        async with httpx.AsyncClient() as client:
            if method == "GET":
                resp = await client.get(url, headers=headers, timeout=30)
            else:
                resp = await client.post(url, headers=headers, json=body, timeout=30)
                
            resp.raise_for_status()
            result = resp.json()
            print(f"Tool Result: {str(result)[:100]}...")
            
            updates = {}
            if output_var:
                updates["metadata"] = {
                    **metadata,
                    "variables": {
                        **variables,
                        output_var: result
                    }
                }
            return updates

    except Exception as e:
        print(f"Tool Execution Warning: {e}")
        # Decide if we fail the node or just continue with error
        return {"error": str(e)}

# 8. Code Node (Python Exec)
async def node_code(state: CampaignState, config: dict):
    print(f"--- CODE NODE: {config.get('label')} ---")
    data = config.get("data", {})
    code = data.get("code", "")
    input_vars = data.get("inputKeys", "").split(",")
    output_vars = data.get("outputKeys", "").split(",")
    
    # Context
    metadata = state.get("metadata", {})
    variables = metadata.get("variables", {})
    
    # Prepare Execution Context
    exec_context = {
        "variables": variables,
        "metadata": metadata,
        "print": print,
        "json": json
    }
    
    # Add input variables to local scope for easier access
    for var in input_vars:
        var = var.strip()
        if not var:
            continue
            
        if var in variables:
            exec_context[var] = variables[var]
        else:
            # Initialize to None if missing, to avoid NameError
            print(f"Warning: Input variable '{var}' not found in state.")
            exec_context[var] = None
            
    print(f"Executing Code: {code[:50]}...")
    try:
        # EXECUTION (WARNING: Unsafe)
        exec(code, {"__builtins__": {}}, exec_context)
        
        # Extract Outputs
        updates = {}
        new_variables = {}
        
        for var in output_vars:
            var = var.strip()
            if var and var in exec_context:
                new_variables[var] = exec_context[var]
        
        if new_variables:
            updates["metadata"] = {
                **metadata,
                "variables": {
                    **variables,
                    **new_variables
                }
            }
        
        print(f"Code Result vars: {list(new_variables.keys())}")
        return updates

    except Exception as e:
        print(f"Code Execution Failed: {e}")
        return {"error": str(e)}

# 9. Generic / Transform (Placeholder)
async def node_generic(state: CampaignState, config: dict):
    print(f"--- GENERIC NODE ({config.get('data', {}).get('category')}): {config.get('label')} ---")
    return {}

async def node_end(state: CampaignState, config: dict):
    print(f"--- END NODE ---")
    
    # Calculate final scaled score (0.0 - 10.0)
    score_sum = state.get("raw_score_sum", 0.0)
    expectations_count = state.get("expectations_count", 1)
    
    # Scale to 10
    final_score = (score_sum / expectations_count) * 10.0
    final_score = min(10.0, max(0.0, final_score)) # Clamp
    
    metrics = state.get("metrics")
    
    print(f"Final Aggregated Score: {final_score}/10 (Sum: {score_sum}, Count: {expectations_count})")
    
    # Pass final score and metrics to DB
    await update_campaign_status(state['campaign_id'], "completed", score=final_score, metrics=metrics)
    
    return {
        "status": "completed",
        "current_score": final_score # Final state update override
    }


# --- Edges Router ---
def condition_router(state: CampaignState):
    result = state.get("_condition_result", "false")
    return result

# --- Graph Builder ---

def build_dynamic_graph(scenario_config: dict = None):
    """
    Builds a LangGraph StateGraph from the Scenario JSON structure.
    """
    workflow = StateGraph(CampaignState)
    
    if not scenario_config:
        # Fallback to simple default graph (Simulation -> Evaluation)
        print("No scenario config provided. Building default graph.")
        # Minimal dummy graph to accessing checkpointer
        workflow.add_node("start", lambda s: {})
        workflow.add_node("end", lambda s: {})
        workflow.set_entry_point("start")
        workflow.add_edge("start", "end")
        checkpointer = get_checkpointer()
        return workflow.compile(checkpointer=checkpointer)

    nodes = scenario_config.get("nodes", [])
    edges = scenario_config.get("edges", [])
    
    print(f"Building Graph with {len(nodes)} nodes and {len(edges)} edges.")
    
    # 1. Add Nodes
    node_map = {n["id"]: n for n in nodes}
    
    for node in nodes:
        node_id = node["id"]
        # Determine Node Type
        # Data might have 'category' or 'type' inside 'data', or top-level 'type'
        # Normalize type
        node_type = node.get("data", {}).get("category") or node.get("type", "default")
        node_type = node_type.replace("customNode", "").lower() # Handle 'customNode' wrapper if present
        
        # We need to bind the config to the handler
        # Using a closure/wrapper
        async def handler_wrapper(state, node_config=node):
            # Select underlying handler based on type
            n_type = node_config.get("data", {}).get("category") or node_config.get("type", "default")
            n_type = n_type.lower()
            
            if n_type == "start": return await node_start(state)
            if n_type == "persona": return await node_persona(state, node_config)
            if n_type == "task": return await node_task(state, node_config)
            if n_type == "tool": return await node_tool(state, node_config)
            if n_type == "code": return await node_code(state, node_config) # NEW
            if n_type == "condition": return await node_condition(state, node_config)
            if n_type == "wait": return await node_wait(state, node_config)
            if n_type == "expectation": return await node_expectation(state, node_config)
            if n_type == "end": return await node_end(state, node_config)
            
            return await node_generic(state, node_config)

        workflow.add_node(node_id, handler_wrapper)
        
        # Set Entry Point
        if node_type == "start":
            workflow.set_entry_point(node_id)

    # 2. Add Edges
    # Group edges by source to handle conditional logic
    edges_by_source = {}
    for edge in edges:
        src = edge["source"]
        if src not in edges_by_source: edges_by_source[src] = []
        edges_by_source[src].append(edge)
        
    for source_id, source_edges in edges_by_source.items():
        source_node = node_map.get(source_id)
        if not source_node: continue
        
        node_type = source_node.get("data", {}).get("category") or source_node.get("type", "default")
        node_type = node_type.lower()
        
        if node_type == "condition":
            # Conditional Edge Logic
            mapping = {}
            for edge in source_edges:
                # Handle ID is usually 'true', 'false', 'a', 'b' etc.
                # ReactFlow edges have 'sourceHandle' property
                handle = edge.get("sourceHandle") # e.g. "true", "false"
                target = edge["target"]
                
                # If handle is missing (single output), map 'default' or assume true
                key = handle if handle else "default"
                mapping[key] = target
                
            # Add Conditional Edge using router
            # Router must return keys present in mapping
            workflow.add_conditional_edges(
                source_id,
                lambda state: state.get("_condition_result", "false"), # Router function
                mapping
            )
        else:
            # Standard Edge (Usually 1 outgoing)
            # If multiple outgoing from non-conditional, LangGraph executes parallel or random?
            # We assume 1 outgoing for now
            target_id = source_edges[0]["target"]
            workflow.add_edge(source_id, target_id)

    # 3. Compile
    try:
        print("Initializing Checkpointer...")
        checkpointer = get_checkpointer()
        print(f"Checkpointer initialized: {checkpointer}")
        app = workflow.compile(checkpointer=checkpointer)
        print("Graph compiled with checkpointer.")
        return app
    except Exception as e:
        print(f"Checkpointer init failed: {e}")
        return workflow.compile()
