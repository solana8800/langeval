import os
import json
from typing import List, Dict, Optional
from openai import OpenAI
import logging
from sqlmodel import Session, select
from app.core.database import engine
from app.models.domain import ModelRef, AgentRef
from app.core.security import decrypt_value

logger = logging.getLogger(__name__)

# Load from environment (Matches root .env)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "deepseek-chat")

class AIService:
    def __init__(self):
        if not OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set. AI Features will be unavailable.")
            self.client = None
        else:
            self.client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)

    async def generate_scenario(self, prompt: str, current_nodes: List[Dict] = None, current_edges: List[Dict] = None, model_id: str = None, agent_id: str = None) -> Dict:
        """
        Sử dụng LLM để tạo hoặc cập nhật kịch bản dựa trên prompt.
        """
        client = self.client
        model_name = MODEL_NAME
        agent_context = ""

        with Session(engine) as session:
            # If model_id is provided, try to fetch custom model config from DB
            if model_id:
                try:
                    model_ref = session.get(ModelRef, model_id)
                    if model_ref:
                        api_key = decrypt_value(model_ref.api_key_encrypted)
                        base_url = model_ref.base_url
                        
                        # Use custom client
                        if api_key:
                             client = OpenAI(api_key=api_key, base_url=base_url)
                             if model_ref.meta_data and 'model_name' in model_ref.meta_data:
                                 model_name = model_ref.meta_data['model_name']
                             elif model_ref.provider == "DeepSeek":
                                 model_name = "deepseek-chat"
                             elif model_ref.provider == "OpenAI":
                                 model_name = "gpt-4-turbo-preview"
                                 
                        print(f"Using Custom Model: {model_ref.name} ({model_ref.provider}) - Model: {model_name}")
                except Exception as e:
                    logger.error(f"Failed to load model {model_id} from DB: {e}. Falling back to default.")

            # If agent_id is provided, fetch agent details for context
            if agent_id:
                try:
                    agent_ref = session.get(AgentRef, agent_id)
                    if agent_ref:
                        agent_context = f"\n\nTHÔNG TIN AGENT CẦN TEST:\n"
                        agent_context += f"- Tên: {agent_ref.name}\n"
                        if agent_ref.description:
                            agent_context += f"- Mô tả: {agent_ref.description}\n"
                        if agent_ref.meta_data:
                             agent_context += f"- Metadata: {json.dumps(agent_ref.meta_data, ensure_ascii=False)}\n"
                        logger.info(f"Loaded Agent Context for {agent_ref.name}")
                except Exception as e:
                    logger.error(f"Failed to load agent {agent_id} from DB: {e}")

        if not client:
            raise ValueError("AI Service is not configured (missing API Key).")

        system_prompt = """
Bạn là một Chuyên gia Kiểm thử Tự động (Test Automation Architect). 
Nhiệm vụ của bạn là thiết kế luồng kịch bản kiểm thử (Test Scenario) dưới dạng đồ thị (Graph) bao gồm Nodes và Edges.

Cấu trúc kịch bản:
- Node Types: 
  1. `start`: Điểm bắt đầu (Duy nhất).
  2. `end`: Điểm kết thúc.
  3. `persona`: Thiết lập tính cách/vai trò người dùng (vd: 'Khách hàng khó tính').
  4. `task`: Hành động hoặc câu hỏi cụ thể gửi cho Agent (vd: 'Hỏi về giá vé').
  5. `condition`: Rẽ nhánh luồng dựa trên phản hồi (vd: 'Nếu có vé', 'Nếu hết vé').
  6. `expectation`: Tiêu chí đánh giá phản hồi của Agent (vd: 'Phải chứa từ khóa Hà Nội').

- Coordinates (x, y): Bạn phải tính toán tọa độ để các node được bố trí đẹp mắt, không đè lên nhau. 
  Gợi ý: Luồng dọc từ trên xuống (Start ở y=0, các node tiếp theo tăng dần y thêm 150-200 đơn vị).

- Edges: Kết nối các node thông qua `source` và `target` (sử dụng ID của node).

Yêu cầu trả về:
- LUÔN trả về định dạng JSON thuần túy, không có giải thích thừa.
- Ngôn ngữ: Tiếng Việt cho các nhãn (label) và mô tả.

Schema JSON trả về:
{
  "name": "Tên kịch bản",
  "description": "Mô tả ngắn gọn",
  "nodes": [
    { "id": "uuid", "type": "customNode", "position": {"x": 0, "y": 0}, "data": { "category": "node_type", "label": "Text", "prompt": "..." } }
  ],
  "edges": [
    { "id": "e_uuid", "source": "node_id", "target": "node_id", "label": "Tùy chọn" }
  ]
}

Nếu có `current_scenario` đi kèm, hãy thực hiện CẬP NHẬT (thêm node, sửa edge) thay vì tạo mới hoàn toàn, trừ khi người dùng yêu cầu làm lại từ đầu.
"""

        user_content = f"Prompt: {prompt}\n"
        if current_nodes:
            user_content += f"Current Nodes: {json.dumps(current_nodes)}\n"
        if current_edges:
            user_content += f"Current Edges: {json.dumps(current_edges)}\n"
        
        if agent_context:
            user_content += agent_context

        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
        except Exception as e:
            logger.error(f"AI Generation failed: {e}")
            raise e

ai_service = AIService()
