# AI Evaluation Platform - Design Documentation (v2 - Advanced Agentic)

Tài liệu thiết kế hệ thống "Next-Gen AI Evaluation"

## 🚀 START HERE: Executive Summary
*   **[00-Master-Plan.md](./00-Master-Plan.md)**: **Bản tóm tắt**. Dành cho cấp quản lý đọc nhanh.
*   **[00-Business-Requirements.md](./00-Business-Requirements.md)**: Yêu cầu nghiệp vụ chi tiết.

## 1. Core Architecture (The "Brain")
*   **[01-System-Architecture.md](./01-System-Architecture.md)**
    *   **NEW**: LangGraph Orchestrator & AutoGen Simulation Engine.
    *   **REMOVED**: Kong Gateway.
*   **[01-b-Process-Flows.md](./01-b-Process-Flows.md)**
    *   **NEW**: Graph State Machine & Red-Teaming Flows.
*   **[02-Core-Framework-Analysis.md](./02-Core-Framework-Analysis.md)**
    *   Tích hợp bộ tứ: **LangGraph + AutoGen + DeepEval + Langfuse**.

## 2. AI Studio & Innovation (The "Creative")
*   **[09-AI-Studio-Design.md](./09-AI-Studio-Design.md)** (Updated)
    *   **NEW**: "Eval-Driven Development" Flywheel (Log-to-Test conversion).
    *   Thiết kế Dashboard AI-centric.
*   **[10-Agentic-Metrics-Catalog.md](./10-Agentic-Metrics-Catalog.md)** (Updated)
    *   Metrics chuyên sâu cho Agent: Tool Calling Accuracy, Business Process Compliance.
*   **[11-Integration-Patterns.md](./11-Integration-Patterns.md)** (New)
    *   Hướng dẫn 4 cách tích hợp Agent: Black-box, Proxy, SDK, Callbacks.

## 3. Data & Implementation Specs
*   **[03-Database-Design.md](./03-Database-Design.md)** (Updated)
    *   Schema cho Graph State.
*   **[04-API-Microservices-Spec.md](./04-API-Microservices-Spec.md)**
    *   API Backend Services (Internal/Public).
    *   **NEW**: Web Application API (Web BFF/Mock Specification).
*   **[05-SDK-Integration.md](./05-SDK-Integration.md)**

## 4. Operations & Security
*   **[06-Deployment-DevOps.md](./06-Deployment-DevOps.md)**
*   **[07-Security-Compliance.md](./07-Security-Compliance.md)**
*   **[08-Operations-Cost.md](./08-Operations-Cost.md)**
*   **[12-Authorization-Matrix.md](./12-Authorization-Matrix.md)** (New)
    *   Phân quyền người dùng theo Role (RBAC) với Entra External ID.

---
