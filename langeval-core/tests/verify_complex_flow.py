import requests
import json
import time
import sys
import random

# Configuration
RESOURCE_URL = "http://localhost:8003/resource"
ORCHESTRATOR_URL = "http://localhost:8001/orchestrator"

# Agent Configuration
DEEPSEEK_AGENT_DATA = {
    "name": "DeepSeek Travel Agent",
    "type": "Chatbot",
    "version": "v1.0.0",
    "status": "active",
    "endpoint_url": "https://api.deepseek.com",
    "api_key": "sk-6079aff5c834420e890d62906f6383f5", 
    "description": "Expert Travel Agent",
    "meta_data": {
        "model": "deepseek-chat",
        "provider": "DeepSeek"
    },
    "langfuse_project_id": "cml8wik9h0006qg07k21fa2sa",
    "langfuse_project_name": "V-App",
    "langfuse_org_id": "cml8wige40001qg07s5wfyual",
    "langfuse_org_name": "VSF"
}

def ensure_agent():
    print(f"--- Ensuring Agent '{DEEPSEEK_AGENT_DATA['name']}' ---")
    try:
        resp = requests.post(f"{RESOURCE_URL}/agents", json=DEEPSEEK_AGENT_DATA)
        if resp.status_code in [200, 201]:
            data = resp.json()
            print(f"✅ Created/Updated Agent. ID: {data.get('id')}")
            return data.get('id')
        else:
            # Try to find existing
            all_agents_resp = requests.get(f"{RESOURCE_URL}/agents")
            if all_agents_resp.status_code == 200:
                agents = all_agents_resp.json()
                for a in agents:
                    if a.get('name') == DEEPSEEK_AGENT_DATA['name']:
                        print(f"✅ Found existing Agent. ID: {a.get('id')}")
                        return a.get('id')
            return None
    except Exception as e:
        print(f"❌ Error ensuring agent: {e}")
        return None

def ensure_complex_scenario(agent_id):
    print(f"--- Ensuring Complex Scenario 'Hanoi Travel Plan' ---")
    
    scenario_data = {
        "name": "Hanoi Travel Plan (Multi-step)",
        "description": "A multi-step conversation to plan a trip to Hanoi.",
        "agent_id": agent_id,
        "nodes": [
            {"id": "1", "type": "start", "position": {"x": 100, "y": 100}, "data": {"category": "start"}},
            
            # Step 0: Persona Setup
            {
                "id": "persona_1",
                "type": "persona",
                "position": {"x": 200, "y": 100},
                "data": {
                    "category": "persona",
                    "name": "Foreign Tourist",
                    "description": "You are a foreign tourist visiting Hanoi for the first time. You are curious but polite."
                }
            },

            # Step 1: Ask for Itinerary
            {
                "id": "2", 
                "type": "task", 
                "position": {"x": 300, "y": 100}, 
                "data": {
                    "category": "task",
                    "instruction": "I have 1 free day in Hanoi. Can you suggest a morning activity around Hoan Kiem Lake?",
                    "timeout": 60
                }
            },
            
            # Step 2: Check for Lake mention
            {
                "id": "3",
                "type": "expectation",
                "position": {"x": 500, "y": 100},
                "data": {
                    "category": "expectation",
                    "label": "Check Hoan Kiem",
                    "evalProvider": "basic", 
                    "criteria": "Hoan Kiem" # Expect "Hoan Kiem" in response
                }
            },
            
            # Step 3: Helper - Wait (Optional, usually implied by edges)
            
            # Step 4: Ask for Food
            {
                "id": "4", 
                "type": "task", 
                "position": {"x": 700, "y": 100}, 
                "data": {
                    "category": "task",
                    "instruction": "Great. Now suggest a famous dish to eat nearby for lunch. Only the name.",
                    "timeout": 60
                }
            },
            
            # Step 5: Check for Pho/Bun Cha
            {
                "id": "5",
                "type": "expectation",
                "position": {"x": 900, "y": 100},
                "data": {
                    "category": "expectation",
                    "label": "Check Food",
                    "evalProvider": "basic", 
                    "criteria": "Pho" # Or Bun Cha
                }
            },
            
            {"id": "6", "type": "end", "position": {"x": 1100, "y": 100}, "data": {"category": "end"}}
        ],
        "edges": [
            {"id": "e1-p1", "source": "1", "target": "persona_1"},
            {"id": "ep1-2", "source": "persona_1", "target": "2"},
            {"id": "e2-3", "source": "2", "target": "3"},
            {"id": "e3-4", "source": "3", "target": "4"},
            {"id": "e4-5", "source": "4", "target": "5"},
            {"id": "e5-6", "source": "5", "target": "6"}
        ]
    }

    try:
        # Check if exists
        resp = requests.get(f"{RESOURCE_URL}/scenarios")
        resp.raise_for_status()
        items = resp.json().get("items", [])
        existing = next((s for s in items if s["name"] == scenario_data["name"]), None)
        
        if existing:
            scenario_id = existing["id"]
            resp = requests.put(f"{RESOURCE_URL}/scenarios/{scenario_id}", json=scenario_data)
            resp.raise_for_status()
            print(f"✅ Updated Scenario. ID: {scenario_id}")
            return scenario_id
        else:
            resp = requests.post(f"{RESOURCE_URL}/scenarios", json=scenario_data)
            resp.raise_for_status()
            scenario_id = resp.json()["id"]
            print(f"✅ Created Scenario. ID: {scenario_id}")
            return scenario_id

    except Exception as e:
        print(f"❌ Failed to ensure scenario: {e}")
        sys.exit(1)

def trigger_run(scenario_id, agent_id):
    print(f"--- Triggering Complex Run ---")
    payload = {
        "scenario_id": scenario_id,
        "agent_id": agent_id,
        "scenario_name": "Hanoi Travel Plan (Multi-step)",
        "metadata": {
            "source": "verify_complex_flow",
            "type": "automated",
            "model_id": "02f40b2b-aac1-44c7-ad5e-b101d8f61c00",
            "target_config": {
                "api_key": "sk-6079aff5c834420e890d62906f6383f5",
                "model": "deepseek-chat",
                "base_url": "https://api.deepseek.com"
            }
        }
    }
    
    try:
        resp = requests.post(f"{ORCHESTRATOR_URL}/campaigns", json=payload)
        if resp.status_code in [200, 201]:
            data = resp.json()
            campaign_id = data.get("campaign_id")
            print(f"✅ Run Triggered. Campaign ID: {campaign_id}")
            return campaign_id
        else:
            print(f"❌ Failed to trigger run: {resp.status_code} {resp.text}")
            return None
    except Exception as e:
        print(f"❌ Error triggering run: {e}")
        return None

def monitor_run(campaign_id):
    print(f"--- Monitoring Run {campaign_id} ---")
    max_retries = 180 
    for i in range(max_retries):
        try:
            resp = requests.get(f"{ORCHESTRATOR_URL}/campaigns/{campaign_id}")
            if resp.status_code == 200:
                data = resp.json()
                status = data.get("status")
                
                # Check messages count to see progress
                msgs = data.get("values", {}).get("messages", [])
                score = data.get("values", {}).get("current_score", 0.0)
                
                print(f"[{i+1}s] Status: {status} | Msgs: {len(msgs)} | Score: {score}")
                
                if status in ["completed", "failed", "error"]:
                    return data
                
            time.sleep(1)
        except Exception as e:
            print(f"Error options: {e}")
            time.sleep(1)
            
    print("❌ Timeout waiting for run completion.")
    return None

if __name__ == "__main__":
    print("=== COMPLEX FLOW VERIFICATION START ===")
    
    agent_id = ensure_agent()
    if not agent_id: sys.exit(1)
        
    scenario_id = ensure_complex_scenario(agent_id)
    if not scenario_id: sys.exit(1)
        
    campaign_id = trigger_run(scenario_id, agent_id)
    if not campaign_id: sys.exit(1)
        
    result = monitor_run(campaign_id)
    
    if result:
        print("\n=== VERIFICATION RESULT ===")
        vals = result.get('values', {})
        print(f"Status: {result.get('status')}")
        print(f"Final Score: {vals.get('current_score')}/10")
        print("\nConversation History:")
        for msg in vals.get('messages', []):
            role = msg.get('role', 'unknown').upper()
            content = msg.get('content', '')
            print(f"[{role}]: {content}")
            print("-" * 40)
            
        print("\nMetrics:")
        print(json.dumps(vals.get('metrics', {}), indent=2))
