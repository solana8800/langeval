from aiokafka import AIOKafkaProducer
from redis.asyncio import Redis
import os
import asyncio

producer: AIOKafkaProducer = None
redis_client: Redis = None
redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
kafka_bootstrap = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")

async def wait_for_kafka(bootstrap_servers, retries=10, delay=2):
    for i in range(retries):
        try:
            print(f"Attempting to connect to Kafka ({bootstrap_servers}) - Attempt {i+1}/{retries}...")
            producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
            await producer.start()
            print("Successfully connected to Kafka.")
            return producer
        except Exception as e:
            print(f"Failed to connect to Kafka: {e}")
            if i < retries - 1:
                await asyncio.sleep(delay)
                delay = min(delay * 2, 30)  # Exponential backoff, cap at 30s
            else:
                raise e

async def init_resources():
    global producer, redis_client
    print(f"Initializing Resources... Kafka={kafka_bootstrap}, Redis={redis_url}")
    
    # Retry logic for Kafka
    producer = await wait_for_kafka(kafka_bootstrap)
    
    redis_client = Redis.from_url(redis_url, decode_responses=True)

async def close_resources():
    global producer, redis_client
    if producer: await producer.stop()
    if redis_client: await redis_client.close()
