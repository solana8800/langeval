import requests
import uuid
import json

PROXY_URL = "http://localhost:8800/api/v1/resource/scenarios"
WORKSPACE_ID = "4ddfe22e-5798-45eb-bd4f-06dedaf17c45"

def test_metadata_persistence():
    headers = {
        "X-Workspace-ID": WORKSPACE_ID,
        "Content-Type": "application/json",
        "Authorization": "Bearer fake_token" # Proxy might require it or not
    }

    # 1. Create Scenario with full metadata
    name = f"MetaTest_{uuid.uuid4().hex[:4]}"
    payload = {
        "name": name,
        "agent_id": "c05a855e-2550-41ef-b276-20204b7a9bda",
        "nodes": [],
        "edges": [],
        "meta_data": {
            "difficulty": "Hard",
            "language": "vi",
            "model_id": "gpt-4"
        }
    }
    
    print(f"--- 1. Creating Scenario: {name} ---")
    res = requests.post(PROXY_URL, json=payload, headers=headers)
    if res.status_code not in [200, 201]:
        print(f"❌ Create failed: {res.status_code} - {res.text}")
        return
    
    scenario = res.json()
    scenario_id = scenario["id"]
    print(f"✅ Created ID: {scenario_id}")
    print(f"Initial Metadata: {scenario.get('meta_data')}")

    # 2. Update Scenario with only nodes (simulating editor save)
    # The proxy should merge metadata from existing
    update_url = f"{PROXY_URL}/{scenario_id}"
    update_payload = {
        "nodes": [{"id": "node_1", "type": "start", "position": {"x": 10, "y": 10}, "data": {}}],
        "meta_data": {
            "model_id": "gpt-3.5-turbo" # Update only model_id
        }
    }
    
    print(f"\n--- 2. Updating Scenario (Partial metadata) ---")
    res = requests.put(update_url, json=update_payload, headers=headers)
    if res.status_code != 200:
        print(f"❌ Update failed: {res.status_code} - {res.text}")
        return
    
    updated_scenario = res.json()
    final_meta = updated_scenario.get("meta_data", {})
    print(f"Final Metadata: {final_meta}")

    # 3. Verify
    if final_meta.get("difficulty") == "Hard" and final_meta.get("model_id") == "gpt-3.5-turbo":
        print("\n✅ SUCCESS: Metadata merged correctly!")
    else:
        print("\n❌ FAILURE: Metadata lost or not merged correctly.")
        print(f"Expected difficulty: Hard, Got: {final_meta.get('difficulty')}")

if __name__ == "__main__":
    test_metadata_persistence()
