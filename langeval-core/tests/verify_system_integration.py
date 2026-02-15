import requests
import json
import sys
from datetime import datetime

# Service Configuration
SERVICES = {
    "resource-service": "http://localhost:8003",
    "orchestrator": "http://localhost:8001",
    "identity-service": "http://localhost:8002",
    "evaluation-worker": "http://localhost:8005",
    "simulation-worker": "http://localhost:8004",
    "gen-ai-service": "http://localhost:8006"
}

ENDPOINTS = [
    # Resource Service
    {"service": "resource-service", "path": "/resource/agents", "name": "Agents API"},
    {"service": "resource-service", "path": "/resource/knowledge-bases", "name": "Knowledge Bases API"},
    {"service": "resource-service", "path": "/resource/scenarios", "name": "Scenarios API"},
    {"service": "resource-service", "path": "/resource/metrics-library", "name": "Metrics API"},
    {"service": "resource-service", "path": "/resource/models", "name": "Models API"},
    
    # Orchestrator
    {"service": "orchestrator", "path": "/orchestrator/health", "name": "Orchestrator Health"},
    
    # Identity Service
    {"service": "identity-service", "path": "/health", "name": "Identity Service Health"},
    
    # Workers (Health Checks)
    {"service": "evaluation-worker", "path": "/health", "name": "Eval Worker Health"},
    {"service": "simulation-worker", "path": "/health", "name": "Sim Worker Health"},
    {"service": "gen-ai-service", "path": "/health", "name": "GenAI Service Health"},
]

def log(message, status="INFO"):
    colors = {
        "INFO": "\033[94m",    # Blue
        "SUCCESS": "\033[92m", # Green
        "WARNING": "\033[93m", # Yellow
        "ERROR": "\033[91m",   # Red
        "RESET": "\033[0m"
    }
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{colors.get(status, '')}[{timestamp}] [{status}] {message}{colors['RESET']}")

def check_api_health():
    log("🚀 Starting System Integration Verifier...", "INFO")
    success_count = 0
    
    for endpoint in ENDPOINTS:
        service_url = SERVICES.get(endpoint['service'])
        url = f"{service_url}{endpoint['path']}"
        
        try:
            # Set timeout to catch hanging connections
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                item_count = "N/A"
                
                if isinstance(data, list):
                    item_count = len(data)
                elif isinstance(data, dict):
                    if 'data' in data and isinstance(data['data'], list):
                        item_count = len(data['data'])
                    elif 'items' in data: 
                         item_count = len(data['items'])
                    elif 'status' in data:
                        item_count = data['status']
                
                log(f"✅ {endpoint['name']:<25} | Status: 200 | Items/Msg: {str(item_count):<7} | URL: {url}", "SUCCESS")
                success_count += 1
            else:
                log(f"❌ {endpoint['name']:<25} | Status: {response.status_code} | URL: {url}", "ERROR")
                
        except requests.exceptions.ConnectionError:
            log(f"❌ {endpoint['name']:<25} | Connection Refused | URL: {url}", "ERROR")
        except Exception as e:
            log(f"⚠️  {endpoint['name']:<25} | Error: {str(e)}", "WARNING")

    print("-" * 80)
    if success_count == len(ENDPOINTS):
        log("🏆 All Backend Services Operational! The system is fully integrated.", "SUCCESS")
    else:
        log(f"⚠️  System Partial Healthy ({success_count}/{len(ENDPOINTS)} operational)", "WARNING")

if __name__ == "__main__":
    check_api_health()
