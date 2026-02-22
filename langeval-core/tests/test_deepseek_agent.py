import requests
import json
import time

RESOURCE_SERVICE_URL = "http://localhost:8003/resource"
ORCHESTRATOR_URL = "http://localhost:8001/orchestrator"

# Configuration provided by user
DEEPSEEK_AGENT_CONFIG = {
    "name": "DeepSeek Chat",
    "type": "Chatbot",
    "version": "v1.0.0",
    "status": "active",
    "repo_url": "https://deepseek.com",
    "endpoint_url": "https://api.deepseek.com",
    "api_key": "sk-6079aff5c834420e890d62906f6383f5", 
    "description": "Agent using DeepSeek model",
    "meta_data": {
        "model": "deepseek-chat",
        "provider": "DeepSeek",
        "note": "User provided credentials."
    }
}

def get_or_create_agent():
    print("Checking for DeepSeek Chat agent...")
    try:
        # 1. List agents to find existing
        resp = requests.get(f"{RESOURCE_SERVICE_URL}/agents?size=100")
        if resp.status_code == 200:
            agents = resp.json().get("items", [])
            for agent in agents:
                if agent["name"] == DEEPSEEK_AGENT_CONFIG["name"]:
                    print(f"Found existing agent: {agent['id']}")
                    # Update config if needed? For now we assume existing is fine, 
                    # but maybe we should update credentials.
                    # Let's just create a new one if not found or use existing.
                    return agent["id"]
        
        # 2. Create if not found
        print("Agent not found. Creating new DeepSeek Chat agent...")
        resp = requests.post(f"{RESOURCE_SERVICE_URL}/agents", json=DEEPSEEK_AGENT_CONFIG)
        if resp.status_code in [200, 201]:
            data = resp.json()
            print(f"Agent created: {data['id']}")
            return data["id"]
        else:
            print(f"Failed to create agent: {resp.text}")
            return None
    except Exception as e:
        print(f"Error managing agent: {e}")
        return None

def create_scenario(agent_id):
    print("Creating DeepSeek Test Scenario...")
    scenario_data = {
        "name": "DeepSeek Connectivity Test",
        "description": "Simple validation of DeepSeek agent connection",
        "agent_id": agent_id,
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "position": {"x": 0, "y": 0},
                "data": {"label": "Start"}
            },
            {
                "id": "persona",
                "type": "customNode",
                "position": {"x": 200, "y": 0},
                "data": {
                    "label": "User",
                    "category": "persona",
                    "role": "Curious User",
                    "prompt": "You are a user testing DeepSeek. Ask a coding question.",
                    "temperature": 0.7
                }
            },
            {
                "id": "task",
                "type": "customNode",
                "position": {"x": 400, "y": 0},
                "data": {
                    "label": "Ask Coding Question",
                    "category": "task",
                    "instruction": "Ask: 'Write a Python function to check for prime numbers.'",
                    "output_variable": "deepseek_reply",
                    "timeout": 60 
                }
            },
            {
                "id": "end",
                "type": "end",
                "position": {"x": 600, "y": 0},
                "data": {"label": "End"}
            }
        ],
        "edges": [
            {"id": "e1", "source": "start", "target": "persona"},
            {"id": "e2", "source": "persona", "target": "task"},
            {"id": "e3", "source": "task", "target": "end"}
        ]
    }
    
    try:
        resp = requests.post(f"{RESOURCE_SERVICE_URL}/scenarios", json=scenario_data)
        if resp.status_code in [200, 201]:
            data = resp.json()
            print(f"Scenario created: {data['id']}")
            return data["id"]
        else:
            print(f"Failed to create scenario: {resp.text}")
            return None
    except Exception as e:
        print(f"Error creating scenario: {e}")
        return None

def run_campaign(scenario_id):
    print("Starting Campaign...")
    
    # Explicitly constructing target_config from provided details
    target_config = {
        "base_url": DEEPSEEK_AGENT_CONFIG["endpoint_url"],
        "api_key": DEEPSEEK_AGENT_CONFIG["api_key"],
        "model": DEEPSEEK_AGENT_CONFIG["meta_data"]["model"]
    }
    
    payload = {
        "scenario_id": scenario_id,
        "metadata": {
            "source": "test_script",
            "target_config": target_config
        }
    }
    
    try:
        resp = requests.post(f"{ORCHESTRATOR_URL}/campaigns", json=payload)
        if resp.status_code == 200:
            data = resp.json()
            cid = data["campaign_id"]
            print(f"Campaign started: {cid}")
            return cid
        else:
            print(f"Failed to start campaign: {resp.text}")
            return None
    except Exception as e:
        print(f"Error starting campaign: {e}")
        return None

def poll_campaign(campaign_id):
    print(f"Polling Campaign {campaign_id}...")
    for i in range(60):
        try:
            resp = requests.get(f"{ORCHESTRATOR_URL}/campaigns/{campaign_id}")
            data = resp.json()
            status = data.get("status")
            print(f"Status: {status}")
            
            if status == "completed":
                print("Campaign Completed Successfully!")
                # Print interaction history
                messages = data.get("values", {}).get("messages", [])
                print("--- Interaction Log ---")
                for msg in messages:
                    role = msg.get("role")
                    content = msg.get("content")
                    print(f"[{role}]: {content[:500]}..." if len(content) > 500 else f"[{role}]: {content}")
                print("-----------------------")
                return
            elif status == "failed":
                print(f"Campaign Failed: {data.get('values', {}).get('error')}")
                return
            
            time.sleep(2)
        except Exception as e:
            print(f"Polling error: {e}")
            time.sleep(2)

if __name__ == "__main__":
    agent_id = get_or_create_agent()
    if agent_id:
        scenario_id = create_scenario(agent_id)
        if scenario_id:
            cid = run_campaign(scenario_id)
            if cid:
                poll_campaign(cid)
