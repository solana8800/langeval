# Turn Relevancy (Sự Liên quan của Lượt hội thoại)

Metric `TurnRelevancyMetric` là một metric hội thoại xác định xem chatbot LLM của bạn có khả năng tạo ra các phản hồi liên quan một cách nhất quán **trong suốt cuộc hội thoại** hay không.

## Các Đối số Bắt buộc

Để sử dụng `TurnRelevancyMetric`, bạn sẽ phải cung cấp các đối số sau khi tạo một [`ConversationalTestCase`](/docs/evaluation-multiturn-test-cases):

- `turns`

Bạn phải cung cấp `role` và `content` để quá trình đánh giá diễn ra. Đọc phần [Cách tính toán](#how-is-it-calculated) bên dưới để tìm hiểu thêm.

## Cách sử dụng

`TurnRelevancyMetric()` có thể được sử dụng cho đánh giá đa lượt [end-to-end](/docs/evaluation-end-to-end-llm-evals):

```python
from deepeval import evaluate  
from deepeval.test_case import Turn, ConversationalTestCase  
from deepeval.metrics import TurnRelevancyMetric  
  
convo_test_case = ConversationalTestCase(  
    turns=[Turn(role="...", content="..."), Turn(role="...", content="...")]  
)  
metric = TurnRelevancyMetric(threshold=0.5)  
  
# To run metric as a standalone  
# metric.measure(convo_test_case)  
# print(metric.score, metric.reason)  
  
evaluate(test_cases=[convo_test_case], metrics=[metric])
```

Có **BẢY** tham số tùy chọn khi tạo một `TurnRelevancyMetric`:

- [Optional] `threshold`: một số thực đại diện cho ngưỡng đạt tối thiểu, mặc định là 0.5.
- [Optional] `model`: một chuỗi chỉ định mô hình GPT nào của OpenAI sẽ được sử dụng, **HOẶC** [bất kỳ mô hình LLM tùy chỉnh nào](/docs/metrics-introduction#using-a-custom-llm) thuộc loại `DeepEvalBaseLLM`. Mặc định là 'gpt-4.1'.
- [Optional] `include_reason`: một boolean mà khi được đặt thành `True`, sẽ bao gồm lý do cho điểm đánh giá của nó. Mặc định là `True`.
- [Optional] `strict_mode`: một boolean mà khi được đặt thành `True`, thực thi điểm số metric nhị phân: 1 cho hoàn hảo, 0 cho trường hợp còn lại. Nó cũng ghi đè ngưỡng hiện tại và đặt nó thành 1. Mặc định là `False`.
- [Optional] `async_mode`: một boolean mà khi được đặt thành `True`, cho phép [thực thi đồng thời trong phương thức `measure()`.](/docs/metrics-introduction#measuring-metrics-in-async) Mặc định là `True`.
- [Optional] `verbose_mode`: một boolean mà khi được đặt thành `True`, in các bước trung gian được sử dụng để tính toán metric đó ra console. Mặc định là `False`.
- [Optional] `window_size`: một số nguyên xác định kích thước của cửa sổ trượt của các lượt được sử dụng trong quá trình đánh giá. Mặc định là `10`.

### Chạy độc lập (Standalone)

Bạn cũng có thể chạy `TurnRelevancyMetric` trên một test case đơn lẻ như một lần thực thi độc lập.

```python
...  
  
metric.measure(convo_test_case)  
print(metric.score, metric.reason)
```

:::caution
Điều này rất tốt để gỡ lỗi hoặc nếu bạn muốn xây dựng đường ống đánh giá của riêng mình, nhưng bạn sẽ **KHÔNG** nhận được những lợi ích (báo cáo kiểm thử, nền tảng Confident AI) và tất cả các tối ưu hóa (tốc độ, bộ nhớ đệm, tính toán) mà hàm `evaluate()` hoặc `deepeval test run` cung cấp.
:::

## Cách tính toán

Điểm số `TurnRelevancyMetric` được tính theo phương trình sau:

$$Conversation\ Relevancy = \frac{Number\ of\ Turns\ with\ Relevant\ Assistant\ Content}{Total\ Number\ of\ Assistant\ Turns}$$

`TurnRelevancyMetric` trước tiên xây dựng một cửa sổ trượt các lượt cho mỗi lượt, trước khi sử dụng một LLM để xác định xem lượt cuối cùng trong mỗi cửa sổ trượt có nội dung `"assistant"` liên quan đến ngữ cảnh hội thoại trước đó được tìm thấy trong cửa sổ trượt hay không.
