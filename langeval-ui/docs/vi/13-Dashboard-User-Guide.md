# 13. Hướng dẫn Sử dụng Dashboard Chi Tiết

Tài liệu này cung cấp hướng dẫn toàn diện về cách sử dụng Dashboard của LangEval, từ việc cấu hình AI Agent, thiết lập Model, tạo Kịch bản (Scenarios) cho đến thực thi Đánh giá và xem Báo cáo.

---

## 📑 Mục Lục
1. [Cấu Hình Model](#1-cấu-hình-model)
2. [Cấu Hình AI Agent](#2-cấu-hình-ai-agent)
3. [Quản Lý Kịch Bản (Scenario)](#3-quản-lý-kịch-bản-scenario)
4. [Thực Thi Đánh Giá & Báo Cáo](#4-thực-thi-đánh-giá--báo-cáo)
5. [Cài Đặt Workspace](#5-cài-đặt-workspace)

---

## 1. Cấu Hình Model

Trước khi tạo AI Agent hoặc chạy đánh giá tự động (LLM-as-a-Judge), bạn cần cấu hình các Mô hình Ngôn ngữ (LLMs) nền tảng.

### 1.1 Thêm Nhà Cung Cấp (Provider)
1. Chọn menu **Settings > Models** từ thanh điều hướng bên trái.
2. Nhấn nút **Enable Provider** (Kích hoạt) hoặc **Add Connection** (Thêm Kết nối).
3. Chọn Provider từ danh sách (ví dụ: *OpenAI, Anthropic, Google Gemini, Azure, Local/Custom*).

### 1.2 Cấu Hình Thông Tin Xác Thực (Credentials)
1. **API Key**: Nhập API Key do nhà cung cấp cung cấp. Key này được mã hóa và lưu trữ an toàn qua Vault/KMS.
2. **Base URL**: (Tùy chọn) Nếu bạn dùng Proxy hoặc mô hình Local (như Ollama, vLLM), hãy điền URL tùy chỉnh tại đây.
3. **Lưu**: Nhấn **Save Connection**. Hệ thống sẽ gọi API kiểm tra trạng thái để đảm bảo cấu hình hợp lệ.

---

## 2. Cấu Hình AI Agent

Một "Agent" trong LangEval đại diện cho ứng dụng AI hoặc Target Bot mà bạn muốn kiểm thử. Agent có thể là một chatbot thông thường, một hệ thống RAG (Retrieval-Augmented Generation), hoặc một hệ thống Đa tác nhân (Multi-Agent). Việc thiết lập chính xác các tham số này là vô cùng quan trọng vì đây là gốc rễ để Bộ điều phối (Orchestrator) của LangEval giao tiếp với hệ thống của bạn.

### 2.1 Khởi tạo Hồ sơ Thông tin (Basic Profile)
1. Chuyển sang tab **Agents** trên thanh công cụ điều hướng.
2. Nhấn nút **Create Agent** (Tạo Agent).
3. **Name (Bắt buộc)**: Nhập tên gợi nhớ cho Agent (Ví dụ: `Bot CSKH v2`).
4. **Description**: (Tùy chọn) Mô tả ngắn mục đích, phạm vi và khả năng của Agent.
5. **Type (Phân loại)**: Định nghĩa thể loại Agent, phổ biến nhất là `RAG Chatbot`, `Rule-based Bot` hoặc `Generative Agent`.
6. **Version (Phiên bản)**: Rất hữu ích khi bạn phải đánh giá A/B testing (VD: `v1.0.0`, `v1.1.0-beta`).
7. **Status (Trạng thái)**: `active` (Hoạt động, sẵn sàng test), `maintenance` (Đang bảo trì/Tạm dừng), hoặc `deprecated` (Bỏ đi).
8. **Repository URL**: (Tùy chọn) Đường dẫn tới Git repo chứa mã nguồn của Agent để Team liên kết dễ dàng.

### 2.2 Kết nối & Endpoint (Endpoint & Connection Properties)
Đây là cách hệ thống LangEval gửi các câu hỏi thử nghiệm tới Agent của bạn.

1. **Endpoint URL (Bắt buộc)**: Đường dẫn HTTP/HTTPS tuyệt đối của API Agent (Ví dụ: `https://api.my-agent.com/v1/chat`).
   - Hệ thống sẽ validate chuẩn URL. URLs dùng IP nội bộ hoặc mock server được hỗ trợ tùy vào cấu hình hạ tầng mạng LangEval của bạn.
2. **API Key / Authentication**: Nếu API Agent của bạn cần khóa bảo mật, hãy nhập tại đây.
   - *Bảo mật*: API Key này lập tức được mã hóa trong cơ sở dữ liệu (`api_key_encrypted`) và chỉ được giải mã trên RAM lúc thực thi để truyền vào Header (Authorization/X-API-Key) của Request.
3. **Thêm Meta-data & Schema**: Bạn có thể truyền chuỗi JSON vào ô `meta_data` để hướng dẫn LangEval về định dạng Payload gửi đi hoặc định dạng nhận về.
   - Ví dụ `meta_data`: `{"payload_format": "openai_compatible", "provider": "OpenAI", "model": "gpt-4o"}`.

### 2.3 Cấu hình Khả năng Quan sát (Langfuse Integration)
Nếu Logic Agent của bạn phức tạp (ví dụ: dùng LangChain gọi Database/Tools nhiều bước) và bạn muốn LangEval hiển thị rõ từng bước "suy nghĩ" của Agent tại giao diện Trace View:

1. Bật công tắc **Langfuse Integration**.
2. Nhập các Credentials dự án Langfuse mà Agent đang dùng: `Project ID`, `Public Key`, `Secret Key`, và (tùy chọn) `Host URL` nếu cài On-Premise.
3. Khi Evaluation chạy, LangEval sẽ dùng Trace ID để tự động gắn kết câu trả lời output với toàn bộ cây thực thi (Execution Tree) bên trong. Bạn sẽ thấy rõ LLM suy luận ra sao trước khi trả lời.

---

## 3. Quản Lý Kịch Bản (Scenario)

Scenario (Kịch bản) là bộ kiểm thử của bạn. Nó chứa dữ liệu, kết quả mong đợi và các chỉ số (metrics) dùng để chấm điểm Agent.

### 3.1 Tạo Kịch Bản Mới
1. Chuyển sang menu **Scenarios** và nhấn **New Scenario**.
2. **Tên & Tags**: Nhập tên kịch bản (VD: `Kiểm thử QA Tài chính`) và thêm tags để dễ phân loại.

### 3.2 Định Nghĩa Thuộc Tính & Dữ Liệu
1. **Import Dữ liệu**: Box hỗ trợ tải lên tệp CSV, JSON.
   - Mỗi hàng/record đại diện cho một "Test Case" (Ca kiểm thử).
   - Các cột bắt buộc thường có: `input` (câu hỏi của user).
   - Cột tùy chọn: `expected_output` (cho so sánh chính xác hoặc Semantic), `context` (dành cho đánh giá RAG).
2. **Data Mapping**: Đảm bảo các cột trong file được ánh xạ (map) đúng với các biến cấu hình của LangEval.

### 3.3 Cấu Hình Chỉ Số Đánh Giá (Metrics)
1. Trong màn hình chi tiết Scenario, chọn tab **Metrics**.
2. Nhấn **Add Metric**.
3. Lựa chọn từ thư viện Metrics được hỗ trợ AI:
   - **Faithfulness (Độ trung thực)**: Kiểm tra câu trả lời có dựa trên context được cấp không (RAG).
   - **Answer Relevance (Độ bám sát)**: Kiểm tra câu trả lời có đúng trọng tâm câu hỏi không.
   - **Toxicity/Bias**: Đánh giá ngôn từ độc hại hoặc thiên vị.
   - **Custom Code**: Viết script Python/JS để map Regex hoặc kiểm tra JSON Schema.
4. **Scoring Thresholds (Ngưỡng đạt)**: Thay đổi điểm đạt (VD: > 0.8 / 1.0) cho từng tiêu chí.

---

## 4. Thực Thi Đánh Giá & Báo Cáo

### 4.1 Chạy Kịch Bản (Run Evaluation)
1. Tại giao diện Scenario, nhấn **Run Evaluation**.
2. Chọn **Target Agent** mà bạn đã khởi tạo ban đầu.
3. Nhấn **Start**. LangGraph Orchestrator sẽ phân bổ công việc (workload) cho các Worker để chạy đồng thời.

### 4.2 Xem Báo Cáo trên Dashboard
1. Chuyển sang tab **Reports** hoặc bấm vào ID của lần chạy vừa xong.
2. **Tổng quan (Overview)**: Xem tổng điểm trung bình, Tỉ lệ Pass/Fail, và biểu đồ Độ trễ phân vị (Latency).
3. **Trace View**: Xem chi tiết từng Test Case. Bạn có thể thấy rõ prompt nào được gửi đi, Agent trả lời gì, và lý luận chấm điểm (Rationale) của Judge-LLM.
4. **Export**: Xuất báo cáo ra định dạng file PDF/CSV phục vụ cho việc nộp hồ sơ Compliance.

---

## 5. Cài Đặt Workspace

- **Thành viên & Quyền (Members & Roles)**: Mời thành viên team và gắn quyền (Admin, Evaluator, Viewer).
- **API Keys**: Tạo API Key của LangEval để kích hoạt quy trình tự động từ các công cụ CI/CD Pipelines (Github Actions, Jenkins, Gitlab CI).
