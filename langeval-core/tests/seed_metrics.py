import re
import requests
import json
import os

# Path to mock-metrics.ts
# Path to mock-metrics.ts
# Resolved relative to this script file: backend/tests/seed_metrics.py -> ../../langeval-ui/lib/data/mock-metrics.ts
script_dir = os.path.dirname(os.path.abspath(__file__))
MOCK_FILE_PATH = os.path.normpath(os.path.join(script_dir, "../../langeval-ui/lib/data/mock-metrics.ts"))
API_URL = "http://localhost:8003/resource/metrics-library/seed"

def parse_metrics(file_path):
    metrics = []
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return []

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find all objects inside the array: { ... }
    # This regex is a bit simplistic but works for the current file structure where each item is on one line or clearly structured.
    # Actually, the file has one item per line mostly.
    
    lines = content.split('\n')
    current_metric = {}
    
    for line in lines:
        line = line.strip()
        if not line.startswith('{') or not line.endswith('},'): 
            continue
            
        # Parse fields using regex
        m_id = re.search(r"id:\s*'([^']*)'", line)
        m_name = re.search(r"name:\s*'([^']*)'", line)
        m_desc = re.search(r"description:\s*'([^']*)'", line)
        m_cat = re.search(r"category:\s*'([^']*)'", line)
        m_enabled = re.search(r"enabled:\s*(true|false)", line)
        m_thresh = re.search(r"threshold:\s*([\d\.]+)", line)
        m_custom = re.search(r"isCustom:\s*(true|false)", line)
        
        if m_id:
            metric = {
                "id": m_id.group(1),
                "name": m_name.group(1) if m_name else "",
                "definition": m_desc.group(1) if m_desc else "", # mapping description -> definition (backend model uses definition?)
                # Wait, MetricConfigRef has definition? Let me check model.
                # MetricConfigRef: id, name, category, definition, threshold, enabled, config
                "category": m_cat.group(1) if m_cat else "Others",
                "enabled": m_enabled.group(1) == 'true' if m_enabled else False,
                "threshold": float(m_thresh.group(1)) if m_thresh else 0.5,
                "config": {}
            }
            # Frontend has 'description', Backend `MetricConfigRef` has `definition`.
            # Let's map description to definition.
            
            if m_custom and m_custom.group(1) == 'true':
                metric['config']['isCustom'] = True
            
            metrics.append(metric)

    return metrics

def seed_backend(metrics):
    try:
        print(f"Sending {len(metrics)} metrics to {API_URL}...")
        response = requests.post(API_URL, json=metrics)
        if response.status_code == 200:
            print("Successfully seeded metrics!")
            print("Response:", response.json())
        else:
            print(f"Failed to seed. Status: {response.status_code}")
            print("Error:", response.text)
    except Exception as e:
        print(f"Error calling API: {e}")

if __name__ == "__main__":
    
    print(f"Reading from {MOCK_FILE_PATH}")
    metrics_data = parse_metrics(MOCK_FILE_PATH)
    seed_backend(metrics_data)
