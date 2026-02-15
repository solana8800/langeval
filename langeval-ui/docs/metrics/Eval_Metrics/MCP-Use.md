# MCP-Use (Sử dụng MCP)

Metric `MCPUseMetric` được sử dụng để đánh giá mức độ hiệu quả mà một **tác nhân LLM dựa trên MCP sử dụng các máy chủ mcp mà nó có quyền truy cập**. Nó sử dụng LLM-as-a-judge để đánh giá các MCP primitive được gọi cũng như các đối số được tạo bởi ứng dụng LLM.

## Các Đối số Bắt buộc

Để sử dụng `MCPUseMetric`, bạn sẽ phải cung cấp các đối số sau khi tạo một [`LLMTestCase`](https://www.deepeval.com/docs/evaluation-test-cases):

- `input`
- `actual_output`
- `mcp_servers`

Bạn cũng sẽ cần cung cấp bất kỳ `mcp_tools_called`, `mcp_resources_called`, và `mcp_prompts_called` nào nếu được sử dụng, để quá trình đánh giá diễn ra.

## Cách sử dụng

`MCPUseMetric` có thể được sử dụng trên một trường hợp `LLMTestCase` đơn lượt với các tham số MCP.

```python
from deepeval import evaluate  
from deepeval.metrics import MCPUseMetric  
from deepeval.test_case import LLMTestCase, MCPServer  
  
test_case = LLMTestCase(  
    input="...", # Your input here  
    actual_output="...", # Your LLM app's final output here  
    mcp_servers=[MCPServer(...)] # Your MCP server's data  
    # MCP primitives used (if any)  
)  
  
metric = MCPUseMetric()  
  
# To run metric as a standalone  
# metric.measure(convo_test_case)  
# print(metric.score, metric.reason)  
  
evaluate([test_case], [metric])
```

Có **SÁU** tham số tùy chọn khi tạo một `MCPTaskCompletionMetric`:

- [Optional] `threshold`: một số thực đại diện cho ngưỡng đạt tối thiểu, mặc định là 0.5.
- [Optional] `model`: một chuỗi chỉ định mô hình GPT nào của OpenAI sẽ được sử dụng, **HOẶC** [bất kỳ mô hình LLM tùy chỉnh nào](/docs/metrics-introduction#using-a-custom-llm) thuộc loại `DeepEvalBaseLLM`. Mặc định là 'gpt-4o'.
- [Optional] `include_reason`: một boolean mà khi được đặt thành `True`, sẽ bao gồm lý do cho điểm đánh giá của nó. Mặc định là `True`.
- [Optional] `strict_mode`: một boolean mà khi được đặt thành `True`, thực thi điểm số metric nhị phân: 1 cho hoàn hảo, 0 cho trường hợp còn lại. Nó cũng ghi đè ngưỡng hiện tại và đặt nó thành 1. Mặc định là `False`.
- [Optional] `async_mode`: một boolean mà khi được đặt thành `True`, cho phép [thực thi đồng thời trong phương thức `measure()`.](/docs/metrics-introduction#measuring-a-metric-in-async) Mặc định là `True`.
- [Optional] `verbose_mode`: một boolean mà khi được đặt thành `True`, in các bước trung gian được sử dụng để tính toán metric đó ra console. Mặc định là `False`.

### Chạy độc lập (Standalone)

Bạn cũng có thể chạy `MCPUseMetric` trên một test case đơn lẻ như một lần thực thi độc lập.

```python
...  
  
metric.measure(convo_test_case)  
print(metric.score, metric.reason)
```

:::caution
Điều này rất tốt để gỡ lỗi hoặc nếu bạn muốn xây dựng đường ống đánh giá của riêng mình, nhưng bạn sẽ **KHÔNG** nhận được những lợi ích (báo cáo kiểm thử, nền tảng Confident AI) và tất cả các tối ưu hóa (tốc độ, bộ nhớ đệm, tính toán) mà hàm `evaluate()` hoặc `deepeval test run` cung cấp.
:::

## Cách tính toán

Điểm số `MCPUseMetric` được tính theo phương trình sau:

$$MCP\ Use\ Score = AlignmentScore(Primitives\ Used, Primitives\ Available)$$

**AlignmentScore** được đánh giá bởi một mô hình đánh giá dựa trên việc các primitive nào được gọi và các đối số được tạo của chúng liên quan đến đầu vào của người dùng.

:::info
`MCPUseMetric` đánh giá xem các công cụ phù hợp có được gọi với các tham số phù hợp hay không, tức là, nếu tất cả các tham số tùy chọn ở trên không được cung cấp, `MCPUseMetric` đánh giá xem liệu việc gọi bất kỳ primitive nào có sẵn có tốt hơn hay không.
:::
