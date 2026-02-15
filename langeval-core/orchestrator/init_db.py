
import asyncio
from app.db.engine import engine
from app.db.models import Base

async def init_db():
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables initialized.")

if __name__ == "__main__":
    asyncio.run(init_db())
