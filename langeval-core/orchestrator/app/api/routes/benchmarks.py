from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import httpx
from app.services.benchmark_service import benchmark_service

router = APIRouter()

class BenchmarkRunRequest(BaseModel):
    benchmark_id: str
    model_id: Optional[str] = None
    agent_id: Optional[str] = None
    generator_model_id: Optional[str] = "gpt-4o"
    openai_key: Optional[str] = None

@router.post("/run")
async def run_benchmark_endpoint(request: BenchmarkRunRequest):
    """
    Trigger a benchmark run.
    """
    try:
        # In a real async scenario, this might run in background and return a job ID.
        # For this MVP, we await the result directly.
        result = await benchmark_service.run_benchmark(
            benchmark_id=request.benchmark_id, 
            model_id=request.model_id,
            agent_id=request.agent_id,
            generator_model_id=request.generator_model_id,
            openai_key=request.openai_key or ""
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_benchmarks():
    """
    List available benchmarks.
    """
    return {
        "benchmarks": [
            {"id": "mmlu", "name": "MMLU (Massive Multitask Language Understanding)", "description": "General knowledge & reasoning across 57 subjects."},
            {"id": "gsm8k", "name": "GSM8K (Grade School Math 8K)", "description": "High quality grade school math problems."},
            {"id": "commonsense", "name": "CommonSenseQA", "description": "Questions requiring prior knowledge and common sense."}
        ]
    }

@router.get("/history")
async def list_benchmark_history(page: int = 1, size: int = 20):
    """
    List past benchmark runs.
    """
    resource_service_url = benchmark_service.resource_service_url
    url = f"{resource_service_url}/resource/benchmarks?page={page}&size={size}"
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                # Frontend expects "data" to be the list of items
                return {"success": True, "data": data.get("items", [])}
            else:
                raise HTTPException(status_code=resp.status_code, detail="Failed to fetch history")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{id}")
async def get_benchmark_result(id: str):
    """
    Get a specific benchmark result.
    """
    resource_service_url = benchmark_service.resource_service_url
    url = f"{resource_service_url}/resource/benchmarks/{id}"
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=10)
            if resp.status_code == 200:
                return {"success": True, "data": resp.json()}
            else:
                raise HTTPException(status_code=resp.status_code, detail="Failed to fetch result")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
