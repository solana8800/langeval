
import requests
import json
import time

RESOURCE_URL = "http://localhost:8003/resource/models"
API_KEY_RAW = "sk-verify-1234567890"

def create_model():
    payload = {
        "name": "Verify-DeepSeek-Test",
        "provider": "DeepSeek",
        "type": "API",
        "api_key": API_KEY_RAW,
        "base_url": "https://api.deepseek.com",
        "meta_data": {"test": "true"}
    }
    
    print(f"Creating Model at {RESOURCE_URL}...")
    try:
        resp = requests.post(RESOURCE_URL, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            print("Model Created Successfully!")
            print(f"ID: {data.get('id')}")
            print(f"Encrypted Key: {data.get('api_key_encrypted')}")
            
            # Verify Key is NOT raw
            if data.get('api_key_encrypted') == API_KEY_RAW:
                print("ERROR: API Key was not encrypted!")
            elif not data.get('api_key_encrypted'):
                print("ERROR: API Key is missing!")
            else:
                print("SUCCESS: API Key is encrypted.")
                
            return data.get('id')
        else:
            print(f"Failed to create model: {resp.text}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def verify_get(model_id):
    if not model_id: return
    
    print(f"Fetching Model {model_id}...")
    resp = requests.get(f"{RESOURCE_URL}/{model_id}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Fetched Model: {data.get('name')}")
        print(f"Fetched Key: {data.get('api_key_encrypted')}")
    else:
        print(f"Failed to fetch: {resp.text}")

if __name__ == "__main__":
    mid = create_model()
    verify_get(mid)
