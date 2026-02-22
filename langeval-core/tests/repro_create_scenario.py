import sys
import os
import uuid
import json
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

# Setup path
current_dir = os.path.dirname(os.path.abspath(__file__))
resource_service_dir = os.path.join(current_dir, "../resource-service")
sys.path.insert(0, resource_service_dir)

from app.main import app
from app.core.database import get_session
from app.api.deps import get_current_workspace

# Test Setup
# def get_session_override():
#     engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
#     SQLModel.metadata.create_all(engine)
#     with Session(engine) as session:
#         yield session

# app.dependency_overrides[get_session] = get_session_override

client = TestClient(app)

WORKSPACE_ID = "4ddfe22e-5798-45eb-bd4f-06dedaf17c45"

def test_repro_scenario_creation():
    # Exact user headers
    headers = {
        'sec-ch-ua-platform': '"macOS"',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzE0MzkzMDEsInN1YiI6ImViYTMyNWY0LTAzOWYtNGE2OS1iZTNjLWQxMTg1MjU4OTc1NCJ9.M1pqAlJ9AK8LsTK4ekrspJiO6GJzNXAWnohKKDe_p9c',
        'Referer': 'http://localhost:8800/vi/scenario-builder',
        'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        'X-Workspace-ID': WORKSPACE_ID,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
        'Content-Type': 'application/json'
    }
    
    # Exact payload from user
    payload = {
        "name": "oooooo",
        "agent_id": "c05a855e-2550-41ef-b276-20204b7a9bda",
        "description": "",
        "nodes": [],
        "edges": [],
        "meta_data": {
            "model_id": "",
            "difficulty": "Medium",
            "language": "en"
        }
    }
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    # Run twice to check for unique constraint
    for i in range(2):
        print(f"\nAttempt {i+1}...")
        response = client.post("/scenarios", json=payload, headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Failed to create Scenario. Status: {response.status_code}")
            print(f"Response: {response.text}")
        else:
            data = response.json()
            print(f"✅ Scenario Created: {data}")
            assert data["workspace_id"] == WORKSPACE_ID

if __name__ == "__main__":
    try:
        test_repro_scenario_creation()
    except Exception as e:
        print(f"\n❌ Exception: {e}")
        import traceback
        traceback.print_exc()
