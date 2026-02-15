# Answer Relevancy (Mức độ Liên quan của Câu trả lời)

Metric `AnswerRelevancyMetric` đo lường xem `actual_output` của hệ thống RAG của bạn có liên quan đến `input` đã cho hay không. Đây là một metric dựa trên tham chiếu vì nó không yêu cầu `expected_output` (còn được gọi là ground truth - sự thật nền tảng).

Metric `AnswerRelevancyMetric` sử dụng LLM để tính toán điểm số.

## Cách thức hoạt động

Metric `AnswerRelevancyMetric` trước tiên sử dụng LLM để tạo ra $n$ câu hỏi giả định dựa trên `actual_output`, trong đó $n$ có thể được cấu hình thông qua tham số `n`.

Sau đó, nó tính toán độ tương đồng cosine trung bình giữa các embedding của $n$ câu hỏi giả định được tạo ra và embedding của `input` ban đầu. Thuật toán này dựa trên bài báo [RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217).

## Mã nguồn Ví dụ

Bạn có thể sử dụng `AnswerRelevancyMetric` giống như bất kỳ metric nào khác.

```python
from deepeval.metrics import AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase

answer_relevancy_metric = AnswerRelevancyMetric(threshold=0.5)
test_case = LLMTestCase(
    input="What if these shoes don't fit?",
    actual_output="We offer a 30-day full refund at no extra cost."
)

answer_relevancy_metric.measure(test_case)
print(answer_relevancy_metric.score)
print(answer_relevancy_metric.reason)
```

Có 5 tham số tùy chọn khi khởi tạo `AnswerRelevancyMetric`:

- [Optional] `threshold`: ngưỡng điểm tối thiểu để vượt qua, mặc định là 0.5.
- [Optional] `model`: tên mô hình sẽ được sử dụng để tạo câu hỏi. Mặc định là 'gpt-4o'.
- [Optional] `embeddings`: mô hình embedding được sử dụng để tính toán độ tương đồng cosine. Mặc định là `OpenAIEmbedding` (mô hình text-embedding-3-small).
- [Optional] `include_reason`: có bao gồm lý do cho điểm số tính toán hay không. Mặc định là `True`.
- [Optional] `strict_mode`: ép buộc metric trả về điểm số nhị phân (0 hoặc 1). Metric chỉ trả về 1 nếu điểm thực tế lớn hơn `threshold`. Mặc định là `False`.
- [Optional] `async_mode`: có thực hiện việc tạo metric không đồng bộ hay không. Mặc định là `True`.
- [Optional] `verbose_mode`: có in các bước trung gian ra console hay không. Mặc định là `False`.

## Cách chạy

Sau khi chạy phương thức `measure()`, bạn có thể in ra `score` (điểm số) và `reason` (lý do) của metric.

```python
print(answer_relevancy_metric.score)
print(answer_relevancy_metric.reason)
```

:::info
Bạn có thể nhận thấy rằng lý do `AnswerRelevancyMetric` trả về trông hơi khác so với các metric khác. Điều này là do nó không sử dụng LLM để đánh giá (trừ khi nó tạo ra các câu hỏi tổng hợp).
:::
