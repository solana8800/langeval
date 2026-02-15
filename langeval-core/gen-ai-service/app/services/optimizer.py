import random
from typing import List, Dict

class PromptOptimizer:
    def __init__(self):
        # Mock LLM for mutation (In reality, use OpenAI/LangChain)
        pass

    def optimize(self, original_prompt: str, n_generations: int = 3) -> List[Dict]:
        """
        Runs GEPA (Genetic Evolutionary Prompt Optimization).
        """
        population = [original_prompt]
        history = []
        
        for generation in range(n_generations):
            print(f"--- GEPA Generation {generation + 1} ---")
            
            # 1. Evaluation (Fitness Function)
            # In a real system, this would trigger an Orchestrator Campaign to score the prompt.
            # Here we mock the score.
            scored_population = []
            for prompt in population:
                score = self._mock_evaluate(prompt)
                scored_population.append({"prompt": prompt, "score": score})
            
            # Sort by score (DESC)
            scored_population.sort(key=lambda x: x["score"], reverse=True)
            best_performer = scored_population[0]
            history.append(best_performer)
            
            print(f"Best Score Gen {generation}: {best_performer['score']}")
            
            # 2. Selection & Mutation
            # Keep top 50%, mutate them to create next gen
            top_half = scored_population[:max(1, len(population)//2)]
            
            next_gen = [item["prompt"] for item in top_half]
            
            while len(next_gen) < len(population):
                parent = random.choice(top_half)["prompt"]
                child = self._mutate(parent)
                next_gen.append(child)
                
            population = next_gen
            
        return history

    def _mock_evaluate(self, prompt: str) -> float:
        """
        Mock Evaluation: Longer prompts get slightly better scores + random noise.
        """
        base_score = min(len(prompt) / 100, 0.8)
        return min(base_score + random.uniform(0.0, 0.15), 1.0)

    def _mutate(self, prompt: str) -> str:
        """
        Mock Mutation: Adds instructions or rephrases.
        """
        mutations = [
            " Think step by step.",
            " Be concise.",
            " Act as an expert.",
            " Verify your answer."
        ]
        return prompt + random.choice(mutations)

optimizer = PromptOptimizer()
