# 00. MASTER PLAN & DOCUMENTATION MAP
**Project**: Enterprise AI Agent Evaluation Platform
**Version**: 2.0 (Executive Summary)

---

## 1. EXECUTIVE SUMMARY
Dự án nhằm xây dựng một **Nền tảng Đánh giá AI Chủ động (Active Agent Evaluation Platform)** dành cho doanh nghiệp (Enterprise-Grade). Không chỉ dừng lại ở việc chấm điểm thụ động (Passive Monitoring), hệ thống có khả năng giả lập người dùng (User Simulation) để "tấn công" và kiểm thử Agent một cách toàn diện trước khi ra mắt.

Đặc biệt, hệ thống được thiết kế với tiêu chuẩn bảo mật cao cấp, tích hợp **Entra External ID** để quản lý định danh và phân quyền chặt chẽ.

### Key Capabilities
*   **Active Testing**: Tự động sinh kịch bản và chạy thử nghiệm hội thoại (Red-Teaming).
*   **Enterprise Security**: Tích hợp Entra External ID, RBAC Matrix cho nhiều đối tượng (Admin, AI Engineer, QA, Stakeholder).
*   **Agentic Metrics**: Đo lường khả năng dùng Tool và tuân thủ quy trình của Agent.
*   **Enterprise Integration**: Tích hợp chặt chẽ vào CI/CD pipeline để tạo rào chắn chất lượng (Quality Gate).

---

## 2. STRATEGIC ROADMAP (3 PHASES)

### Phase 1: The Core Engine (Q1/2026)
Tập trung xây dựng năng lực xử lý cốt lõi, chưa cần UI đẹp.
*   **Goal**: Chạy được 1 test campaign hoàn chỉnh bằng CLI.
*   **Deliverables**:
    *   `Orchestrator Service` (LangGraph backbone).
    *   `Scoring Worker` tích hợp DeepEval.
    *   `Ingestion API` (Postgres + ClickHouse).
    *   `Metrics`: Tool Correctness, Relevancy.

### Phase 2: The Studio Experience (Q2/2026)
Tập trung vào trải nghiệm người dùng và quy trình No-Code.
*   **Goal**: QA/Tester có thể tự tạo bài test mà không cần Dev.
*   **Deliverables**:
    *   `AI Studio` (Web App with Visual Scenario Builder).
    *   `Active Red-Teaming` (Automated Attack).
    *   `Human-in-the-loop` Interface (Review Queue).

### Phase 3: Scale & Ecosystem (Q3/2026+)
Mở rộng quy mô và tích hợp sâu.
*   **Goal**: Tích hợp vào quy trình vận hành của toàn doanh nghiệp.
*   **Deliverables**:
    *   `Battle Mode` (Arena UI for A/B Testing).
    *   `CI/CD Integration` (Github Actions).
    *   `Self-Optimization` (GEPA algorithm để tự sửa Prompt).

---

## 3. ARCHITECTURE COMPONENT RECAP
Tổng hợp các thành phần phần mềm cần xây dựng (Map 1-1 với System Architecture).

| Component | Tech Stack | Responsibility | Design Doc |
| :--- | :--- | :--- | :--- |
| **AI Studio (Web)** | Next.js 14, ReactFlow, Shadcn/UI | Giao diện điều khiển, Visual Builder, Dashboard. | `09-AI-Studio-Design.md` |
| **Orchestrator** | Python, LangGraph, FastAPI | "Bộ não" điều phối quy trình test, quản lý State. | `01-b-Process-Flows.md` |
| **Simulation Engine** | Python, AutoGen, Docker | Môi trường Sandbox chạy các Agent giả lập. | `02-Core-Framework-Analysis.md` |
| **Scoring Worker** | Python, DeepEval | Worker tính toán metrics (Stateless). | `10-Agentic-Metrics-Catalog.md` |
| **Data Layer** | Postgres, ClickHouse, Qdrant | Lưu trữ Metadata (PG), Logs (CH), Context (Qdrant). | `03-Database-Design.md` |

---

## 4. DOCUMENTATION NAVIGATION MAP
Hướng dẫn tra cứu tài liệu chi tiết cho từng đối tượng độc giả.

### Cho Product Manager / Stakeholders
*   **Tổng quan dự án**: `00-Business-Requirements.md` (BRD)
*   **Lộ trình**: `00-Master-Plan.md` (File này)

### Cho Architect / Tech Lead
*   **Kiến trúc tổng thể**: `01-System-Architecture.md`
*   **Quy trình vận hành**: `01-b-Process-Flows.md`
*   **Lựa chọn công nghệ**: `02-Core-Framework-Analysis.md`

### Cho Backend/Data Engineer
*   **Thiết kế CSDL**: `03-Database-Design.md`
*   **Cách tích hợp**: `11-Integration-Patterns.md`

### Cho Frontend Engineer
*   **Thiết kế UX/UI**: `09-AI-Studio-Design.md`

### Cho AI Engineer / Data Scientist
*   **Các chỉ số đo lường**: `10-Agentic-Metrics-Catalog.md`

### Cho DevOps / Security Engineer
*   **Triển khai hệ thống**: `06-Deployment-DevOps.md`
*   **Phân quyền & Bảo mật**: `12-Authorization-Matrix.md` (New)

---

## 5. NEXT IMMEDIATE ACTIONS
1.  **Repo Setup**: Khởi tạo Monorepo với cấu trúc `apps/studio`, `services/orchestrator`, `packages/metrics`.
2.  **Infrastructure Initialization**: Dựng docker-compose cho stack cơ bản (PG, CH, Redis).
3.  **Prototype v0.1**: Viết script Python chạy thử 1 flow LangGraph gọi AutoGen.
