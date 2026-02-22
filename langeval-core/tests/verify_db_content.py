
from sqlalchemy import create_engine, text
import json

DB_URL = "postgresql://admin:password@localhost:5432/eval_db"

def check_db():
    print(f"Connecting to {DB_URL}...")
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Check if api_key column exists
            try:
                result = conn.execute(text("SELECT id, name, api_key_encrypted, api_key FROM model_ref ORDER BY created_at DESC LIMIT 5;"))
                rows = result.fetchall()
                print(f"Found {len(rows)} models:")
                for row in rows:
                    print(f"ID: {row[0]}, Name: {row[1]}, KeyEnc: {row[2]}, KeyRaw: {row[3]}")
            except Exception as e:
                print(f"Select failed (maybe column missing): {e}")
                
    except Exception as e:
        print(f"DB Check Failed: {e}")

if __name__ == "__main__":
    check_db()
