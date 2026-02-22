from langgraph.graph import StateGraph, END
from typing import Annotated, Dict, Any, List, Optional
import asyncio
import json
import operator
import logging

from app.models.schemas import BattleArenaState
import app.core.resources as resources
from app.services.checkpointer import get_checkpointer
from app.services.workflow import SIMULATION_TOPIC, EVALUATION_TOPIC
from app.services.resource_client import update_battle_data, add_battle_turn

logger = logging.getLogger(__name__)

# --- Comparison Mode Nodes (Bot A vs Bot B) ---

async def node_battle_start(state: BattleArenaState):
    campaign_id = state['campaign_id']
    logger.info(f"--- BATTLE ARENA START (COMPARISON): {campaign_id} ---")
    await update_battle_data(campaign_id, {"status": "running"})
    return {"status": "running"}

async def node_get_input(state: BattleArenaState):
    """Lấy input của người dùng hoặc kịch bản cho lượt này."""
    campaign_id = state['campaign_id']
    metadata = state.get("metadata", {})
    # Ưu tiên lấy từ metadata (instruction_injection) hoặc default
    user_input = metadata.get("instruction_injection") or "Hãy giải thích về AI bằng tiếng Việt đơn giản."
    
    logger.info(f"--- BATTLE TURN INPUT (Campaign: {campaign_id}): {user_input[:50]}... ---")
    return {"user_message": user_input}

async def node_fork_simulation(state: BattleArenaState):
    """Gửi yêu cầu song song tới Bot A và Bot B."""
    campaign_id = state['campaign_id']
    agent_a_id = state['agent_a_id']
    agent_b_id = state['agent_b_id']
    user_msg = state['user_message']
    metadata = state.get("metadata", {})
    injection = metadata.get("instruction_injection", "")

    logger.info(f"Forking simulation for A({agent_a_id}) and B({agent_b_id})")
    
    instruction = user_msg
    if injection:
        instruction = f"{user_msg}\n\nAdditional Instruction: {injection}"
    
    payload_a = {"campaign_id": campaign_id, "node_id": "agent_a", "agent_id": agent_a_id, "instruction": instruction}
    payload_b = {"campaign_id": campaign_id, "node_id": "agent_b", "agent_id": agent_b_id, "instruction": instruction}
    
    await asyncio.gather(
        resources.producer.send_and_wait(SIMULATION_TOPIC, json.dumps(payload_a).encode('utf-8')),
        resources.producer.send_and_wait(SIMULATION_TOPIC, json.dumps(payload_b).encode('utf-8'))
    )
    
    # Đợi kết quả từ Redis
    results = await asyncio.gather(
        resources.redis_client.blpop(f"campaign:{campaign_id}:node:agent_a:result", timeout=60),
        resources.redis_client.blpop(f"campaign:{campaign_id}:node:agent_b:result", timeout=60)
    )
    
    if not results[0] or not results[1]:
        return {"agent_a_response": "Timeout", "agent_b_response": "Timeout", "status": "failed", "error": "Agent Timeout"}
    
    data_a = json.loads(results[0][1])
    data_b = json.loads(results[1][1])
    
    resp_a = data_a.get("new_messages", [])[-1].get("content", "")
    resp_b = data_b.get("new_messages", [])[-1].get("content", "")
    
    # Check for errors
    if data_a.get("status") == "error" or data_b.get("status") == "error":
        err_msg = data_a.get("new_messages", [])[-1].get("content", "") if data_a.get("status") == "error" else data_b.get("new_messages", [])[-1].get("content", "")
        logger.error(f"Agent simulation error in comparison mode for campaign {campaign_id}: {err_msg}")
        return {"agent_a_response": resp_a, "agent_b_response": resp_b, "status": "failed", "error": err_msg}
    
    return {"agent_a_response": resp_a, "agent_b_response": resp_b}

async def node_judge_turn(state: BattleArenaState):
    """Gọi AI Judge để chấm điểm xem A hay B thắng."""
    if state.get("status") == "failed":
        return {"agent_a_wins": 0, "agent_b_wins": 0, "ties": 0, "judge_reasoning": state.get("error", "Agent failed")}
    
    campaign_id = state['campaign_id']
    
    payload = {
        "campaign_id": campaign_id,
        "node_id": "battle_judge",
        "user_input": state['user_message'],
        "response_a": state['agent_a_response'],
        "response_b": state['agent_b_response']
    }
    
    await resources.producer.send_and_wait(EVALUATION_TOPIC, json.dumps(payload).encode('utf-8'))
    
    result_raw = await resources.redis_client.blpop(f"campaign:{campaign_id}:node:battle_judge:result", timeout=60)
    if not result_raw:
        return {"error": "Judge Timeout"}
        
    res = json.loads(result_raw[1])
    winner = res.get("winner", "tie")
    
    updates = {"agent_a_wins": 0, "agent_b_wins": 0, "ties": 0}
    if winner == "A": updates["agent_a_wins"] = 1
    elif winner == "B": updates["agent_b_wins"] = 1
    else: updates["ties"] = 1
    
    return {**updates, "judge_reasoning": res.get("reason", "No reason")}

async def node_battle_progress(state: BattleArenaState):
    """Lưu dữ liệu lượt đấu vào DB."""
    current_turn = state.get("current_turn", 0) + 1
    turn_data = {
        "campaign_id": state['campaign_id'],
        "turn_number": current_turn,
        "user_message": state['user_message'],
        "agent_a_response": state['agent_a_response'],
        "agent_b_response": state['agent_b_response'],
        "winner": "agent_a" if state.get("agent_a_wins_turn", 0) else ("agent_b" if state.get("agent_b_wins_turn", 0) else "tie"),
        "confidence": 0.9,
        "judge_reasoning": state.get("judge_reasoning")
    }
    await add_battle_turn(turn_data)
    return {"current_turn": 1}

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

def build_comparison_graph():
    workflow = StateGraph(BattleArenaState)
    workflow.add_node("start", node_battle_start)
    workflow.add_node("get_input", node_get_input)
    workflow.add_node("fork_simulation", node_fork_simulation)
    workflow.add_node("judge_turn", node_judge_turn)
    workflow.add_node("progress", node_battle_progress)
    workflow.add_node("end", node_battle_end)
    
    workflow.set_entry_point("start")
    workflow.add_edge("start", "get_input")
    workflow.add_edge("get_input", "fork_simulation")
    workflow.add_edge("fork_simulation", "judge_turn")
    workflow.add_edge("judge_turn", "progress")
    workflow.add_conditional_edges("progress", should_continue, {"continue": "get_input", "end": "end"})
    workflow.add_edge("end", END)
    
    return workflow.compile(checkpointer=get_checkpointer())
