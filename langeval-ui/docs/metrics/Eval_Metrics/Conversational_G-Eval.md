# Conversational G-Eval (G-Eval cho Hội thoại)

`ConversationalGEval` là một phần mở rộng của `GEval` được thiết kế đặc biệt để đánh giá các tương tác hội thoại. Nó cho phép bạn đánh giá chất lượng của một cuộc hội thoại dựa trên các tiêu chí tùy chỉnh.

## Mã nguồn Ví dụ

Bạn có thể sử dụng `ConversationalGEval` để đánh giá lịch sử trò chuyện hoặc các phản hồi trong ngữ cảnh hội thoại.

```python
from deepeval.metrics import ConversationalGEval
from deepeval.test_case import LLMTestCase

conversational_g_eval = ConversationalGEval(
    criteria="Politeness and helpfulness of the assistant."
)

test_case = LLMTestCase(
    input="Can you help me reset my password?",
    actual_output="Sure, please follow these steps..."
)

conversational_g_eval.measure(test_case)
print(conversational_g_eval.score)
print(conversational_g_eval.reason)
```

Các tham số tương tự như `GEval`, nhưng được tối ưu hóa cho dữ liệu hội thoại:

- `criteria`: tiêu chí đánh giá.
- [Optional] `model`: mô hình LLM sử dụng để đánh giá.
- [Optional] `threshold`: ngưỡng điểm.

## Cách chạy

Sử dụng `measure()` để tính toán điểm số dựa trên tiêu chí đã định nghĩa.

```python
print(conversational_g_eval.score)
print(conversational_g_eval.reason)
```
