# 04. API & Microservices Specification

## 1. Overview
The system follows an **API-First Design**. 
- **External Communication**: REST/HTTP (for public API and UI integration).
- **Internal Communication**: gRPC (between microservices) and Kafka (async events).

---

## 2. Public Ingestion API (`Data Ingestion Service`)
This is the public-facing API that Agents/Chatbots call to submit interaction logs.

### Base URL: `https://api.eval-platform.com/v1`

### 2.1. Submit Interaction Event
Main endpoint for log submission. Uses async processing for low latency (<50ms).
*   **POST** `/events`
*   **Auth**: Bearer Token (Project API Key)
*   **Request Body**:
```json
{
  "trace_id": "uuid-v4-optional",
  "session_id": "chat-session-123",
  "event_type": "chat_completion",
  "input": "User query here",
  "output": "Agent response string",
  "context":  ["Retrieved doc 1 content", "Retrieved doc 2 content"],
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7,
    "user_tier": "premium"
  }
}
```
*   **Response (202 Accepted)**:
```json
{
  "success": true,
  "event_id": "evt-873289743"
}
```

### 2.2. Submit User Feedback
Endpoint for capturing explicit user feedback (e.g., Thumbs up/down).
*   **POST** `/events/{event_id}/feedback`
*   **Body**:
```json
{
  "score": 1.0,  // 1.0 = positive, 0.0 = negative
  "comment": "Completely wrong answer"
}
```

---

## 3. Simulation & Graph API (`Orchestrator Service`)
API for initiating complex tests (Active Evaluation).

### 3.1. Create Simulation Job
Triggers a Multi-Agent evaluation scenario (AutoGen).
*   **POST** `/simulations`
*   **Body**:
```json
{
  "scenario_id": "scen-price-negotiation",
  "target_agent_url": "https://my-bot.com/api/chat",
  "persona_config": {
    "name": "AngryCustomer",
    "difficulty": "hard"
  }
}
```

### 3.2. Get Job Status (Stream)
Uses Server-Sent Events (SSE) to stream real-time conversation logs to AI Studio.
*   **GET** `/simulations/{job_id}/stream`
*   **Response**: Event stream (Thought, Action, Reply).

---

## 4. Connector API (Webhooks)
Special endpoints for integration with 3rd party systems (Langfuse, LangChain).

### 4.1. Langfuse Ingestion Webhook
Receives `trace.create` events from the Langfuse Server.
*   **POST** `/webhooks/langfuse`
*   **Headers**: `X-Langfuse-Signature` (Security check)
*   **Body**:
```json
{
  "event": "trace.create",
  "payload": {
    "traceId": "trace-1234",
    "inputs": "...",
    "outputs": "..."
  }
}
```

---

## 5. Internal Message Schemas (Kafka/Queue)
Services communicate primarily via Kafka topics.

### 5.1. Topic: `events.raw`
Producer: **Ingestion Service** | Consumer: **Eval Orchestrator**, **Langfuse Connector**
```json
{
  "meta_info": {
     "timestamp": 171542342342,
     "project_id": "prj-001"
  },
  "payload": { ...original_http_body... }
}
```

### 5.2. Topic: `eval.jobs`
Producer: **Eval Orchestrator** | Consumer: **Scoring Workers**
Queue for scoring requests.
```json
{
  "job_id": "job-555",
  "event_ref": { "input": "...", "output": "..." },
  "metrics_to_run": [
    {
      "name": "hallucination",
      "config": { "model": "gpt-4-turbo" }
    }
  ]
}
```

### 5.3. Topic: `eval.results`
Producer: **Scoring Workers** | Consumer: **Reporting Service**, **Alert Service**
Results after running LLM evaluation.
```json
{
  "job_id": "job-555",
  "event_id": "evt-873",
  "results": [
    {
      "metric": "hallucination",
      "score": 0.0,
      "reason": "The output contradicts context chunk 2.",
      "cost_usd": 0.003
    }
  ]
}
```

---

## 6. Microservices Responsibilities

| Service Name | Language | Main Responsibility |
|--------------|----------|---------------------|
| **Simulation Engine** | Python | Runs AutoGen agents (Dockerized sandbox). |
| **Orchestrator** | Python (LangGraph) | Manages evaluation flow state (State Machine). |
| **Ingestion API** | Go | (Passive) Receives logs from production traffic. |
| **Scoring Worker** | Python | (Passive) Runs independent metrics for production logs. |
| **Reporter** | Go | ETL & Aggregation. |

---

## 7. Extended Microservices REST API (Detailed Specification)

This section maps the specific endpoints exposed by each microservice (accessible via the API Gateway).

### 7.1. Identity Service
Authentication, Users, and Workspace management.

- [x] `POST /identity/api/v1/auth/google`: Authenticate via Google OAuth.
- [x] `GET /identity/api/v1/workspaces/me`: Get current user profile.
- [x] `GET /identity/api/v1/workspaces`: List user workspaces.
- [x] `POST /identity/api/v1/workspaces`: Create a new workspace.
- [x] `GET /identity/api/v1/workspaces/{id}/members`: List members of a workspace.
- [x] `DELETE /identity/api/v1/workspaces/{workspace_id}/members/{user_id}`: Remove a member.
- [x] `POST /identity/api/v1/workspaces/{id}/invites`: Create a workspace invitation.
- [x] `GET /identity/api/v1/workspaces/{id}/invites`: List pending invites for a workspace.
- [x] `GET /identity/api/v1/invites/{code}`: Get invite details by code.
- [x] `POST /identity/api/v1/invites/{code}/accept`: Accept an invitation.
- [x] `DELETE /identity/api/v1/invites/{code}`: Cancel an invitation.

### 7.2. Billing Service
Subscription and Quota Management.

- [x] `GET /billing/api/v1/plans`: List available subscription plans.
- [x] `GET /billing/api/v1/subscription`: Get current user subscription details.
- [x] `POST /billing/api/v1/usage/increment`: Increment resource usage (e.g., test runs).
- [x] `POST /billing/api/v1/checkout`: Initiate PayPal checkout session.
- [x] `POST /billing/api/v1/checkout/success`: Capture successful PayPal payment.
- [x] `GET /billing/api/v1/transactions`: View transaction history.
- [x] `POST /billing/api/v1/webhook`: Handle external payment webhooks (e.g., PayPal IPN).

### 7.3. Resource Service
Core CRUD operations for evaluation resources.

#### Agent & Model Management
- [x] `GET /resource/api/v1/agents`: List target Agents.
- [x] `POST /resource/api/v1/agents`: Register an Agent.
- [x] `GET /resource/api/v1/agents/{id}`: Get Agent details.
- [x] `PUT /resource/api/v1/agents/{id}`: Update Agent.
- [x] `DELETE /resource/api/v1/agents/{id}`: Delete an Agent.
- [x] `GET /resource/api/v1/models_llm`: List LLM configurations (OpenAI, VLLM, etc.).
- [x] `POST /resource/api/v1/models_llm`: Add a new LLM configuration.
- [x] `PUT /resource/api/v1/models_llm/{id}`: Update LLM config.
- [x] `DELETE /resource/api/v1/models_llm/{id}`: Remove LLM config.

#### Scenarios & Testing
- [x] `GET /resource/api/v1/scenarios`: List Graph-based Scenarios.
- [x] `POST /resource/api/v1/scenarios`: Create a Scenario.
- [x] `GET /resource/api/v1/scenarios/{id}`: Get Scenario ReactFlow JSON structure.
- [x] `PUT /resource/api/v1/scenarios/{id}`: Update Scenario.
- [x] `DELETE /resource/api/v1/scenarios/{id}`: Delete Scenario.
- [x] `POST /resource/api/v1/scenarios/generate-ai`: Generate AI-driven Scenario structure from text prompt.

#### Knowledge Bases (RAG)
- [x] `GET /resource/api/v1/knowledge_bases`: List Knowledge Bases.
- [x] `POST /resource/api/v1/knowledge_bases`: Connect a new Knowledge Base.
- [x] `PUT /resource/api/v1/knowledge_bases/{id}`: Update Knowledge Base settings.
- [x] `DELETE /resource/api/v1/knowledge_bases/{id}`: Disconnect Knowledge Base.

#### Metrics & Evaluation
- [x] `GET /resource/api/v1/metrics`: List available evaluation Metrics.
- [x] `POST /resource/api/v1/metrics`: Define a custom Metric.
- [x] `PUT /resource/api/v1/metrics/{id}`: Update Metric settings/thresholds.
- [x] `DELETE /resource/api/v1/metrics/{id}`: Delete custom Metric.
- [x] `POST /resource/api/v1/metrics/seed`: **[System]** Seed default metrics (RAG, Toxicity, etc.).
- [x] `GET /resource/api/v1/traces`: List evaluation traces (Integration with Langfuse).
- [x] `GET /resource/api/v1/traces/{id}`: Get a specific trace detail.

#### Human-in-the-Loop Reviews
- [x] `GET /resource/api/v1/reviews/manual-reviews`: Fetch queue of items needing human review.
- [x] `POST /resource/api/v1/reviews`: Create a new manual review request.
- [x] `POST /resource/api/v1/reviews/{id}/decision`: Submit human judgment (rating/correction).

#### Advanced Campaigns Data (Battle Arena & Red Teaming)
These endpoints serve historic states and metadata for specialized campaigns managed by Orchestrator.
- [x] `GET /resource/api/v1/battle/campaigns`: List A/B testing campaigns.
- [x] `GET /resource/api/v1/battle/campaigns/{id}`: Get Battle Campaign outcome.
- [x] `GET /resource/api/v1/battle/campaigns/{id}/turns`: Get distinct turns in an Arena battle.
- [x] `GET /resource/api/v1/red_teaming/campaigns`: List all Red Teaming operations.
- [x] `GET /resource/api/v1/red_teaming/campaigns/{id}`: View status of a Red Teaming run.
- [x] `GET /resource/api/v1/red_teaming/campaigns/{id}/stats`: Vulnerability statistics.
- [x] `GET /resource/api/v1/red_teaming/campaigns/{id}/logs`: Raw attack iteration logs.
- [x] `GET /resource/api/v1/benchmarks`: View generic Benchmark performance (e.g., MMLU).
- [x] `GET /resource/api/v1/benchmarks/{id}`: Get details of a specific Benchmark run.

#### Dashboard Analytics
- [x] `GET /resource/api/v1/dashboard/summary`: High-level evaluation metrics.
- [x] `GET /resource/api/v1/dashboard/trends`: Timeseries pass/fail data.
- [x] `GET /resource/api/v1/dashboard/metrics-breakdown`: Score distribution by category.

### 7.4. Orchestrator Service
Controls the execution logic (LangGraph State Machines) of various evaluation workflows.

#### Standard Campaigns
- [x] `POST /orchestrator/api/v1/campaigns`: Initiate a standard simulation Job.
- [x] `GET /orchestrator/api/v1/campaigns`: List active/recent Campaign Jobs.
- [x] `GET /orchestrator/api/v1/campaigns/{id}`: Check execution status of a Campaign.
- [x] `GET /orchestrator/api/v1/campaigns/{id}/state`: Stream or fetch the live state machinery status of a Campaign.

#### Red Teaming Execution
- [x] `POST /orchestrator/api/v1/red-teaming`: Start an adversarial probing campaign.
- [x] `GET /orchestrator/api/v1/red-teaming/campaigns`: List executing/queued Red Teaming jobs.

#### Battle Arena Execution
- [x] `POST /orchestrator/api/v1/battle/start`: Start a Model A vs Model B evaluation run.
- [x] `GET /orchestrator/api/v1/battle/{id}/state`: View real-time Arena scores.

#### Benchmark Execution
- [x] `GET /orchestrator/api/v1/benchmarks/list`: Fetch available standard benchmark suites.
- [x] `POST /orchestrator/api/v1/benchmarks/run`: Run predefined benchmarks against an Agent.
- [x] `GET /orchestrator/api/v1/benchmarks/history`: List historically executed benchmarks.
- [x] `GET /orchestrator/api/v1/benchmarks/history/{id}`: See historical benchmark specifics.

### 7.5. Gen AI Service
Data Generation & Setup features utilizing Auxiliary AI agents.

- [x] `POST /gen-ai/api/v1/generate/personas`: Synthesize User Personas based on context mapping.
- [x] `POST /gen-ai/api/v1/generate/test-cases`: Generate complex Test Cases adapted for given personas.

---

## 8. Web Application API (BFF Specification & Mockups)

Describes the simulated API endpoints for the Evaluation Platform. Frontend components call these APIs to display data.

Base URL: `/api/v1`

**Default Error Response Format:**
```json
{
  "error": "Error code",
  "message": "Detailed error description"
}
```

---

## 8.1. Navigation & System
### Get Menu Structure
Returns sidebar menu items based on user permissions.

- [ ] **Endpoint**: `/navigation`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
      {
        "title": "Dashboard",
        "icon": "LayoutDashboard",
        "href": "/dashboard",
        "permission": "VIEW_DASHBOARD"
      },
      ...
    ]
    ```

---

## 8.2. Dashboard
### Get System Health Metrics
Returns overview metrics like uptime, request count, and error rate.

- [ ] **Endpoint**: `/dashboard/health`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    {
      "uptime": 99.9,
      "latency_ms": 120,
      "error_rate": 0.05,
      "total_requests": 150000
    }
    ```

### Get Release Status
Returns current release progress.

- [ ] **Endpoint**: `/dashboard/status`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    {
        "stage": "Beta Testing",
        "progress": 75,
        "blockers": 2,
        "target_date": "2024-12-25"
    }
    ```

---

## 8.3. Agent Management
### List Agents
- [ ] **Endpoint**: `/agents`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
      { "id": 1, "name": "Customer Support Bot", "status": "active", "type": "assistant", "last_deployed": "2h ago" },
      { "id": 2, "name": "Data Analyst Agent", "status": "stopped", "type": "tool_user", "last_deployed": "1d ago" }
    ]
    ```

### Create New Agent
- [ ] **Endpoint**: `/agents`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "name": "New Agent",
      "type": "assistant",
      "repoUrl": "https://github.com/org/repo"
    }
    ```
*   **Response**: `201 Created`
    ```json
    { "id": 3, "status": "initializing", ... }
    ```

### Update Agent
- [ ] **Endpoint**: `/agents/:id`
*   **Method**: `PUT`
*   **Body**:
    ```json
    {
        "name": "Updated Name",
        "webhookUrl": "https://api.example.com/webhook"
    }
    ```
*   **Response**: `200 OK`

### Delete Agent
- [ ] **Endpoint**: `/agents/:id`
*   **Method**: `DELETE`
*   **Response**: `204 No Content`

---

## 8.4. Scenario Builder
### List Scenarios
- [ ] **Endpoint**: `/scenarios`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": "sc_01", "name": "Refund Policy Flow", "nodes_count": 5, "updated_at": "..." }
    ]
    ```

### Scenario Details
- [ ] **Endpoint**: `/scenarios/:id`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    {
        "id": "sc_01",
        "nodes": [ { "id": "1", "type": "prompt", "position": { "x": 0, "y": 0 }, "data": { "label": "Start" } } ],
        "edges": [ { "id": "e1-2", "source": "1", "target": "2" } ]
    }
    ```

### Create/Save Scenario
- [ ] **Endpoint**: `/scenarios`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
        "name": "Complex Flow",
        "nodes": [ ... ],
        "edges": [ ... ]
    }
    ```
*   **Response**: `201 Created`

### Delete Scenario
- [ ] **Endpoint**: `/scenarios/:id`
*   **Method**: `DELETE`
*   **Response**: `204 No Content`

---

## 8.5. Knowledge Base Management
### List Knowledge Bases
- [ ] **Endpoint**: `/knowledge-bases`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": "kb_1", "name": "Product Manuals", "doc_count": 50, "status": "synced" }
    ]
    ```

### Connect New Knowledge Base
- [ ] **Endpoint**: `/knowledge-bases`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
        "name": "Sales Docs",
        "type": "vectordb",
        "config": { "provider": "pinecone", "index": "sales-v1" }
    }
    ```
*   **Response**: `201 Created`

### Trigger Sync
- [ ] **Endpoint**: `/knowledge-bases/:id/sync`
*   **Method**: `POST`
*   **Response**: `200 OK` (Async response)
    ```json
    { "job_id": "job_sync_123", "status": "queued" }
    ```

### Delete Knowledge Base
- [ ] **Endpoint**: `/knowledge-bases/:id`
*   **Method**: `DELETE`
*   **Response**: `204 No Content`

---

## 8.6. Team & Users
### List Team Members
- [ ] **Endpoint**: `/team`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": 1, "name": "Nguyen Van A", "email": "a@example.com", "role": "ADMIN", "avatar": "url..." }
    ]
    ```

### Invite Member
- [ ] **Endpoint**: `/team/invite`
*   **Method**: `POST`
*   **Body**: `{ "email": "new@example.com", "role": "EDITOR" }`
*   **Response**: `200 OK`

### Update Status/Role
- [ ] **Endpoint**: `/team/:id/role`
*   **Method**: `PATCH`
*   **Body**: `{ "role": "VIEWER" }`
*   **Response**: `200 OK`

### Delete Member
- [ ] **Endpoint**: `/team/:id`
*   **Method**: `DELETE`
*   **Response**: `204 No Content`

---

## 8.7. Dev Console (CI/CD)
### Pipeline Logs
- [ ] **Endpoint**: `/dev-console/logs`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": "log_1", "step": "Build", "status": "success", "message": "Compiled successfully in 2s", "timestamp": "..." }
    ]
    ```

### Failure Details
- [ ] **Endpoint**: `/dev-console/failure-detail`
*   **Method**: `GET`
*   **Query Params**: `?log_id=...`
*   **Response**: `200 OK`
    ```json
    { "stack_trace": "Error at line 12...", "suggestion": "Fix typo in variable name" }
    ```

---

## 8.8. Red Teaming (Security)
### Attack Logs
- [ ] **Endpoint**: `/red-teaming/logs`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": "rt_1", "attack_vector": "Prompt Injection", "result": "Blocked", "severity": "High" }
    ]
    ```

### Attack Statistics
- [ ] **Endpoint**: `/red-teaming/stats`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    { "total_attacks": 500, "blocked": 498, "bypassed": 2 }
    ```

### Start Test Attack
- [ ] **Endpoint**: `/red-teaming/start`
*   **Method**: `POST`
*   **Body**: `{ "strategy": "jailbreak", "intensity": 80 }`
*   **Response**: `200 OK`

---

## 8.9. Benchmarks
### Get Benchmark Scores
Returns scores for common benchmark suites.
- [ ] **Endpoint**: `/benchmarks`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    {
      "data": [
        { "name": "MMLU", "category": "General Knowledge", "score": 86.5, "sota": 89.8, "progress": 96 },
        { "name": "GSM8K", "category": "Reasoning", "score": 92.0, "sota": 95.1, "progress": 97 }
      ]
    }
    ```

### Run Benchmark
- [ ] **Endpoint**: `/benchmarks/run`
*   **Method**: `POST`
*   **Body**: `{ "suites": ["mmlu", "gsm8k"] }`
*   **Response**: `200 OK`
    ```json
    { "success": true, "job_id": "bench_123" }
    ```

---

## 8.10. Battle Arena
### Chat History
- [ ] **Endpoint**: `/battle-arena/history`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "role": "user", "content": "Hello" },
        { "role": "model_a", "content": "Hi there!" },
        { "role": "model_b", "content": "Hello! How can I help?" }
    ]
    ```

### Send Message (Model Comparison)
- [ ] **Endpoint**: `/battle-arena/send`
*   **Method**: `POST`
*   **Body**: `{ "content": "Write a poem about autumn" }`
*   **Response**: `200 OK`
    ```json
    {
        "model_a_response": "...",
        "model_b_response": "..."
    }
    ```

---

## 8.11. Model Registry
### List Models
- [ ] **Endpoint**: `/models`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
      { "id": 1, "name": "GPT-4 Turbo", "provider": "OpenAI", "type": "API", "status": "active", "usage": "High" }
    ]
    ```

### Add New Model
- [ ] **Endpoint**: `/models`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
        "name": "Local Llama 3",
        "provider": "VLLM",
        "type": "Local",
        "apiKey": "sk-...",
        "endpoint": "http://localhost:8000/v1"
    }
    ```
*   **Response**: `201 Created`

### Delete Model
- [ ] **Endpoint**: `/models/:id`
*   **Method**: `DELETE`
*   **Response**: `204 No Content`

### Check Connection
- [ ] **Endpoint**: `/models/:id/check`
*   **Method**: `POST`
*   **Response**: `200 OK`
    ```json
    { "status": "connected", "latency": "45ms" }
    ```

---

## 8.12. Dataset Generator
### Upload Source Documents
- [ ] **Endpoint**: `/dataset-gen/upload`
*   **Method**: `POST`
*   **Headers**: `Content-Type: multipart/form-data`
*   **Body**: `file` (Binary)
*   **Response**: `201 Created`
    ```json
    { "message": "File uploaded", "fileId": "file_abc_123" }
    ```

### Generate Dataset
- [ ] **Endpoint**: `/dataset-gen/generate`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
        "topic": "Warranty Policy",
        "complexity": 50,
        "type": "mixed",
        "quantity": 50,
        "sourceFileIds": ["file_abc_123"]
    }
    ```
*   **Response**: `202 Accepted`
    ```json
    { "message": "Generation started", "jobId": "gen_job_123" }
    ```

### Generation History
- [ ] **Endpoint**: `/dataset-gen/history`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": 1, "date": "2023-10-25", "topic": "...", "quantity": 50, "status": "completed" }
    ]
    ```

---

## 8.13. Human Review
### Review Queue
- [ ] **Endpoint**: `/human-review/queue`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        {
            "id": 1,
            "query": "...",
            "response": "...",
            "confidence": 0.45,
            "timestamp": "2 mins ago"
        }
    ]
    ```

### Submit Rating/Correction
- [ ] **Endpoint**: `/human-review/submit`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
        "itemId": 1,
        "rating": 5,
        "correction": "The correct answer should be..."
    }
    ```
*   **Response**: `200 OK`

---

## 8.14. Contribution
### Commit History
- [ ] **Endpoint**: `/contribution/commits`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": 1, "message": "Add VF9 charging specs", "time": "2 mins ago" }
    ]
    ```

### Commit New Test Case
- [ ] **Endpoint**: `/contribution/commit`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
        "input": "...",
        "expected": "...",
        "tags": "#edge-case #vf3"
    }
    ```
*   **Response**: `201 Created`

---

## 8.15. Metrics Library
### List Metrics
- [ ] **Endpoint**: `/metrics-library`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
      { "id": "faithfulness", "name": "Faithfulness", "category": "RAG", "enabled": true, "threshold": 0.5 }
    ]
    ```

### Update Metric Config
- [ ] **Endpoint**: `/metrics-library/:id`
*   **Method**: `PATCH`
*   **Body**:
    ```json
    {
      "threshold": 0.7,
      "config": { "model": "gpt-4" }
    }
    ```
*   **Response**: `200 OK`

### Create Custom Metric
- [ ] **Endpoint**: `/metrics-library`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
      "name": "Brand Voice Check",
      "type": "G-Eval",
      "definition": "Check if tone is professional."
    }
    ```
*   **Response**: `201 Created`
