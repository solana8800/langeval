# Exact Match (Khớp Chính xác)

Metric `ExactMatchMetric` là một metric đơn giản kiểm tra xem `actual_output` có khớp chính xác với `expected_output` hay không. Đây là metric cơ bản nhất và hữu ích cho các trường hợp kiểm thử tất định.

## Mã nguồn Ví dụ

```python
from deepeval.metrics import ExactMatchMetric
from deepeval.test_case import LLMTestCase

exact_match_metric = ExactMatchMetric()
test_case = LLMTestCase(
    input="What is 2 + 2?",
    actual_output="4",
    expected_output="4"
)

exact_match_metric.measure(test_case)
print(exact_match_metric.score)
print(exact_match_metric.reason)
```

Metric này trả về 1 nếu khớp chính xác và 0 nếu không khớp.

## Cách chạy

```python
print(exact_match_metric.score)
```
