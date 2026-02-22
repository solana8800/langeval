# 03. DATABASE DESIGN SPECIFICATION
**Project**: Enterprise AI Agent Evaluation Platform
**Version**: 2.0 (Active Testing Support)

---

## 1. DATA ARCHITECTURE STRATEGY (Polyglot Persistence)

Chúng ta sử dụng đúng công cụ cho đúng việc (Right tool for the right job).

| Component | Technology | Role | Rationale in Context |
|-----------|------------|------|----------------------|
| **Primary** | **PostgreSQL 16** | Metadata & Config | Cần ACID transaction cho việc quản lý Campaign Configs, Users, Billing. |
| **Analytics** | **ClickHouse** | Logs & Events | Cần tốc độ insert cực nhanh cho hàng triệu log chat và khả năng query aggregate (SUM, AVG) độ trễ thấp. |
| **Vector** | **Qdrant** | Context & Semantic | Hỗ trợ tìm kiếm Similarity cho Golden Datasets và RAG Context. |
| **Queue** | **Redis** | Job Queue | Broker nhẹ cho LangGraph tasks. |

---

## 2. POSTGRESQL SCHEMA (Metadata & Orchestration)

Tập trung vào quản lý **Chiến dịch kiểm thử (Campaigns)** và **Kịch bản (Scenarios)**.

### 2.1. ER Diagram
```mermaid
erDiagram
    PROJECT ||--o{ SCENARIO : has
    PROJECT ||--o{ CAMPAIGN : runs
    SCENARIO ||--o{ TEST_CASE : defines
    CAMPAIGN ||--o{ CAMPAIGN_RUN : history
    
    CAMPAIGN {
        uuid id PK
        string name
        json config_snapshot "Prompt, Model, Thresholds"
        string schedule "CRON"
    }

    CAMPAIGN_RUN {
        uuid id PK
        uuid campaign_id FK
        timestamp started_at
        float pass_rate
        string status "RUNNING/COMPLETED/FAILED"
    }

    SCENARIO {
        uuid id PK
        string name "E.g: Angry Customer"
        string persona_prompt
        uuid golden_dataset_id FK
    }
```

### 2.2. Key Tables DDL

**Table: `campaigns`**
Quản lý các đợt chạy test định kỳ.
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'RED_TEAMING', 'REGRESSION', 'A_B_TEST'
    
    -- Snapshot cấu hình tại thời điểm tạo campaign
    config JSONB NOT NULL, 
    -- VD: { "model_a": "gpt-4", "simulator_model": "gpt-4-turbo", "metrics": ["toxicty", "relevancy"] }
    
    cron_schedule VARCHAR(50), -- NULL nếu chạy thủ công
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: `scenarios`**
Định nghĩa các kịch bản test (Simulation Configs).
```sql
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    name VARCHAR(255),
    description TEXT,
    
    -- Cấu hình cho AutoGen UserProxy
    persona_template TEXT, -- "You are a {age} year old user..."
    complexity_level INT DEFAULT 1, -- 1-5
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. CLICKHOUSE SCHEMA (Deep Analytics)

Tối ưu cho việc lưu trữ hàng loạt (Bulk Insert) và tính toán Aggregate Score.

### 3.1. Raw Conversation Turns
Lưu trữ chi tiết từng lượt hội thoại trong quá trình Simulation.

```sql
CREATE TABLE conversation_turns (
    run_id UUID,          -- Link to Postgres CampaignRun
    trace_id UUID,        -- Langfuse Trace ID
    timestamp DateTime64(3),
    
    -- Simulation Context
    scenario_id UUID,
    simulator_persona String,
    
    -- The interaction
    turn_index UInt8,     -- Turn 1, 2, 3...
    user_input String,    -- Simulator said
    agent_msg String,     -- Target Bot said
    
    metadata Map(String, String) -- Extra tags
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (run_id, timestamp);
```

### 3.2. Evaluation Metrics Results
Kết quả chấm điểm chi tiết.

```sql
CREATE TABLE eval_results (
    run_id UUID,
    trace_id UUID,
    timestamp DateTime64(3),
    
    metric_name String, -- 'AnswerRelevancy', 'Toxicity'
    score Float32,      -- 0.0 - 1.0
    reason String,      -- "The agent failed because..."
    
    -- Cost tracking
    input_tokens UInt32,
    output_tokens UInt32,
    cost_usd Float32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (metric_name, score, timestamp);
```

---

## 4. VECTOR DATABASE (Qdrant)

### 4.1. Collection: `golden_test_cases`
Lưu trữ bộ dữ liệu mẫu (Golden Dataset) để so sánh ngữ nghĩa.

*   **Config**: Cosine Distance, 1536 dimensions (OpenAI ada-002/small-3).
*   **Payload Schema**:
    ```json
    {
      "question": "Làm sao để đổi mật khẩu?",
      "expected_answer": "Bạn vào Cài đặt -> Bảo mật -> Đổi mật khẩu.",
      "ideal_context": ["doc_security_policy_v2.pdf"],
      "difficulty": "Easy",
      "category": "Account Management"
    }
    ```
*   **Usage**: Khi chạy test Regression, hệ thống sẽ query vector để tìm các test case cũ tương tự nhằm đảm bảo không bị "Regression" (cải lùi).

---

## 5. DATA RETENTION POLICY (Quy định lưu trữ)

*   **Hot Data (30 ngày)**: Lưu full logs trong ClickHouse NVMe storage. Truy xuất tức thì.
*   **Warm Data (1 năm)**: Move logs cũ sang S3-backed storage (ClickHouse Tiered Storage). Query chậm hơn.
*   **Cold Data (Vĩnh viễn)**: Archive các bản Campaign Reports (PDF/JSON summary) vào Postgres/S3. Raw logs quá cũ sẽ bị xóa.
