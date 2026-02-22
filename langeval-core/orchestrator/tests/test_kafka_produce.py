from aiokafka import AIOKafkaProducer
import asyncio
import json

KAFKA_BOOTSTRAP_SERVERS = "kafka:29092"
SIMULATION_TOPIC = "simulation.requests"

async def produce():
    print(f"Connecting to Kafka {KAFKA_BOOTSTRAP_SERVERS}...")
    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda m: json.dumps(m).encode('utf-8')
    )
    await producer.start()
    try:
        payload = {
            "campaign_id": "test-campaign",
            "node_id": "test-node",
            "agent_id": "test-agent",
            "instruction": "Hello from manual test",
            "target_config": {},
            "include_history": []
        }
        print(f"Sending message to {SIMULATION_TOPIC}...")
        await producer.send_and_wait(SIMULATION_TOPIC, payload)
        print("Message sent successfully.")
    finally:
        await producer.stop()

if __name__ == "__main__":
    asyncio.run(produce())
