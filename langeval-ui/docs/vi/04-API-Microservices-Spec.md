# 04. API & Microservices Specification

## 1. Overview
Hệ thống sử dụng **API-First Design**. 
- **External Communication**: REST/HTTP (cho public API và UI integration).
- **Internal Communication**: gRPC (giữa các microservices) và Kafka (async events).

---

## 2. Public Ingestion API (`Data Ingestion Service`)
Đây là API public-facing mà các Agent/Chatbot sẽ gọi để gửi log tương tác.

### Base URL: `https://api.eval-platform.com/v1`

### 2.1. Submit Interaction Event
Endpoint chính để nhận log. Async processing để đảm bảo low latency (<50ms).
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
Endpoint ghi nhận feedback explicit từ người dùng (như Thumbs up/down).
*   **POST** `/events/{event_id}/feedback`
*   **Body**:
```json
{
  "score": 1.0,  // 1.0 = positive, 0.0 = negative
  "comment": "Câu trả lời sai hoàn toàn"
}
```

---

## 3. Simulation & Graph API (`Orchestrator Service`)
Đây là API để khởi tạo các bài test phức tạp (Active Evaluation).

### 3.1. Create Simulation Job
Trigger một kịch bản đánh giá Multi-Agent (AutoGen).
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
Dùng Server-Sent Events (SSE) để stream log hội thoại realtime về UI Studio.
*   **GET** `/simulations/{job_id}/stream`
*   **Response**: Event stream (Thought, Action, Reply).

---

## 4. Connector API (Webhooks)
Endpoint đặc biệt để tích hợp với các hệ thống 3rd party (Langfuse, LangChain).

### 4.1. Langfuse Ingestion Webhook
Nhận sự kiện `trace.create` từ phía Langfuse Server.
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
Các service giao tiếp chủ yếu qua Kafka Topics. Định nghĩa schema message (dùng Protobuf hoặc Avro trong thực tế):

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
Queue chứa lệnh yêu cầu tính điểm.
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
Kết quả sau khi chạy LLM eval.
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
| **Simulation Engine** | Python | Chạy AutoGen agents (Dockerized sandbox). |
| **Orchestrator** | Python (LangGraph) | Quản lý state của luồng đánh giá (State Machine). |
| **Ingestion API** | Go | (Passive) Nhận log từ production traffic. |
| **Scoring Worker** | Python | (Passive) Chạy metric lẻ tẻ cho production log. |
| **Reporter** | Go | ETL & Aggregation. |

---

## 7. Extended Microservices REST API (Đặc tả chi tiết Frontend & API Gateway)

Phần này mô tả các endpoints API thực tế được cung cấp bởi các Microservices phụ trợ (backend), có thể được truy cập thông qua Gateway.

### 7.1. Identity Service
Quản lý Định danh, Người dùng và Không gian làm việc.

- [x] `POST /identity/api/v1/auth/google`: Xác thực OAuth với Google.
- [x] `GET /identity/api/v1/workspaces/me`: Lấy profile của người dùng hiện tại.
- [x] `GET /identity/api/v1/workspaces`: Lấy danh sách các workspace của người dùng.
- [x] `POST /identity/api/v1/workspaces`: Tạo thông tin workspace mới.
- [x] `GET /identity/api/v1/workspaces/{id}/members`: Hiện các thành viên trong workspace.
- [x] `DELETE /identity/api/v1/workspaces/{workspace_id}/members/{user_id}`: Xóa thành viên khỏi nhóm.
- [x] `POST /identity/api/v1/workspaces/{id}/invites`: Tạo lời mời tham gia workspace.
- [x] `GET /identity/api/v1/workspaces/{id}/invites`: Danh sách các lời mời chưa được chấp nhận.
- [x] `GET /identity/api/v1/invites/{code}`: Lấy chi tiết thông tin thiệp mời theo code.
- [x] `POST /identity/api/v1/invites/{code}/accept`: Đồng ý lời mời tham gia.
- [x] `DELETE /identity/api/v1/invites/{code}`: Hủy lời mời tham gia.

### 7.2. Billing Service
Quản lý Gói cước và Tổng chi phí.

- [x] `GET /billing/api/v1/plans`: Lấy danh sách các gói cước có sẵn nền tảng.
- [x] `GET /billing/api/v1/subscription`: Xem thông tin subscription hiện tại của người dùng.
- [x] `POST /billing/api/v1/usage/increment`: Tăng mức tiêu thụ tài nguyên (số lượng kiểm thử, v.v.).
- [x] `POST /billing/api/v1/checkout`: Khởi tạo thanh toán với cổng PayPal.
- [x] `POST /billing/api/v1/checkout/success`: Nhận kết quả thanh toán từ cổng PayPal thành công.
- [x] `GET /billing/api/v1/transactions`: Xem lịch sử thanh toán giao dịch.
- [x] `POST /billing/api/v1/webhook`: Webhook server-to-server xử lý từ IPN PayPal.

### 7.3. Resource Service
Chịu trách nhiệm C.R.U.D các tài nguyên đánh giá (Agents, Scenarios, Vectors).

#### Quản lý Agent & Mô hình
- [x] `GET /resource/api/v1/agents`: Lấy danh sách các Bot mục tiêu.
- [x] `POST /resource/api/v1/agents`: Đăng kí Bot mục tiêu.
- [x] `GET /resource/api/v1/agents/{id}`: Xem chi tiết về Bot.
- [x] `PUT /resource/api/v1/agents/{id}`: Sửa metadata Bot.
- [x] `DELETE /resource/api/v1/agents/{id}`: Xóa Agent.
- [x] `GET /resource/api/v1/models_llm`: Danh sách cung cấp cài đặt AI (OpenAI, VLLM).
- [x] `POST /resource/api/v1/models_llm`: Thêm thiết lập LLM Provider mới.
- [x] `PUT /resource/api/v1/models_llm/{id}`: Sửa khóa LLM Provider.
- [x] `DELETE /resource/api/v1/models_llm/{id}`: Xóa LLM Cấu hình.

#### Kịch bản & Node
- [x] `GET /resource/api/v1/scenarios`: Lọc Scenarios (Graph-based).
- [x] `POST /resource/api/v1/scenarios`: Tạo các Nodes và Dây (Edges).
- [x] `GET /resource/api/v1/scenarios/{id}`: JSON chi tiết ReactFlow.
- [x] `PUT /resource/api/v1/scenarios/{id}`: Chỉnh sửa Dây và Khối Node.
- [x] `DELETE /resource/api/v1/scenarios/{id}`: Remove 1 bản kịch.
- [x] `POST /resource/api/v1/scenarios/generate-ai`: Tạo ra cấu trúc Edge Node tự động từ hội thoại thô (Text prompt).

#### Base Kiến thức RAG
- [x] `GET /resource/api/v1/knowledge_bases`: Lấy tổng kho.
- [x] `POST /resource/api/v1/knowledge_bases`: Kết nối cơ sở Vector / Database tài liệu mới.
- [x] `PUT /resource/api/v1/knowledge_bases/{id}`: Cài đặt nâng cao KB.
- [x] `DELETE /resource/api/v1/knowledge_bases/{id}`: Gỡ tài liệu khỏi KB.

#### Tùy Biến Metrics & Traces (Kiểm duyệt)
- [x] `GET /resource/api/v1/metrics`: Lấy Metrics đang enable.
- [x] `POST /resource/api/v1/metrics`: Tùy biến tiêu chí mới (G-Eval).
- [x] `PUT /resource/api/v1/metrics/{id}`: Sửa mức Threshold điểm.
- [x] `DELETE /resource/api/v1/metrics/{id}`: Xóa dòng Metric.
- [x] `POST /resource/api/v1/metrics/seed`: **[Hệ Thống]** Gieo rắc sẵn hệ Base Default Metrics (RAG/Toxcity).
- [x] `GET /resource/api/v1/traces`: Gọi liên kết từ SDK LangFuse Traces Logging.
- [x] `GET /resource/api/v1/traces/{id}`: Bắt đúng vết Trace đã trace.

#### Human-in-the-Loop Đánh Giá
- [x] `GET /resource/api/v1/reviews/manual-reviews`: Danh sách case đang treo, cờ chờ điểm Review.
- [x] `POST /resource/api/v1/reviews`: Lưu trữ cờ cắm khi AI không chắc chắn.
- [x] `POST /resource/api/v1/reviews/{id}/decision`: Báo cáo Score đánh bằng cơm từ Human.

#### Báo cáo dữ liệu (Arena & Red Team)
API Resource đảm nhiệm các query cho UI hiển thị từ Data của Orchestrator.
- [x] `GET /resource/api/v1/battle/campaigns`: Xem các ván đấu đôi.
- [x] `GET /resource/api/v1/battle/campaigns/{id}`: Ai thắng ai.
- [x] `GET /resource/api/v1/battle/campaigns/{id}/turns`: Từng hiệp một.
- [x] `GET /resource/api/v1/red_teaming/campaigns`: Lọc tiến độ cuộc đánh Jailbreak.
- [x] `GET /resource/api/v1/red_teaming/campaigns/{id}`: Kết quả Tấn công Đỏ.
- [x] `GET /resource/api/v1/red_teaming/campaigns/{id}/stats`: Tỉ lệ sập lỗ hổng bảo mật.
- [x] `GET /resource/api/v1/red_teaming/campaigns/{id}/logs`: Chi tiết raw dump chích xuất Prompt Injection.
- [x] `GET /resource/api/v1/benchmarks`: Các bài thi test quốc tế có sẵn (MMLU).
- [x] `GET /resource/api/v1/benchmarks/{id}`: Xem Agent được bao nhiêu điểm bài test MMLU.

#### Bảng điều khiển (Analytics)
- [x] `GET /resource/api/v1/dashboard/summary`: Tính điểm Metrics báo cáo.
- [x] `GET /resource/api/v1/dashboard/trends`: Timeseries qua thời gian.
- [x] `GET /resource/api/v1/dashboard/metrics-breakdown`: Biểu đồ bánh đánh giá phần trăm.

### 7.4. Orchestrator Service
Quản lý Controller của các trạng thái chạy (LangGraph State Machines). Xử lý quá trình kích hoạt Run Logic.

#### Tiêu chuẩn chiến dịch chạy
- [x] `POST /orchestrator/api/v1/campaigns`: Trigger Run Job cơ bản.
- [x] `GET /orchestrator/api/v1/campaigns`: Tracking Job.
- [x] `GET /orchestrator/api/v1/campaigns/{id}`: Trạng thái cờ Queue.
- [x] `GET /orchestrator/api/v1/campaigns/{id}/state`: Luồng tin nhắn realtime qua Event State Stream.

#### Exec Tấn Công Đội Đỏ 
- [x] `POST /orchestrator/api/v1/red-teaming`: Nã đạn chọt (Probing) liên hoàn bot target.
- [x] `GET /orchestrator/api/v1/red-teaming/campaigns`: Theo dõi Job Red Team.

#### Battle Arena Đấu Lô-gic
- [x] `POST /orchestrator/api/v1/battle/start`: Đưa Model A và Model B lên võ đài.
- [x] `GET /orchestrator/api/v1/battle/{id}/state`: Stream tỉ số đôi.

#### Benchmark (Chấm Chuẩn Quốc Tế)
- [x] `GET /orchestrator/api/v1/benchmarks/list`: Coi các bộ quy chuẩn Quốc tế (MMLU, GSM8K).
- [x] `POST /orchestrator/api/v1/benchmarks/run`: Yêu cầu thi để cấp điểm.
- [x] `GET /orchestrator/api/v1/benchmarks/history`: Lịch sử các đề đã giải.
- [x] `GET /orchestrator/api/v1/benchmarks/history/{id}`: Lịch sử giải bài thi cụ thể.

### 7.5. Gen AI Service
Service Độc lập chuyên xử lý Logic LLM Helper (Generate Test case/Avatar..v.v).

- [x] `POST /gen-ai/api/v1/generate/personas`: Làm ảo (Synthetic) một chân dung khách lạ.
- [x] `POST /gen-ai/api/v1/generate/test-cases`: Sinh Case Test Phức tạp cho đối tượng cụ thể.

---

# Tài Liệu API Backend cho Web Application (Mock Specification)
## 8. Web Application API (BFF Specification)

Tài liệu mô tả danh sách các API endpoints được giả lập (mock) trong hệ thống Evaluation Platform. Các Frontend Component sẽ gọi các API để hiển thị dữ liệu.

Base URL: `/api/v1`

**Quy ước phản hồi lỗi mặc định (nếu có):**
```json
{
  "error": "Mã lỗi",
  "message": "Mô tả chi tiết lỗi"
}
```

---

## 8.1. Navigation & System
### Lấy cấu trúc Menu
Trả về danh sách các menu items để hiển thị trên Sidebar dựa trên quyền hạn user hiện tại.

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
### Lấy chỉ số sức khỏe hệ thống
Trả về các metric tổng quan như uptime, số lượng request, tỉ lệ lỗi.

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

### Lấy trạng thái Release
Trả về tiến độ của đợt release hiện tại.

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
### Lấy danh sách Agent
- [ ] **Endpoint**: `/agents`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
      { "id": 1, "name": "Customer Support Bot", "status": "active", "type": "assistant", "last_deployed": "2h ago" },
      { "id": 2, "name": "Data Analyst Agent", "status": "stopped", "type": "tool_user", "last_deployed": "1d ago" }
    ]
    ```

### Tạo Agent mới
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

### Cập nhật Agent
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

### Xóa Agent
- [ ] **Endpoint**: `/agents/:id`
*   **Method**: `DELETE`
*   **Response**: `204 No Content`

---

## 8.4. Scenario Builder (Kịch bản kiểm thử)
### Lấy danh sách kịch bản
- [ ] **Endpoint**: `/scenarios`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": "sc_01", "name": "Refund Policy Flow", "nodes_count": 5, "updated_at": "..." }
    ]
    ```

### Lấy chi tiết kịch bản
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

### Tạo/Lưu kịch bản
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

### Xóa kịch bản
- [ ] **Endpoint**: `/scenarios/:id`
*   **Method**: `DELETE`
*   **Response**: `204 No Content`

---

## 8.5. Knowledge Base Management
### Lấy danh sách KB
- [ ] **Endpoint**: `/knowledge-bases`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": "kb_1", "name": "Product Manuals", "doc_count": 50, "status": "synced" }
    ]
    ```

### Kết nối KB mới
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
Kích hoạt đồng bộ lại dữ liệu.
- [ ] **Endpoint**: `/knowledge-bases/:id/sync`
*   **Method**: `POST`
*   **Response**: `200 OK` (Async response)
    ```json
    { "job_id": "job_sync_123", "status": "queued" }
    ```

### Xóa KB
- [ ] **Endpoint**: `/knowledge-bases/:id`
*   **Method**: `DELETE`
*   **Response**: `204 No Content`

---

## 8.6. Team & Users
### Lấy danh sách thành viên
- [ ] **Endpoint**: `/team`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": 1, "name": "Nguyen Van A", "email": "a@example.com", "role": "ADMIN", "avatar": "url..." }
    ]
    ```

### Mời thành viên
- [ ] **Endpoint**: `/team/invite`
*   **Method**: `POST`
*   **Body**: `{ "email": "new@example.com", "role": "EDITOR" }`
*   **Response**: `200 OK`

### Cập nhật quyền
- [ ] **Endpoint**: `/team/:id/role`
*   **Method**: `PATCH`
*   **Body**: `{ "role": "VIEWER" }`
*   **Response**: `200 OK`

### Xóa thành viên
- [ ] **Endpoint**: `/team/:id`
*   **Method**: `DELETE`
*   **Response**: `204 No Content`

---

## 8.7. Dev Console (CI/CD)
### Lấy Logs Pipeline
- [ ] **Endpoint**: `/dev-console/logs`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": "log_1", "step": "Build", "status": "success", "message": "Compiled successfully in 2s", "timestamp": "..." }
    ]
    ```

### Lấy chi tiết lỗi
- [ ] **Endpoint**: `/dev-console/failure-detail`
*   **Method**: `GET`
*   **Query Params**: `?log_id=...`
*   **Response**: `200 OK`
    ```json
    { "stack_trace": "Error at line 12...", "suggestion": "Fix typo in variable name" }
    ```

---

## 8.8. Red Teaming (Security)
### Lấy Logs tấn công
- [ ] **Endpoint**: `/red-teaming/logs`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": "rt_1", "attack_vector": "Prompt Injection", "result": "Blocked", "severity": "High" }
    ]
    ```

### Lấy báo cáo thống kê
- [ ] **Endpoint**: `/red-teaming/stats`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    { "total_attacks": 500, "blocked": 498, "bypassed": 2 }
    ```

### Bắt đầu tấn công thử nghiệm
- [ ] **Endpoint**: `/red-teaming/start`
*   **Method**: `POST`
*   **Body**: `{ "strategy": "jailbreak", "intensity": 80 }`
*   **Response**: `200 OK`

---

## 8.9. Benchmarks
### Lấy điểm chuẩn
Trả về danh sách điểm số của các bộ benchmark phổ biến.
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

### Chạy Benchmark
- [ ] **Endpoint**: `/benchmarks/run`
*   **Method**: `POST`
*   **Body**: `{ "suites": ["mmlu", "gsm8k"] }`
*   **Response**: `200 OK`
    ```json
    { "success": true, "job_id": "bench_123" }
    ```

---

## 8.10. Battle Arena
### Lấy dịch sử chat
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

### Gửi tin nhắn (So sánh Models)
- [ ] **Endpoint**: `/battle-arena/send`
*   **Method**: `POST`
*   **Body**: `{ "content": "Viết bài thơ về mùa thu" }`
*   **Response**: `200 OK`
    ```json
    {
        "model_a_response": "...",
        "model_b_response": "..."
    }
    ```

---

## 8.11. Model Registry
### Lấy danh sách Model
- [ ] **Endpoint**: `/models`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
      { "id": 1, "name": "GPT-4 Turbo", "provider": "OpenAI", "type": "API", "status": "active", "usage": "High" }
    ]
    ```

### Thêm Model mới
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

### Xóa Model
- [ ] **Endpoint**: `/models/:id`
*   **Method**: `DELETE`
*   **Response**: `204 No Content`

### Kiểm tra kết nối
- [ ] **Endpoint**: `/models/:id/check`
*   **Method**: `POST`
*   **Response**: `200 OK`
    ```json
    { "status": "connected", "latency": "45ms" }
    ```

---

## 8.12. Dataset Generator
### Tải lên tài liệu nguồn
- [ ] **Endpoint**: `/dataset-gen/upload`
*   **Method**: `POST`
*   **Headers**: `Content-Type: multipart/form-data`
*   **Body**: `file` (Binary)
*   **Response**: `201 Created`
    ```json
    { "message": "File uploaded", "fileId": "file_abc_123" }
    ```

### Sinh dữ liệu tự động
- [ ] **Endpoint**: `/dataset-gen/generate`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
        "topic": "Chính sách bảo hành",
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

### Lấy lịch sử sinh
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
### Lấy hàng đợi đánh giá
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
            "timestamp": "2 phút trước"
        }
    ]
    ```

### Gửi đánh giá
- [ ] **Endpoint**: `/human-review/submit`
*   **Method**: `POST`
*   **Body**:
    ```json
    {
        "itemId": 1,
        "rating": 5,
        "correction": "Câu trả lời đúng phải là..."
    }
    ```
*   **Response**: `200 OK`

---

## 8.14. Contribution
### Lấy lịch sử commit
- [ ] **Endpoint**: `/contribution/commits`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
        { "id": 1, "message": "Thêm thông số sạc VF9", "time": "2p trước" }
    ]
    ```

### Commit test case mới
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
### Lấy danh sách Metrics
- [ ] **Endpoint**: `/metrics-library`
*   **Method**: `GET`
*   **Response**: `200 OK`
    ```json
    [
      { "id": "faithfulness", "name": "Faithfulness", "category": "RAG", "enabled": true, "threshold": 0.5 }
    ]
    ```

### Cập nhật cấu hình Metric
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

### Tạo Custom Metric mới
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
