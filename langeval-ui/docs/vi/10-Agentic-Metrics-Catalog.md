# 10. AGENTIC METRICS CATALOG
**Project**: Enterprise AI Agent Evaluation Platform
**Version**: 2.0 (Based on DeepEval Framework)

---

## 1. METRICS HIERARCHY

Hệ thống phân chia metrics thành 4 nhóm chính để đánh giá toàn diện một AI Agent từ "Lời nói" đến "Hành động".

| Tier | Category | Focus | Examples |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Response Quality** | Chất lượng câu trả lời cuối cùng. | Answer Relevancy, Toxicity, Bias. |
| **Tier 2** | **RAG Pipeline** | Chất lượng dữ liệu tri thức được tìm kiếm. | Faithfulness, Contextual Precision/Recall. |
| **Tier 3** | **Agentic Execution** | Khả năng sử dụng công cụ và suy luận. | Tool Correctness, Task Completion. |
| **Tier 4** | **Conversational** | Khả năng duy trì hội thoại dài. | Role Adherence, Knowledge Retention. |

---

## 2. TIER 1: RESPONSE QUALITY METRICS
Đánh giá đầu ra (Output) mà người dùng cuối nhìn thấy.

### 2.1. Answer Relevancy
*   **Definition**: Đo lường mức độ liên quan của câu trả lời so với câu hỏi (Query). Không đánh giá đúng sai, chỉ đánh giá "có lạc đề không".
*   **Method**: LLM tạo ra các câu hỏi giả định từ câu trả lời của Bot, sau đó so sánh vector similarity với câu hỏi gốc.
*   **Threshold**: > 0.7

### 2.2. Toxicity
*   **Definition**: Phát hiện nội dung độc hại, thù ghét, quấy rối hoặc bạo lực.
*   **Method**: Sử dụng mô hình phân loại (BERT-based or LLM-based) để detect các từ khóa nhạy cảm.
*   **Threshold**: < 0.1 (Yêu cầu nghiêm ngặt).

### 2.3. Bias
*   **Definition**: Đo lường sự thiên vị về giới tính, chủng tộc, tôn giáo hoặc chính trị.
*   **Method**: LLM đánh giá xem câu trả lời có chứa định kiến (stereotype) nào không.
*   **Threshold**: < 0.1

---

## 3. TIER 2: RAG PIPELINE METRICS
Đánh giá hiệu quả của hệ thống Retrieval-Augmented Generation. Đây là "trái tim" của các Knowledge Bot.

### 3.1. Faithfulness (Trung Thực)
*   **Definition**: Đo lường xem câu trả lời của Bot có *hoàn toàn dựa trên* Context được cung cấp hay không. Loại bỏ ảo giác (Hallucination).
*   **Formula**: $\frac{\text{Number of Claims supported by Context}}{\text{Total Claims in Output}}$
*   **Evaluation Mode**: Segment câu trả lời thành các mệnh đề (Claims) và verify từng mệnh đề.

### 3.2. Contextual Precision (Độ Chính Xác Ngữ Cảnh)
*   **Definition**: Đánh giá xem các tài liệu (Chunks) liên quan nhất có nằm ở TOP đầu danh sách tìm kiếm không (Ranking Quality).
*   **Why**: LLM thường chỉ chú ý đến các kết quả đầu tiên (Lost in the middle phenomenon).

### 3.3. Contextual Recall (Độ Phủ Ngữ Cảnh)
*   **Definition**: Đánh giá xem hệ thống retrieval có tìm thấy *ĐỦ* thông tin để trả lời câu hỏi không.
*   **Formula**: So sánh giữa `Retrieval Context` và `Expected Output` (trong Golden Dataset).

---

## 4. TIER 3: AGENTIC EXECUTION METRICS
Nhóm metrics quan trọng nhất cho Autonomous Agents.

### 4.1. Tool Correctness
*   **Definition**: Đánh giá độ chính xác khi Agent gọi hàm (External Tools).
*   **Checklist**:
    1.  **Tool Selection**: Có chọn đúng tool không? (VD: Hỏi thời tiết phải gọi `get_weather`, không gọi `google_search`).
    2.  **Argument Extraction**: Có trích xuất đúng tham số từ user prompt không? (VD: "Thời tiết Hà Nội" -> `location="Hanoi"`).
*   **Method**: So sánh JSON Output của Agent với Expected Dictionary.

### 4.2. Task Completion (Goal Rate)
*   **Definition**: Đánh giá xem mục tiêu cuối cùng của User có đạt được không.
*   **Scenario**:
    *   *Input*: "Đặt vé máy bay đi Đà Nẵng ngày mai".
    *   *Success*: Agent trả về mã đặt chỗ (Booking ID).
    *   *Fail*: Agent hỏi vòng vo hoặc báo lỗi.
*   **Method**: LLM Judge đánh giá trạng thái kết thúc hội thoại (Conversation State).

### 4.3. Plan Adherence (Tuân Thủ Quy Trình)
*   **Definition**: Agent có tuân theo quy trình nghiệp vụ (SOP) đã định nghĩa không.
*   **Example**: CSKH bắt buộc phải: (1) Chào -> (2) Xác thực danh tính -> (3) Hỗ trợ. Nếu nhảy cóc (1) -> (3) là Fail.
*   **Method**: LangGraph State Check (Kiểm tra đường đi trong đồ thị).

---

## 5. TIER 4: CONVERSATIONAL METRICS (Multi-turn)
Dành cho Chatbot đàm thoại dài.

### 5.1. Knowledge Retention (Trí Nhớ)
*   **Definition**: Khả năng của Bot trong việc nhớ các thông tin User đã cung cấp ở các lượt (turn) trước đó.
*   **Test**:
    *   Turn 1: "Tên tôi là An."
    *   Turn 5: "Tôi tên gì?" -> Nếu Bot không nhớ là Fail.

### 5.2. Role Adherence (Nhập Vai)
*   **Definition**: Bot có giữ vững "nhân cách" (Persona) được cài đặt trong suốt hội thoại không.
*   **Example**: Bot được cài là "Cướp biển". Nó luôn phải nói kiểu "Ahoy matey!", không được quay về văn phong Make-money-fast machine learning.

---

## 6. CUSTOM METRICS (G-Eval)
Khi các metrics chuẩn không đủ, ta sử dụng G-Eval (GPT-4 evaluation with Chain-of-Thought).

### 6.1. Brand Tone Consistency
*   **Prompt**: "Bạn là giám sát chất lượng. Hãy đánh giá xem câu trả lời này có phù hợp với giọng điệu thương hiệu (Trẻ trung, Năng động, GenZ) không. Score 1-5."

### 6.2. Code Quality (For Coding Agents)
*   **Criteria**: Code chạy được không? Có comment không? Có tối ưu không?

---

## 7. IMPLEMENTATION GUIDE

Code ví dụ tích hợp DeepEval để đo `ToolCorrectness`:

```python
from deepeval import evaluate
from deepeval.metrics import ToolCorrectnessMetric
from deepeval.test_case import LLMTestCase, ToolCallParam

# 1. Định nghĩa Test Case
test_case = LLMTestCase(
    input="Book a flight to NYC tomorrow",
    actual_output="Calling book_flight(destination='NYC', date='2024-01-22')",
    tools_called=[
        ToolCallParam(name="book_flight", arguments={"destination": "NYC", "date": "2024-01-22"})
    ],
    expected_tools=[
        ToolCallParam(name="book_flight", arguments={"destination": "New York", "date": "2024-01-22"})
    ]
)

# 2. Khởi tạo Metric
metric = ToolCorrectnessMetric(threshold=0.8)

# 3. Đo lường
metric.measure(test_case)
print(f"Score: {metric.score}")
print(f"Reason: {metric.reason}")
```
