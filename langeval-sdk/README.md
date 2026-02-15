# AI Agent Evaluation SDK

SDK chính thức của nền tảng **Enterprise AI Agent Evaluation Platform**. 
Thư viện này giúp đơn giản hóa việc tích hợp tính năng **Observability (Quan sát)** và **Evaluation (Đánh giá)** vào các ứng dụng AI Agent (Chatbot, RAG, Assistant).

## 🌟 Tính năng chính

1.  **Tự động gắn ngữ cảnh (Automatic Context Injection)**: 
    *   SDK tự động chiết xuất `X-Eval-Campaign-ID` từ Header của request.
    *   Liên kết mọi Trace (nhật ký hoạt động) với Campaign Test tương ứng trên dashboard.
2.  **Bảo mật dữ liệu (PII Masking)**:
    *   Tự động phát hiện và che giấu thông tin nhạy cảm như Email (`<EMAIL>`) và Số điện thoại Việt Nam (`<PHONE>`) trong Input/Output trước khi gửi lên server.
3.  **Tích hợp đơn giản (@monitor)**:
    *   Decorator `@monitor` giúp ghi lại nhật ký thực thi hàm chỉ với 1 dòng code.
4.  **Hỗ trợ đa nền tảng**:
    *   Tích hợp sẵn Middleware cho **FastAPI** và Hooks cho **Flask**.
    *   Hỗ trợ Callback cho **LangChain**.

---

## 📦 Cài đặt

Yêu cầu: Python 3.9 trở lên.

```bash
# Cài đặt gói cơ bản
pip install langeval-sdk

# Cài đặt với các dependencies phụ trợ (tuỳ chọn)
pip install "langeval-sdk[fastapi]"   # Nếu dùng FastAPI
pip install "langeval-sdk[flask]"     # Nếu dùng Flask
pip install "langeval-sdk[langchain]" # Nếu dùng LangChain
```

---

## ⚙️ Cấu hình

Bạn cần thiết lập các biến môi trường sau trong file `.env` hoặc hệ thống deployment của bạn:

```bash
# Thông tin kết nối tới Langfuse Server (Observability Backend)
LANGFUSE_PUBLIC_KEY="pk-lf-..."
LANGFUSE_SECRET_KEY="sk-lf-..."
LANGFUSE_HOST="https://eval.your-company.com" # URL của server Langfuse doanh nghiệp
```

---

## 📖 Hướng dẫn sử dụng

### 1. Sử dụng cơ bản (Function Tracing)

Sử dụng decorator `@monitor` cho bất kỳ hàm nào bạn muốn theo dõi.

```python
from ai_eval_sdk import monitor

@monitor
def xu_ly_tin_nhan(nguoi_dung: str, tin_nhan: str):
    # Logic xử lý AI...
    return f"Xin chào {nguoi_dung}, tôi đã nhận được: {tin_nhan}"

# Khi hàm này chạy, Trace sẽ tự động được gửi lên server
xu_ly_tin_nhan("Tuan", "Email tôi là tuan@example.com")
# SDK sẽ tự động mask email thành <EMAIL> trên dashboard
```

### 2. Tích hợp với FastAPI

Tự động bắt `X-Eval-Campaign-ID` từ header `X-Eval-Campaign-ID` của Orchestrator.

```python
from fastapi import FastAPI
from ai_eval_sdk.integrations.fastapi import EvalContextMiddleware

app = FastAPI()

# 1. Thêm Middleware vào ứng dụng
app.add_middleware(EvalContextMiddleware)

@app.post("/chat")
async def chat_endpoint(message: str):
    # Context (Campaign ID) sẽ tự động được truyền xuống các hàm được @monitor bên trong
    return {"reply": "Hello World"}
```

### 3. Tích hợp với Flask

```python
from flask import Flask, request
from ai_eval_sdk.integrations.flask import register_eval_context

app = Flask(__name__)

# 1. Đăng ký Hook
register_eval_context(app)

@app.route("/chat", methods=["POST"])
def chat():
    # Context đã được thiết lập tự động
    return "Hello Flask"
```

### 4. Tích hợp với LangChain

Nếu bạn sử dụng LangChain, hãy dùng `get_eval_callback` để inject vào Chain.

```python
from langchain_openai import ChatOpenAI
from ai_eval_sdk.integrations.langchain import get_eval_callback

llm = ChatOpenAI()

# 1. Lấy Callback Handler đã được cấu hình
handler = get_eval_callback()

# 2. Truyền vào config khi gọi Chain/LLM
response = llm.invoke(
    "Viết một bài thơ ngắn", 
    config={"callbacks": [handler]}
)
```

---

## 🛡️ Cơ chế bảo mật (PII Masking)

SDK được tích hợp sẵn Module Security (`ai_eval_sdk.core.security`). Mọi dữ liệu đi qua `@monitor` sẽ được quét regex:

*   **Email**: `[\w\.-]+@[\w\.-]+` -> Thay thế bằng `<EMAIL>`
*   **SĐT Việt Nam**: `(84|0[3|5|7|8|9])([0-9]{8})\b` -> Thay thế bằng `<PHONE>`

Điều này đảm bảo tuân thủ quy định bảo mật dữ liệu khách hàng.

---

## 🚦 Trạng thái phát triển (Status)
> **Trạng thái: 🟢 MVP Ready (Sẵn sàng cho tích hợp cơ bản)**

### Đã hoàn thiện
*   [x] **Wrappers Core**: Đóng gói Langfuse SDK để ẩn độ phức tạp.
*   [x] **Context Injection**: Logic middleware cho FastAPI, Flask hoạt động tốt với Orchestrator.
*   [x] **PII Masking (Core)**: Regex engine cơ bản để lọc Email/SĐT.
*   [x] **LangChain Support**: Callback Handler tự động inject Campaign Identity.

### Phân tích thiếu hụt (Gap Analysis)
Các tính năng nâng cao cần phát triển thêm:

1.  **Advanced PII Detection**:
    *   Hiện tại chỉ dùng Regex đơn giản. Cần bổ sung NLP model (hoặc thư viện `presidio-analyzer` nhẹ) để phát hiện tên người, địa chỉ, CCCD chính xác hơn mà không cần Regex cứng.
2.  **Sampling Strategies**:
    *   Chưa hỗ trợ lấy mẫu Trace (VD: Chỉ ghi log 10% traffic production) để tiết kiệm chi phí/storage.
3.  **Resilience Configuration**:
    *   Chưa expose cấu hình Offline Caching path của Langfuse (phòng khi mất mạng, log không bị mất).
4.  **Auto-instrumentation**:
    *   Cần wrapper cho OpenAI SDK (`openai.ChatCompletion.create`) để tự động trace mà không cần decorator `@monitor` thủ công.
