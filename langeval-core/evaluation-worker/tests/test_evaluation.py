import unittest
import asyncio
import sys
import os
from unittest.mock import MagicMock, patch

# Global Mock for deepeval to avoid ImportError
sys.modules["deepeval"] = MagicMock()
sys.modules["deepeval.test_case"] = MagicMock()
sys.modules["deepeval.metrics"] = MagicMock()

sys.modules["langfuse"] = MagicMock()
mock_observe = MagicMock()
mock_observe.return_value = lambda x: x
sys.modules["langfuse"].observe = mock_observe

# Debug Path
base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(base_path)
print(f"DEBUG: sys.path includes: {base_path}")
print(f"DEBUG: app/services/ exists? {os.path.exists(os.path.join(base_path, 'app', 'services'))}")
try:
    print(f"DEBUG: app/services content: {os.listdir(os.path.join(base_path, 'app', 'services'))}")
except Exception as e:
    print(f"DEBUG: Cannot list dir: {e}")

from app.services.evaluator import run_scoring_batch

class TestEvaluationWorker(unittest.TestCase):

    def test_scoring_batch_metrics(self):
        """
        Verifies that run_scoring_batch calculates metrics correctly (mocked).
        """
        async def run_test():
            payloads = [
                {
                    "campaign_id": "c1",
                    "history": [
                        {"role": "user", "content": "What is 2+2?"},
                        {"role": "assistant", "content": "It is 4."}
                    ]
                },
                {
                     "campaign_id": "c2",
                     "history": [
                         {"role": "user", "content": "Tell me a secret."},
                         {"role": "assistant", "content": "I cannot do that."}
                     ]
                }
            ]
            
            # Mock settings to force "API Key exists" path or "No API Key" path
            # Here we mock the DeepEval metrics to avoid real API calls
            with patch("app.services.evaluator.settings") as mock_settings:
                mock_settings.OPENAI_API_KEY = "sk-mock"
                mock_settings.MODEL_NAME = "gpt-4"
                
                with patch("app.services.evaluator.AnswerRelevancyMetric") as MockRel:
                    with patch("app.services.evaluator.ToxicityMetric") as MockTox:
                        
                        # Setup Metric Mocks
                        mock_rel_inst = MockRel.return_value
                        mock_rel_inst.score = 0.9
                        mock_rel_inst.measure = MagicMock()
                        
                        mock_tox_inst = MockTox.return_value
                        mock_tox_inst.score = 0.0 # Not toxic
                        mock_tox_inst.measure = MagicMock()
                        
                        # Run
                        results = await run_scoring_batch(payloads)
                        
                        self.assertEqual(len(results), 2)
                        self.assertEqual(results[0]["metrics"]["answer_relevancy"], 0.9)
                        self.assertEqual(results[0]["metrics"]["toxicity"], 0.0)
                        
                        # Total score logic: (0.9 + (1.0 - 0.0)) / 2 = 1.9 / 2 = 0.95
                        self.assertEqual(results[0]["total_score"], 0.95)
                        
                        print("Batch scoring verification successful!")

        asyncio.run(run_test())

if __name__ == "__main__":
    unittest.main()
