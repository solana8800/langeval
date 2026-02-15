import unittest
import asyncio
from unittest.mock import MagicMock, patch
import sys
import os

# Global Mocks for missing deps
sys.modules["autogen"] = MagicMock()
sys.modules["langfuse"] = MagicMock()
sys.modules["langfuse.decorators"] = MagicMock()

# Mock observe decorator specifically
mock_observe = MagicMock()
mock_observe.return_value = lambda x: x
sys.modules["langfuse"].observe = mock_observe

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.simulator import run_simulation
from app.services.adversarial import get_adversarial_prompt

class TestSimulationWorker(unittest.TestCase):
    
    def test_red_teaming_trigger(self):
        """
        Verifies that the 'hacker' persona triggers the adversarial prompt.
        """
        async def run_test():
            payload = {
                "campaign_id": "test_red_team",
                "persona": "hacker",
                "target_config": {"api_key": "mock", "base_url": "mock"}
            }
            
            # Mock adversarial prompt return
            expected_prompt = "SYS_ATTACK_INJECTION"
            
            with patch("app.services.simulator.get_adversarial_prompt", return_value=expected_prompt) as mock_get_prompt:
                with patch("app.services.simulator.UserProxyAgent") as MockUserProxy:
                    with patch("app.services.simulator.AssistantAgent") as MockAssistant:
                        
                        # Setup Mocks
                        mock_proxy_instance = MockUserProxy.return_value
                        mock_proxy_instance.a_initiate_chat = MagicMock()
                        future = asyncio.Future()
                        future.set_result(MagicMock(chat_history=[{"role": "user", "content": "pwned"}]))
                        mock_proxy_instance.a_initiate_chat.return_value = future

                        # Run
                        result = await run_simulation(payload)
                        
                        # Check if get_adversarial_prompt was called
                        mock_get_prompt.assert_called_with("hacker")
                        
                        # Check if system message in UserProxy contained the adversarial prompt
                        # usage: UserProxyAgent(..., system_message=...)
                        args, kwargs = MockUserProxy.call_args
                        self.assertIn(expected_prompt, kwargs["system_message"])
                        print("Adversarial prompt injection verified!")

        asyncio.run(run_test())

    def test_normal_persona(self):
        """
        Verifies that a normal persona does NOT trigger adversarial prompts.
        """
        async def run_test():
            payload = {
                "campaign_id": "test_normal",
                "persona": "grandmother",
                "target_config": {"api_key": "mock", "base_url": "mock"}
            }
            
            with patch("app.services.simulator.get_adversarial_prompt", return_value=None) as mock_get_prompt:
                with patch("app.services.simulator.UserProxyAgent") as MockUserProxy:
                    with patch("app.services.simulator.AssistantAgent"):
                        # Run
                        await run_simulation(payload)
                        
                        # Check results
                        args, kwargs = MockUserProxy.call_args
                        # Should basically be the default template
                        self.assertIn("You are a user testing a chatbot", kwargs["system_message"])
                        print("Normal persona verified!")

        asyncio.run(run_test())

if __name__ == "__main__":
    unittest.main()
