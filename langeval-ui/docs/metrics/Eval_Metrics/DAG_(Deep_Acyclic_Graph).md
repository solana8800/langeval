# DAG (Deep Acyclic Graph)

Metric `DAGMetric` được thiết kế để đánh giá các quy trình phức tạp có thể được mô hình hóa dưới dạng Đồ thị Không Chu trình Định hướng (Directed Acyclic Graph). Điều này đặc biệt hữu ích cho các tác nhân AI (agents) thực hiện chuỗi các bước.

## Mã nguồn Ví dụ

Bạn cần định nghĩa cấu trúc DAG đại diện cho quy trình mong đợi.

```python
from deepeval.metrics import DAGMetric
from deepeval.test_case import LLMTestCase

# Define DAG structure
# dag = ...

dag_metric = DAGMetric(dag=dag)
test_case = LLMTestCase(
    input="Execute task A then B.",
    actual_output="Task A done. Task B done."
)

dag_metric.measure(test_case)
print(dag_metric.score)
print(dag_metric.reason)
```

## Cách chạy

Metric này sẽ kiểm tra xem việc thực thi thực tế có tuân thủ cấu trúc DAG đã định nghĩa hay không.

```python
print(dag_metric.score)
print(dag_metric.reason)
```
