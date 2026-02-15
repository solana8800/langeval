---
title: Đánh giá LLM cấp thành phần
---

# Đánh giá LLM cấp thành phần

Đánh giá cấp thành phần (Component-level evaluation) đánh giá các đơn vị riêng lẻ của [tương tác LLM](/docs/evaluation-test-cases#what-is-an-llm-interaction) giữa các **thành phần nội bộ** như retrievers, tool calls, LLM generations, hoặc thậm chí các agents tương tác với các agents khác, thay vì coi ứng dụng LLM như một hộp đen.

![component level evals](../images/8f94fbce.png)

Đánh giá cấp thành phần hiện chỉ được hỗ trợ cho các đánh giá lượt đơn (single-turn).

**Khi nào bạn nên chạy đánh giá cấp thành phần?**

Trong [đánh giá end-to-end](/docs/evaluation-end-to-end-llm-evals), ứng dụng LLM của bạn được coi như một hộp đen và việc đánh giá được gói gọn bởi các đầu vào và đầu ra tổng thể của hệ thống dưới dạng một `LLMTestCase`.

Nếu ứng dụng của bạn có các thành phần lồng nhau hoặc một cấu trúc mà một `LLMTestCase` đơn giản không thể xử lý dễ dàng, đánh giá cấp thành phần cho phép bạn **áp dụng các metrics khác nhau cho các thành phần khác nhau trong ứng dụng LLM của bạn.**

Các trường hợp sử dụng phổ biến phù hợp cho đánh giá cấp thành phần bao gồm (nhưng không giới hạn):

* Chatbots/conversational agents
* Autonomous agents (Các tác nhân tự hành)
* Text-SQL
* Code generation (Sinh mã)
* v.v.

Xu hướng bạn sẽ nhận thấy là các trường hợp sử dụng có kiến trúc phức tạp hơn sẽ phù hợp hơn cho đánh giá cấp thành phần.

## Nó hoạt động như thế nào?

Khi ứng dụng LLM của bạn được decorate với `@observe`, bạn sẽ có thể cung cấp nó như một `observed_callback` và gọi nó với các `Golden`s để tạo ra một danh sách các test cases bên trong các span được decorate `@observe` của bạn. Các test cases này sau đó được đánh giá bằng cách sử dụng các `metrics` tương ứng để tạo ra một **test run**.

* Evals on Traces (Đánh giá trên Trace)
* Evals on Spans (Đánh giá trên Span)

Evals on traces là [đánh giá end-to-end](/docs/evaluation-end-to-end-llm-evals), nơi một tương tác LLM đơn lẻ đang được đánh giá.

[](https://confident-docs.s3.us-east-1.amazonaws.com/llm-tracing:traces.mp4)

Học cách thiết lập LLM tracing cho Confident AI

Spans tạo nên một trace và evals on spans đại diện cho [đánh giá cấp thành phần](/docs/evaluation-component-level-llm-evals), nơi các thành phần riêng lẻ trong ứng dụng LLM của bạn đang được đánh giá.

[](https://confident-docs.s3.us-east-1.amazonaws.com/llm-tracing:spans.mp4)

Học cách thiết lập LLM tracing cho Confident AI

:::tip
Đánh giá cấp thành phần tạo ra LLM traces, chỉ hiển thị trên Confident AI. Để xem chúng, hãy đăng nhập [tại đây](https://app.confident-ai.com) hoặc chạy:

```bash
deepeval login
```
:::

## Thiết lập môi trường kiểm thử

### Thiết lập LLM Tracing và metrics

Đối với kiểm thử cấp thành phần, bạn cần thiết lập LLM tracing cho ứng dụng của mình. Bạn có thể tìm hiểu về [cách thiết lập LLM tracing tại đây](/docs/evaluation-llm-tracing).

**somewhere.py**

```python
from typing import List  
from openai import OpenAI  
  
from deepeval.tracing import observe, update_current_span  
from deepeval.test_case import LLMTestCase  
from deepeval.metrics import AnswerRelevancyMetric  
  
def your_llm_app(input: str):  
    def retriever(input: str):  
        return ["Hardcoded", "text", "chunks", "from", "vectordb"]  
  
    @observe(metrics=[AnswerRelevancyMetric()])  
    def generator(input: str, retrieved_chunks: List[str]):  
        res = OpenAI().chat.completions.create(  
            model="gpt-4o",  
            messages=[{"role": "user", "content": "\n\n".join(retrieved_chunks) + "\n\nQuestion: " + input}]  
        ).choices[0].message.content  
  
        # Create test case at runtime  
        update_current_span(test_case=LLMTestCase(input=input, actual_output=res))  
  
        return res  
  
    return generator(input, retriever(input))  
  
  
print(your_llm_app("How are you?"))
```

Trong ví dụ trên, chúng ta:

* Đã decorate các hàm khác nhau trong ứng dụng của chúng ta với `@observe`, cho phép `deepeval` lập bản đồ cách các thành phần liên quan với nhau.
* Đã cung cấp `AnswerRelevancyMetric` cho `metrics` trong `generator`, điều này báo cho `deepeval` biết rằng thành phần đó nên được đánh giá.
* Đã xây dựng các test cases tại thời gian chạy (runtime) bằng cách sử dụng `update_current_span`.

Bạn có thể tìm hiểu thêm về LLM tracing trong [phần này.](/docs/evaluation-llm-tracing)

**LLM tracing là gì?**

Quá trình thêm decorator `@observe` vào ứng dụng của bạn được gọi là **tracing**, bạn có thể tìm hiểu trong [phần tracing](/docs/evaluation-llm-tracing).

Một decorator `@observe` tạo ra một **span**, và tập hợp tổng thể của các spans được gọi là một **trace**.

Như bạn sẽ thấy trong ví dụ dưới đây, tracing với `@observe` của `deepeval` có nghĩa là chúng ta không phải trả về các biến như `retrieval_context` ở những nơi khó xử chỉ để tạo ra các `LLMTestCase` end-to-end, [như đã thấy trước đây trong đánh giá end-to-end](/docs/evaluation-end-to-end-llm-evals#setup-your-testing-environment).

### Tạo một dataset

[Datasets](/docs/evaluation-datasets) trong `deepeval` cho phép bạn lưu trữ [`Golden`](/docs/evaluation-datasets#what-are-goldens)s, giống như tiền thân của các test cases. Chúng cho phép bạn tạo test case một cách linh hoạt trong thời gian đánh giá bằng cách gọi ứng dụng LLM của bạn. Đây là cách bạn có thể tạo goldens:

* Single-Turn (Lượt đơn)
* Multi-Turn (Đa lượt)

```python
from deepeval.dataset import Golden  
  
goldens=[  
    Golden(input="What is your name?"),  
    Golden(input="Choose a number between 1 to 100"),  
]
```

```python
from deepeval.dataset import ConversationalGolden  
  
goldens = [  
    ConversationalGolden(  
        scenario="Andy Byron wants to purchase a VIP ticket to a Coldplay concert.",  
        expected_outcome="Successful purchase of a ticket.",  
        user_description="Andy Byron is the CEO of Astronomer.",  
    )  
]
```

Bạn cũng có thể tạo goldens tổng hợp tự động bằng cách sử dụng `Synthesizer`. Tìm hiểu thêm [tại đây](/docs/synthesizer-introduction). Bây giờ bạn có thể sử dụng các goldens này để tạo một evaluation dataset có thể được lưu trữ và tải lại bất cứ lúc nào.

* Confident AI
* Locally as CSV (Cục bộ dưới dạng CSV)
* Locally as JSON (Cục bộ dưới dạng JSON)

```python
from deepeval.dataset import EvaluationDataset  
  
dataset = EvaluationDataset(goldens)  
dataset.push(alias="My dataset")
```

```python
from deepeval.dataset import EvaluationDataset  
  
dataset = EvaluationDataset(goldens)  
dataset.save_as(  
    file_type="csv",  
    directory="./example"  
)
```

```python
from deepeval.dataset import EvaluationDataset  
  
dataset = EvaluationDataset(goldens)  
dataset.save_as(  
    file_type="json",  
    directory="./example"  
)
```

✅ Xong. Bây giờ bạn có thể sử dụng dataset này ở bất cứ đâu để chạy các đánh giá của mình một cách tự động bằng cách lặp qua chúng và tạo ra các test cases.

## Chạy đánh giá cấp thành phần

Bạn có thể sử dụng dataset bạn vừa tạo và gọi ứng dụng LLM được decorate `@observe` của bạn bên trong vòng lặp của `evals_iterator()` để chạy đánh giá cấp thành phần.

### Tải dataset của bạn

`deepeval` hỗ trợ tải các dataset được lưu trữ trong file JSON, file CSV, và hugging face datasets vào một `EvaluationDataset` dưới dạng test cases hoặc goldens.

* Confident AI
* From CSV
* From JSON

```python
from deepeval.dataset import EvaluationDataset  
  
dataset = EvaluationDataset()  
dataset.pull(alias="My Evals Dataset")
```

```python
from deepeval.dataset import EvaluationDataset  
  
dataset = EvaluationDataset()  
  
dataset.add_goldens_from_csv_file(  
    # file_path is the absolute path to your .csv file  
    file_path="example.csv",  
    input_col_name="query"  
)
```

```python
from deepeval.dataset import EvaluationDataset  
  
dataset = EvaluationDataset()  
  
dataset.add_goldens_from_json_file(  
    # file_path is the absolute path to your .json file  
    file_path="example.json",  
    input_key_name="query"  
)
```

Bạn có thể [tìm hiểu thêm về tải datasets tại đây](/docs/evaluation-datasets#load-dataset).

### Chạy evals sử dụng evals iterator

Bạn có thể sử dụng `evals_iterator` của dataset để chạy đánh giá cấp thành phần bằng cách đơn giản gọi ứng dụng LLM của bạn trong vòng lặp cho tất cả các goldens.

**main.py**

```python
from somewhere import your_llm_app # Replace with your LLM app  
from deepeval.dataset import EvaluationDataset  
  
dataset = EvaluationDataset()  
dataset.pull(alias="My Evals Dataset")  
  
for golden in dataset.evals_iterator():  
    # Invoke your LLM app  
    your_llm_app(golden.input)
```

Có **SÁU** tham số tùy chọn khi sử dụng `evals_iterator()`:

* [Tùy chọn] `metrics`: một danh sách các `BaseMetric` cho phép bạn chạy đánh giá end-to-end cho các traces của bạn.
* [Tùy chọn] `identifier`: một chuỗi cho phép bạn định danh tốt hơn test run của mình trên Confident AI.
* [Tùy chọn] `async_config`: một instance kiểu `AsyncConfig` cho phép bạn [tùy chỉnh mức độ đồng thời](/docs/evaluation-flags-and-configs#async-configs) trong quá trình đánh giá. Mặc định là các giá trị `AsyncConfig` mặc định.
* [Tùy chọn] `display_config`: một instance kiểu `DisplayConfig` cho phép bạn [tùy chỉnh những gì được hiển thị](/docs/evaluation-flags-and-configs#display-configs) ra console trong quá trình đánh giá. Mặc định là các giá trị `DisplayConfig` mặc định.
* [Tùy chọn] `error_config`: một instance kiểu `ErrorConfig` cho phép bạn [tùy chỉnh cách xử lý lỗi](/docs/evaluation-flags-and-configs#error-configs) trong quá trình đánh giá. Mặc định là các giá trị `ErrorConfig` mặc định.
* [Tùy chọn] `cache_config`: một instance kiểu `CacheConfig` cho phép bạn [tùy chỉnh hành vi caching](/docs/evaluation-flags-and-configs#cache-configs) trong quá trình đánh giá. Mặc định là các giá trị `CacheConfig` mặc định.

:::tip
Hệ thống thực sự khuyên bạn nên thiết lập [Confident AI](https://app.confident-ai.com) với các đánh giá `deepeval` của bạn để quan sát các đánh giá spans và traces trong một giao diện người dùng trực quan đẹp mắt như thế này:

[](https://confident-docs.s3.us-east-1.amazonaws.com/llm-tracing:spans.mp4)

Span-Level Evals in Production
:::

Nếu bạn muốn chạy đánh giá cấp thành phần trong các pipeline CI/CD, [nhấp vào đây](/docs/evaluation-unit-testing-in-ci-cd#component-level-evals-in-cicd).
