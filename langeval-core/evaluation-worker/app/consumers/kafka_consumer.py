from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from redis.asyncio import Redis
import asyncio
import json
import logging
from app.core.config import settings
# run_scoring imported inside function to avoid circular deps if any

logger = logging.getLogger(__name__)

consumer = None
producer = None

async def push_trace(event_data: dict):
    if producer:
        try:
            await producer.send_and_wait(settings.KAFKA_TOPIC_TRACES, event_data)
        except Exception as e:
            logger.error(f"Failed to push trace from evaluation-worker: {e}")

async def consume_messages():
    logger.info(f"Starting consumer for {settings.KAFKA_TOPIC_EVALUATION_REQUESTS}...")
    global consumer, producer
    consumer = AIOKafkaConsumer(
        settings.KAFKA_TOPIC_EVALUATION_REQUESTS,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id=settings.KAFKA_GROUP_EVALUATION,
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )
    producer = AIOKafkaProducer(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda m: json.dumps(m).encode('utf-8')
    )

    # Redis Init
    redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)

    retry_count = 0
    max_retries = 5
    while retry_count < max_retries:
        try:
            await consumer.start()
            await producer.start()
            logger.info("Successfully connected to Kafka.")
            break
        except Exception as e:
            logger.error(f"Failed to connect to Kafka (Attempt {retry_count + 1}/{max_retries}): {e}")
            retry_count += 1
            await asyncio.sleep(5)
    else:
        raise Exception("Could not connect to Kafka after multiple retries.")
    
    # Batch Config
    BATCH_SIZE = 10
    FLUSH_INTERVAL = 5.0 # seconds
    batch_buffer = []
    
    from app.services.evaluator import run_scoring_batch, run_battle_judge
    
    async def process_batch(messages):
        if not messages:
            return
            
        logger.info(f"Processing batch of {len(messages)} messages...")
        
        results = []
        # Tách riêng battle requests và standard eval requests
        battle_payloads = []
        standard_payloads = []
        
        for m in messages:
            p = m.value
            if p.get("response_a") and p.get("response_b"):
                battle_payloads.append(p)
            else:
                standard_payloads.append(p)
                
        # Xử lý standard requests (batch)
        if standard_payloads:
            results.extend(await run_scoring_batch(standard_payloads, trace_callback=push_trace))
            
        # Xử lý battle requests (sequential for simplicity or gather)
        if battle_payloads:
            battle_results = await asyncio.gather(*[run_battle_judge(p) for p in battle_payloads])
            results.extend(battle_results)
            
        # -----------------------------
        
        for res in results:
             # 1. Push to Redis
            campaign_id = res.get("campaign_id")
            if campaign_id:
                node_id = res.get("node_id")
                if node_id:
                    redis_key = f"campaign:{campaign_id}:node:{node_id}:result"
                else:
                    redis_key = f"campaign:{campaign_id}:evaluation_result"
                
                await redis_client.rpush(redis_key, json.dumps(res))
                await redis_client.expire(redis_key, 600)

            # 2. Check Confidence & Send result back
            total_score = res.get("total_score", 0.0)
            
            if total_score < settings.EVALUATION_CONFIDENCE_THRESHOLD:
                # Low confidence -> Manual Review
                res["status"] = "needs_review"
                res["confidence_flag"] = "low"
                logger.warning(f"Campaign {campaign_id} has low score ({total_score}). Sending to Manual Review.")
                await producer.send_and_wait(settings.KAFKA_TOPIC_MANUAL_REVIEW, res)
            else:
                # High confidence -> Completed
                await producer.send_and_wait(settings.KAFKA_TOPIC_EVALUATION_COMPLETED, res)
        
        logger.info(f"Batch processed. Sent {len(results)} results.")

    try:
        # Consumer Loop with Batching
        iterator = consumer.__aiter__()
        while True:
            try:
                # Wait for next message or timeout
                msg = await asyncio.wait_for(iterator.__anext__(), timeout=FLUSH_INTERVAL)
                batch_buffer.append(msg)
                
                if len(batch_buffer) >= BATCH_SIZE:
                    await process_batch(batch_buffer)
                    batch_buffer = []
                    
            except asyncio.TimeoutError:
                # Flush on timeout if we have data
                if batch_buffer:
                    logger.info("Batch timeout reached. Flushing buffer.")
                    await process_batch(batch_buffer)
                    batch_buffer = []
            except StopAsyncIteration:
                break
                
    finally:
        # Flush remaining
        if batch_buffer:
             await process_batch(batch_buffer)
             
        await consumer.stop()
        await producer.stop()
