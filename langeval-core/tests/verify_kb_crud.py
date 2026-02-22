import requests
import uuid
import json

BASE_URL = "http://localhost:8003/resource"

def verify_kb_crud():
    print("🚀 Starting Knowledge Base CRUD Verification...")
    
    # 1. CREATE
    print("\n[1] Testing CREATE...")
    kb_payload = {
        "name": "Integration Test KB",
        "source_path": "s3://test-bucket/doc.pdf",
        "description": "Temporary KB for CRUD testing",
        "type": "document",
        "status": "indexing",
        "chunking_strategy": "fixed-size",
        "meta_data": {"test_run": True}
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/knowledge-bases", json=kb_payload)
        resp.raise_for_status()
        kb_data = resp.json()
        kb_id = kb_data["id"]
        print(f"✅ Created KB with ID: {kb_id}")
        print(f"   Name: {kb_data['name']}")
    except Exception as e:
        print(f"❌ Create FAILED: {e}")
        return

    # 2. READ (List)
    print("\n[2] Testing READ (List)...")
    try:
        resp = requests.get(f"{BASE_URL}/knowledge-bases")
        resp.raise_for_status()
        kbs = resp.json()
        found = any(k["id"] == kb_id for k in kbs)
        if found:
            print(f"✅ Kb ID {kb_id} found in list of {len(kbs)} items")
        else:
            print(f"❌ Kb ID {kb_id} NOT found in list!")
    except Exception as e:
        print(f"❌ List FAILED: {e}")

    # 3. UPDATE
    print("\n[3] Testing UPDATE...")
    update_payload = {
        "status": "ready",
        "description": "Updated description",
        "meta_data": {"test_run": True, "updated": True}
    }
    try:
        resp = requests.put(f"{BASE_URL}/knowledge-bases/{kb_id}", json=update_payload)
        resp.raise_for_status()
        updated_data = resp.json()
        if updated_data["status"] == "ready" and updated_data["meta_data"]["updated"] == True:
            print(f"✅ Update successful. Status: {updated_data['status']}")
        else:
            print(f"❌ Update verification failed. Got: {updated_data}")
    except Exception as e:
        print(f"❌ Update FAILED: {e}")

    # 4. DELETE
    print("\n[4] Testing DELETE...")
    try:
        resp = requests.delete(f"{BASE_URL}/knowledge-bases/{kb_id}")
        resp.raise_for_status()
        print(f"✅ Delete request successful")
        
        # Verify it's gone
        resp = requests.get(f"{BASE_URL}/knowledge-bases")
        kbs = resp.json()
        found = any(k["id"] == kb_id for k in kbs)
        if not found:
             print(f"✅ Verification: KB ID {kb_id} is incorrectly removed from list")
        else:
             print(f"❌ Verification FAILED: KB ID {kb_id} is still present!")
    except Exception as e:
        print(f"❌ Delete FAILED: {e}")

if __name__ == "__main__":
    verify_kb_crud()
