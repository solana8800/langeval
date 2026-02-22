# Hướng Dẫn Đóng Góp (Contributing Guide)

[English](CONTRIBUTING.md) | [Tiếng Việt](CONTRIBUTING.vi.md)


Chào mừng bạn đến với **LangEval**! Chúng tôi rất vui mừng vì bạn quan tâm đến việc đóng góp cho dự án. Tài liệu này sẽ hướng dẫn bạn quy trình tham gia phát triển, báo lỗi và gửi Pull Request.

Đặc biệt, dự án LangEval khuyến khích áp dụng phương pháp **"Vibe Coding"** (Lập trình dựa trên cảm hứng và sự hỗ trợ của AI) để tăng tốc độ phát triển mà vẫn đảm bảo chất lượng.

---

## 📋 Mục Lục

1.  [Quy Tắc Ứng Xử (Code of Conduct)](#quy-tắc-ứng-xử)
2.  [Bắt Đầu (Getting Started)](#bắt-đầu)
3.  [Quy Trình Phát Triển với AI (Vibe Coding)](#-quy-trình-phát-triển-với-ai-vibe-coding)
4.  [Quy Trình Gitflow](#quy-trình-gitflow)
5.  [Tiêu Chuẩn Coding (Coding Standards)](#tiêu-chuẩn-coding)
6.  [Gửi Pull Request](#gửi-pull-request)
7.  [Báo Lỗi & Tính Năng Mới](#báo-lỗi--tính-năng-mới)

---

## 🤝 Quy Tắc Ứng Xử

Chúng tôi cam kết xây dựng một môi trường cởi mở, thân thiện và an toàn. Vui lòng tôn trọng tất cả các thành viên trong cộng đồng, không phân biệt tuổi tác, giới tính, chủng tộc hay trình độ kỹ thuật.

---

## 🚀 Bắt Đầu

### Yêu Cầu Hệ Thống

*   **OS**: Linux, macOS, hoặc Windows (WSL2).
*   **Docker**: Phiên bản 24.0+.
*   **Python**: 3.10+.
*   **Node.js**: 18+ (LTS).
*   **Rust**: 1.70+ (cho Data Ingestion Service).

### Thiết Lập Môi Trường (Local Setup)

1.  **Fork** repository này về tài khoản GitHub của bạn.
2.  **Clone** dự án về máy:
    ```bash
    git clone https://github.com/<your-username>/langeval.git
    cd langeval
    ```
3.  **Cấu hình biến môi trường**:
    Sao chép tệp `.env.example` thành `.env` và cập nhật các cấu hình cần thiết (OpenAI, Google OAuth...).
    ```bash
    cp .env.example .env
    ```
    > [!TIP]
    > Để thiết lập Google OAuth, vui lòng xem [hướng dẫn chi tiết tại đây](langeval-core/identity-service/GOOGLE_SETUP.md).

4.  **Chọn chế độ phát triển**:

    #### Lựa chọn A: Chạy toàn bộ Stack bằng Docker (Dễ nhất để test)
    Chạy tất cả dịch vụ backend và hạ tầng:
    ```bash
    docker-compose up --build -d
    ```

    #### Lựa chọn B: Phát triển hỗn hợp (Khuyến nghị khi code)
    Nếu bạn muốn chỉnh sửa một service cụ thể (ví dụ: `orchestrator`), hãy chỉ chạy hạ tầng (DB/Quere) trong Docker và chạy service đó local để tiện debug.
    1. **Chạy hạ tầng**:
       ```bash
       docker-compose up -d postgres redis kafka clickhouse qdrant langfuse
       ```
    2. **Chạy Service local**:
       ```bash
       cd langeval-core/orchestrator
       python -m venv venv && source venv/bin/activate
       pip install -r requirements.txt
       python app/main.py
       ```

---

1.  **Fork** & **Clone** repository.
2.  **Cài đặt Dependencies** (xem README của từng service).
3.  **Chạy Infrastructure**: `docker-compose up -d ...`

---

## 🤖 Quy Trình Phát Triển với AI (Vibe Coding)

LangEval có kiến trúc phức tạp (Event-Driven, Microservices, LangGraph). Để đóng góp hiệu quả, bạn nên sử dụng AI (như GitHub Copilot, Cursor, Trae) nhưng cần tuân thủ quy trình **"Context-First"** sau đây:

### Nguyên Tắc Cốt Lõi: "Read Docs First, Prompt Later"

Đừng bao giờ yêu cầu AI viết code khi nó chưa hiểu kiến trúc dự án. Hãy cung cấp ngữ cảnh (Context) từ thư mục `langeval-ui/docs/` cho AI trước.

### Các Bước Thực Hiện:

1.  **Bước 1: Nạp Context (Context Injection)**
    *   Trước khi bắt đầu task, hãy yêu cầu AI đọc các file tài liệu liên quan.
    *   Ví dụ: Nếu bạn muốn sửa module `Orchestrator`, hãy nạp các file:
        *   `langeval-ui/docs/01-System-Architecture.md` (Tổng quan)
        *   `langeval-ui/docs/01-b-Process-Flows.md` (Luồng xử lý)
        *   `backend/orchestrator/README.md` (Chi tiết service)

2.  **Bước 2: Viết Prompt Rõ Ràng (Detailed Prompting)**
    *   Đừng nói: "Viết hàm login".
    *   Hãy nói: "Dựa vào `04-API-Microservices-Spec.md` và `12-Authorization-Matrix.md`, hãy implement API endpoint login trong `identity-service` sử dụng thư viện `NextAuth` đã cấu hình, đảm bảo check quyền RBAC."

3.  **Bước 3: Review Code & Refine**
    *   Code do AI sinh ra có thể chạy được nhưng chưa chắc đúng chuẩn (Architectural patterns).
    *   Kiểm tra xem AI có tuân thủ cấu trúc thư mục (Folder Structure) đã định nghĩa trong `README.md` không.
    *   Đảm bảo AI không hardcode các secret keys (phải dùng biến môi trường).

4.  **Bước 4: Generate Test**
    *   Yêu cầu AI viết Unit Test ngay sau khi viết code logic (TDD Style).
    *   Sử dụng prompt: "Viết Pytest cho function vừa rồi, cover các edge cases như..."

---

## 🔄 Quy Trình Phát Triển

Chúng tôi tuân thủ quy trình **Gitflow** đơn giản hóa:

1.  **Sync với nhánh `main`**: Luôn đảm bảo branch của bạn được cập nhật mới nhất.
    ```bash
    git checkout main
    git pull upstream main
    ```
2.  **Tạo Feature Branch**: Đặt tên branch theo format `type/feature-name`.
    *   `feat/add-toxicity-metric`
    *   `fix/kafka-consumer-lag`
    *   `docs/update-readme`
    ```bash
    git checkout -b feat/my-awesome-feature
    ```
3.  **Code & Test**: Viết code và đảm bảo chạy unit test thành công.
    ```bash
    # Chạy test (ví dụ)
    pytest tests/
    ```

---

## 📏 Tiêu Chuẩn Coding

### Python (Backend)

*   Tuân thủ **PEP 8**.
*   Sử dụng **Type Hints** cho tất cả function arguments và return types.
*   Sử dụng `ruff` hoặc `black` để format code.
*   Sắp xếp imports bằng `isort`.

Example:
```python
def calculate_score(input_text: str, metrics: List[str]) -> float:
    """Calculate evaluation score based on metrics."""
    pass
```

### TypeScript/React (Frontend)

*   Sử dụng **ESLint** và **Prettier** cấu hình sẵn trong dự án.
*   Ưu tiên **Functional Components** và **Hooks**.
*   Đặt tên component theo `PascalCase`, biến và hàm theo `camelCase`.

### Commit Messages

Chúng tôi sử dụng **Conventional Commits**:

*   `feat`: Tính năng mới (e.g., `feat: add new toxicity metric`)
*   `fix`: Sửa lỗi (e.g., `fix: resolve kafka connection timeout`)
*   `docs`: Tài liệu (e.g., `docs: update api spec`)
*   `chore`: Công việc bảo trì (e.g., `chore: update dependencies`)
*   `refactor`: Tái cấu trúc code (e.g., `refactor: simplify graph logic`)

---

## 📥 Gửi Pull Request

1.  Push branch của bạn lên GitHub:
    ```bash
    git push origin feat/my-awesome-feature
    ```
2.  Tạo Pull Request (PR) từ branch của bạn vào nhánh `main` của repo gốc.
3.  Điền đầy đủ thông tin vào PR Template:
    *   Mô tả thay đổi.
    *   Checklist các việc đã làm (Tests, Docs).
    *   Screenshots (nếu có thay đổi UI).
4.  Chờ Review: Maintainer sẽ review code của bạn. Hãy sẵn sàng thảo luận và chỉnh sửa nếu cần.

---

## 🐛 Báo Lỗi & Tính Năng Mới

Nếu bạn tìm thấy lỗi hoặc có ý tưởng mới, vui lòng tạo **Issue** trên GitHub:

*   **Bug Report**: Mô tả rõ các bước tái hiện, hành vi mong đợi và log lỗi.
*   **Feature Request**: Mô tả tính năng, lý do cần thiết và use case cụ thể.

Cảm ơn bạn đã đóng góp cho LangEval! ❤️
