import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "evaluation-worker"
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
    KAFKA_TOPIC_EVALUATION_REQUESTS: str = os.getenv("KAFKA_TOPIC_EVALUATION_REQUESTS", "evaluation.requests")
    KAFKA_TOPIC_EVALUATION_COMPLETED: str = os.getenv("KAFKA_TOPIC_EVALUATION_COMPLETED", "evaluation.completed")
    KAFKA_TOPIC_MANUAL_REVIEW: str = os.getenv("KAFKA_TOPIC_MANUAL_REVIEW", "evaluation.manual_review")
    KAFKA_TOPIC_TRACES: str = os.getenv("KAFKA_TOPIC_TRACES", "traces")
    KAFKA_GROUP_EVALUATION: str = os.getenv("KAFKA_GROUP_EVALUATION", "evaluation-group")
    
    # Confidence Threshold
    EVALUATION_CONFIDENCE_THRESHOLD: float = float(os.getenv("EVALUATION_CONFIDENCE_THRESHOLD", "0.5"))
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379")
    
    # OpenAI / LLM
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "deepseek-chat")

settings = Settings()
