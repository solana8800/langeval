import requests
import json
import uuid

BASE_URL = "http://localhost:8003/resource"
RESOURCE_URL = "http://localhost:8003/resource" # Direct backend access for verification

def verify_crud():
    print("🚀 Starting Scenario Builder CRUD Verification...")
    
    # 1. Create a Scenario (with agent_id)
    # Get an existing agent first
    agents = requests.get(f"{RESOURCE_URL}/agents").json()
    if not agents:
        print("❌ No agents found. Please seed agents first.")
        return
    
    agent_id = agents[0]['id']
    print(f"ℹ️  Linking to Agent: {agents[0]['name']} ({agent_id})")

    new_scenario = {
        "id": str(uuid.uuid4()),
        "name": "CRUD Test Scenario",
        "description": "Created via verification script",
        "nodes": [{"id": "1", "type": "start", "position": {"x": 50, "y": 50}}],
        "edges": [],
        "agent_id": agent_id
    }

    # CREATE
    print(f"👉 Creating Scenario: {new_scenario['name']}...")
    resp = requests.post(f"{BASE_URL}/scenarios", json=new_scenario)
    if resp.status_code in [200, 201]:
        created = resp.json()
        print(f"✅ Created! ID: {created['id']}")
    else:
        print(f"❌ Creation Failed: {resp.status_code} {resp.text}")
        return

    scenario_id = created['id']

    # READ Detail
    print(f"👉 Reading Scenario Detail: {scenario_id}...")
    resp = requests.get(f"{BASE_URL}/scenarios/{scenario_id}")
    if resp.status_code == 200:
        detail = resp.json()
        if detail.get('agent_id') == agent_id:
            print(f"✅ Read Successful! Agent ID matches.")
        else:
            print(f"⚠️  Read OK but Agent ID mismatch: {detail.get('agent_id')}")
    else:
        print(f"❌ Read Failed! {resp.status_code}")

    # UPDATE
    print(f"👉 Updating Scenario...")
    update_data = {
        "name": "CRUD Test Scenario UPDATED", 
        "description": "Updated description",
        "nodes": [{"id": "1", "type": "start", "position": {"x": 100, "y": 100}}]
    }
    resp = requests.put(f"{BASE_URL}/scenarios/{scenario_id}", json=update_data)
    if resp.status_code == 200:
        updated = resp.json()
        if updated['name'] == update_data['name']:
             print(f"✅ Update Successful!")
        else:
             print(f"❌ Update Verification Failed!")
    else:
        print(f"❌ Update Failed! {resp.status_code} Body: {resp.text}")

    # DELETE
    print(f"👉 Deleting Scenario...")
    resp = requests.delete(f"{BASE_URL}/scenarios/{scenario_id}")
    if resp.status_code == 200:
        print(f"✅ Delete Request Successful!")
    else:
        print(f"❌ Delete Failed! {resp.status_code}")

    # VERIFY PERSISTENCE (Direct DB check)
    print(f"👉 Verifying persistence in Backend...")
    resp = requests.get(f"{RESOURCE_URL}/scenarios/{scenario_id}")
    if resp.status_code == 404:
        print(f"✅ Persistence Verified: Scenario is GONE from DB.")
    else:
        print(f"❌ Persistence Check Failed: Scenario still exists! ({resp.status_code})")

if __name__ == "__main__":
    verify_crud()
