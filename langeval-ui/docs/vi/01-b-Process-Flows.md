# 01-b. PROCESS FLOWS & SEQUENCE DIAGRAMS
**Project**: Enterprise AI Agent Evaluation Platform
**Version**: 2.0 (Aligned with BRD v1.1)

---

## 1. SYNTHETIC DATA GENERATION WORKFLOW
Quy trình tự động sinh bộ dữ liệu "vàng" (Golden Dataset) từ tài liệu nghiệp vụ thô.

### 1.1. Flowchart
```mermaid
graph TD
    start([User Uploads Docs]) --> parse[Chunking & Parsing]
    parse --> embed[Embedding Generation]
    
    subgraph "Evolutionary Generation (DeepEval)"
        embed --> gen_simple[Generate Simple QA Pairs]
        gen_simple --> evolve_1{Add Reasoning?}
        evolve_1 -- Yes --> gen_reasoning[Evolve to Multi-step Reasoning]
        evolve_1 -- No --> evolve_2{Add Noise?}
        
        gen_reasoning --> evolve_2
        
        evolve_2 -- Yes --> gen_noise[Inject Grammar Errors / Irrelevant Context]
        evolve_2 -- No --> format[Format to JSON]
    end
    
    format --> human_review{Human Approval?}
    human_review -- Reject --> start
    human_review -- Approve --> save_db[(Save to Golden Dataset)]
```

### 1.2. Sequence Diagram
```mermaid
sequenceDiagram
    actor QC as QA Engineer
    participant FE as AI Studio UI
    participant Gen as Data Generator
    participant LLM as Generator LLM (GPT-4)
    participant DB as Dataset DB

    QC->>FE: Upload "Product_Manual.pdf"
    FE->>Gen: POST /generate-data (file)
    Gen->>Gen: Parse PDF -> Text Chunks
    
    loop For each Chunk
        Gen->>LLM: Prompt: "Generate 5 QA pairs from this text..."
        LLM-->>Gen: 5 QA Pairs
        
        Gen->>LLM: Prompt: "Make question #3 harder and add bad grammar"
        LLM-->>Gen: Evolved QA Pair
    end
    
    Gen-->>FE: Return Preview List (100 items)
    
    QC->>FE: Review & Edit Items
    QC->>FE: Click "Save Dataset"
    FE->>DB: Insert into dataset_table
```

---

## 2. END-TO-END CAMPAIGN EXECUTION
Quy trình cốt lõi khi chạy một chiến dịch kiểm thử (Test Campaign).

### 2.1. Orchestration Flow (LangGraph)
Mô hình trạng thái (State Machine) của một lượt chạy kiểm thử.

```mermaid
stateDiagram-v2
    [*] --> Init: Configure & Load Data
    Init --> Simulating: Start User Proxy
    
    state Simulating {
        [*] --> Attack: Planner generates User Prompt
        Attack --> WaitBot: Send to Target Bot
        WaitBot --> Judge: Receive Response
        
        state Judge {
             [*] --> SafetyCheck: DeepEval Security
             SafetyCheck --> QualityCheck: If Safe
        }
        
        QualityCheck --> Decision: Score > Threshold?
        Decision --> NextTurn: Pass / Continue
        Decision --> Retry: Fail (Self-Correction)
        Retry --> Attack: Try different prompt
    }
    
    NextTurn --> Simulating: Until Max Turns reached
    Simulating --> Aggregating: Campaign Finished
    Aggregating --> Reporting: Generate PDF
    Reporting --> [*]
```

### 2.2. Detailed Sequence Diagram
```mermaid
sequenceDiagram
    participant Job as Campaign Job
    participant Orch as LangGraph Engine
    participant Sim as AutoGen Users
    participant Bot as Target Agent
    participant Eval as DeepEval Worker
    participant Result as Report DB

    Job->>Orch: Start Campaign (100 Test Cases)
    loop Parallel Execution (Workers)
        Orch->>Sim: Initialize Conversation (Persona="Angry Customer")
        
        loop Conversation Turns (max 5)
            Sim->>Sim: Plan Next Move
            Sim->>Bot: Send Message
            Bot-->>Sim: Reply Message
            
            par Async Evaluation
                Sim->>Eval: Assess Interaction
                Eval->>Eval: Calculate Metrics (Answer Relevancy)
                Eval-->>Orch: Metric Result
            end
        end
        
        Sim-->>Orch: Conversation Complete
        Orch->>Result: Save Test Case Result (Pass/Fail)
    end
    Orch->>Result: Aggregate Campaign Stats
```

---

## 3. HUMAN-IN-THE-LOOP (HITL) REVIEW
Quy trình đảm bảo chất lượng đánh giá khi AI không chắc chắn.

```mermaid
sequenceDiagram
    actor Tester
    participant UI as Annotation UI
    participant Sys as Eval System
    participant DB as Feedback DB

    Sys->>Sys: Auto-Evaluate Trace
    Sys->>Sys: Calculate Confidence Score
    
    opt Confidence < 0.6
        Sys->>DB: Flag as "Needs Review"
        Sys->>UI: Add to Review Queue
    end
    
    Tester->>UI: Open "Review Queue"
    UI->>DB: Fetch Flagged Traces
    
    loop Manual Grading
        Tester->>UI: Read Chat Log
        Tester->>UI: Override Score (AI=0.4 -> Human=0.9)
        Tester->>UI: Add Comment "AI misunderstood slang"
        UI->>DB: Update Score & Save Feedback
    end
    
    DB->>Sys: Trigger "Fine-tune Judge" Event (Future)
```

---

## 4. BATTLE MODE FLOW (Arena)
Quy trình so sánh mù (Blind Comparison) giữa 2 model A và B.

```mermaid
sequenceDiagram
    actor Voter as Human Judge
    participant UI as Arena UI
    participant Proxy as Arena Backend
    participant BotA as Model A (v1)
    participant BotB as Model B (v2)

    Voter->>UI: Enter Prompt "Help me write code"
    UI->>Proxy: Broadcast Request
    
    par Parallel Call
        Proxy->>BotA: Chat
        Proxy->>BotB: Chat
    end
    
    BotA-->>Proxy: Response A
    BotB-->>Proxy: Response B
    
    Proxy-->>UI: Show Responses (Anonymous)
    
    Voter->>UI: Vote "Response A is better"
    UI->>Proxy: Submit Vote
    Proxy->>Proxy: Update ELO Ratings
    Proxy-->>UI: Reveal Identities (A was GPT-4, B was Llama-3)
```

---

## 5. RECOVERY & RETRY LOGIC (Resilience)
Cách hệ thống xử lý khi gặp lỗi trong quá trình chạy test dài.

```mermaid
flowchart TD
    Start[Start Task] --> CallLLM[Call LLM API]
    CallLLM --> Check{Success?}
    
    Check -- Yes --> Finish[Return Result]
    Check -- No (Error) --> Type{Error Type?}
    
    Type -- Rate Limit (429) --> Wait[Exp Backoff Wait]
    Wait --> CallLLM
    
    Type -- Timeout (504) --> RetryCount{Retries < 3?}
    RetryCount -- Yes --> CallLLM
    RetryCount -- No --> Fallback[Mark Block as FAIL]
    
    Type -- Context Too Long --> Prune[Prune History]
    Prune --> CallLLM
    
    Fallback --> Finish
```
