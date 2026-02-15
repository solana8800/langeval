import requests
import json

BASE_URL = "http://localhost:8003/resource/models"

def test_update_flow():
    # 1. Create Model
    payload = {
        "name": "Test Update Model",
        "provider": "OpenAI",
        "type": "API",
        "api_key": "sk-original-key",
        "base_url": "https://api.openai.com/v1"
    }
    print(f"Creating model...")
    res = requests.post(BASE_URL, json=payload)
    if not res.ok:
        print(f"Create failed: {res.text}")
        return
    
    model = res.json()
    model_id = model["id"]
    print(f"Created model ID: {model_id}")
    print(f"Original Base URL: {model.get('base_url')}")
    print(f"Response JSON: {model}")
    assert model.get("api_key_encrypted") is not None

    # 2. Update Model (Change Name & Base URL, Keep Key)
    # Frontend behavior: sends api_key=""
    update_payload = {
        "name": "Updated Model Name",
        "provider": "OpenAI",
        "type": "API",
        "api_key": "", # Simulate frontend empty input
        "base_url": "https://new.api.com"
    }
    print(f"\nUpdating model (keep key)...")
    res = requests.put(f"{BASE_URL}/{model_id}", json=update_payload)
    if not res.ok:
        print(f"Update failed: {res.text}")
        return

    updated_model = res.json()
    print(f"Updated Name: {updated_model['name']}")
    print(f"Updated Base URL: {updated_model.get('base_url')}")
    
    assert updated_model["name"] == "Updated Model Name"
    assert updated_model["base_url"] == "https://new.api.com"
    # Ensure key is still there (we can't see the value but we can see the field is populated)
    # Actually ModelRef returns api_key_encrypted.
    assert updated_model["api_key_encrypted"] is not None
    # We assume it hasn't changed or become None. 
    # To strictly verify it hasn't changed, we would need to decrypt or compare hashes, 
    # but since random IV is used in Fernet, encryption changes every time.
    # So we just ensure it's not None.
    
    # 3. Update Model (Change Key)
    update_payload_2 = {
        "api_key": "sk-new-key"
    }
    print(f"\nUpdating model (new key)...")
    res = requests.put(f"{BASE_URL}/{model_id}", json=update_payload_2)
    updated_model_2 = res.json()
    assert updated_model_2["api_key_encrypted"] is not None
    print("Update with new key successful.")

    # Clean up
    requests.delete(f"{BASE_URL}/{model_id}")
    print("\nTest Finished Successfully")

if __name__ == "__main__":
    try:
        test_update_flow()
    except Exception as e:
        print(f"Test Failed: {e}")
