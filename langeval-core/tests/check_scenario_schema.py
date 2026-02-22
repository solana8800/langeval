import sys
import os
from sqlalchemy import create_engine, text

# Database URL (Correct one from previous success)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:password@localhost:5432/eval_db")
print(f"Connecting to {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        print("Connected.")
        
        # Check columns in scenario_ref with types
        print("--- Checking scenario_ref schema with types ---")
        result = connection.execute(text("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'scenario_ref';"))
        columns = [{row[0]: f"{row[1]} ({row[2]})"} for row in result.fetchall()]
        print(f"Columns: {columns}")
        
        if "workspace_id" in columns:
            print("✅ workspace_id exists in scenario_ref")
        else:
            print("❌ workspace_id MISSING in scenario_ref")

except Exception as e:
    print(f"Check Failed: {e}")
