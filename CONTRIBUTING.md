# Contributing Guide

[English](CONTRIBUTING.md) | [Tiếng Việt](CONTRIBUTING.vi.md)


Welcome to **LangEval**! We are excited that you are interested in contributing to the project. This document will guide you through the process of participating in development, reporting bugs, and submitting Pull Requests.

Specifically, the LangEval project encourages the **"Vibe Coding"** approach (inspiration-driven programming with AI assistance) to accelerate development while maintaining quality.

---

## 📋 Table of Contents

1.  [Code of Conduct](#code-of-conduct)
2.  [Getting Started](#getting-started)
3.  [AI-Assisted Development Process (Vibe Coding)](#-ai-assisted-development-process-vibe-coding)
4.  [Gitflow Process](#gitflow-process)
5.  [Coding Standards](#coding-standards)
6.  [Submitting a Pull Request](#submitting-a-pull-request)
7.  [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)

---

## 🤝 Code of Conduct

We are committed to building an open, friendly, and safe environment. Please respect all community members, regardless of age, gender, race, or technical proficiency.

---

## 🚀 Getting Started

### System Requirements

*   **OS**: Linux, macOS, or Windows (WSL2).
*   **Docker**: Version 24.0+.
*   **Python**: 3.10+.
*   **Node.js**: 18+ (LTS).
*   **Rust**: 1.70+ (for Data Ingestion Service).

### Local Setup

1.  **Fork** this repository to your GitHub account.
2.  **Clone** the project to your machine:
    ```bash
    git clone https://github.com/<your-username>/langeval.git
    cd langeval
    ```
3.  **Configure Environment**:
    Copy `.env.example` to `.env` and update required keys (OpenAI, Google OAuth, etc.).
    ```bash
    cp .env.example .env
    ```
    > [!TIP]
    > For Google OAuth setup, please follow the [detailed guide here](langeval-core/identity-service/GOOGLE_SETUP.md).

4.  **Choose your Development Mode**:

    #### Option A: Full Stack with Docker (Easiest for full testing)
    Run the entire backend stack (Infrastructure + Core Services):
    ```bash
    docker-compose up --build -d
    ```

    #### Option B: Hybrid Development (Recommended for coding)
    If you want to modify a specific service (e.g., `orchestrator`), run only the infrastructure in Docker and run your service locally.
    1. **Start Infrastructure**:
       ```bash
       docker-compose up -d postgres redis kafka clickhouse qdrant langfuse
       ```
    2. **Run Service Locally**:
       ```bash
       cd langeval-core/orchestrator
       python -m venv venv && source venv/bin/activate
       pip install -r requirements.txt
       python app/main.py
       ```

---

## 🤖 AI-Assisted Development Process (Vibe Coding)

LangEval has a complex architecture (Event-Driven, Microservices, LangGraph). To contribute effectively, you should use AI (such as GitHub Copilot, Cursor, Trae) but follow this **"Context-First"** process:

### Core Principle: "Read Docs First, Prompt Later"

Never ask an AI to write code before it understands the project architecture. Provide context from the `langeval-ui/docs/` directory to the AI first.

### Action Steps:

1.  **Step 1: Context Injection**
    *   Before starting a task, ask the AI to read the relevant documentation files.
    *   Example: If you want to modify the `Orchestrator` module, load these files:
        *   `langeval-ui/docs/01-System-Architecture.md` (Overview)
        *   `langeval-ui/docs/01-b-Process-Flows.md` (Process flows)
        *   `backend/orchestrator/README.md` (Service details)

2.  **Step 2: Clear and Detailed Prompting**
    *   Don't say: "Write a login function."
    *   Say: "Based on `04-API-Microservices-Spec.md` and `12-Authorization-Matrix.md`, implement the login API endpoint in `identity-service` using the configured `NextAuth` library, ensuring RBAC checks are included."

3.  **Step 3: Code Review & Refine**
    *   AI-generated code may run but might not meet standards (Architectural patterns).
    *   Check if the AI adheres to the folder structure defined in `README.md`.
    *   Ensure the AI does not hardcode secret keys (use environment variables).

4.  **Step 4: Generate Tests**
    *   Ask the AI to write Unit Tests immediately after writing logic code (TDD Style).
    *   Use the prompt: "Write a Pytest for the previous function, covering edge cases like..."

---

## 🔄 Development Process

We follow a simplified **Gitflow** process:

1.  **Sync with `main`**: Always ensure your branch is up to date.
    ```bash
    git checkout main
    git pull upstream main
    ```
2.  **Create a Feature Branch**: Name your branch using the format `type/feature-name`.
    *   `feat/add-toxicity-metric`
    *   `fix/kafka-consumer-lag`
    *   `docs/update-readme`
    ```bash
    git checkout -b feat/my-awesome-feature
    ```
3.  **Code & Test**: Write code and ensure unit tests pass.
    ```bash
    # Run tests (example)
    pytest tests/
    ```

---

## 📏 Coding Standards

### Python (Backend)

*   Adhere to **PEP 8**.
*   Use **Type Hints** for all function arguments and return types.
*   Use `ruff` or `black` for code formatting.
*   Sort imports using `isort`.

Example:
```python
def calculate_score(input_text: str, metrics: List[str]) -> float:
    """Calculate evaluation score based on metrics."""
    pass
```

### TypeScript/React (Frontend)

*   Use **ESLint** and **Prettier** as configured in the project.
*   Prioritize **Functional Components** and **Hooks**.
*   Name components using `PascalCase`, variables and functions using `camelCase`.

### Commit Messages

We use **Conventional Commits**:

*   `feat`: New feature (e.g., `feat: add new toxicity metric`)
*   `fix`: Bug fix (e.g., `fix: resolve kafka connection timeout`)
*   `docs`: Documentation changes (e.g., `docs: update api spec`)
*   `chore`: Maintenance tasks (e.g., `chore: update dependencies`)
*   `refactor`: Code refactoring (e.g., `refactor: simplify graph logic`)

---

## 📥 Submitting a Pull Request

1.  Push your branch to GitHub:
    ```bash
    git push origin feat/my-awesome-feature
    ```
2.  Create a Pull Request (PR) from your branch into the `main` branch of the original repo.
3.  Fill out the PR Template completely:
    *   Describe the changes.
    *   Work checklist (Tests, Docs).
    *   Screenshots (if there are UI changes).
4.  Wait for Review: Maintainers will review your code. Be ready to discuss and make adjustments if necessary.

---

## 🐛 Reporting Bugs & Requesting Features

If you find a bug or have a new idea, please create an **Issue** on GitHub:

*   **Bug Report**: Clearly describe reproduction steps, expected behavior, and error logs.
*   **Feature Request**: Describe the feature, why it is needed, and specific use cases.

Thank you for contributing to LangEval! ❤️
