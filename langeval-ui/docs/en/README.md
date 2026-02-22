# AI Evaluation Platform - Design Documentation (v2 - Advanced Agentic)

This repository contains the design documentation for the "Next-Gen AI Evaluation" system.

## 🚀 START HERE: Executive Summary
*   **[00-Master-Plan.md](./00-Master-Plan.md)**: **The Executive Summary**. Recommended for a quick overview by management.
*   **[00-Business-Requirements.md](./00-Business-Requirements.md)**: Detailed business and functional requirements.

## 1. Core Architecture (The "Brain")
*   **[01-System-Architecture.md](./01-System-Architecture.md)**
    *   **NEW**: LangGraph Orchestrator & AutoGen Simulation Engine integration.
*   **[01-b-Process-Flows.md](./01-b-Process-Flows.md)**
    *   **NEW**: Graph State Machine & Red-Teaming workflows.
*   **[02-Core-Framework-Analysis.md](./02-Core-Framework-Analysis.md)**
    *   Integration of the "Quad-Core" stack: **LangGraph + AutoGen + DeepEval + Langfuse**.

## 2. AI Studio & Innovation (The "Creative")
*   **[09-AI-Studio-Design.md](./09-AI-Studio-Design.md)** (Updated)
    *   **NEW**: "Eval-Driven Development" Flywheel (Log-to-Test conversion).
    *   AI-centric Dashboard design.
*   **[10-Agentic-Metrics-Catalog.md](./10-Agentic-Metrics-Catalog.md)** (Updated)
    *   Advanced metrics for Agents: Tool Calling Accuracy, Business Process Compliance.
*   **[11-Integration-Patterns.md](./11-Integration-Patterns.md)** (New)
    *   Guide on 5 integration methods: Black-box, Proxy, Log SDK, Callbacks, and Hybrid.

## 3. Data & Implementation Specs
*   **[03-Database-Design.md](./03-Database-Design.md)** (Updated)
    *   Schemas for Graph State and polyglot persistence.
*   **[04-API-Microservices-Spec.md](./04-API-Microservices-Spec.md)**
    *   Internal and Public Backend API specifications.
    *   **NEW**: Web Application API (Web BFF/Mock Specification).
*   **[04-b-Google-OAuth-Setup.md](./04-b-Google-OAuth-Setup.md)** (New)
    *   Step-by-step guide to creating Google OAuth Credentials.
*   **[05-SDK-Integration.md](./05-SDK-Integration.md)**
    *   The "Thin Wrapper" strategy for agent monitoring.
*   **[05-Backend-Implementation-Plan.md](./05-Backend-Implementation-Plan.md)**
    *   Details on microservices, tech stack, and deployment status.

## 4. Operations & Security
*   **[06-Deployment-DevOps.md](./06-Deployment-DevOps.md)**
    *   IaC strategy and CI/CD pipelines.
*   **[06-b-Kafka-Configuration.md](./06-b-Kafka-Configuration.md)** (New)
    *   Centralized Kafka topic and consumer group settings.
*   **[07-Security-Compliance.md](./07-Security-Compliance.md)**
    *   Security layers, PII protection, and container scanning.
*   **[08-Operations-Cost.md](./08-Operations-Cost.md)**
    *   Cost model estimation and optimization strategies.
*   **[12-Authorization-Matrix.md](./12-Authorization-Matrix.md)** (New)
    *   Workspace-based RBAC with Google OAuth 2.0.

## 5. User Guides & Manuals
*   **[13-Dashboard-User-Guide.md](./13-Dashboard-User-Guide.md)** (New)
    *   Comprehensive guide on configuring Models, Agents, Scenarios, and Metrics.
