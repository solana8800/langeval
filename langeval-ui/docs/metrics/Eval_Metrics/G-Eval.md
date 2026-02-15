# G-Eval

`GEval` là một framework đánh giá linh hoạt sử dụng LLM để đánh giá các đầu ra dựa trên bất kỳ tiêu chí tùy chỉnh nào bạn cung cấp. Đây là một trong những metric mạnh mẽ nhất trong DeepEval vì tính linh hoạt của nó.

`GEval` sử dụng LLM để tính toán điểm số.

## Mã nguồn Ví dụ

```python
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

g_eval = GEval(
    name="Coherence",
    criteria="The response should be coherent and logically structured.",
    evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT]
)

test_case = LLMTestCase(
    input="Tell me a story.",
    actual_output="Once upon a time..."
)

g_eval.measure(test_case)
print(g_eval.score)
print(g_eval.reason)
```

Bạn có thể định nghĩa bất kỳ `criteria` nào và chỉ định `evaluation_params` để cho biết phần nào của `LLMTestCase` cần được xem xét (ví dụ: `INPUT`, `ACTUAL_OUTPUT`, `EXPECTED_OUTPUT`, `CONTEXT`).

## Cách chạy

```python
print(g_eval.score)
print(g_eval.reason)
```
