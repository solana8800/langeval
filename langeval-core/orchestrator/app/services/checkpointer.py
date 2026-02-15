from langgraph.checkpoint.redis import AsyncRedisSaver
from redis.asyncio import Redis, ConnectionPool
import os

def get_redis_client() -> Redis:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    # Use connection pool for better performance and stability
    pool = ConnectionPool.from_url(redis_url, decode_responses=False)
    return Redis(connection_pool=pool)

def get_checkpointer() -> AsyncRedisSaver:
    """
    Trả về Async Redis Checkpointer để lưu trạng thái Graph.
    Key prefix: checkpoint:{thread_id}
    """
    redis_client = get_redis_client()
    return AsyncRedisSaver(redis_client=redis_client)
