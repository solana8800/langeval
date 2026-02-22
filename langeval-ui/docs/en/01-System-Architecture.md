# 01. SYSTEM ARCHITECTURE DESIGN
**Project**: Enterprise AI Agent Evaluation Platform
**Version**: 2.1 (Consolidated Master)
**Status**: APPROVED
**Last Updated**: 2026-01-22

---

## 1. INTRODUCTION

This document defines the overall Solution Architecture for the **Enterprise AI Agent Evaluation Platform**, an automated evaluation and testing system for next-generation AI Agents.

The architecture is designed following **Cloud-Native** principles, ensuring High Availability, Scalability, and Enterprise-grade Security, ready for deployment on **AWS Cloud** infrastructure.

### Design Principles
1.  **Microservices on Kubernetes**: All workloads (excluding the Data Layer) run on EKS to optimize resource management and auto-scaling.
2.  **Event-Driven & Graph-based**: Utilizes LangGraph for complex orchestration logic and Kafka/Redis for asynchronous processing.
3.  **Security-First**: Adopts a Zero Trust model, 2-way data encryption (At-rest & In-transit), and strict VPC Isolation.
4.  **Separation of Concerns**: Clear distinction between the Control Plane (Orchestrator), Compute Plane (Simulation/Eval Workers), and Data Plane.

---

## 2. SYSTEM CONTEXT (C4 Level 1)

Describes the interaction between the Platform and external systems.

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

Details the main services and containers in the system, mapped to AWS/EKS infrastructure.

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

In-depth look at the internal structure of the `Orchestrator Service` - the brain of the system.

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

### Key Components
*   **Campaign Manager**: Manages the lifecycle of a test campaign.
*   **LangGraph Builder**: Translates JSON configurations (from UI) into LangGraph Runnable objects, supporting cyclic graphs for self-correcting test scenarios.
*   **Node Executor**: Executes the logic of each node (Start, Wait, End).
*   **State Manager**: Manages short-term memory for campaigns, ensuring durability across server restarts.

---

## 4.1. AUTOGEN INTEGRATION STRATEGY (Headless Simulation)

The system uses **AutoGen** as an embedded Python library within the `Simulation Worker`, **NOT** deploying the AutoGen Studio UI.

### 4.1.1. Headless Architecture (Engine-only)
We bypass the AutoGen UI layer (AutoGen Studio) and utilize only the Core Engine:

*   **Role**: Automates multi-agent conversations to simulate users.
*   **Deployment**: Runs as a Python process within Docker containers (`Simulation Worker`).
*   **Input**: JSON configuration from the `Orchestrator` (User Profile, Test Scenarios).
*   **Output**: Chat History (List of Messages) returned for `DeepEval` scoring.

### 4.1.2. Why not use AutoGen Studio UI?
| Feature | AutoGen Studio UI | Evaluation UI (Custom) |
| :--- | :--- | :--- |
| **Purpose** | Prototyping & Demoing Agents. | **Evaluation & Benchmarking**. |
| **Interface** | Simple Chat (ChatGPT style). | **Split-View Battle Arena**: Compare thoughts vs. responses. |
| **Integrations** | Hard to integrate DeepEval scoring. | Deeply integrated: Realtime Scoring, Latency, CI/CD. |
| **Customization** | Limited theme/layout editing. | Fully controlled (Shadcn/UI). |

---

## 5. CODE/CLASS DESIGN (C4 Level 4)

Modeling the main classes in the Evaluation module (DeepEval Integration).

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

### 6.1. Sequence Diagram: Active Testing / Red Teaming

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

---

## 7. AMAZON AWS INFRASTRUCTURE ARCHITECTURE

This section details the physical infrastructure design on AWS.

### 7.1. Network Topology (VPC Design)

Deployed in a dedicated **Virtual Private Cloud (VPC)** across **3 Availability Zones (AZs)**.

*   **VPC CIDR**: `10.0.0.0/16`
*   **Subnet Strategy**:
    *   **Public Subnets**: ALB, NAT Gateways.
    *   **Private App Subnets**: EKS Node Groups (Microservices).
    *   **Private Data Subnets**: RDS, ElastiCache, MSK, ClickHouse.

### 7.3. Compute & Data Layer
*   **Amazon EKS**: Container management.
    *   *Spot Node Group*: Used for Eval Workers for cost optimization.
*   **Persistence**:
    *   **PostgreSQL (RDS)**: Metadata.
    *   **ClickHouse**: Big Data Analytics (Traces).
    *   **S3**: Object Storage.

---

## 8. SECURITY & OPERATIONS

### 8.3. Authorization Model (RBAC)
The system applies strict Role-Based Access Control:

| Role | Key Permissions | Target Users |
| :--- | :--- | :--- |
| **ADMIN** | **Full Access**: Member management, Billing, System Config, Project Deletion. | Project Owner, Tech Lead |
| **EDITOR** | **Modify**: Create/Edit Agents, Run Campaigns, Config Metrics. | AI Engineers, Developers |
| **STAKEHOLDER** | **Analyze**: View Dashboards, Reports, Detailed Logs. Limited Test activation. | QC Lead, Product Manager |
| **VIEWER** | **Read-Only**: High-level Dashboards and Published Reports only. | Business Analysts, Guests |

---
*End of Document*
