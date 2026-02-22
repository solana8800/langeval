from aiokafka import AIOKafkaProducer
from redis.asyncio import Redis
import os
import asyncio
import json

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
TRACES_TOPIC = os.getenv("KAFKA_TOPIC_TRACES", "traces")

producer: AIOKafkaProducer = None
redis_client: Redis = None
redis_url = os.getenv("REDIS_URL", "redis://redis:6379")

async def wait_for_kafka(bootstrap_servers, retries=10, delay=2):
    for i in range(retries):
        try:
            print(f"Attempting to connect to Kafka ({bootstrap_servers}) - Attempt {i+1}/{retries}...")
            # Initialize Producer
            temp_producer = AIOKafkaProducer(
                bootstrap_servers=bootstrap_servers,
                value_serializer=lambda m: json.dumps(m).encode('utf-8')
            )
            await temp_producer.start()
            print("Successfully connected to Kafka.")
            await temp_producer.stop() 
            return True
        except Exception as e:
            print(f"Failed to connect to Kafka: {e}")
            if i < retries - 1:
                await asyncio.sleep(delay)
                delay = min(delay * 2, 30)
            else:
                raise e

async def init_resources():
    global producer, redis_client
    print(f"Initializing Resources... Kafka={KAFKA_BOOTSTRAP_SERVERS}, Redis={redis_url}")
    
    # Wait for Kafka to be ready
    await wait_for_kafka(KAFKA_BOOTSTRAP_SERVERS)
    
    # Initialize Producer
    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda m: json.dumps(m).encode('utf-8')
    )
    await producer.start()
    
    # Initialize Redis
    redis_client = Redis.from_url(redis_url, decode_responses=True)

async def close_resources():
    global producer, redis_client
    if producer: await producer.stop()
    if redis_client: await redis_client.close()

async def push_trace(event_data: dict):
    """
    Push arbitrary event data to the central traces topic.
    """
    if producer:
        try:
            await producer.send_and_wait(TRACES_TOPIC, event_data)
        except Exception as e:
            print(f"Failed to push trace: {e}")
