# 01. SYSTEM ARCHITECTURE DESIGN
**Project**: Enterprise AI Agent Evaluation Platform
**Version**: 2.1 (Consolidated Master)
**Status**: APPROVED
**Last Updated**: 2026-01-22

---

## 1. GIỚI THIỆU (Introduction)

Tài liệu xác định kiến trúc tổng thể (Solution Architecture) cho **Enterprise AI Agent Evaluation Platform**, hệ thống đánh giá và kiểm thử tự động cho các AI Agent thế hệ mới.

Kiến trúc được thiết kế theo các nguyên tắc **Cloud-Native**, đảm bảo tính Khả dụng cao (High Availability), Khả năng mở rộng (Scalability) và Bảo mật (Security) theo tiêu chuẩn Enterprise, sẵn sàng triển khai trên hạ tầng **AWS Cloud**.

### Đăng ký Kiến trúc (Design Principles)
1.  **Microservices on Kubernetes**: Toàn bộ workload (ngoại trừ Data Layer) chạy trên EKS để tối ưu hóa quản lý resource và auto-scaling.
2.  **Event-Driven & Graph-based**: Sử dụng LangGraph cho logic điều phối phức tạp và Kafka/Redis cho xử lý bất đồng bộ.
3.  **Security-First**: Áp dụng mô hình Zero Trust, mã hóa dữ liệu 2 chiều (At-rest & In-transit), tuân thủ VPC Isolation nghiêm ngặt.
4.  **Separation of Concerns**: Tách biệt rõ ràng giữa Control Plane (Orchestrator), Compute Plane (Simulation/Eval Workers) và Data Plane.

---

## 2. SYSTEM CONTEXT (C4 Level 1)

Mô tả sự tương tác giữa Platform và các hệ thống bên ngoài.

```mermaid
graph TD
    %% User Actors
    qa("QA Engineer<br>[User]")
    dev("AI Developer<br>[User]")
    biz("Product Manager<br>[User]")

    %% System Boundary
    subgraph "Enterprise AI Evaluation Platform"
        eval_sys("AI Evaluation Core System<br>[System Boundary]")
    end

    %% External Systems
    target_bot("Target AI Agent<br>[SUT - System Under Test]")
    llm_kb("Knowledge Base/RAG<br>[Vector DB]")
    llm_api("LLM Providers<br>(OpenAI/Anthropic/Bedrock)")
    notif("Notification Channel<br>(Slack/MS Teams)")
    git("Source Control<br>(GitHub/GitLab)")

    %% Relationships
    qa -- "Define Scenarios, Audit Reports" --> eval_sys
    dev -- "Monitor Traces, Debug Failures" --> eval_sys
    biz -- "View High-level Metrics" --> eval_sys

    eval_sys -- "Simulated User Traffic" --> target_bot
    eval_sys -- "LLM-as-a-Judge Requests" --> llm_api
    eval_sys -- "Fetch Context (RAG Eval)" --> llm_kb
    eval_sys -- "Alerts & Reports" --> notif
    git -- "CI/CD Trigger Test" --> eval_sys

    %% Styling
    classDef person fill:#08427b,stroke:#052e56,color:#fff
    classDef system fill:#1168bd,stroke:#0b4884,color:#fff
    classDef ext fill:#666,stroke:#333,color:#fff
    
    class qa,dev,biz person
    class eval_sys system
    class target_bot,llm_kb,llm_api,notif,git ext
```

---

## 3. CONTAINER ARCHITECTURE (C4 Level 2)

Chi tiết các services và container chính trong hệ thống, mapping với hạ tầng AWS/EKS.

```mermaid
graph TD
    user(("User (Browser)"))

    subgraph "AWS Cloud Region"
        subgraph "Public Zone"
            lb("Application Load Balancer (ALB)")
            cdn("CloudFront CDN")
        end

        subgraph "EKS Cluster (Private Zone)"
            subgraph "Frontend Layer"
                web_ui("AI Studio UI<br>[Next.js]")
            end

            subgraph "API Layer"
                api_gw("API Gateway Service<br>[Golang/Hasura]")
            end

            subgraph "Core Logic Layer"
                orch("Orchestrator Service<br>[Python/LangGraph]")
                sched("Job Scheduler<br>[Celery/Temporal]")
            end

            subgraph "Worker Layer (Auto-scaling)"
                sim_worker("Simulation Worker<br>[AutoGen]")
                eval_worker("Evaluation Worker<br>[DeepEval]")
            end
        end

        subgraph "Data Layer"
            rds[("Primary DB<br>PostgreSQL (RDS)")]
            ch[("Analytics DB<br>ClickHouse")]
            redis[("Cache/Queue<br>ElastiCache Redis")]
            msk[("Event Bus<br>Amazon MSK/Kafka")]
            s3[("Object Store<br>S3 Bucket")]
        end
    end

    %% Flows
    user --> cdn
    cdn --> lb
    lb --> web_ui
    lb --> api_gw

    web_ui --> api_gw
    api_gw --> orch
    
    orch --> redis
    orch --> msk
    
    msk -.-> sim_worker
    msk -.-> eval_worker
    
    sim_worker --> ch
    eval_worker --> ch
    orch --> rds
    
    %% Styles
    classDef k8s fill:#326ce5,stroke:#fff,color:#fff
    classDef aws fill:#FF9900,stroke:#232f3e,color:#fff
    class web_ui,api_gw,orch,sched,sim_worker,eval_worker k8s
    class rds,ch,redis,msk,s3 aws
```

---

## 4. COMPONENT ARCHITECTURE (C4 Level 3)

Đi sâu vào cấu trúc nội bộ của `Orchestrator Service` - bộ não của hệ thống.

```mermaid
graph TD
    subgraph "Orchestrator Service (Pod)"
        api_handler("API Handler<br>[FastAPI]")
        
        subgraph "Graph Logic Layer"
            campaign_mgr("Campaign Manager")
            graph_builder("LangGraph Builder")
            node_exec("Node Executor")
            state_mgr("State Manager")
        end
        
        db_adapter("DB Adapter<br>[SQLAlchemy]")
        mq_adapter("Queue Producer")
        kb_manager("Knowledge Manager<br>[RAG Connector]")
    end
    
    db[("PostgreSQL")]
    mq[("Message Queue")]
    vdb[("Vector DB<br>(Qdrant/Pinecone)")]

    api_handler -- "Create Campaign" --> campaign_mgr
    campaign_mgr -- "Load Config" --> db_adapter
    campaign_mgr -- "Build Execution Graph" --> graph_builder
    
    graph_builder -- "Compiled Graph" --> node_exec
    
    node_exec -- "Get/Set State" --> state_mgr
    state_mgr -- "Persist Checkpoint" --> db_adapter
    
    node_exec -- "Dispatch Sim Task" --> mq_adapter
    node_exec -- "Dispatch Eval Task" --> mq_adapter
    node_exec -- "Retrieve Context" --> kb_manager
    
    db_adapter -- "SQL" --> db
    mq_adapter -- "Push" --> mq
    kb_manager -- "Similarity Search" --> vdb
    
    %% Style
    classDef component fill:#85bbf0,stroke:#5b8db8,color:#333
    class api_handler,campaign_mgr,graph_builder,node_exec,state_mgr,db_adapter,mq_adapter,kb_manager component
```

### Các Component chính
*   **Campaign Manager**: Quản lý vòng đời của một chiến dịch test.
*   **LangGraph Builder**: Dịch cấu hình JSON (từ UI) thành LangGraph Runnable objects, hỗ trợ cyclic graphs cho các kịch bản test self-correcting.
*   **Node Executor**: Thực thi logic của từng node (Start, Wait, End).
*   **State Manager**: Quản lý bộ nhớ ngắn hạn của Campaign, đảm bảo tính bền vững (durability) nếu server restart.

---

## 4.1. AUTOGEN INTEGRATION STRATEGY (Headless Simulation)

Hệ thống sử dụng **AutoGen** như một thư viện Python (Library) nhúng bên trong `Simulation Worker`, **KHÔNG** triển khai AutoGen Studio UI.

### 4.1.1. Kiến trúc Headless (Engine-only)
Chúng ta bỏ qua lớp UI của AutoGen (AutoGen Studio) và chỉ sử dụng lớp Core Engine:

*   **Role**: Tự động hóa hội thoại Multi-agent để giả lập người dùng.
*   **Deployment**: Chạy dưới dạng tiến trình Python trong Docker Container (`Simulation Worker`).
*   **Input**: JSON configuration từ `Orchestrator` (Profile User, Kịch bản test).
*   **Output**: Chat History (List of Messages) trả về cho `DeepEval` chấm điểm.

### 4.1.2. Tại sao không dùng AutoGen Studio UI?
| Feature | AutoGen Studio UI | Evaluation UI (Custom) |
| :--- | :--- | :--- |
| **Mục đích** | Prototyping & Demo Agent. | **Evaluation & Benchmarking**. |
| **Giao diện** | Chat đơn giản (ChatGPT style). | **Split-View Battle Arena**: So sánh User nghĩ gì (Thought) vs Bot nói gì. |
| **Integrations** | Khó tích hợp chấm điểm DeepEval. | Tích hợp sâu: Realtime Scoring, Latency tracking, CI/CD trigger. |
| **Customization** | Khó sửa theme/layout. | Hoàn toàn làm chủ (Shadcn/UI), đúng chuẩn Design. |

### 4.1.3. Code Snippet minh họa
Cách Worker gọi AutoGen ở mức code:

```python
# SimulationWorker.py
from autogen import UserProxyAgent, AssistantAgent

def run_simulation(persona_config, target_bot_url):
    # 1. Khởi tạo User Sim (Headless - Không cần người gõ phím)
    user_sim = UserProxyAgent(
        name="User_Simulator",
        human_input_mode="NEVER",
        system_message=persona_config['system_prompt'],
        code_execution_config=False
    )
    
    # 2. Khởi tạo Wrapper để gọi Bot cần test
    target_bot = AssistantAgent(
        name="Target_Bot",
        llm_config={"config_list": [{"model": "gpt-4", "base_url": target_bot_url}]}
    )
    
    # 3. Bắt đầu hội thoại
    chat_result = user_sim.initiate_chat(
        target_bot, 
        message="Chào bạn, tư vấn cho tôi xe VF3."
    )
    
    return chat_result.chat_history
```

---

## 5. CODE/CLASS DESIGN (C4 Level 4)

Mô hình hóa các Class chính trong module Evaluation (DeepEval Integration).

```mermaid
classDiagram
    class BaseEvaluator {
        +evaluate(test_case: TestCase) EvaluationResult
        +get_metric_name() str
    }

    class DeepEvalProbe {
        -model: str
        -threshold: float
        +evaluate_hallucination(input, context, output)
        +evaluate_toxicity(output)
    }

    class TestCase {
        +input: str
        +actual_output: str
        +retrieval_context: List[str]
        +expected_output: str
    }

    class EvaluationResult {
        +score: float
        +reason: str
        +passed: bool
        +cost: float
    }

    class MetricRegistry {
        +register(name, class)
        +get(name) BaseEvaluator
    }

    BaseEvaluator <|-- DeepEvalProbe
    DeepEvalProbe ..> TestCase : Uses
    DeepEvalProbe ..> EvaluationResult : Returns
    MetricRegistry o-- BaseEvaluator : Manages
```

---

## 6. DYNAMIC VIEWS & SCENARIOS

### 6.1. Sequence Diagram: Kịch bản kiểm thử chủ động (Active Testing / Red Teaming)

```mermaid
sequenceDiagram
    actor QA as QA User
    participant UI as AI Studio
    participant Orch as Orchestrator
    participant Sim as Simulation Engine
    participant Agent as Target Bot
    participant Eval as Eval Worker
    participant DB as Database

    QA->>UI: Click "Start Red Teaming"
    UI->>Orchestrator: POST /orchestrator/campaigns/start
    Orchestrator->>DB: Create Campaign (Status: PENDING)
    Orchestrator->>Orchestrator: Init Graph (LangGraph)
    
    loop For each Test Case
        Orchestrator->>Sim: Async Event: Run_Simulation_Turn
        activate Sim
        Sim->>Sim: Generate Attack Prompt (LLM)
        Sim->>Agent: Send Chat Message
        Agent-->>Sim: Reply
        Sim->>DB: Log Interaction
        Sim-->>Orchestrator: Sim Done (TraceID)
        deactivate Sim

        Orchestrator->>Eval: Async Event: Evaluate_Trace
        activate Eval
        Eval->>DB: Fetch Chat Logs
        Eval->>Eval: Run ToolCallingMetric & ToxicityMetric
        Eval-->>Orchestrator: Evaluation Result (Score: 0.8)
        deactivate Eval
        
        Orchestrator->>Orchestrator: Check Threshold
        opt Score < 0.5
           Orchestrator->>Sim: Retry with easier prompt
        end
    end

    Orchestrator->>DB: Update Campaign (Status: COMPLETED)
    Orchestrator-->>UI: WebSocket Notification
    QA->>UI: View Report
```

### 6.2. System Overview Data Flow
```mermaid
graph LR
    input_docs[Input Documents] -->|Upload| gen_engine[Data Generator]
    gen_engine -->|LLM Synthesis| dataset[(Golden Dataset)]
    
    dataset -->|Feed| simulator[Simulation Engine]
    configs[Test Configs] -->|Load| simulator
    
    simulator <-->|Chat Loop| target_bot[Target Bot]
    
    simulator -->|Logs| raw_logs[(Raw Trace Logs)]
    raw_logs -->|Stream| evaluator[Evaluation Engine]
    
    evaluator -->|Scoring| metrics_db[(Metrics & Reports)]
    metrics_db -->|Vizualize| dashboard[Dashboard UI]
```

### 6.3. FUNCTIONAL FLOWS (Detailed Logic)

#### 6.3.1. Synthetic Data Generation Pipeline (FR-03)
Minh họa quy trình sinh dữ liệu test từ tài liệu gốc.

```mermaid
graph LR
    subgraph "Data Sources"
        docs[("Docs (PDF/Docx)")]
        gold[("Key Examples")]
    end
    
    subgraph "Generation Engine"
        syn[("DeepEval Synthesizer")]
        evolve("Evolutionary Logic<br>(Make it harder)")
    end
    
    out[("Golden Dataset<br>(JSONL)")]

    docs --> syn
    gold --> syn
    syn --> evolve
    evolve --> out
```

#### 6.3.2. Auto-Red Teaming Sequence (FR-04)
Quy trình giả lập tấn công bảo mật.

```mermaid
sequenceDiagram
    participant Attacker as Red Team Persona
    participant Target as Target Bot
    participant Safety as Safety Analyzer
    participant Report as Vuln Report

    Attacker->>Target: Attack Prompt (DAN/Injection)
    Target-->>Attacker: Response
    
    Attacker->>Safety: Send Trace
    Safety->>Safety: Scan PII & Toxicity
    
    alt Vulnerability Found
        Safety->>Report: Log Critical Issue
        Safety-->>Attacker: Feedback (Success)
        Attacker->>Attacker: Mutate Attack Vector
    else Safe Response
        Safety-->>Attacker: Feedback (Fail)
    end
```

#### 6.3.3. Human-in-the-loop Grading Process (FR-05)
Quy trình xử lý các trường hợp AI chấm điểm không chắc chắn.

```mermaid
graph TD
    s_start((Start Eval)) --> ai_judge[("AI Judge")]
    ai_judge --> check{Confidence Score?}
    
    check -->|High > 0.8| s_pass[("Save Score")]
    check -->|Low < 0.5| s_queue[("Annotation Queue")]
    
    s_queue --> human("Human Tester")
    human -->|Override/Confirm| s_pass
    human -->|Feedback| ai_judge
```

#### 6.3.4. Prompt Optimization Loop (FR-07)
Vòng lặp tối ưu hóa Prompt tự động.

```mermaid
stateDiagram-v2
    state "Current Prompt" as P1
    state "Run Eval Campaign" as Eval
    state "Analyze Weakness" as Analyze
    state "Mutate Prompt (Genetic Algo)" as Mutate
    state check_score <<choice>>
    
    [*] --> P1
    P1 --> Eval
    Eval --> check_score
    
    check_score --> Analyze : Score < 95%
    Analyze --> Mutate
    Mutate --> P1 : New Candidate
    
    check_score --> [*] : Score >= 95% (Deploy)
```

---

## 7. AMAZON AWS INFRASTRUCTURE ARCHITECTURE

Phần này mô tả chi tiết thiết kế hạ tầng vật lý trên AWS.

### 7.1. Network Topology (VPC Design)

Hệ thống được triển khai trong một **Virtual Private Cloud (VPC)** riêng biệt, trải dài trên **3 Availability Zones (AZs)**.

*   **VPC CIDR**: `10.0.0.0/16`
*   **Subnet Strategy**:
    1.  **Public Subnets**: ALB, NAT Gateways.
    2.  **Private App Subnets**: EKS Node Groups (Microservices).
    3.  **Private Data Subnets**: RDS, ElastiCache, MSK, ClickHouse.

### 7.2. Infrastructure Diagram (Physical)

```mermaid
graph TB
    subgraph "AWS Cloud (Region: ap-southeast-1)"
        vpc("VPC (10.0.0.0/16)")
        
        subgraph "Availability Zone A"
            pub_a("Public Subnet A")
            app_a("Private App Subnet A")
            data_a("Private Data Subnet A")
        end
        
        subgraph "Availability Zone B"
            pub_b("Public Subnet B")
            app_b("Private App Subnet B")
            data_b("Private Data Subnet B")
        end
        
        %% Load Balancer
        alb("ALB (Internet Facing)")
        alb --- pub_a
        alb --- pub_b
        
        %% Compute (EKS)
        eks("EKS Cluster Control Plane")
        ng_app("Node Group: App Services")
        ng_worker("Node Group: GPU/High-CPU Workers")
        
        app_a --- ng_app
        app_b --- ng_worker
        
        %% Data
        rds_master("RDS PostgreSQL (Primary)")
        rds_standby("RDS PostgreSQL (Standby)")
        
        data_a --- rds_master
        data_b --- rds_standby
        
        %% External Connectivity
        nat("NAT Gateway")
        pub_a --- nat
        nat --> igw("Internet Gateway")
    end
```

### 7.3. Compute & Data Layer
*   **Amazon EKS**: Quản lý containers.
    *   *System Node Group*: Chạy CoreDNS, VPC CNI, Prometheus.
    *   *App Node Group*: Chạy Microservices.
    *   *Spot Node Group*: Chạy Eval Workers (Cost Optimization).
*   **Persistence**:
    *   **PostgreSQL (RDS)**: Metadata.
    *   **ClickHouse**: Big Data Analytics (Traces).
    *   **S3**: Object Storage.

---

## 8. SECURITY & OPERATIONS

### 8.1. Security Architecture
*   **NetSec**: AWS WAF chặn tấn công lớp 7. Security Groups giới hạn traffic giữa các tầng.
*   **IAM**: Sử dụng IRSA (IAM Roles for Service Accounts) để cấp quyền truy cập S3/RDS cho Pods, không dùng Access Key.
*   **Encryption**: KMS cho encryption at-rest (EBS, RDS, S3).
*   **Audit Logging**: Ghi lại toàn bộ hành động tạo/sửa/xóa tài nguyên.

### 8.3. Authorization Model (RBAC)
Hệ thống áp dụng mô hình phân quyền dựa trên vai trò (Role-Based Access Control) chặt chẽ:

| Role | Quyền Hạn Chính (Key Permissions) | Đối Tượng Sử Dụng |
| :--- | :--- | :--- |
| **ADMIN** | **Full Access**: Quản lý thành viên, Billing, Cấu hình hệ thống, Xóa dự án. | Project Owner, Tech Lead |
| **EDITOR** | **Modify**: Tạo/Sửa Agent, Chạy Eval Campaign, Cấu hình Metrics. Không được quản lý User/Billing. | AI Engineers, Developers |
| **STAKEHOLDER** | **Analyze**: Xem Dashboard, Reports, Logs chi tiết. Có quyền kích hoạt Test Scenario nhưng quyền hạn chế. | QC Lead, Product Manager |
| **VIEWER** | **Read-Only**: Chỉ xem Dashboard tổng quan và Report đã xuất bản. Không xem được Log chi tiết (Traces). | Business Analysts, Guest |

*Chi tiết Ma trận phân quyền (Permission Matrix) được hiển thị trực tiếp trong giao diện Team Settings.*

### 8.2. Autoscaling & DR
*   **HPA**: Autoscaling dựa trên Custom Metrics (Queue Depth).
*   **Disaster Recovery**: Backup RDS và S3 định kỳ. Quy trình RTO < 4 giờ dùng IaC (Terraform).

---

## 9. CẤU HÌNH MÔI TRƯỜNG (Environments)

| Environment | VPC | Branch | Scale Strategy |
| :--- | :--- | :--- | :--- |
| **Development** | VPC-Dev | `develop` | Single AZ, Spot Instances (Cheap) |
| **Staging** | VPC-Staging | `release/*` | Multi-AZ, same architectural parity as Prod |
| **Production** | VPC-Prod | `main` | Multi-AZ (3 Zones), Reserved Instances |

---
*End of Document*
