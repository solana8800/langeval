import requests
import json
import time
import sys

# Configuration based on docker-compose and code analysis
RESOURCE_URL = "http://localhost:8003/resource"
ORCHESTRATOR_URL = "http://localhost:8001/orchestrator"

# Agent Configuration from User Request
DEEPSEEK_AGENT_DATA = {
    "name": "DeepSeek Chat",
    "type": "Chatbot",
    "version": "v1.0.0",
    "status": "active",
    "repo_url": "https://api.deepseek.com",
    "endpoint_url": "https://api.deepseek.com",
    "api_key": "sk-6079aff5c834420e890d62906f6383f5", 
    "description": "Agent using DeepSeek model",
    "meta_data": {
        "model": "deepseek-chat",
        "provider": "DeepSeek",
        "note": "Requires valid DeepSeek API Key."
    },
    "langfuse_project_id": "cml8wik9h0006qg07k21fa2sa",
    "langfuse_project_name": "V-App",
    "langfuse_org_id": "cml8wige40001qg07s5wfyual",
    "langfuse_org_name": "VSF"
}

import random

def ensure_agent():
    print(f"--- Ensuring Agent '{DEEPSEEK_AGENT_DATA['name']}' ---")
    try:
        resp = requests.post(f"{RESOURCE_URL}/agents", json=DEEPSEEK_AGENT_DATA)
        if resp.status_code in [200, 201]:
            data = resp.json()
            print(f"✅ Created/Updated Agent. ID: {data.get('id')}")
            return data.get('id')
        else:
            print(f"⚠️  Agent creation returned {resp.status_code}: {resp.text}")
            print("   Attempting to find existing agent by name...")
            all_agents_resp = requests.get(f"{RESOURCE_URL}/agents")
            if all_agents_resp.status_code == 200:
                agents = all_agents_resp.json()
                for a in agents:
                    if a.get('name') == DEEPSEEK_AGENT_DATA['name']:
                        # Should we update it? Ideally yes, to ensure Key is correct. 
                        # Assuming POST performs update or we need PUT. 
                        # For now, just return found ID.
                        print(f"✅ Found existing Agent. ID: {a.get('id')}")
                        return a.get('id')
            return None
    except Exception as e:
        print(f"❌ Error ensuring agent: {e}")
        return None

def ensure_scenario(agent_id):
    print(f"--- Ensuring Scenario 'DeepSeek Math Eval' ---")
    
    # Generate Math Problem
    a = random.randint(10, 99)
    b = random.randint(10, 99)
    expected_sum = a + b
    question = f"What is {a} + {b}? Return only the number."
    
    print(f"Generated Question: {question}")
    print(f"Expected Answer: {expected_sum}")

    scenario_data = {
        "name": "DeepSeek Math Eval",
        "description": f"Dynamic Math Evaluation: {a} + {b}",
        "agent_id": agent_id,
        "nodes": [
            {"id": "1", "type": "start", "position": {"x": 100, "y": 100}, "data": {"category": "start"}},
            {
                "id": "2", 
                "type": "task", 
                "position": {"x": 300, "y": 100}, 
                "data": {
                    "category": "task",
                    "prompt": question,
                    "timeout": 60
                }
            },
            {
                "id": "3",
                "type": "expectation",
                "position": {"x": 500, "y": 100},
                "data": {
                    "category": "expectation",
                    "label": "Check Math",
                    "evalProvider": "basic", 
                    "threshold": 1.0,
                    # We use a custom criteria for GEval if provider is basic/default with criteria key
                    # OR we can use exact match if we implemented a specific metric.
                    # Let's try to guide the LLM Judge (GEval)
                    "criteria": f"The answer must be exactly {expected_sum}. If the answer contains {expected_sum}, it is correct."
                }
            },
            {"id": "4", "type": "end", "position": {"x": 700, "y": 100}, "data": {"category": "end"}}
        ],
        "edges": [
            {"id": "e1-2", "source": "1", "target": "2"},
            {"id": "e2-3", "source": "2", "target": "3"},
            {"id": "e3-4", "source": "3", "target": "4"}
        ]
    }

    try:
        # Check if exists
        resp = requests.get(f"{RESOURCE_URL}/scenarios")
        resp.raise_for_status()
        items = resp.json().get("items", [])
        existing = next((s for s in items if s["name"] == "DeepSeek Math Eval"), None)
        
        if existing:
            # Update specific math problem each run? 
            # Ideally we create a NEW one or Update the existing one.
            # Let's UPDATE to avoid clutter
            scenario_id = existing["id"]
            resp = requests.put(f"{RESOURCE_URL}/scenarios/{scenario_id}", json=scenario_data)
            resp.raise_for_status()
            print(f"✅ Updated Scenario. ID: {scenario_id}")
            return scenario_id
        else:
            resp = requests.post(f"{RESOURCE_URL}/scenarios", json=scenario_data)
            resp.raise_for_status()
            data = resp.json()
            scenario_id = data["id"]
            print(f"✅ Created Scenario. ID: {scenario_id}")
            return scenario_id

    except Exception as e:
        print(f"❌ Failed to ensure scenario: {e}")
        sys.exit(1)

def trigger_run(scenario_id, agent_id):
    print(f"--- Triggering Evaluation Run ---")
    payload = {
        "scenario_id": scenario_id,
        "agent_id": agent_id,
        "scenario_name": "DeepSeek Math Eval",
        "metadata": {
            "source": "verification_script",
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
    max_retries = 120 # 120 seconds timeout
    for i in range(max_retries):
        try:
            resp = requests.get(f"{ORCHESTRATOR_URL}/campaigns/{campaign_id}")
            if resp.status_code == 200:
                data = resp.json()
                status = data.get("status")
                print(f"[{i+1}s] Status: {status}")
                
                if status in ["completed", "failed", "error"]:
                    return data
                
            time.sleep(1)
        except Exception as e:
            print(f"Error options: {e}")
            time.sleep(1)
            
    print("❌ Timeout waiting for run completion.")
    return None

if __name__ == "__main__":
    print("=== DEEPSEEK VERIFICATION START ===")
    
    # 1. Agent
    agent_id = ensure_agent()
    if not agent_id:
        print("❌ Failed to get Agent ID. Aborting.")
        sys.exit(1)
        
    # 2. Scenario
    scenario_id = ensure_scenario(agent_id)
    if not scenario_id:
        print("❌ Failed to get Scenario ID. Aborting.")
        sys.exit(1)
        
    # 3. Trigger Run
    campaign_id = trigger_run(scenario_id, agent_id)
    if not campaign_id:
        print("❌ Failed to trigger run. Aborting.")
        sys.exit(1)
        
    # 4. Monitor
    result = monitor_run(campaign_id)
    
    if result:
        print("\n=== VERIFICATION RESULT ===")
        print(f"Status: {result.get('status')}")
        print(f"Score: {result.get('values', {}).get('current_score')}")
        print("Messages:")
        for msg in result.get('values', {}).get('messages', []):
            role = msg.get('role', 'unknown')
            content = msg.get('content', '...')
            print(f"  - [{role.upper()}]: {content[:100]}...") # Truncate for display
            
        if result.get('status') == 'completed':
            print("\n✅ VERIFICATION SUCCESS: DeepSeek Agent responded and flow completed.")
        else:
            print("\n❌ VERIFICATION FAILED: Flow did not complete successfully.")
    else:
         print("\n❌ VERIFICATION FAILED: Timeout or Error.")
