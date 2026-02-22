
import requests
import json

RESOURCE_URL = "http://localhost:8003/resource/agents"

try:
    print(f"Fetching from {RESOURCE_URL}...")
    resp = requests.get(RESOURCE_URL)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        if "items" in data:
            for agent in data["items"]:
                print(f"Agent: {agent.get('name')}")
                print(f"  ID: {agent.get('id')}")
                print(f"  Keys: {list(agent.keys())}")
                print(f"  API_KEY_ENC: {agent.get('api_key_encrypted')}")
                print(f"  Meta: {agent.get('meta_data')}")
                print("-" * 20)
        elif isinstance(data, list):
             for agent in data:
                print(f"Agent: {agent.get('name')}")
                print(f"  API_KEY_ENC: {agent.get('api_key_encrypted')}")
    else:
        print("Error:", resp.text)
except Exception as e:
    print(f"Exception: {e}")
