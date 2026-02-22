
import asyncio
import os
import json
from unittest.mock import MagicMock, patch, AsyncMock
from app.services.benchmark_service import BenchmarkService

async def test_ai_generation():
    print("Testing AI Generation Logic...")
    
    # Mock Response Data
    mock_ai_response = {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "questions": [
                            {
                                "question": "AI Generated Q1",
                                "options": ["A) Opt1", "B) Opt2", "C) Opt3", "D) Opt4"],
                                "answer": "A",
                                "explanation": "Exp1"
                            },
                            {
                                "question": "AI Generated Q2",
                                "options": ["A) Opt1", "B) Opt2", "C) Opt3", "D) Opt4"],
                                "answer": "B",
                                "explanation": "Exp2"
                            }
                        ]
                    })
                }
            }
        ]
    }

    # Mock env and httpx
    with patch.dict(os.environ, {"OPENAI_API_KEY": "sk-fake-key"}):
        with patch("httpx.AsyncClient") as MockClient:
            # Setup Mock Client Instance
            mock_instance = MagicMock()
            
            # Async Enter/Exit
            async def async_aenter(*args, **kwargs): return mock_instance
            async def async_aexit(*args, **kwargs): return None
            
            mock_instance.__aenter__ = async_aenter
            mock_instance.__aexit__ = async_aexit
            
            # Mock Post Response
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "choices": [{
                    "message": {
                        "content": json.dumps({
                            "questions": [
                                {
                                    "question": "AI Generated Q1",
                                    "options": ["A) Opt1", "B) Opt2", "C) Opt3", "D) Opt4"],
                                    "answer": "A", 
                                    "explanation": "Exp1"
                                },
                                {
                                    "question": "AI Generated Q2",
                                    "options": ["A) Opt1", "B) Opt2", "C) Opt3", "D) Opt4"],
                                    "answer": "B", 
                                    "explanation": "Exp2"
                                }
                            ]
                        })
                    }
                }]
            }
            mock_instance.post = AsyncMock(return_value=mock_response)
            
            # Configure the MockClient class to return this instance
            MockClient.return_value = mock_instance
            
            # Run Service
            service = BenchmarkService()
            questions = await service.generate_questions("test_topic", 2)
        
        # Verify
        print(f"Generated {len(questions)} questions.")
        for q in questions:
            print(f"- {q['question']} (Ans: {q['answer']})")
            
        if len(questions) == 2 and questions[0]["question"] == "AI Generated Q1":
            print("SUCCESS: AI Generation logic is correct.")
        else:
            print("FAILURE: AI Generation logic failed.")

if __name__ == "__main__":
    asyncio.run(test_ai_generation())
