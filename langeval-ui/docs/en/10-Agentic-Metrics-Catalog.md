# 10. AGENTIC METRICS CATALOG
**Project**: Enterprise AI Agent Evaluation Platform
**Version**: 2.0 (Based on DeepEval Framework)

---

## 1. METRICS HIERARCHY

The system categorizes metrics into four main tiers to comprehensively evaluate an AI Agent from "Conversations" to "Actions."

| Tier | Category | Focus | Examples |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Response Quality** | Final answer quality. | Answer Relevancy, Toxicity, Bias. |
| **Tier 2** | **RAG Pipeline** | Knowledge retrieval quality. | Faithfulness, Contextual Precision/Recall. |
| **Tier 3** | **Agentic Execution** | Tool usage and reasoning capabilities. | Tool Correctness, Task Completion. |
| **Tier 4** | **Conversational** | Long-form dialogue maintenance. | Role Adherence, Knowledge Retention. |

---

## 2. TIER 1: RESPONSE QUALITY METRICS
Evaluates the output visible to the end user.

### 2.1. Answer Relevancy
*   **Definition**: Measures how relevant the response is to the query. It evaluates focus rather than factual correctness.
*   **Method**: LLM generates hypothetical questions from the bot's response and compares them to the original query using vector similarity.
*   **Threshold**: > 0.7

### 2.2. Toxicity
*   **Definition**: Detects harmful, hateful, harassing, or violent content.
*   **Method**: Uses classification models (BERT-based or LLM-based) to detect sensitive keywords.
*   **Threshold**: < 0.1 (Strict requirement).

### 2.3. Bias
*   **Definition**: Measures gender, racial, religious, or political bias.
*   **Method**: LLM assesses whether the response contains stereotypes.
*   **Threshold**: < 0.1

---

## 3. TIER 2: RAG PIPELINE METRICS
Evaluates the efficiency of the Retrieval-Augmented Generation system. This is the "heart" of Knowledge Bots.

### 3.1. Faithfulness
*   **Definition**: Measures if the response is *entirely based* on the provided retrieval context. Eliminates hallucinations.
*   **Formula**: $\frac{\text{Number of Claims supported by Context}}{\text{Total Claims in Output}}$
*   **Evaluation Mode**: Segments the response into claims and verifies each claim individually.

### 3.2. Contextual Precision
*   **Definition**: Evaluates if the most relevant documents (chunks) are ranked higher in the search results.
*   **Why**: LLMs often suffer from the "lost in the middle" phenomenon, paying more attention to the first and last results.

### 3.3. Contextual Recall
*   **Definition**: Evaluates if the retrieval system found *enough* information to answer the question.
*   **Formula**: Comparison between `Retrieval Context` and `Expected Output` (from the Golden Dataset).

---

## 4. TIER 3: AGENTIC EXECUTION METRICS
The most critical tier for autonomous agents.

### 4.1. Tool Correctness
*   **Definition**: Evaluates the accuracy of external function/tool calls.
*   **Checklist**:
    1.  **Tool Selection**: Was the correct tool chosen? (e.g., calling `get_weather` for weather queries).
    2.  **Argument Extraction**: Were parameters extracted correctly from the user prompt?
*   **Method**: Compares the Agent's JSON output with the Expected Dictionary.

### 4.2. Task Completion (Goal Rate)
*   **Definition**: Assesses whether the user's ultimate goal was achieved.
*   **Method**: LLM Judge evaluates the final conversation state.

### 4.3. Plan Adherence
*   **Definition**: Verifies if the agent followed defined business processes (SOPs).
*   **Method**: LangGraph state check (tracking the execution path).

---

## 5. TIER 4: CONVERSATIONAL METRICS (Multi-turn)
Designed for long-form conversational chatbots.

### 5.1. Knowledge Retention (Memory)
*   **Definition**: The bot's ability to remember information provided by the user in previous turns.
*   **Test**: Confirming if the bot remembers a piece of information introduced several turns earlier.

### 5.2. Role Adherence (Persona Consistency)
*   **Definition**: Ensures the bot maintains its assigned persona throughout the conversation.

---

## 6. CUSTOM METRICS (G-Eval)
Used when standard metrics are insufficient.

### 6.1. Brand Tone Consistency
*   **Method**: GPT-4 evaluation with Chain-of-Thought based on specific brand guidelines.

---

## 7. IMPLEMENTATION GUIDE

Example code integrating DeepEval for `ToolCorrectness`:

```python
from deepeval import evaluate
from deepeval.metrics import ToolCorrectnessMetric
from deepeval.test_case import LLMTestCase, ToolCallParam

# 1. Define Test Case
test_case = LLMTestCase(
    input="Book a flight to NYC tomorrow",
    actual_output="Calling book_flight(destination='NYC', date='2024-01-22')",
    tools_called=[
        ToolCallParam(name="book_flight", arguments={"destination": "NYC", "date": "2024-01-22"})
    ],
    expected_tools=[
        ToolCallParam(name="book_flight", arguments={"destination": "New York City", "date": "2024-01-22"})
    ]
)

# 2. Initialize Metric
metric = ToolCorrectnessMetric(threshold=0.8)

# 3. Measure
metric.measure(test_case)
print(f"Score: {metric.score}")
print(f"Reason: {metric.reason}")
```
