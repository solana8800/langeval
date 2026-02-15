# Conversational DAG (Đồ thị Chu trình Định hướng cho Hội thoại)

`ConversationalDAG` là một metric cho phép bạn đánh giá các luồng hội thoại phức tạp bằng cách sử dụng cấu trúc đồ thị. Nó rất hữu ích khi bạn muốn đảm bảo chatbot của mình tuân theo một kịch bản hoặc quy trình cụ thể.

## Mã nguồn Ví dụ

Để sử dụng `ConversationalDAG`, bạn cần định nghĩa các node (nút) và edge (cạnh) của đồ thị hội thoại.

```python
from deepeval.metrics import ConversationalDAG
from deepeval.test_case import LLMTestCase

# Define your conversation graph here (conceptual example)
# graph = ... 

conversational_dag = ConversationalDAG(graph=graph)
test_case = LLMTestCase(
    input="Start the onboarding process.",
    actual_output="Welcome! Let's get you set up."
)

conversational_dag.measure(test_case)
print(conversational_dag.score)
print(conversational_dag.reason)
```

Có một số tham số quan trọng khi làm việc với `ConversationalDAG`:

- `graph`: đối tượng đồ thị định nghĩa luồng hội thoại mong đợi.
- [Optional] `threshold`: ngưỡng điểm tối thiểu để vượt qua.
- [Optional] `include_reason`: có bao gồm lý do cho điểm số tính toán hay không.

## Cách chạy

Sau khi chạy phương thức `measure()`, bạn có thể in ra `score` (điểm số) và `reason` (lý do) của metric.

```python
print(conversational_dag.score)
print(conversational_dag.reason)
```
