---
title: Arena G-Eval
---

# Arena G-Eval

* LLM-as-a-judge
* Custom
* Single-turn
* Multimodal

Arena G-Eval là một phiên bản được điều chỉnh của [`GEval` metric](/docs/metrics-llm-evals) phổ biến của `deepeval` nhưng dùng để chọn `LLMTestCase` nào thực hiện tốt hơn thay thế.

:::info
Để đảm bảo không thiên vị, `ArenaGEval` sử dụng phương pháp LLM-as-a-Judge n-pairwise, vị trí ngẫu nhiên, mù (blinded) để chọn lần lặp lại hoạt động tốt nhất của ứng dụng LLM của bạn bằng cách đại diện cho chúng như là các "thí sinh" (contestants).
:::

## Các tham số bắt buộc

Để sử dụng metric `ArenaGEval`, bạn sẽ phải cung cấp các tham số sau khi tạo một [`ArenaTestCase`](/docs/evaluation-arena-test-cases):

* `contestants`

Bạn cũng sẽ cần cung cấp bất kỳ tham số bổ sung nào như `expected_output` và `context` bên trong `LLMTestCase` của `contestants` nếu tiêu chí đánh giá của bạn phụ thuộc vào các tham số này.

## Cách sử dụng

Để tạo một metric tùy chỉnh chọn `LLMTestCase` tốt nhất, chỉ cần khởi tạo một lớp `ArenaGEval` và định nghĩa một tiêu chí đánh giá bằng ngôn ngữ hàng ngày:

```python
from deepeval.test_case import ArenaTestCase, LLMTestCase, LLMTestCaseParams, Contestant  
from deepeval.metrics import ArenaGEval  
from deepeval import compare  
  
a_test_case = ArenaTestCase(  
    contestants=[  
        Contestant(  
            name="GPT-4",  
            hyperparameters={"model": "gpt-4"},  
            test_case=LLMTestCase(  
                input="What is the capital of France?",  
                actual_output="Paris",  
            ),  
        ),  
        Contestant(  
            name="Claude-4",  
            hyperparameters={"model": "claude-4"},  
            test_case=LLMTestCase(  
                input="What is the capital of France?",  
                actual_output="Paris is the capital of France.",  
            ),  
        )  
    ]  
)  
metric = ArenaGEval(  
    name="Friendly",  
    criteria="Choose the winner of the more friendly contestant based on the input and actual output",  
    evaluation_params=[  
        LLMTestCaseParams.INPUT,  
        LLMTestCaseParams.ACTUAL_OUTPUT,  
    ],  
)  
  
compare(test_cases=[a_test_case], metric=metric)
```

Có **BA** tham số bắt buộc và **BỐN** tham số tùy chọn khi khởi tạo một lớp `ArenaGEval`:

* `name`: tên của metric. Điều này sẽ **không** ảnh hưởng đến việc đánh giá.
* `criteria`: một mô tả phác thảo các khía cạnh đánh giá cụ thể cho từng test case.
* `evaluation_params`: một danh sách kiểu `LLMTestCaseParams`, chỉ bao gồm các tham số có liên quan đến việc đánh giá.
* [Tùy chọn] `evaluation_steps`: một danh sách các chuỗi phác thảo các bước chính xác mà LLM nên thực hiện để đánh giá. Nếu `evaluation_steps` không được cung cấp, `ConversationalGEval` sẽ tạo ra một loạt `evaluation_steps` thay mặt bạn dựa trên `criteria` được cung cấp. Bạn chỉ có thể cung cấp hoặc `evaluation_steps` **HOẶC** `criteria`, và không phải cả hai.
* [Tùy chọn] `model`: một chuỗi chỉ định model GPT nào của OpenAI để sử dụng, **HOẶC** [bất kỳ model LLM tùy chỉnh nào](/docs/metrics-introduction#using-a-custom-llm) kiểu `DeepEvalBaseLLM`. Mặc định là 'gpt-4.1'.
* [Tùy chọn] `async_mode`: một boolean mà khi được đặt là `True`, cho phép [thực thi đồng thời trong phương thức `measure()`.](/docs/metrics-introduction#measuring-metrics-in-async) Mặc định là `True`.
* [Tùy chọn] `verbose_mode`: một boolean mà khi được đặt là `True`, in các bước trung gian được sử dụng để tính toán metric đó ra console, như được nêu trong phần [Nó được tính toán như thế nào](#how-is-it-calculated). Mặc định là `False`.

:::danger
Để có kết quả chính xác và hợp lệ, chỉ các tham số đánh giá được đề cập trong `criteria`/`evaluation_steps` mới nên được đưa vào làm thành viên của `evaluation_params`.
:::

### Như một bản độc lập (As a standalone)

Bạn cũng có thể chạy `ArenaGEval` trên một test case đơn lẻ như một bản thực thi độc lập, một lần.

```python
...  
  
metric.measure(a_test_case)  
print(metric.winner, metric.reason)
```

:::caution
Điều này rất tốt để gỡ lỗi hoặc nếu bạn muốn xây dựng pipeline đánh giá của riêng mình, nhưng bạn sẽ **KHÔNG** nhận được các lợi ích (báo cáo kiểm thử, nền tảng Confident AI) và tất cả các tối ưu hóa (tốc độ, tính toán) mà hàm `compare()` cung cấp.
:::

## Nó được tính toán như thế nào?

`ArenaGEval` là một phiên bản thích ứng của [`GEval`](/docs/metrics-llm-evals), vì vậy giống như `GEval`, metric `ArenaGEval` là một thuật toán hai bước, trước tiên tạo ra một loạt `evaluation_steps` sử dụng chuỗi suy nghĩ (chain of thoughts - CoTs) dựa trên `criteria` đã cho, trước khi sử dụng `evaluation_steps` đã tạo để xác định người chiến thắng dựa trên `evaluation_params` được trình bày trong mỗi `LLMTestCase`.
