import requests
import uuid
import json
import sys

BASE_URL = "http://localhost:8003/resource"

def test_agent_crud():
    print("--- Testing Agent CRUD ---")
    
    # 1. Create Agent
    print("\n1. Creating Agent...")
    payload = {
        "name": "Test Agent CRUD",
        "description": "Created by verify script",
        "endpoint_url": "http://mock-agent.com",
        "type": "Chatbot",
        "version": "1.0",
        "status": "active",
        "repo_url": "http://github.com/test/agent"
    }
    try:
        res = requests.post(f"{BASE_URL}/agents", json=payload)
        res.raise_for_status()
        agent = res.json()
        agent_id = agent["id"]
        print(f"✅ Created Agent: {agent_id}")
    except Exception as e:
        print(f"❌ Failed to create agent: {e}")
        if 'res' in locals(): print(res.text)
        return

    # 2. Read Agents
    print("\n2. Reading Agents...")
    try:
        res = requests.get(f"{BASE_URL}/agents")
        res.raise_for_status()
        agents = res.json()
        found = any(a["id"] == agent_id for a in agents)
        if found:
            print(f"✅ Found agent {agent_id} in list.")
        else:
            print(f"❌ Agent {agent_id} NOT found in list.")
    except Exception as e:
        print(f"❌ Failed to read agents: {e}")
        return

    print("\n3. Updating Agent...")
    update_payload = {
        "description": "Updated description",
        "status": "maintenance"
    }
    try:
        res = requests.put(f"{BASE_URL}/agents/{agent_id}", json=update_payload)
        res.raise_for_status()
        updated_agent = res.json()
        if updated_agent["description"] == "Updated description":
            print("✅ Update successful.")
        else:
            print("❌ Update payload ignored.")
    except Exception as e:
        print(f"❌ Failed to update agent: {e}")

    # 4. Delete Agent
    print("\n4. Deleting Agent...")
    try:
        res = requests.delete(f"{BASE_URL}/agents/{agent_id}")
        res.raise_for_status()
        print("✅ Delete successful.")
        
        # Verify deletion
        res_get = requests.get(f"{BASE_URL}/agents")
        if not any(a["id"] == agent_id for a in res_get.json()):
            print("✅ Verified deletion.")
        else:
            print("❌ Agent still exists after delete.")
    except Exception as e:
        print(f"❌ Failed to delete agent: {e}")

if __name__ == "__main__":
    test_agent_crud()
