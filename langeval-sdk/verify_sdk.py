import os
import time
from ai_eval_sdk import monitor, set_campaign_id

from dotenv import load_dotenv

# 1. Load Configuration from .env
load_dotenv()

# Verify crucial vars
if not os.getenv("LANGFUSE_SECRET_KEY"):
    raise ValueError("LANGFUSE_SECRET_KEY not found in .env")

# 2. Simulate Context
TEST_CAMPAIGN_ID = "sdk-verification-campaign"
set_campaign_id(TEST_CAMPAIGN_ID)

# 3. Define Monitored Function
@monitor
def process_user_data(username: str, email: str, phone: str):
    print(f"Processing user: {username}")
    # Simulate work
    time.sleep(0.5)
    return {
        "status": "success",
        "user_info": f"User {username} created. Email sent to {email}"
    }

if __name__ == "__main__":
    print("--- SDK Verification Start ---")
    try:
        # 4. Invoke Function with PII
        result = process_user_data(
            username="test_user_1",
            email="test_user@evaluation.ai",  # Should be masked
            phone="0912345678"               # Should be masked
        )
        print(f"Function Result: {result}")
        
        # 5. Allow background thread to flush
        print("Waiting for flush...")
        time.sleep(2) 
        print("--- SDK Verification Done ---")
        print("Check Langfuse Dashboard (http://localhost:3000) for:")
        print(f"1. Trace Name: 'process_user_data'")
        print(f"2. Tag: 'campaign_id:{TEST_CAMPAIGN_ID}'")
        print("3. Masked Email/Phone in Input/Output")
        
    except Exception as e:
        print(f"Error: {e}")
