from fastapi import APIRouter, BackgroundTasks, Depends
from typing import Dict, Any, List
import uuid
import os
import json
from datetime import datetime

from app.models.schemas import CreateBattleRequest
from app.services.battle_arena_workflow import build_comparison_graph
from app.services.adversarial_workflow import build_adversarial_graph
from app.services.checkpointer import get_checkpointer, get_redis_client

router = APIRouter(prefix="/battle")

async def run_battle_background(campaign_id: str, req: CreateBattleRequest):
    print(f"--- BACKGROUND BATTLE START: {campaign_id} ---")
    try:
        # Chọn graph dựa trên mode
        if req.mode == "adversarial":
            graph = build_adversarial_graph()
            initial_state = {
                "campaign_id": campaign_id,
                "mode": "adversarial",
                "target_agent_id": req.target_agent_id,
                "simulator_id": req.simulator_id,
                "max_turns": req.max_turns,
                "language": req.language,
                "metadata": req.metadata,
                "status": "running",
                "current_turn": 0,
                "score_sum": 0,
                "messages": []
            }
        else: # Default to comparison if mode is not adversarial or explicitly "comparison"
            graph = build_comparison_graph()
            initial_state = {
                "campaign_id": campaign_id,
                "mode": "comparison",
                "agent_a_id": req.agent_a_id,
                "agent_b_id": req.agent_b_id,
                "max_turns": req.max_turns,
                "language": req.language,
                "metadata": req.metadata,
                "status": "running",
                "current_turn": 0,
                "agent_a_wins": 0,
                "agent_b_wins": 0,
                "ties": 0,
                "messages": []
            }
            
        # Initialize Checkpointer (if graph has one)
        if hasattr(graph, 'checkpointer') and graph.checkpointer:
            await graph.checkpointer.asetup()
        
        config = {
            "configurable": {
                "thread_id": campaign_id,
                "checkpoint_ns": "" 
            }
        }
        
        # Invoke Graph
        async for _ in graph.astream(initial_state, config=config):
            pass
            
    except Exception as e:
        print(f"CRITICAL ERROR in Battle Workflow: {e}")
        import traceback
        traceback.print_exc()

@router.post("/start")
async def start_battle(req: CreateBattleRequest, background_tasks: BackgroundTasks):
    """
    Khởi chạy luồng Battle Arena.
    """
    campaign_id = req.campaign_id
    background_tasks.add_task(run_battle_background, campaign_id, req)
    
    return {
        "campaign_id": campaign_id,
        "status": "queued",
        "message": "Battle Arena workflow started in background"
    }

@router.get("/{campaign_id}/state")
async def get_battle_state(campaign_id: str):
    """
    Lấy trạng thái hiện tại của Battle Arena từ Checkpointer.
    """
    app = build_comparison_graph()
    config = {
        "configurable": {
            "thread_id": campaign_id,
            "checkpoint_ns": ""
        }
    }
    
    state = await app.aget_state(config)
    if not state or not state.values:
        return {"error": "Battle state not found"}
        
    return {
        "campaign_id": campaign_id,
        "values": state.values,
        "next": state.next
    }
