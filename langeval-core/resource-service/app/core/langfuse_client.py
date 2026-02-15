"""
Langfuse API Client Wrapper
Cung cấp interface để gọi Langfuse API và lấy trace data.
"""

import os
import httpx
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class LangfuseClient:
    """Client để tương tác với Langfuse API"""
    
    def __init__(self):
        self.base_url = os.getenv("LANGFUSE_HOST", "http://localhost:3000")
        self.public_key = os.getenv("LANGFUSE_PUBLIC_KEY", "")
        self.secret_key = os.getenv("LANGFUSE_SECRET_KEY", "")
        self.timeout = 10.0
        
        if not self.public_key or not self.secret_key:
            logger.warning("Langfuse credentials not configured. API calls will fail.")
    
    def _get_auth(self) -> tuple:
        """Trả về auth tuple cho httpx"""
        return (self.public_key, self.secret_key)
    
    async def get_traces(
        self,
        project_id: str,
        limit: int = 50,
        offset: int = 0,
        cursor: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Lấy danh sách traces từ Langfuse API.
        
        Args:
            project_id: ID của project trong Langfuse
            limit: Số lượng traces tối đa
            offset: Offset cho pagination (nếu không dùng cursor)
            cursor: Cursor cho pagination (ưu tiên hơn offset)
            filters: Các filter bổ sung (name, user_id, tags, fromTimestamp, toTimestamp, etc.)
        
        Returns:
            Dict chứa data và metadata
            
        Raises:
            httpx.HTTPError: Khi API call thất bại
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Langfuse API endpoint: GET /api/public/traces
                url = f"{self.base_url}/api/public/traces"
                
                params = {
                    "limit": limit,
                }
                
                # Langfuse uses page-based pagination
                # Cursor is actually the page number
                if cursor:
                    try:
                        page = int(cursor)
                        params["page"] = page
                    except ValueError:
                        # Fallback to offset-based if cursor is not a number
                        params["page"] = offset // limit + 1
                else:
                    params["page"] = offset // limit + 1
                
                print(f"[LANGFUSE] Calling {url} with params: {params}")
                
                # Thêm filters nếu có
                if filters:
                    if filters.get("name"):
                        params["name"] = filters["name"]
                    if filters.get("user_id"):
                        params["userId"] = filters["user_id"]
                    if filters.get("tags"):
                        params["tags"] = filters["tags"]
                    if filters.get("fromTimestamp"):
                        params["fromTimestamp"] = filters["fromTimestamp"]
                    if filters.get("toTimestamp"):
                        params["toTimestamp"] = filters["toTimestamp"]
                
                response = await client.get(
                    url,
                    params=params,
                    auth=self._get_auth(),
                    headers={
                        "X-Langfuse-Project-Id": project_id
                    }
                )
                
                response.raise_for_status()
                data = response.json()
                
                logger.info(f"Fetched {len(data.get('data', []))} traces from Langfuse (page {params.get('page')})")
                return data
                
        except httpx.HTTPError as e:
            logger.error(f"Langfuse API error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error calling Langfuse: {str(e)}")
            raise
    
    async def get_trace_detail(
        self,
        project_id: str,
        trace_id: str
    ) -> Dict[str, Any]:
        """
        Lấy chi tiết trace với full spans (waterfall data).
        
        Args:
            project_id: ID của project trong Langfuse
            trace_id: ID của trace cần lấy
            
        Returns:
            Dict chứa trace detail với observations/spans
            
        Raises:
            httpx.HTTPError: Khi API call thất bại
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Langfuse API endpoint: GET /api/public/traces/{traceId}
                url = f"{self.base_url}/api/public/traces/{trace_id}"
                
                response = await client.get(
                    url,
                    auth=self._get_auth(),
                    headers={
                        "X-Langfuse-Project-Id": project_id
                    }
                )
                
                response.raise_for_status()
                data = response.json()
                
                logger.info(f"Fetched trace detail for {trace_id}")
                return data
                
        except httpx.HTTPError as e:
            logger.error(f"Langfuse API error fetching trace {trace_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching trace {trace_id}: {str(e)}")
            raise
    
    async def health_check(self) -> bool:
        """
        Kiểm tra xem Langfuse API có khả dụng không.
        
        Returns:
            True nếu API hoạt động, False nếu không
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                url = f"{self.base_url}/api/public/health"
                response = await client.get(url)
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Langfuse health check failed: {str(e)}")
            return False


# Singleton instance
_langfuse_client: Optional[LangfuseClient] = None


def get_langfuse_client() -> LangfuseClient:
    """Trả về singleton instance của LangfuseClient"""
    global _langfuse_client
    if _langfuse_client is None:
        _langfuse_client = LangfuseClient()
    return _langfuse_client
