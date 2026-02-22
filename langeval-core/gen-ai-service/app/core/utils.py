from langchain_core.callbacks import BaseCallbackHandler
from typing import Any, Dict, List
import json
import time

class LoggingCallbackHandler(BaseCallbackHandler):
    """
    Custom Callback Handler that prints valid JSON logs for Splunk/Datadog/CloudWatch.
    """
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.start_time = 0

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> Any:
        self.start_time = time.time()
        # Log Start Event (Optional, maybe just log end to reduce noise)
        # print(json.dumps({
        #     "event": "llm_start",
        #     "service": self.service_name,
        #     "prompts": prompts
        # }))

    def on_llm_end(self, response: Any, **kwargs: Any) -> Any:
        duration = time.time() - self.start_time
        
        # Extract Token Usage
        llm_output = response.llm_output or {}
        token_usage = llm_output.get("token_usage", {})
        
        # Extract Completion
        generations = response.generations
        completion_text = ""
        if generations and len(generations) > 0 and len(generations[0]) > 0:
            completion_text = generations[0][0].text

        log_entry = {
            "event": "llm_end",
            "service": self.service_name,
            "duration_seconds": round(duration, 3),
            "token_usage": {
                "prompt_tokens": token_usage.get("prompt_tokens", 0),
                "completion_tokens": token_usage.get("completion_tokens", 0),
                "total_tokens": token_usage.get("total_tokens", 0)
            },
            # Estimate Cost (DeepSeek/OpenAI approximation if not provided)
            # "model_name": ... (hard to get from response sometimes)
            "output_preview": completion_text[:200] + "..." if len(completion_text) > 200 else completion_text
        }
        
        # Use simple print which Docker captures
        print(json.dumps(log_entry))

    def on_llm_error(self, error: Exception, **kwargs: Any) -> Any:
        print(json.dumps({
            "event": "llm_error",
            "service": self.service_name,
            "error": str(error)
        }))
