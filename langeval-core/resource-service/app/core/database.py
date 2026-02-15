from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import QueuePool
from app.core.config import settings
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resource.db")

# Connection Pool Configuration
# Tối ưu cho production workload
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))  # Số connections thường xuyên
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))  # Số connections tạm thời
POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))  # Timeout khi chờ connection (seconds)
POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))  # Recycle connection sau 1h
ECHO_SQL = os.getenv("DB_ECHO", "false").lower() == "true"  # Tắt echo trong production

# Create engine với connection pooling
engine = create_engine(
    DATABASE_URL,
    echo=ECHO_SQL,  # Chỉ bật trong dev để debug
    poolclass=QueuePool,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_timeout=POOL_TIMEOUT,
    pool_recycle=POOL_RECYCLE,
    pool_pre_ping=True,  # Kiểm tra connection trước khi dùng (tránh stale connections)
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
