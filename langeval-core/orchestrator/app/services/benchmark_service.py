import json
import random
import asyncio
import os
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import uuid4

class BenchmarkService:
    def __init__(self):
        self.resource_service_url = os.getenv("RESOURCE_SERVICE_URL", "http://resource-service:8000")
        # Sample MMLU-like items for demonstration
        self.mmlu_samples = [
            {
                "id": "mmlu_001",
                "question": "What is the capital of France?",
                "options": ["A) London", "B) Berlin", "C) Paris", "D) Madrid"],
                "answer": "C",
                "explanation": "Paris is the capital and most populous city of France."
            },
            {
                "id": "mmlu_002",
                "question": "Which planet is known as the Red Planet?",
                "options": ["A) Venus", "B) Mars", "C) Jupiter", "D) Saturn"],
                "answer": "B",
                "explanation": "Mars is dusty, cold, and desert-like with a very thin atmosphere. It is also a dynamic planet with seasons, polar ice caps, canyons, extinct volcanoes, and evidence that it was even more active in the past."
            },
             {
                "id": "mmlu_003",
                "question": "Who wrote 'Romeo and Juliet'?",
                "options": ["A) Charles Dickens", "B) William Shakespeare", "C) Jane Austen", "D) Mark Twain"],
                "answer": "B",
                "explanation": "William Shakespeare was an English playwright, poet, and actor, widely regarded as the greatest writer in the English language and the world's great dramatist."
            },
            {
                "id": "mmlu_004",
                "question": "What is the chemical symbol for Gold?",
                "options": ["A) Au", "B) Ag", "C) Fe", "D) Hg"],
                "answer": "A",
                "explanation": "The symbol Au is from the Latin: aurum."
            },
            {
                "id": "mmlu_005",
                "question": "What is the largest ocean on Earth?",
                "options": ["A) Atlantic Ocean", "B) Indian Ocean", "C) Arctic Ocean", "D) Pacific Ocean"],
                "answer": "D",
                "explanation": "The Pacific Ocean is the largest and deepest of Earth's oceanic divisions."
            }
        ]

    async def save_result(self, result_data: Dict[str, Any]):
        """
        Saves the benchmark result to the Resource Service.
        """
        url = f"{self.resource_service_url}/resource/benchmarks"
        try:
            async with httpx.AsyncClient() as client:
                # Transform data to match BenchmarkResultCreate schema
                payload = {
                    "benchmark_id": result_data["benchmark_id"],
                    "model_id": result_data["model_id"],
                    "score": result_data["score"],
                    "total_items": result_data["total_items"],
                    "correct_items": result_data["correct_items"],
                    "details": result_data["results"],
                    "status": "completed",
                    "meta_data": {
                        "run_id": result_data["run_id"],
                        "completed_at": result_data["completed_at"]
                    }
                }
                print(f"Saving benchmark result to {url}...", flush=True)
                resp = await client.post(url, json=payload, timeout=10)
                if resp.status_code == 200:
                    print("Benchmark result saved successfully.", flush=True)
                else:
                    print(f"Failed to save benchmark result: {resp.status_code} - {resp.text}", flush=True)
        except Exception as e:
            print(f"Error saving benchmark result: {e}", flush=True)

    async def generate_questions(self, topic: str, count: int = 5, generator_model_id: str = "gpt-4o") -> List[Dict[str, Any]]:
        """
        Generates MMLU-style questions using OpenAI API.
        """
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("OPENAI_API_KEY not found. Using static samples.", flush=True)
            return self.mmlu_samples[:count]

        print(f"Generating {count} questions for topic '{topic}' using OpenAI...", flush=True)
        
        prompt = f"""
        Generate {count} multiple-choice questions about "{topic}" in the style of the MMLU benchmark.
        The questions should be challenging and precise.
        
        Return ONLY a JSON array with this structure:
        [
            {{
                "id": "unique_id",
                "question": "Question text...",
                "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                "answer": "A", 
                "explanation": "Brief explanation of why A is correct."
            }}
        ]
        """

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={
                        "model": generator_model_id,
                        "messages": [
                            {"role": "system", "content": "You are a helpful assistant that generates benchmark questions in JSON format."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "response_format": { "type": "json_object" }
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                
                # Parse JSON
                try:
                    # Handle potential wrapping in "questions" key or raw list
                    parsed = json.loads(content)
                    if isinstance(parsed, dict) and "questions" in parsed:
                        questions = parsed["questions"]
                    elif isinstance(parsed, list):
                        questions = parsed
                    else:
                        # Fallback if json_object mode returns something else
                        # Try to find list in values?
                        questions = next((v for v in parsed.values() if isinstance(v, list)), self.mmlu_samples[:count])
                        
                    # Validate structure
                    items = []
                    for i, q in enumerate(questions):
                        items.append({
                            "id": f"gen_{topic}_{i}_{str(uuid4())[:8]}",
                            "question": q.get("question", "Unknown Question"),
                            "options": q.get("options", []),
                            "answer": q.get("answer", "A").replace(")", "").strip(), # Clean answer A) -> A
                            "explanation": q.get("explanation", "")
                        })
                    return items
                except json.JSONDecodeError:
                    print(f"Failed to parse JSON from OpenAI: {content}", flush=True)
                    return self.mmlu_samples[:count]
                    
        except Exception as e:
            print(f"Error generating questions: {e}", flush=True)
            return self.mmlu_samples[:count]

    async def run_benchmark(self, benchmark_id: str, model_id: str = None, agent_id: str = None, generator_model_id: str = "gpt-4o", openai_key: str = None) -> Dict[str, Any]:
        """
        Runs a benchmark evaluation.
        """
        run_id = str(uuid4())
        results = []
        correct_count = 0
        
        # Determine Subject (Agent or Model)
        subject_name = "Unknown"
        target_model_id = model_id
        
        if agent_id:
            from app.services.resource_client import get_agent_config, get_model_config
            agent_config = await get_agent_config(agent_id)
            if agent_config:
                subject_name = agent_config.get("name", agent_id)
                # In a real system, we'd use the Agent's Model Config. 
                # For MVP, we assume Agent has a linked model_id or we use a default
                target_model_id = agent_config.get("model_id")
                if not target_model_id:
                     print(f"Warning: Agent {agent_id} has no model_id. Using default.", flush=True)

        if not target_model_id and not agent_id:
             return {"error": "Must provide either model_id or agent_id"}

        # Dynamic generation using generator_model_id
        items = await self.generate_questions(topic=benchmark_id, count=5, generator_model_id=generator_model_id)
        total_items = len(items)

        print(f"Starting benchmark {benchmark_id} for {subject_name} (Model: {target_model_id}) with {total_items} items...", flush=True)

        # Simulate processing time and model response
        for item in items:
            # Simulate network latency
            await asyncio.sleep(0.5) 
            
            # Simple simulation logic: 80% chance to be correct for demo purposes
            # In production this would use the OpenAI API with the target_model_id
            is_correct = random.random() < 0.8 
            
            # Clean options to extract A, B, C, D if needed, but for now strict match
            correct_opt = item['answer'] # Expected A, B, C, D
            
            # Simulate Model Answer
            if is_correct:
                model_answer = correct_opt
            else:
                 # Pick wrong answer
                 options = ["A", "B", "C", "D"]
                 if correct_opt in options:
                     options.remove(correct_opt)
                 model_answer = random.choice(options)
            
            results.append({
                "item_id": item['id'],
                "question": item['question'],
                "model_answer": model_answer,
                "correct_answer": correct_opt,
                "is_correct": model_answer == correct_opt
            })
            
            if model_answer == correct_opt:
                correct_count += 1

        score = (correct_count / total_items) * 100 if total_items > 0 else 0
        
        result_data = {
            "run_id": run_id,
            "benchmark_id": benchmark_id,
            "model_id": model_id,
            "score": score,
            "total_items": total_items, # Ensure this is int
            "correct_items": correct_count, # Ensure this is int
            "results": results,
            "status": "completed",
            "completed_at": datetime.now().isoformat()
        }

        # Save result asynchronously
        await self.save_result(result_data)
        
        return result_data

benchmark_service = BenchmarkService()
