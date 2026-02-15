# Task Completion (Hoàn thành Nhiệm vụ)

Metric `TaskCompletionMetric` sử dụng LLM-as-a-judge để đánh giá mức độ hiệu quả mà một **tác nhân LLM hoàn thành một nhiệm vụ**. Task Completion là một LLM-Eval tự giải thích, nghĩa là nó xuất ra lý do cho điểm số metric của nó.

:::info
Task Completion phân tích **toàn bộ trace của tác nhân** của bạn để xác định sự thành công của nhiệm vụ, điều này yêu cầu [thiết lập tracing](/docs/evaluation-llm-tracing).
:::

## Cách sử dụng

Để bắt đầu, hãy [thiết lập tracing](/docs/evaluation-llm-tracing) và chỉ cần cung cấp `TaskCompletionMetric()` cho thẻ `@observe` của tác nhân của bạn.

```python
from deepeval.tracing import observe  
from deepeval.dataset import Golden, EvaluationDataset  
from deepeval.metrics import TaskCompletionMetric  
  
@observe()  
def trip_planner_agent(input):  
    destination = "Paris"  
    days = 2  
  
    @observe()  
    def restaurant_finder(city):  
        return ["Le Jules Verne", "Angelina Paris", "Septime"]  
  
    @observe()  
    def itinerary_generator(destination, days):  
        return ["Eiffel Tower", "Louvre Museum", "Montmartre"][:days]  
  
    itinerary = itinerary_generator(destination, days)  
    restaurants = restaurant_finder(destination)  
  
    return itinerary + restaurants  
  
  
# Create dataset  
dataset = EvaluationDataset(goldens=[Golden(input="This is a test query")])  
  
# Initialize metric  
task_completion = TaskCompletionMetric(threshold=0.7, model="gpt-4o")  
  
# Loop through dataset  
for goldens in dataset.evals_iterator(metrics=[task_completion]):  
    trip_planner_agent(golden.input)
```

Có **BẢY** tham số tùy chọn khi tạo một `TaskCompletionMetric`:

- [Optional] `threshold`: một số thực đại diện cho ngưỡng đạt tối thiểu, mặc định là 0.5.
- [Optional] `task`: một chuỗi đại diện cho nhiệm vụ cần hoàn thành. Nếu không có nhiệm vụ nào được cung cấp, nó sẽ tự động được suy luận từ trace. Mặc định là `None`.
- [Optional] `model`: một chuỗi chỉ định mô hình GPT nào của OpenAI sẽ được sử dụng, **HOẶC** [bất kỳ mô hình LLM tùy chỉnh nào](/docs/metrics-introduction#using-a-custom-llm) thuộc loại `DeepEvalBaseLLM`. Mặc định là 'gpt-4o'.
- [Optional] `include_reason`: một boolean mà khi được đặt thành `True`, sẽ bao gồm lý do cho điểm đánh giá của nó. Mặc định là `True`.
- [Optional] `strict_mode`: một boolean mà khi được đặt thành `True`, thực thi điểm số metric nhị phân: 1 cho hoàn hảo, 0 cho trường hợp còn lại. Nó cũng ghi đè ngưỡng hiện tại và đặt nó thành 1. Mặc định là `False`.
- [Optional] `async_mode`: một boolean mà khi được đặt thành `True`, cho phép [thực thi đồng thời trong phương thức `measure()`.](/docs/metrics-introduction#measuring-a-metric-in-async) Mặc định là `True`.
- [Optional] `verbose_mode`: một boolean mà khi được đặt thành `True`, in các bước trung gian được sử dụng để tính toán metric đó ra console. Mặc định là `False`.

Để tìm hiểu thêm về cách `evals_iterator` hoạt động, [nhấn vào đây.](/docs/evaluation-end-to-end-llm-evals#e2e-evals-for-tracing)

## Cách tính toán

Điểm số `TaskCompletionMetric` được tính theo phương trình sau:

$$Task\ Completion\ Score = AlignmentScore(Task, Outcome)$$

- **Task** và **Outcome** được trích xuất từ trace (hoặc test case cho end-to-end) bằng cách sử dụng một LLM.
- **Alignment Score** đo lường mức độ phù hợp của kết quả với nhiệm vụ được trích xuất (hoặc do người dùng cung cấp), được đánh giá bởi một LLM.
