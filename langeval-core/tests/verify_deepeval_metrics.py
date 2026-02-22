import requests
import json
import time
import sys

RESOURCE_URL = "http://localhost:8003/resource"
ORCHESTRATOR_URL = "http://localhost:8001/orchestrator"

# Use the existing DeepSeek Agent ID if possible, or create new
AGENT_DATA = {
    "name": "DeepEval Test Agent",
    "type": "Chatbot",
    "endpoint_url": "https://api.deepseek.com",
    "api_key": "sk-6079aff5c834420e890d62906f6383f5", # Reusing known working key for Target
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
    print(f"--- Ensuring Agent ---")
    try:
        # Check existing first to avoid spam
        resp = requests.get(f"{RESOURCE_URL}/agents")
        data = resp.json()
        # Handle Page response or List response
        all_agents = data.get('items', []) if isinstance(data, dict) else data
        
        existing = next((a for a in all_agents if a.get('name') == AGENT_DATA['name']), None)
        if existing:
            print(f"✅ Found existing Agent. ID: {existing['id']}")
            return existing['id']
            
        resp = requests.post(f"{RESOURCE_URL}/agents", json=AGENT_DATA)
        if resp.status_code in [200, 201]:
            data = resp.json()
            print(f"✅ Created Agent. ID: {data['id']}")
            return data['id']
    except Exception as e:
        print(f"❌ Error ensuring agent: {e}")
        return None

def create_deepeval_scenario(agent_id):
    print(f"--- Creating DeepEval Scenario ---")
    scenario_data = {
        "name": "DeepEval Metric Verification",
        "description": "Testing Answer Relevancy and Faithfulness",
        "agent_id": agent_id,
        "nodes": [
            {"id": "1", "type": "start", "position": {"x": 50, "y": 50}, "data": {"category": "start"}},
            {
                "id": "2", 
                "type": "task", 
                "position": {"x": 200, "y": 50}, 
                "data": {
                    "category": "task",
                    "instruction": "Tell me a short joke about programming.",
                    "timeout": 30
                }
            },
            {
                "id": "3",
                "type": "expectation",
                "position": {"x": 400, "y": 50},
                "data": {
                    "category": "expectation",
                    "evalProvider": "deepeval", # Explicitly request DeepEval
                    "metrics": ["answer_relevancy", "toxicity"], # Request specific metrics
                    "threshold": 0.5
                }
            },
            {"id": "4", "type": "end", "position": {"x": 600, "y": 50}, "data": {"category": "end"}}
        ],
        "edges": [
            {"id": "e1", "source": "1", "target": "2"},
            {"id": "e2", "source": "2", "target": "3"},
            {"id": "e3", "source": "3", "target": "4"}
        ]
    }
    
    try:
        # Create/Update
        all_scenarios = requests.get(f"{RESOURCE_URL}/scenarios").json().get("items", [])
        existing = next((s for s in all_scenarios if s['name'] == scenario_data['name']), None)
        
        if existing:
            # Update to ensure metrics are current
            sid = existing['id']
            requests.put(f"{RESOURCE_URL}/scenarios/{sid}", json=scenario_data)
            print(f"✅ Updated Scenario. ID: {sid}")
            return sid
        else:
            resp = requests.post(f"{RESOURCE_URL}/scenarios", json=scenario_data)
            sid = resp.json()['id']
            print(f"✅ Created Scenario. ID: {sid}")
            return sid
    except Exception as e:
        print(f"❌ Error creating scenario: {e}")
        return None

def run_test(scenario_id, agent_id):
    print(f"--- Triggering Run ---")
    payload = {
        "scenario_id": scenario_id,
        "agent_id": agent_id,
        "scenario_name": "DeepEval Metric Verification",
        "metadata": {
            "source": "verify_deepeval_metrics",
            "type": "automated",
            "model_id": "02f40b2b-aac1-44c7-ad5e-b101d8f61c00",
            "target_config": {
                "api_key": AGENT_DATA["api_key"],
                "model": "deepseek-chat",
                "base_url": "https://api.deepseek.com"
            }
        }
    }
    
    resp = requests.post(f"{ORCHESTRATOR_URL}/campaigns", json=payload)
    if resp.status_code not in [200, 201]:
        print(f"❌ Failed to trigger: {resp.text}")
        return
        
    cid = resp.json()['campaign_id']
    print(f"✅ Campaign Started: {cid} - Waiting for results...")
    
    # Poll
    for i in range(60):
        try:
            r = requests.get(f"{ORCHESTRATOR_URL}/campaigns/{cid}")
            data = r.json()
            status = data.get('status')
            
            if status == 'completed':
                print("\n✅ Verification Completed!")
                print(f"Final Score: {data.get('values', {}).get('current_score')}")
                metrics = data.get('values', {}).get('metrics', {})
                print("--- METRICS ---")
                print(json.dumps(metrics, indent=2))
                return
            elif status == 'failed':
                print("\n❌ Campaign Failed!")
                print(data)
                return
                
            time.sleep(1)
            if i % 5 == 0: print(f"Status: {status}...")
        except Exception as e:
            print(f"Error polling: {e}")
            time.sleep(1)

if __name__ == "__main__":
    aid = ensure_agent()
    if aid:
        sid = create_deepeval_scenario(aid)
        if sid:
            run_test(sid, aid)
