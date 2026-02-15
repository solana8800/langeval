import requests
import json
import uuid

BASE_URL = "http://localhost:8003/resource"

def verify_models_crud():
    print("🚀 Starting Models CRUD Verification...")
    
    # 1. CREATE
    new_model = {
        "name": f"Test Model {uuid.uuid4().hex[:6]}",
        "provider": "OpenAI",
        "type": "API",
        "api_key": "sk-test-key",
        "meta_data": {"test": True}
    }
    
    print(f"👉 Creating Model: {new_model['name']}...")
    resp = requests.post(f"{BASE_URL}/models", json=new_model)
    if resp.status_code == 200:
        created = resp.json()
        model_id = created['id']
        print(f"✅ Created! ID: {model_id}")
    else:
        print(f"❌ Create Failed: {resp.status_code} {resp.text}")
        return

    # 2. READ
    print(f"👉 Reading Model Detail: {model_id}...")
    resp = requests.get(f"{BASE_URL}/models/{model_id}")
    if resp.status_code == 200:
        print(f"✅ Read Successful! Name: {resp.json()['name']}")
    else:
        print(f"❌ Read Failed: {resp.status_code}")

    # 3. UPDATE
    print("👉 Updating Model...")
    update_data = {"status": "maintenance"}
    resp = requests.put(f"{BASE_URL}/models/{model_id}", json=update_data)
    if resp.status_code == 200:
        print(f"✅ Update Successful! Status: {resp.json()['status']}")
    else:
        print(f"❌ Update Failed: {resp.status_code}")

    # 4. DELETE
    print("👉 Deleting Model...")
    resp = requests.delete(f"{BASE_URL}/models/{model_id}")
    if resp.status_code == 200:
        print("✅ Delete Request Successful!")
    else:
        print(f"❌ Delete Failed: {resp.status_code}")

    # 5. VERIFY DELETION
    print("👉 Verifying persistence in Backend...")
    resp = requests.get(f"{BASE_URL}/models/{model_id}")
    if resp.status_code == 404:
        print("✅ Persistence Verified: Model is GONE from DB.")
    else:
        print(f"❌ Persistence Check Failed: {resp.status_code}")

if __name__ == "__main__":
    verify_models_crud()
