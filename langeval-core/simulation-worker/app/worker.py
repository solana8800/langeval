from aiokafka import AIOKafkaConsumer
import asyncio
import json
import os
from app.core import resources
from app.services.simulator import run_simulation

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
SIMULATION_TOPIC = os.getenv("KAFKA_TOPIC_SIMULATION_REQUESTS", "simulation.requests")
RESULT_TOPIC = os.getenv("KAFKA_TOPIC_SIMULATION_COMPLETED", "simulation.completed")
CONSUMER_GROUP_ID = os.getenv("KAFKA_GROUP_SIMULATION", "simulation-group")

async def consume_messages():
    print(f"DEBUG: Starting consumer for {SIMULATION_TOPIC}...", flush=True)
    consumer = AIOKafkaConsumer(
        SIMULATION_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id=CONSUMER_GROUP_ID,
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        retry_backoff_ms=500,
        request_timeout_ms=30000,
        connections_max_idle_ms=600000
    )
    
    try:
        await consumer.start()
        print(f"DEBUG: Consumer started successfully for {SIMULATION_TOPIC}", flush=True)
        
        async for msg in consumer:
            payload = msg.value
            try:
                print(f"Received Simulation Request: {payload}")
                
                # --- EXECUTE AUTOGEN ---
                # Pass push_trace callback from resources
                result = await run_simulation(payload, trace_callback=resources.push_trace)
                # -----------------------

                # 1. Push to Redis (for Orchestrator)
                campaign_id = result.get("campaign_id")
                node_id = payload.get("node_id")
                
                if campaign_id and resources.redis_client:
                    redis_key = f"campaign:{campaign_id}:node:{node_id}:result" if node_id else f"campaign:{campaign_id}:simulation_result"
                    await resources.redis_client.rpush(redis_key, json.dumps(result))
                    await resources.redis_client.expire(redis_key, 600)

                # 2. Send result to Kafka (for Data Ingestion)
                if resources.producer:
                    await resources.producer.send_and_wait(RESULT_TOPIC, result)
                    print(f"Sent result to {RESULT_TOPIC} & Redis")
                    
            except Exception as e:
                print(f"ERROR: Exception processing simulation request: {e}", flush=True)
                # Push failure result to Redis so orchestrator doesn't hang
                try:
                    campaign_id = payload.get("campaign_id")
                    node_id = payload.get("node_id")
                    if campaign_id and resources.redis_client:
                        failed_result = {
                            "campaign_id": campaign_id,
                            "node_id": node_id,
                            "status": "failed",
                            "error": str(e)
                        }
                        redis_key = f"campaign:{campaign_id}:node:{node_id}:result" if node_id else f"campaign:{campaign_id}:simulation_result"
                        await resources.redis_client.rpush(redis_key, json.dumps(failed_result))
                except Exception as inner_e:
                    print(f"DEBUG: Failed to push error result to Redis: {inner_e}")
                    
    except Exception as e:
        print(f"CRITICAL: Consumer reported error: {e}", flush=True)
    finally:
        await consumer.stop()
        print(f"DEBUG: Consumer stopped for {SIMULATION_TOPIC}")
