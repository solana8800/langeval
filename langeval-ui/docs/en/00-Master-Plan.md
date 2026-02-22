# 00. MASTER PLAN & DOCUMENTATION MAP
**Project**: Enterprise AI Agent Evaluation Platform
**Version**: 2.0 (Executive Summary)

---

## 1. EXECUTIVE SUMMARY
The project aims to build an **Active Agent Evaluation Platform** for enterprises. Moving beyond passive monitoring, the system simulates users (User Simulation) to "attack" and comprehensively test Agents before deployment.

The system is designed with high-level security standards, integrating **Entra External ID** for robust identity management and access control.

### Key Capabilities
*   **Active Testing**: Automatically generates scenarios and runs conversational tests (Red-Teaming).
*   **Enterprise Security**: Integrated with Entra External ID, featuring an RBAC Matrix for various roles (Admin, AI Engineer, QA, Stakeholder).
*   **Agentic Metrics**: Measures tool-use proficiency and process compliance of Agents.
*   **Enterprise Integration**: Deeply integrates into CI/CD pipelines as a Quality Gate.

---

## 2. STRATEGIC ROADMAP (3 PHASES)

### Phase 1: The Core Engine (Q1/2026)
Focus on building core processing capabilities, prioritizing functionality over UI aesthetics.
*   **Goal**: Run a complete test campaign via CLI.
*   **Deliverables**:
    *   `Orchestrator Service` (LangGraph backbone).
    *   `Scoring Worker` integrated with DeepEval.
    *   `Ingestion API` (Postgres + ClickHouse).
    *   `Metrics`: Tool Correctness, Relevancy.

### Phase 2: The Studio Experience (Q2/2026)
Focus on user experience and No-Code workflows.
*   **Goal**: Enable QA/Testers to create test cases without developers.
*   **Deliverables**:
    *   `AI Studio` (Web App with Visual Scenario Builder).
    *   `Active Red-Teaming` (Automated Attack).
    *   `Human-in-the-loop` Interface (Review Queue).

### Phase 3: Scale & Ecosystem (Q3/2026+)
Scale up and deepen integration.
*   **Goal**: Integrate into the entire enterprise operations workflow.
*   **Deliverables**:
    *   `Battle Mode` (Arena UI for A/B Testing).
    *   `CI/CD Integration` (GitHub Actions).
    *   `Self-Optimization` (GEPA algorithm for Prompt self-correction).

---

## 3. ARCHITECTURE COMPONENT RECAP
Summary of software components to be built (Mapped 1-1 with System Architecture).

| Component | Tech Stack | Responsibility | Design Doc |
| :--- | :--- | :--- | :--- |
| **AI Studio (Web)** | Next.js 14, ReactFlow, Shadcn/UI | Control interface, Visual Builder, Dashboard. | `09-AI-Studio-Design.md` |
| **Orchestrator** | Python, LangGraph, FastAPI | "Brain" for workflow orchestration and state management. | `01-b-Process-Flows.md` |
| **Simulation Engine** | Python, AutoGen, Docker | Sandbox environment for running simulated agents. | `02-Core-Framework-Analysis.md` |
| **Scoring Worker** | Python, DeepEval | Worker for calculating metrics (Stateless). | `10-Agentic-Metrics-Catalog.md` |
| **Data Layer** | Postgres, ClickHouse, Qdrant | Storage for Metadata (PG), Logs (CH), Context (Qdrant). | `03-Database-Design.md` |

---

## 4. DOCUMENTATION NAVIGATION MAP
Detailed documentation lookup guide for different audiences.

### For Product Managers / Stakeholders
*   **Project Overview**: `00-Business-Requirements.md` (BRD)
*   **Roadmap**: `00-Master-Plan.md` (This document)

### For Architects / Tech Leads
*   **Overall Architecture**: `01-System-Architecture.md`
*   **Process Flows**: `01-b-Process-Flows.md`
*   **Technology Selection**: `02-Core-Framework-Analysis.md`

### For Backend/Data Engineers
*   **Database Design**: `03-Database-Design.md`
*   **Integration Patterns**: `11-Integration-Patterns.md`

### For Frontend Engineers
*   **UX/UI Design**: `09-AI-Studio-Design.md`

### For AI Engineers / Data Scientists
*   **Evaluation Metrics**: `10-Agentic-Metrics-Catalog.md`

### For DevOps / Security Engineers
*   **Deployment**: `06-Deployment-DevOps.md`
*   **Auth & Security**: `12-Authorization-Matrix.md` (New)

---

## 5. NEXT IMMEDIATE ACTIONS
1.  **Repo Setup**: Initialize Monorepo with `apps/studio`, `services/orchestrator`, `packages/metrics` structure.
2.  **Infrastructure Initialization**: Set up docker-compose for basic stack (PG, CH, Redis).
3.  **Prototype v0.1**: Write a Python script to run a LangGraph flow calling AutoGen.
