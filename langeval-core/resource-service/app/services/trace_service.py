from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
from app.models.domain import AgentRef
from app.core.langfuse_client import get_langfuse_client
import logging

logger = logging.getLogger(__name__)

class TraceService:
    def __init__(self, session: Session):
        self.session = session
        self.langfuse = get_langfuse_client()

    def _get_project_id(self, agent_id: Optional[str] = None) -> Optional[str]:
        if agent_id:
            agent = self.session.get(AgentRef, agent_id)
            if not agent or not agent.langfuse_project_id:
                return None
            return agent.langfuse_project_id
        else:
            statement = select(AgentRef).where(AgentRef.langfuse_project_id.isnot(None))
            agents = self.session.exec(statement).all()
            if not agents:
                return None
            return agents[0].langfuse_project_id

    async def get_traces(self, 
                         agent_id: Optional[str], 
                         limit: int, 
                         offset: int, 
                         cursor: Optional[str], 
                         filters: Dict[str, Any],
                         custom_filters: Dict[str, Any]) -> Dict[str, Any]:
        
        project_id = self._get_project_id(agent_id)
        if not project_id:
             return {
                "data": [],
                "total": 0,
                "hasMore": False,
                "nextCursor": None,
                "source": "langfuse",
                "message": "Không tìm thấy agent hoặc agent chưa cấu hình Langfuse"
            }

        result = await self.langfuse.get_traces(
            project_id=project_id,
            limit=limit,
            offset=offset if not cursor else 0,
            cursor=cursor,
            filters=filters
        )
        
        traces = result.get("data", [])
        
        # Apply local filters (min_latency, max_latency, status)
        min_latency = custom_filters.get("min_latency")
        max_latency = custom_filters.get("max_latency")
        status = custom_filters.get("status")

        if min_latency is not None or max_latency is not None or status:
            filtered_traces = []
            for trace in traces:
                if min_latency is not None and trace.get("latency", 0) < min_latency:
                    continue
                if max_latency is not None and trace.get("latency", 999) > max_latency:
                    continue
                if status and trace.get("status") != status:
                    continue
                filtered_traces.append(trace)
            traces = filtered_traces

        # Calculate pagination
        meta = result.get("meta", {})
        total = meta.get("totalItems", len(traces))
        
        if cursor:
            try:
                current_page = int(cursor)
            except ValueError:
                current_page = offset // limit + 1
        else:
            current_page = offset // limit + 1
            
        total_pages = meta.get("totalPages", 1)
        has_more = current_page < total_pages
        next_cursor = str(current_page + 1) if has_more else None
        
        return {
            "data": traces,
            "total": total,
            "hasMore": has_more,
            "nextCursor": next_cursor,
            "source": "langfuse"
        }

    async def get_trace_detail(self, trace_id: str, agent_id: Optional[str] = None) -> Dict[str, Any]:
        project_id = self._get_project_id(agent_id)
        if not project_id:
            raise ValueError("Không tìm thấy agent hoặc agent chưa cấu hình Langfuse")

        result = await self.langfuse.get_trace_detail(
            project_id=project_id,
            trace_id=trace_id
        )
        return {"data": result, "source": "langfuse"}
