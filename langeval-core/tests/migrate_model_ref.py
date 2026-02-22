
from sqlalchemy import create_engine, text
import os

# Use the value found in .env
DB_URL = "postgresql://admin:password@localhost:5432/eval_db"

def migrate():
    print(f"Connecting to {DB_URL}...")
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Check if column exists strictly to avoid error
            check_sql = text("SELECT column_name FROM information_schema.columns WHERE table_name='model_ref' AND column_name='api_key_encrypted';")
            result = conn.execute(check_sql).fetchone()
            
            if result:
                print("Column 'api_key_encrypted' already exists.")
            else:
                print("Adding 'api_key_encrypted' column...")
                alter_sql = text("ALTER TABLE model_ref ADD COLUMN api_key_encrypted VARCHAR;")
                conn.execute(alter_sql)
                conn.commit()
                print("Migration successful: Added 'api_key_encrypted'.")
                
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
