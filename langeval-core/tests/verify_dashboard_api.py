import requests
import json

API_URL = "http://localhost:8003/resource/dashboard"

def test_dashboard_api():
    """
    Test connectivity to Dashboard APIs.
    """
    print("🔍 Testing Dashboard API...")
    
    # 1. Summary
    try:
        resp = requests.get(f"{API_URL}/summary")
        if resp.status_code == 200:
            print("✅ GET /summary: OK")
            print(json.dumps(resp.json(), indent=2))
        else:
            print(f"❌ GET /summary Failed: {resp.status_code}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

    # 2. Trends
    try:
        resp = requests.get(f"{API_URL}/trends?days=7")
        if resp.status_code == 200:
            print("\n✅ GET /trends: OK")
            # print(json.dumps(resp.json(), indent=2)) # Too long
            print(f"Received {len(resp.json().get('labels', []))} data points.")
        else:
            print(f"❌ GET /trends Failed: {resp.status_code}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        
    # 3. Metrics Breakdown
    try:
        resp = requests.get(f"{API_URL}/metrics-breakdown")
        if resp.status_code == 200:
            print("\n✅ GET /metrics-breakdown: OK")
            print(json.dumps(resp.json(), indent=2))
        else:
            print(f"❌ GET /metrics-breakdown Failed: {resp.status_code}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_dashboard_api()
