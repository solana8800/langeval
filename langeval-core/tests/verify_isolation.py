import requests
import uuid
import time
import sys

# Configuration
IDENTITY_URL = "http://localhost:8002/api/v1"
RESOURCE_URL = "http://localhost:8003/resource"

# Utils
def print_step(msg):
    print(f"\n[STEP] {msg}")

def print_result(msg, status="OK"):
    print(f"  -> {status}: {msg}")

def fail(msg):
    print(f"\n[FAIL] {msg}")
    sys.exit(1)

def get_auth_token():
    # Helper to get a token. Since we don't have a direct login without Google,
    # we might need to rely on an existing token or create a test user via direct DB insertion?
    # Actually, Identity Service might have a dev login or we can simulate one if we are in dev mode.
    # Looking at identity-service, it uses Google OAuth.
    # However, for tests, we might want to bypass or use a specific test endpoint if it exists.
    # If not, we might be blocked on actual Google Login unless we mock it.
    
    # Wait, `identity-service` usually has a way to vend tokens for dev?
    # Or I can manually insert a user and generate a JWT if I know the secret.
    # The secret is likely "supersecret" from docker-compose.
    
    # Let's try to generate a token locally using python-jose if possible, 
    # but that requires installing `python-jose`.
    # Alternatively, check if there is a dev-login endpoint.
    pass

# Mocking token generation for now (assuming we can't easily login via script without interactive flow)
# I will try to use a "dev" token if I can find one, or I'll implement a fast token generator here 
# assuming I know the secret.
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-super-secret-key-here" # Matches frontend .env and updated backend security.py
ALGORITHM = "HS256"

def create_access_token(user_id: str, email: str):
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"sub": user_id, "email": email, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def run_verification():
    print_step("Initializing Verification")

    # 0. Reset Database to ensure Schema is up to date
    print_step("Resetting Resource DB")
    try:
        # Note: The endpoint is defined as /resource/reset-db in the root router in main.py
        # And RESOURCE_URL is http://localhost:8003/resource
        # So we can construct it or just hardcode it to be safe.
        # Check main.py: @root_router.post("/resource/reset-db") mounted at app root.
        reset_url = "http://localhost:8003/resource/reset-db" 
        res = requests.post(reset_url)
        if res.status_code == 200:
            print_result("Resource DB Reset Successful")
        else:
            print_result(f"Resource DB Reset Failed: {res.text}", "WARN")
    except Exception as e:
         print_result(f"Resource DB Reset Failed (Connection Error): {e}", "WARN")

    # 1. Create User tokens
    user1_id = str(uuid.uuid4())
    user1_email = f"user1_{uuid.uuid4()}@example.com"
    token1 = create_access_token(user1_id, user1_email)

    
    user2_id = str(uuid.uuid4())
    user2_email = f"user2_{uuid.uuid4()}@example.com"
    token2 = create_access_token(user2_id, user2_email)
    
    # Note: verification might fail if the user doesn't exist in DB and API checks FK constraints.
    # Identity service "get_current_user" checks DB.
    # So we MUST create the user in DB first.
    # Since we can't easily insert into DB via API (signup is via Google), 
    # we might need to rely on `create_workspace` implicitly creating user? No.
    
    # PLAN B: Authenticate with a real user? Or use a backdoor?
    # I'll check `identity-service` code for any auto-creation logic or dev endpoints.
    # If not, I will try to Insert into Postgres directly using `psycopg2` or `sqlmodel` if available?
    # Or I can use `docker exec` to insert user.
    
    print_result("Skipping User Creation validation (assuming manual setup or implicit trust for now)")
    print_result("Actually, I will try to use the `token` and see if it works. If it fails 401/404, I know why.")

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 2. Setup Workspaces
    print_step("Creating Workspaces")
    
    # Create Workspace A for User 1
    # We need to make sure User 1 exists. 
    # Since I cannot easily create user, I might be stuck here without DB access.
    # I'll assume I can use `sqlmodel` within this script to insert users if I run it from `langeval-core`.
    
    # Let's try to connect to DB.
    try:
        from sqlmodel import create_engine, Session, SQLModel
        from sqlalchemy import text
        # Connection string from docker-compose: postgresql://admin:password@localhost:5432/eval_db
        engine = create_engine("postgresql://admin:password@localhost:5432/eval_db")
        
        with Session(engine) as session:
            # Create User 1
            session.execute(text(f"INSERT INTO users (id, email, name, google_id, created_at, updated_at) VALUES ('{user1_id}', '{user1_email}', 'User 1', '{user1_id}', NOW(), NOW()) ON CONFLICT DO NOTHING"))
            # Create User 2
            session.execute(text(f"INSERT INTO users (id, email, name, google_id, created_at, updated_at) VALUES ('{user2_id}', '{user2_email}', 'User 2', '{user2_id}', NOW(), NOW()) ON CONFLICT DO NOTHING"))
            session.commit()
            print_result("Users created/verified in DB")
    except Exception as e:
        print_result(f"Failed to connect to DB: {e}", "WARN")
        print_result("Proceeding, but API calls might fail if users missing.")

    # Create Workspace A
    res = requests.post(f"{IDENTITY_URL}/workspaces", json={"name": "Workspace A"}, headers=headers1)
    if res.status_code != 200:
        fail(f"Failed to create Workspace A: {res.text}")
    ws_a = res.json()
    ws_a_id = ws_a["id"]
    print_result(f"Created Workspace A: {ws_a_id}")

    # Create Workspace B for User 1
    res = requests.post(f"{IDENTITY_URL}/workspaces", json={"name": "Workspace B"}, headers=headers1)
    if res.status_code != 200:
        fail(f"Failed to create Workspace B: {res.text}")
    ws_b = res.json()
    ws_b_id = ws_b["id"]
    print_result(f"Created Workspace B: {ws_b_id}")

    # 3. Resource Isolation Test
    print_step("Testing Resource Isolation (Scenarios)")

    # Create Scenario in A
    headers_a = headers1.copy()
    headers_a["X-Workspace-ID"] = ws_a_id
    
    res = requests.post(f"{RESOURCE_URL}/scenarios", json={
        "name": "Scenario In A",
        "description": "Test",
        "question_type": "text", 
        "default_model_id": "gpt-3.5-turbo",
        "nodes": [],
        "edges": []
    }, headers=headers_a)
    if res.status_code != 200:
        # Check if 422 - Validation Error
        print(res.text)
    
    if res.status_code != 200:
        fail(f"Failed to create Scenario in A: {res.text}")
    scenario_a_id = res.json()["id"]
    print_result(f"Created Scenario in A: {scenario_a_id}")

    # Create Scenario in B
    headers_b = headers1.copy()
    headers_b["X-Workspace-ID"] = ws_b_id
    
    res = requests.post(f"{RESOURCE_URL}/scenarios", json={
        "name": "Scenario In B",
        "description": "Test",
        "question_type": "text",
        "default_model_id": "gpt-4",
        "nodes": [],
        "edges": []
    }, headers=headers_b)
    if res.status_code != 200:
        fail(f"Failed to create Scenario in B: {res.text}")
    scenario_b_id = res.json()["id"]
    print_result(f"Created Scenario in B: {scenario_b_id}")

    # 4. Verify Visibility
    print_step("Verifying Visibility")

    # List in A should only show A
    res = requests.get(f"{RESOURCE_URL}/scenarios", headers=headers_a)
    items = res.json().get("items", [])
    ids = [i["id"] for i in items]
    
    if scenario_a_id in ids and scenario_b_id not in ids:
        print_result("Workspace A sees only Scenario A")
    else:
        fail(f"Isolation Broken in A! Found IDs: {ids}")

    # List in B should only show B
    res = requests.get(f"{RESOURCE_URL}/scenarios", headers=headers_b)
    items = res.json().get("items", [])
    ids = [i["id"] for i in items]
    
    if scenario_b_id in ids and scenario_a_id not in ids:
        print_result("Workspace B sees only Scenario B")
    else:
        fail(f"Isolation Broken in B! Found IDs: {ids}")

    # 5. Member Management Test
    print_step("Testing Member Management")
    
    # List Members in A
    res = requests.get(f"{IDENTITY_URL}/workspaces/{ws_a_id}/members", headers=headers1)
    if res.status_code != 200:
        fail(f"Failed to list members: {res.text}")
    members = res.json()
    print_result(f"Found {len(members)} members in A")
    if len(members) != 1 or members[0]['user_id'] != user1_id:
        fail("Unexpected members list")
        
    # Invite User 2 to A
    print_step("Testing Invites")
    res = requests.post(f"{IDENTITY_URL}/workspaces/{ws_a_id}/invites", json={
        "email": user2_email,
        "role": "EDITOR"
    }, headers=headers1)
    if res.status_code != 200:
        fail(f"Failed to create invite: {res.text}")
    invite_code = res.json()["code"]
    print_result(f"Invite created with code: {invite_code}")
    
    # Check Invites List
    res = requests.get(f"{IDENTITY_URL}/workspaces/{ws_a_id}/invites", headers=headers1)
    invites = res.json()
    if len(invites) != 1 or invites[0]['code'] != invite_code:
        fail("Invite not found in list")
    print_result("Invite listed successfully")

    # User 2 Accepts Invite
    print_step("Accepting Invite")
    res = requests.post(f"{IDENTITY_URL}/invites/{invite_code}/accept", headers=headers2)
    if res.status_code != 200:
        fail(f"User 2 failed to accept invite: {res.text}")
    print_result("User 2 accepted invite")
    
    # Check Members List again (Should satisfy requirement for listing members)
    res = requests.get(f"{IDENTITY_URL}/workspaces/{ws_a_id}/members", headers=headers1)
    members = res.json()
    print_result(f"Found {len(members)} members in A (Expect 2)")
    if len(members) != 2:
        fail("Member count incorrect after accept")

    # 6. Delete Member
    print_step("Testing Remove Member")
    res = requests.delete(f"{IDENTITY_URL}/workspaces/{ws_a_id}/members/{user2_id}", headers=headers1)
    if res.status_code != 200:
        fail(f"Failed to remove member: {res.text}")
    print_result("Member removed")
    
    res = requests.get(f"{IDENTITY_URL}/workspaces/{ws_a_id}/members", headers=headers1)
    members = res.json()
    if len(members) != 1:
        fail("Member count incorrect after removal")
        
    print_result("Verified Member Removal")
    
    print_step("ALL TESTS PASSED")

if __name__ == "__main__":
    run_verification()
