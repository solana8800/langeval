import asyncio
import os
from langgraph.checkpoint.redis import AsyncRedisSaver
from redis.asyncio import Redis

async def main():
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
    print(f"Connecting to {redis_url}")
    redis_client = Redis.from_url(redis_url)
    
    print("Creating Saver...")
    saver = AsyncRedisSaver(redis_client=redis_client)
    
    print("Testing put/get...")
    config = {"configurable": {"thread_id": "test-thread"}}
    
    # It seems we need to try writing to it to see if it hangs
    # But Saver usually works with graph methods.
    # Let's try to simulate what compile does.
    
    try:
        print("Saver created. Attempting list operation to check connection...")
        await redis_client.ping()
        print("Redis Ping Success.")

        print("Calling asetup...")
        await saver.asetup()
        print("asetup done.")

        # Try to use saver
        print("Saving checkpoint...")
        config = {"configurable": {"thread_id": "test-thread", "checkpoint_ns": ""}}
        checkpoint = {"v": 1, "id": "test-id", "ts": "2024-01-01", "channel_values": {}, "channel_versions": {}, "versions_seen": {}}
        metadata = {"source": "test", "step": 1, "writes": {}, "parents": {}}
        # Note: aput signature might vary by version. 
        # checking dir(saver) showed aput.
        # usually: aput(config, checkpoint, metadata, new_versions)
        await saver.aput(config, checkpoint, metadata, {})
        print(f"Checkpoint saved.")
        
        print("Loading checkpoint...")
        loaded = await saver.aget(config)
        print(f"Loaded: {loaded}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
