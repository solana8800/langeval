# BUSINESS REQUIREMENTS DOCUMENT (BRD)
**Project Name**: Enterprise AI Agent Evaluation Platform
**Version**: 1.1 (Comprehensive Master)
**Date**: 2026-01-21
**Status**: DRAFT FOR APPROVAL

---

## 0. DOCUMENT CONTROL

### 0.1. Revision History
| Version | Date | Description of Changes | Author |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-01-20 | Document initialization (First draft). | TuanTD |
| 1.1 | 2026-01-21 | Standardized structure updates: Scope, Stakeholders, NFR, Glossary. | TuanTD |

### 0.2. Sign-off
| Role | Name | Signature | Date |
| :--- | :--- | :--- | :--- |
| Project Sponsor | [TBD] | | |
| Product Owner | [TBD] | | |
| Technical Lead | [TBD] | | |

## 0.3. GLOSSARY & ACRONYMS
| Term/Acronym | Definition |
| :--- | :--- |
| **BRD** | Business Requirements Document. |
| **LLM** | Large Language Model (e.g., GPT-4, Claude 3). |
| **RAG** | Retrieval-Augmented Generation. |
| **Agent** | Autonomous AI system that uses tools to perform tasks. |
| **MCP** | Model Context Protocol - Connectivity standard between LLM and data/tools. |
| **SSO** | Single Sign-On (using Google OAuth). |
| **RBAC** | Role-Based Access Control. |
| **Workspace** | Shared working space for a Project or Team. |
| **NFR** | Non-Functional Requirements. |
| **PII** | Personally Identifiable Information. |
| **EaaS** | Evaluation-as-a-Service. |

---

## 1. EXECUTIVE SUMMARY

### 1.1. Problem Statement
*   **Current State**: Enterprises are deploying complex AI Agents (Stateful, Tool-using, RAG), yet QA processes remain manual or rely on rigid static datasets.
*   **Pain Points**:
    *   **Automation Gap**: Inability to automatically test multi-turn conversations where Agents can go off-track at any step.
    *   **Black Box Risk**: Lack of quantitative measurement of "Why" the AI responds in a certain way (missing Tracing/Reasoning).
    *   **Safety Risks**: High risks of Jailbreak, Prompt Injection, and PII Leakage when released to the public.
    *   **Metric Ambiguity**: Lack of standardized quantitative benchmarks (e.g., Hallucination Rate < 5%, Relevance > 0.9).

### 1.2. Strategic Goals
1.  **Active Evaluation**: Shift from Passive Monitoring (waiting for logs) to Active Testing (simulated user attacks).
2.  **Full Automation**: 100% automation of the workflow: Scenario Generation -> Test Execution -> Scoring -> Reporting.
3.  **Measurable Quality**: Standardize AI quality with concrete Metrics.
4.  **Dev-QC Collaboration**: Provide tools for both Developers (Unit Testing) and QC (No-Code Testing).

### 1.3. Project Scope

#### In-Scope
*   Building a centralized AI Evaluation Platform.
*   Integrating core engines: LangGraph (Orchestration), AutoGen (Simulation), DeepEval (Evaluation), Langfuse (Observability).
*   Developing AI Studio: A web app for QC to create test cases using a visual (no-code) builder.
*   Supporting various Bot types: Customer Service Bots, RAG Bots, Task-performing Agents.
*   Automated reporting (HTML, PDF) and realtime Dashboards.

#### Out-of-Scope (Current Phase)
*   Training foundation LLMs.
*   In-depth Video/Audio evaluation (beyond basic multimodal capabilities of GPT-4o).
*   Direct source code modification of target Bots (Black-box testing via API only).
*   Infrastructure management for deployment of target Bots (DevOps responsibility).

### 1.4. Stakeholders
| Role | Responsibility | Representatives |
| :--- | :--- | :--- |
| **Project Sponsor** | Funding, strategic approval. | CFO / CTO |
| **Product Owner** | Requirement definition, backlog prioritization, acceptance. | Head of Product |
| **Development Team** | Platform building, SDK integration. | AI Engineers, Backend/Frontend Devs |
| **QA/Tester** | Primary users, creating test cases, operating evaluation. | QC Leaders, Testers |
| **End Users (Target)** | Bot Developers utilizing the platform for self-testing. | AI Devs from project teams |

### 1.5. Assumptions & Constraints

#### Assumptions
*   **Infrastructure**: Enterprise users have infrastructure for Docker (Self-hosted) or accept Cloud usage.
*   **API Keys**: Users provide LLM API keys (OpenAI, Anthropic) for testing.
*   **Data**: Customers have business documents (PDF, Docx) for synthetic test data generation.

#### Constraints
*   **Quotas**: Features and usage limits depend on the subscription tier (Free, Pro, Enterprise).
*   **API Budget**: Users pay for their own LLM token costs via their API keys; system limits total requests based on the Plan.
*   **Technology**: Python (Backend) and React/Next.js (Frontend).
*   **Performance**: Long multi-turn tests may take from minutes to hours depending on complexity.

---

## 2. TECHNICAL RATIONALE
Why the "Quad-Core" technology stack?

### 2.1. Orchestration: LangGraph
*   **Role**: Orchestrating test execution flows.
*   **Why**: Supports **Cyclic Graphs**.
*   **Explanation**: In Agent testing, a "Self-Correction Loop" is vital. Traditional DAGs (like basic LangChain) cannot loop back. LangGraph allows flexible `Check -> Fail -> Retry` nodes.

### 2.2. Simulation: Microsoft AutoGen
*   **Role**: Simulating users and environments.
*   **Why**: **Conversable Agents** architecture and **Docker Sandbox**.
*   **Explanation**: AutoGen is optimized for multi-turn conversations required for chatbot testing and provides a secure Python sandbox for execution.

### 2.3. Evaluation: DeepEval
*   **Role**: Scoring (LLM-as-a-Judge).
*   **Why**: Supports **Agentic Metrics** and **Synthetic Data**.
*   **Explanation**: Offers specialized metrics like `ToolCallingMetric` and `ReasoningMetric`, and integrates with `PyTest` for a developer-friendly experience.

### 2.4. Observability: Langfuse (Primary)
Selected for **Data Sovereignty** and **Engineering Fit**.

| Feature | **Langfuse** (Selected) | **LangSmith** | **Arize Phoenix** |
| :--- | :--- | :--- | :--- |
| **Hosting** | Open Source / Self-Hosted | Cloud SaaS | Open Source / Self-Hosted |
| **Focus** | Engineering / Tracing | LangChain Ecosystem | Data Science / RAG |
| **Data Privacy** | ✅ High (Local Server) | ⚠️ Medium (Cloud Log) | ✅ High (Local) |

*   **Rationale**: Mandatory **Self-hosted** capability for Enterprise/Banking sectors to keep sensitive logs off third-party clouds.

### 2.5. Supported Evaluation Scenarios
1.  **Prompt Engineering**: A/B testing different system prompts.
2.  **RAG System**: Testing Knowledge Base quality using synthetic questions.
3.  **AI Workflow**: Evaluating fixed processing chains (Summarization -> Translation, etc.).
4.  **AI Agent**: Testing autonomous planning and tool-use via multi-turn simulation.
5.  **MCP Tool**: Unit testing integration modules/servers.
6.  **LLM Arena**: Blind side-by-side model comparison for ELO scoring.

---

## 3. DETAILED FUNCTIONAL SPECS

### FR-01: AI Studio - Visual Workflow Builder
*   **Drag & Drop Canvas**: Start, Persona, Task, and Logic nodes.
*   **Validation**: Real-time logic checking to prevent dead-ends or infinite loops.

### FR-02: Battle View (Real-time Monitoring)
*   **Split Screen UI**: Target Bot vs. User Simulator.
*   **Thought Reveal**: Displaying the "Chain-of-thought" or inner state of the Simulator.
*   **Streaming Metrics**: Real-time scoring updates per message.

### FR-03: Synthetic Data Generator
*   **Sources**: Documents, Contexts, Goldens (few-shot), and Scraping/Scratch (Topics).
*   **Engine**: DeepEval Synthesizer.
*   **Evolution**: Automatically evolves questions from easy to hard.

### FR-04: Auto-Red Teaming
*   **Attack Vectors**: Adversarial Attacks, Vulnerabilities (SQL/XSS), Jailbreak, Prompt Injection, and PII Extraction.

### FR-05: Human-in-the-loop Grading
*   **Annotator UI**: Manual override for subjective metrics.
*   **Feedback Queue**: Automated routing of low-confidence scores (< 0.5) to human reviewers.

### FR-06: Comparative Board (A/B View)
*   **Side-by-Side Canvas**: Comparing two versions on identical inputs.
*   **Diff Highlighter**: Highlighting textual differences in outputs.
*   **Win Rate**: Automated ELO tracking.

### FR-07: AI Prompt Optimizer
*   **GEPA**: Generative Evolutionary Prompt Adjustment.
*   **MIPROv2**: Multi-prompt Instruction Proposal for data-driven tuning.

### FR-08: Standard Benchmarks Runner
*   **Academic Benchmarks**: GSM8K, MMLU, ARC, HumanEval, TruthfulQA, etc.

### FR-09: Identity & Workspace Management
*   **Google SSO**: Auto-provisioning and Personal Workspace.
*   **Multi-tenancy**: Resource isolation per Workspace.
*   **Collaboration**: Team Workspaces with Email Invitation.
*   **RBAC**: Owner, Editor, Viewer roles.

### FR-10: Tiers & Billing Management
*   **Tiers**:
    *   **Free**: 1 personal workspace, 50 test runs/month.
    *   **Pro**: Paid monthly/annually, up to 3 workspaces, 10,000 runs, basic Red Teaming.
    *   **Enterprise**: Custom pricing, unlimited scale, advanced security, SLA 24/7.
*   **Payment**: Integrated via **PayPal**.
*   **Quota Enforcement**: Real-time usage tracking and rate limiting.

---

## 4. NON-FUNCTIONAL REQUIREMENTS (NFR)

### 4.1. Performance
*   **UI Response Time**: < 1s.
*   **Latency**: Single Turn < 15s; 100-case Campaign < 30 mins (parallel).
*   **Scalability**: Supports 50 concurrent users and 10 parallel campaigns.

### 4.2. Security
*   **Auth**: Google OAuth 2.0.
*   **Data Privacy**: "No-Log" mode and automated PII masking.
*   **Compliance**: GDPR readiness (Data deletion support).

### 4.3. Reliability
*   **Uptime**: 99.5% during business hours.
*   **Error Handling**: Exponential Backoff for LLM API failures.

---

## 5. METRIC CATALOG

### 5.1. Tier 1: Communication & Safety
*   Tone Consistency, Politeness, Toxicity, Bias Detection.

### 5.2. Tier 2: Knowledge & RAG
*   Faithfulness (Hallucination), Answer Relevancy, Context Recall.

### 5.3. Tier 3: Agentic Execution (Priority)
*   **Tool Calling Accuracy**: Parameter matching against JSON schemas.
*   **Goal Completion Rate (GCR)**: Success within N turns.
*   **Conversational DAG**: Checking specific workflow logic steps.

---

## 6. INTEGRATED WORKFLOWS

### 6.1. Passive Monitoring (SDK Trace)
*   Post-release logging and random sampling for evaluation.

### 6.2. Active Evaluation (Scenario-based)
*   Pre-release simulation using AutoGen User Simulators tailored by QC Personas.

### 6.3. Special Modes
*   **Battle Arena**: A vs. B direct competition.
*   **Red Teaming**: Targeted security probes.
*   **Human Review Loop**: Semi-automated scoring for edge cases.

---

## 7. PLATFORM OUTPUTS

### 7.1. Dashboard Views
*   **Executive Pulse**: Release Readiness (GO/NO-GO), Radar Charts.
*   **Developer Trace**: Waterfall views, Latency breakdown.
*   **Battle Arena**: Live multi-agent interaction monitoring.

### 7.2. Artifacts
*   **Campaign Reports (PDF/HTML)**.
*   **Compliance Audit Logs (JSON/CSV)**.
*   **Golden Dataset Export (JSONL)**.

---

## 8. ROADMAP
*   **Phase 1**: Core Orchestrator & Simulator.
*   **Phase 2**: DeepEval CI/CD integration.
*   **Phase 3**: AI Studio (No-Code Builder).
*   **Phase 4**: Enterprise Security & RBAC.
