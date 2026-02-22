import redis
import json
from typing import Optional, Any
from functools import wraps
import os

class CacheService:
    """
    Redis caching service cho frequently accessed data.
    Giúp giảm database queries và tăng response time.
    """
    
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            self.client = redis.from_url(redis_url, decode_responses=True)
            self.client.ping()  # Test connection
            self.enabled = True
            print(f"✅ Redis cache connected: {redis_url}")
        except Exception as e:
            print(f"⚠️  Redis cache disabled: {e}")
            self.client = None
            self.enabled = False
        
        self.default_ttl = 300  # 5 minutes default TTL
    
    def get(self, key: str) -> Optional[Any]:
        """Lấy dữ liệu từ cache"""
        if not self.enabled:
            return None
        
        try:
            data = self.client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"Cache get error for key '{key}': {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Lưu dữ liệu vào cache với TTL"""
        if not self.enabled:
            return
        
        try:
            ttl = ttl or self.default_ttl
            serialized = json.dumps(value, default=str)  # default=str để handle datetime
            self.client.setex(key, ttl, serialized)
        except Exception as e:
            print(f"Cache set error for key '{key}': {e}")
    
    def delete(self, key: str):
        """Xóa key khỏi cache"""
        if not self.enabled:
            return
        
        try:
            self.client.delete(key)
        except Exception as e:
            print(f"Cache delete error for key '{key}': {e}")
    
    def delete_pattern(self, pattern: str):
        """Xóa tất cả keys match pattern (ví dụ: 'agents:*')"""
        if not self.enabled:
            return
        
        try:
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
                print(f"🗑️  Deleted {len(keys)} cache keys matching '{pattern}'")
        except Exception as e:
            print(f"Cache delete pattern error for '{pattern}': {e}")
    
    def clear_all(self):
        """Xóa toàn bộ cache (dùng cho testing)"""
        if not self.enabled:
            return
        
        try:
            self.client.flushdb()
            print("🗑️  Cache cleared")
        except Exception as e:
            print(f"Cache clear error: {e}")

# Singleton instance
cache_service = CacheService()

def cached(key_prefix: str, ttl: int = 300):
    """
    Decorator để cache kết quả của function.
    
    Usage:
        @cached(key_prefix="agent", ttl=60)
        def get_agent(self, agent_id: str):
            return self.repository.get(agent_id)
    
    Cache key format: {key_prefix}:{arg1}:{arg2}:...[:kw=val]...[:ws=uuid]
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Skip self argument, build cache key từ remaining args
            cache_parts = [key_prefix]
            
            # Add positional args (skipping self)
            if len(args) > 1:
                cache_parts.extend([str(arg) for arg in args[1:]])
                
            # Add keyword args
            if kwargs:
                for k, v in sorted(kwargs.items()):
                    cache_parts.append(f"{k}={v}")
            
            # Add workspace_id from self if available
            if args and hasattr(args[0], 'workspace_id'):
                ws_id = getattr(args[0], 'workspace_id', None)
                if ws_id:
                    cache_parts.append(f"ws={ws_id}")
            
            cache_key = ":".join(cache_parts)
            
            # Try cache first
            try:
                cached_data = cache_service.get(cache_key)
                if cached_data is not None:
                    # print(f"✅ Cache HIT: {cache_key}")
                    return cached_data
            except Exception as e:
                print(f"Cache read failed: {e}")
            
            # Cache miss - call original function
            # print(f"❌ Cache MISS: {cache_key}")
            result = func(*args, **kwargs)
            
            # Store in cache (convert SQLModel to dict if needed)
            if result is not None:
                try:
                    # Handle SQLModel objects
                    if hasattr(result, 'dict'):
                        cache_data = result.dict()
                    elif hasattr(result, '__dict__'):
                        cache_data = result.__dict__
                    else:
                        cache_data = result
                    
                    cache_service.set(cache_key, cache_data, ttl)
                except Exception as e:
                    print(f"Cache write failed: {e}")
            
            return result
        return wrapper
    return decorator
