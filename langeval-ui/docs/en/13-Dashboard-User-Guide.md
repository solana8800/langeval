# 13. Dashboard User Guide

This comprehensive guide will walk you through the LangEval Dashboard, detailing how to configure AI Agents, set up Models, design Scenarios, and execute Evaluations.

---

## 📑 Table of Contents
1. [Model Configuration](#1-model-configuration)
2. [AI Agent Configuration](#2-ai-agent-configuration)
3. [Scenario Management](#3-scenario-management)
4. [Evaluation Execution & Reports](#4-evaluation-execution--reports)
5. [Workspace Settings](#5-workspace-settings)

---

## 1. Model Configuration

Before creating an AI Agent or running auto-evaluations, you must configure the underlying Language Models (LLMs).

### 1.1 Adding a New Provider
1. Navigate to **Settings > Models** from the left sidebar.
2. Click the **Enable Provider** or **Add Connection** button.
3. Select the Provider from the list (e.g., *OpenAI, Anthropic, Google Gemini, Azure, Local/Custom*).

### 1.2 Configuring Model Credentials
1. **API Key**: Enter the API Key provided by your LLM provider. This is stored securely via Vault/KMS.
2. **Base URL**: (Optional) If you are using a proxy or a local model (like Ollama or vLLM), enter the custom endpoint here.
3. **Save**: Click **Save Connection**. The system will perform a quick health check to verify credentials.

---

## 2. AI Agent Configuration

An "Agent" in LangEval represents the AI application or target bot you want to evaluate. It can be a simple chatbot, a Retrieval-Augmented Generation (RAG) pipeline, or a complex multi-agent system. Configuration accuracy is crucial because LangEval needs to know how to communicate with your agent during simulations.

### 2.1 Basic Agent Profile
1. Go to the **Agents** tab in the main navigation.
2. Click **Create Agent**.
3. **Name**: A required, recognizable name for your agent (e.g., `Customer Support Bot v2`).
4. **Description**: (Optional) A brief outline of the agent's purpose, scope, and expected capabilities.
5. **Type**: Categorize your agent. Normal values are `RAG Chatbot`, `Rule-based Bot`, or `Generative Agent`. 
6. **Version**: Track your revisions (e.g., `v1.0.0`, `v1.1.0-beta`).
7. **Status**: Set the operational state: `active` (ready to test), `maintenance` (temporary disabled), or `deprecated`.
8. **Repository URL**: (Optional) A link to your Git repository holding the agent's source code for cross-reference.

### 2.2 Endpoint & Connection Properties
This is how the LangEval Orchestrator sends test cases to your Agent.

1. **Endpoint URL (Required)**: The absolute HTTP/HTTPS URL where your agent receives requests (e.g., `https://api.my-agent.com/v1/chat`). 
   - LangEval validates this URL structure upon saving. Local IPs or mock hostnames are allowed if your deployment supports them.
2. **API Key / Authentication**: If your agent's API is protected, enter the secret token here. 
   - *Security Note*: This Key is immediately encrypted at rest in the DB (`api_key_encrypted`) and only decrypted in-memory during test payload delivery via Authorization Headers.
3. **Integration Mode (Meta-data)**: You can pass custom JSON in the `meta_data` field to instruct LangEval on how to parse your Agent's HTTP response schema.
   - Example `meta_data`: `{"payload_format": "openai_compatible", "provider": "OpenAI", "model": "gpt-4o"}`.

### 2.3 Observability (Langfuse Integration)
If your agent logic is complex (like multi-turn reasoning or tool calling) and you want LangEval's Trace View to show step-by-step internal executions:

1. Enable the **Langfuse Integration** toggle.
2. Provide your project's Langfuse credentials: `Project ID`, `Public Key`, `Secret Key`, and optionally a custom `Host URL`.
3. During evaluation, LangEval will link the generated output directly to the Langfuse execution Trace ID, giving you an X-ray view into why your Agent responded the way it did.

---

## 3. Scenario Management

A Scenario is your test suite. It contains the dataset, the expected outcomes, and the metrics used to score the agent.

### 3.1 Creating a New Scenario
1. Navigate to **Scenarios** and click **New Scenario**.
2. **Name & Tags**: Enter a name (e.g., `Financial FAQ Testing`) and assign tags for easy filtering.

### 3.2 Defining Scenario Attributes & Dataset
1. **Import Dataset**: You can upload a CSV, JSON file, or connect to an external source.
   - Each row should represent a single "Test Case".
   - Required columns typically include: `input` (the user query).
   - Optional columns: `expected_output` (for exact match or semantic similarity), `context` (for RAG evaluation).
2. **Data Mapping**: Ensure the columns in your dataset map correctly to LangEval's internal variables.

### 3.3 Configuring Evaluation Metrics
1. Within the Scenario editor, go to the **Metrics** tab.
2. Click **Add Metric**.
3. Choose from pre-built AI-assisted metrics:
   - **Faithfulness**: Checks if the answer is grounded in the provided context (RAG).
   - **Answer Relevance**: Checks if the answer addresses the user's prompt.
   - **Toxicity/Bias**: Checks for harmful content.
   - **Custom Code/Deterministic**: Write Python/JS scripts for exact regex matching or JSON schema validation.
4. **Scoring Thresholds**: Set the passing score (e.g., > 0.8 / 1.0) for each metric.

---

## 4. Evaluation Execution & Reports

### 4.1 Running a Scenario
1. In the Scenario view, click **Run Evaluation**.
2. Select the **Target Agent** you configured earlier.
3. Click **Start**. The LangGraph Orchestrator will distribute the workload to evaluation workers.

### 4.2 Interpreting the Dashboard Reports
1. Navigate to **Reports** or click on the finished Run ID.
2. **Overview**: View aggregate scores, pass/fail rates, and latency percentiles.
3. **Trace View**: Dive into individual test cases. See the exact prompt sent, the agent's response, and the rationales generated by the LLM-as-a-Judge.
4. **Export**: Export reports to PDF or CSV for compliance teams.

---

## 5. Workspace Settings

- **Members & Roles**: Invite team members and assign roles (Admin, Evaluator, Viewer).
- **API Keys**: Generate LangEval API Keys to trigger evaluations from your CI/CD pipelines (e.g., GitHub Actions, GitLab CI).
