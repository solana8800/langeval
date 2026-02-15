# Image Coherence (Sự Mạch lạc của Hình ảnh)

Metric `ImageCoherenceMetric` đánh giá mức độ mạch lạc của hình ảnh được tạo ra so với văn bản đầu vào (prompt). Metric này thường được sử dụng cho các mô hình chuyển văn bản thành hình ảnh (text-to-image).

## Mã nguồn Ví dụ

```python
from deepeval.metrics import ImageCoherenceMetric
from deepeval.test_case import LLMTestCase

image_coherence_metric = ImageCoherenceMetric()
test_case = LLMTestCase(
    input="A blue cat sitting on a bench",
    actual_output="path/to/generated/image.png"
)

image_coherence_metric.measure(test_case)
print(image_coherence_metric.score)
print(image_coherence_metric.reason)
```

## Cách chạy

Metric này sẽ phân tích hình ảnh và xác định xem nó có khớp với mô tả trong đầu vào hay không.

```python
print(image_coherence_metric.score)
print(image_coherence_metric.reason)
```
