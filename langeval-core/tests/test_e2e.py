import requests
import time
import uuid

# Configuration
SERVICES = {
    "orchestrator": "http://localhost:8001/orchestrator",
    "identity": "http://localhost:8002/identity", # Assuming future proofing or if identity uses root. Identity typically uses root or /identity? Let's check Identity.
    # Identity main.py: app = FastAPI(), @app.get("/health"). So it is ROOT.
    # Resource main.py: prefix="/resource". So it is /resource.
    # Orchestrator main.py: prefix="/orchestrator". So it is /orchestrator.
    # Let's be specific per service.
}

SERVICE_CONFIG = {
    "orchestrator": {"url": "http://localhost:8001", "health": "/orchestrator/health", "prefix": "/orchestrator"},
    "identity": {"url": "http://localhost:8002", "health": "/health", "prefix": ""}, # Identity uses root for health based on main.py view earlier
    "resource": {"url": "http://localhost:8003", "health": "/health", "prefix": "/resource"},
    "simulation": {"url": "http://localhost:8004", "health": "/health", "prefix": ""},
    "evaluation": {"url": "http://localhost:8005", "health": "/health", "prefix": ""},
    "gen-ai": {"url": "http://localhost:8006", "health": "/health", "prefix": ""},
    "data-ingestion": {"url": "http://localhost:8008", "health": "/health", "prefix": ""}
}

def print_result(name, passed, msg=""):
    symbol = "✅" if passed else "❌"
    print(f"{symbol} {name}: {msg}")

def check_health():
    print("--- 1. Checking Service Health ---")
    all_passed = True
    for name, config in SERVICE_CONFIG.items():
        try:
            url = f"{config['url']}{config['health']}"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                print_result(name, True, "OK")
            else:
                print_result(name, False, f"Status {resp.status_code}")
                all_passed = False
        except Exception as e:
            print_result(name, False, f"Connection Failed (Is Docker Up?) - {str(e)}")
            all_passed = False
    return all_passed

def run_ecommerce_scenario():
    print("\n--- 2. Simulating E-commerce Scenario (Universal Studio) ---")
    
    # 1. Create Agent (Resource Service)
    print("-> Creating 'Universal Studio Bot' Agent...")
    try:
        agent_payload = {
            "name": f"Molbot-{uuid.uuid4().hex[:6]}",
            "endpoint_url": "http://mock-bot/chat"
        }
        res_url = SERVICE_CONFIG['resource']['url'] + SERVICE_CONFIG['resource']['prefix']
        resp = requests.post(f"{res_url}/agents", json=agent_payload)
        if resp.status_code == 200:
            agent_data = resp.json()
            print_result("Create Agent", True, f"ID: {agent_data['id']}")
        else:
            print_result("Create Agent", False, resp.text)
            return
    except Exception as e:
        print_result("Create Agent", False, str(e))
        return

    # 2. Trigger Campaign (Orchestrator)
    # Persona triggers the "Ticket" mock in simulation-worker
    print("\n-> Triggering Campaign (Persona: Buy Tickets)...")
    try:
        campaign_payload = {
            "scenario_id": "mock-scenario-vinwonders",
            "metadata": {
                "user_id": "test-user-vin",
                "persona": "I want to buy tickets for Universal Studio amusement park." 
            }
        }
        orch_url = SERVICE_CONFIG['orchestrator']['url'] + SERVICE_CONFIG['orchestrator']['prefix']
        resp = requests.post(f"{orch_url}/campaigns", json=campaign_payload)
        if resp.status_code == 200:
            campaign_data = resp.json()
            cid = campaign_data['campaign_id']
            print_result("Start Campaign", True, f"Campaign ID: {cid}")
            
            # 3. Poll Status & Validate Content
            print(f"   Status: {campaign_data.get('status')}")
            print(f"   Score:  {campaign_data.get('current_score')}")
            
            messages = campaign_data.get("messages", []) 
            history_text = str(messages).lower()
            
            # Check for Universal Studio context
            if "ticket" in history_text and "vinwonders" in history_text:
                 print_result("Content Verification", True, "Found 'Universal Studio Ticket' flow context.")
            else:
                 print_result("Content Verification", False, f"Missing E-commerce Context. Got: {str(messages)[:100]}...")
                 
            # Verify Score
            score = campaign_data.get('current_score')
            if score is not None and score >= 0:
                 print_result("Evaluation Verification", True, f"Score: {score}")
            else:
                 print_result("Evaluation Verification", False, f"Invalid Score: {score}")
                 
        else:
            print_result("Start Campaign", False, resp.text)
    except Exception as e:
        print_result("Start Campaign", False, str(e))

if __name__ == "__main__":
    print("=== AI Agent Evaluation Platform: E2E Test ===")
    if check_health():
        run_ecommerce_scenario()
    else:
        print("\n⚠️  Some services are down. Please run `docker compose up --build -d` first.")
