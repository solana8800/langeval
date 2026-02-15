from langgraph.graph import StateGraph, END
from typing import Annotated, Dict, Any, List, Optional
import asyncio
import json
import logging

from app.models.schemas import BattleArenaState
import app.core.resources as resources
from app.services.checkpointer import get_checkpointer
from app.services.workflow import SIMULATION_TOPIC, EVALUATION_TOPIC
from app.services.resource_client import update_battle_data, add_battle_turn

logger = logging.getLogger(__name__)

# --- Adversarial Mode Nodes (Sim vs Target) ---

async def node_battle_start(state: BattleArenaState):
    campaign_id = state['campaign_id']
    logger.info(f"--- BATTLE ARENA START (ADVERSARIAL): {campaign_id} ---")
    await update_battle_data(campaign_id, {"status": "running"})
    return {"status": "running"}

async def node_simulator_turn(state: BattleArenaState):
    """Simulator đóng vai người dùng sinh nội dung hội thoại."""
    campaign_id = state['campaign_id']
    simulator_id = state['simulator_id']
    history = state.get("messages", [])
    metadata = state.get("metadata", {})
    injection = metadata.get("instruction_injection", "")
    
    instruction = "Continue the conversation as a user. Be challenging."
    if injection:
        instruction = f"{instruction}\n\nAdditional Instruction: {injection}"
    
    payload = {
        "campaign_id": campaign_id,
        "node_id": "battle_sim",
        "simulator_id": simulator_id,
        "instruction": instruction,
        "history": history
    }
    await resources.producer.send_and_wait(SIMULATION_TOPIC, json.dumps(payload).encode('utf-8'))
    
    result_raw = await resources.redis_client.blpop(f"campaign:{campaign_id}:node:battle_sim:result", timeout=60)
    if not result_raw:
        return {"user_message": "Timeout Sim", "status": "failed", "error": "Simulator Timeout"}
    
    result_data = json.loads(result_raw[1])
    user_msg = result_data.get("new_messages", [])[-1].get("content", "")
    
    if result_data.get("status") == "error":
        logger.error(f"Simulator error for campaign {campaign_id}: {user_msg}")
        return {"user_message": user_msg, "status": "failed", "error": user_msg}
    
    return {"user_message": user_msg}

async def node_agent_turn(state: BattleArenaState):
    """Target Agent phản hồi lại Simulator."""
    campaign_id = state['campaign_id']
    agent_id = state['target_agent_id']
    user_msg = state['user_message']
    history = state.get("messages", [])
    metadata = state.get("metadata", {})
    override = metadata.get("response_override")
    
    # Nếu có ghi đè ở lượt đầu tiên (lượt 0 trong state hiện tại)
    current_turn = state.get("current_turn", 0)
    if current_turn == 0 and override:
        logger.info(f"Using response override for campaign {campaign_id}")
        return {"agent_response": override}
    
    payload = {
        "campaign_id": campaign_id,
        "node_id": "battle_agent",
        "agent_id": agent_id,
        "instruction": user_msg,
        "history": history
    }
    await resources.producer.send_and_wait(SIMULATION_TOPIC, json.dumps(payload).encode('utf-8'))
    
    result_raw = await resources.redis_client.blpop(f"campaign:{campaign_id}:node:battle_agent:result", timeout=60)
    if not result_raw:
        return {"agent_response": "Timeout Agent", "status": "failed", "error": "Agent Timeout"}
    
    result_data = json.loads(result_raw[1])
    agent_resp = result_data.get("new_messages", [])[-1].get("content", "")
    
    if result_data.get("status") == "error":
        logger.error(f"Agent simulation error for campaign {campaign_id}: {agent_resp}")
        return {"agent_response": agent_resp, "status": "failed", "error": agent_resp}
    
    return {"agent_response": agent_resp}

async def node_judge_turn(state: BattleArenaState):
    """AI Judge đánh giá phản hồi của Target Agent."""
    if state.get("status") == "failed":
        return {"score_sum": 0, "turn_score": 0, "judge_reasoning": state.get("error", "Agent failed")}
        
    campaign_id = state['campaign_id']
    
    payload = {
        "campaign_id": campaign_id,
        "node_id": "battle_judge",
        "history": [
            {"role": "user", "content": state['user_message']},
            {"role": "assistant", "content": state['agent_response']}
        ],
        "metrics_config": [{"id": "quality"}]
    }
    await resources.producer.send_and_wait(EVALUATION_TOPIC, json.dumps(payload).encode('utf-8'))
    
    result_raw = await resources.redis_client.blpop(f"campaign:{campaign_id}:node:battle_judge:result", timeout=60)
    score = json.loads(result_raw[1]).get("total_score", 0) if result_raw else 0
    reason = json.loads(result_raw[1]).get("reason", "Timeout") if result_raw else "Timeout"
    
    return {"score_sum": score, "turn_score": score, "judge_reasoning": reason}

async def node_battle_progress(state: BattleArenaState):
    current_turn = state.get("current_turn", 0) + 1
    turn_score = state.get("turn_score", 0)
    
    turn_data = {
        "campaign_id": state['campaign_id'],
        "turn_number": current_turn,
        "user_message": state['user_message'],
        "agent_a_response": state['agent_response'], 
        "agent_b_response": "(Adversarial Mode)",
        "score": turn_score,
        "judge_reasoning": state.get("judge_reasoning")
    }
    await add_battle_turn(turn_data)
    
    return {
        "current_turn": 1,
        "messages": [
            {"role": "user", "content": state['user_message']},
            {"role": "assistant", "content": state['agent_response']}
        ]
    }

def should_continue(state: BattleArenaState):
    if state.get('status') == "failed":
        return "end"
    if state['current_turn'] < state['max_turns']:
        return "continue"
    return "end"

async def node_battle_end(state: BattleArenaState):
    status = state.get("status", "completed")
    await update_battle_data(state['campaign_id'], {"status": status})
    return {"status": status}

def build_adversarial_graph():
    workflow = StateGraph(BattleArenaState)
    workflow.add_node("start", node_battle_start)
    workflow.add_node("simulator", node_simulator_turn)
    workflow.add_node("agent", node_agent_turn)
    workflow.add_node("judge", node_judge_turn)
    workflow.add_node("progress", node_battle_progress)
    workflow.add_node("end", node_battle_end)
    
    workflow.set_entry_point("start")
    workflow.add_edge("start", "simulator")
    workflow.add_edge("simulator", "agent")
    workflow.add_edge("agent", "judge")
    workflow.add_edge("judge", "progress")
    workflow.add_conditional_edges("progress", should_continue, {"continue": "simulator", "end": "end"})
    workflow.add_edge("end", END)
    
    return workflow.compile(checkpointer=get_checkpointer())
