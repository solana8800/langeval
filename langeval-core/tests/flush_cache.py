import sys
import os

# Add resource-service to sys.path to resolve app modules
current_dir = os.path.dirname(os.path.abspath(__file__))
resource_service_dir = os.path.join(current_dir, "../resource-service")
sys.path.append(resource_service_dir)

from app.core.cache import cache_service

if __name__ == "__main__":
    print("Flushing Redis Cache...")
    try:
        if cache_service.enabled:
            cache_service.clear_all()
            print("Successfully flushed cache.")
        else:
            print("Cache is disabled, nothing to flush.")
    except Exception as e:
        print(f"Error flushing cache: {e}")
