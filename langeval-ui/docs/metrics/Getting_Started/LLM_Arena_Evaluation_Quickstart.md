# Bắt đầu
# Trường hợp sử dụng
# LLM Arena

## Hướng dẫn nhanh về Đánh giá LLM Arena

Học cách đánh giá các phiên bản khác nhau của ứng dụng LLM của bạn bằng cách sử dụng LLM Arena-as-a-Judge trong `deepeval`, một đánh giá LLM dựa trên so sánh.

## Tổng Quan

Thay vì so sánh các đầu ra LLM bằng phương pháp LLM-as-a-Judge một đầu ra như đã thấy trong các phần trước, bạn cũng có thể so sánh n test case theo cặp (pairwise) để tìm ra phiên bản tốt nhất của ứng dụng LLM của mình. Phương pháp này mặc dù không cung cấp điểm số bằng số, nhưng cho phép bạn chọn đầu ra LLM "chiến thắng" đáng tin cậy hơn cho một tập hợp đầu vào và đầu ra nhất định.

**Trong hướng dẫn nhanh 5 phút này, bạn sẽ học cách:**

*   Thiết lập một LLM arena
*   Sử dụng Arena G-Eval để chọn ứng dụng LLM hoạt động tốt nhất

## Điều Kiện Tiên Quyết

*   Cài đặt `deepeval`
*   Một khóa API Confident AI (được khuyến nghị). Đăng ký một cái [tại đây](https://app.confident-ai.com)

:::info
Confident AI cho phép bạn xem và chia sẻ các báo cáo kiểm thử của mình. Đặt khóa API của bạn trong CLI:

```bash
CONFIDENT_API_KEY="confident_us..."
```
:::

## Thiết Lập LLM Arena

Trong `deepeval`, các arena test case được sử dụng để so sánh các phiên bản khác nhau của ứng dụng LLM của bạn để xem phiên bản nào hoạt động tốt hơn. Mỗi test case là một đấu trường (arena) chứa các thí sinh (contestants) khác nhau là các phiên bản khác nhau của ứng dụng LLM của bạn, được đánh giá dựa trên `LLMTestCase` tương ứng của chúng.

:::note
`deepeval` cung cấp nhiều lựa chọn mô hình LLM mà bạn có thể dễ dàng chọn và chạy đánh giá cùng.

*   OpenAI
*   Anthropic
*   Gemini
*   Ollama
*   Grok
*   Azure OpenAI
*   Amazon Bedrock
*   Vertex AI

```python
from deepeval.metrics import ArenaGEval

task_completion_metric = ArenaGEval(model="gpt-4.1")
```

(Các ví dụ khác tương tự...)
:::

### Tạo một arena test case

Tạo một `ArenaTestCase` bằng cách truyền vào một danh sách các thí sinh.

`main.py`

```python
from deepeval.test_case import ArenaTestCase, LLMTestCase, Contestant

contestant_1 = Contestant(
    name="Version 1",
    hyperparameters={"model": "gpt-3.5-turbo"},
    test_case=LLMTestCase(
        input="What is the capital of France?",
        actual_output="Paris",
    ),
)

contestant_2 = Contestant(
    name="Version 2",
    hyperparameters={"model": "gpt-4o"},
    test_case=LLMTestCase(
        input="What is the capital of France?",
        actual_output="Paris is the capital of France.",
    ),
)

contestant_3 = Contestant(
    name="Version 3",
    hyperparameters={"model": "gpt-4.1"},
    test_case=LLMTestCase(
        input="What is the capital of France?",
        actual_output="Absolutely! The capital of France is Paris 😊",
    ),
)

test_case = ArenaTestCase(contestants=[contestant_1, contestant_2, contestant_3])
```

Bạn có thể tìm hiểu thêm về `ArenaTestCase` [tại đây](https://deepeval.com/docs/evaluation-arena-test-cases).

### Xác định số liệu arena

Số liệu [`ArenaGEval`](https://deepeval.com/docs/metrics-arena-g-eval) là số liệu duy nhất tương thích với `ArenaTestCase`. Nó chọn một người chiến thắng trong số các thí sinh dựa trên các tiêu chí được xác định.

```python
from deepeval.metrics import ArenaGEval
from deepeval.test_case import LLMTestCaseParams

arena_geval = ArenaGEval(
    name="Friendly",
    criteria="Choose the winner of the more friendly contestant based on the input and actual output",
    evaluation_params=[
        LLMTestCaseParams.INPUT,
        LLMTestCaseParams.ACTUAL_OUTPUT,
    ]
)
```

## Chạy Đánh Giá Arena Đầu Tiên Của Bạn

Bây giờ bạn đã tạo một arena với các thí sinh và xác định một số liệu, bạn có thể bắt đầu chạy các đánh giá arena để xác định thí sinh chiến thắng.

### Chạy một đánh giá

Bạn có thể chạy các đánh giá arena bằng cách sử dụng hàm `compare()`.

`main.py`

```python
from deepeval.test_case import ArenaTestCase, LLMTestCase, LLMTestCaseParams
from deepeval.metrics import ArenaGEval
from deepeval import compare

test_case = ArenaTestCase(
    contestants=[...], # Sử dụng các thí sinh tương tự bạn đã tạo trước đó
)

arena_geval = ArenaGEval(...) # Sử dụng số liệu tương tự bạn đã tạo trước đó

compare(test_cases=[test_case], metric=arena_geval)
```

**Ghi log prompt và model**

Bạn có thể tùy chọn ghi log các prompt và model cho mỗi thí sinh thông qua từ điển `hyperparameters` trong hàm `compare()`. Điều này sẽ cho phép bạn dễ dàng quy kết các thí sinh chiến thắng cho các siêu tham số tương ứng của họ.

```python
from deepeval.prompt import Prompt

prompt_1 = Prompt(
    alias="First Prompt",
    messages_template=[PromptMessage(role="system", content="You are a helpful assistant.")]
)
prompt_2 = Prompt(
    alias="Second Prompt",
    messages_template=[PromptMessage(role="system", content="You are a helpful assistant.")]
)

compare(
    test_cases=[test_case],
    metric=arena_geval,
    hyperparameters={
        "Version 1": {"prompt": prompt_1},
        "Version 2": {"prompt": prompt_2},
    },
)
```

Bây giờ bạn có thể chạy file python này để nhận kết quả:

```bash
python main.py
```

Điều này sẽ cho phép bạn xem kết quả của arena như hiển thị bên dưới:

```python
Counter({'Version 3': 1})
```

🎉🥳 **Chúc mừng!** Bạn vừa chạy đánh giá dựa trên LLM arena đầu tiên của mình. Đây là những gì đã xảy ra:

*   Khi bạn gọi `compare()`, `deepeval` lặp qua từng `ArenaTestCase`
*   Đối với mỗi test case, `deepeval` sử dụng số liệu `ArenaGEval` để chọn "người chiến thắng"
*   Để làm cho arena không thiên vị, `deepeval` che tên của từng thí sinh và ngẫu nhiên hóa vị trí của họ
*   Cuối cùng, bạn nhận được số lượng "chiến thắng" mà mỗi thí sinh có được dưới dạng đầu ra cuối cùng.

Không giống như LLM-as-a-Judge một đầu ra (là mọi thứ trừ đánh giá LLM arena), khái niệm về một test case "vượt qua" (passing) không tồn tại đối với các đánh giá arena.

### Xem trên Confident AI (được khuyến nghị)

Nếu bạn đã đặt `CONFIDENT_API_KEY`, các so sánh arena của bạn sẽ tự động xuất hiện dưới dạng một thử nghiệm (experiment) trên [Confident AI](https://app.confident-ai.com), nền tảng DeepEval.

[](https://deepeval-docs.s3.us-east-1.amazonaws.com/getting-started%3Aarena-evals%3Aexperiment.mp4)

## Các Bước Tiếp Theo

`deepeval` cho phép bạn chạy các so sánh Arena cục bộ nhưng không được tối ưu hóa cho các cải tiến prompt hoặc mô hình lặp đi lặp lại. Nếu bạn đang tìm kiếm một cách toàn diện và hợp lý hơn để chạy các so sánh Arena, [**Confident AI**](https://app.confident-ai.com) cho phép bạn dễ dàng kiểm thử các prompt, model, công cụ và cấu hình đầu ra khác nhau **song song**, và đánh giá chúng bằng cách sử dụng bất kỳ số liệu `deepeval` nào ngoài `ArenaGEval`—tất cả trực tiếp trên nền tảng.

*   So sánh Nhanh
*   Thử Nghiệm (Experiments)
*   So sánh có Trace
*   So sánh Số Liệu
*   Ghi Log Prompt và Model

So sánh các đầu ra mô hình trực tiếp bằng cách sử dụng đánh giá arena.

[](https://deepeval-docs.s3.us-east-1.amazonaws.com/getting-started%3Aarena-evals%3Aquick-run.mp4)

Tạo một thử nghiệm để chạy các so sánh toàn diện trên một bộ dữ liệu đánh giá và tập hợp các số liệu.

[](https://deepeval-docs.s3.us-east-1.amazonaws.com/getting-started%3Aarena-evals%3Arun-experiment.mp4)

Xem chi tiết dấu vết của các lệnh gọi LLM và công cụ trong quá trình so sánh mô hình.

[](https://deepeval-docs.s3.us-east-1.amazonaws.com/getting-started%3Aarena-evals%3Atraced-comparisons.mp4)

Áp dụng các số liệu đánh giá tùy chỉnh để xác định các mô hình chiến thắng trong các so sánh đối đầu.

[](https://deepeval-docs.s3.us-east-1.amazonaws.com/getting-started%3Aarena-evals%3Ametric-comparisons.mp4)

Theo dõi các prompt và cấu hình mô hình để hiểu siêu tham số nào dẫn đến hiệu suất tốt hơn.

[](https://deepeval-docs.s3.us-east-1.amazonaws.com/getting-started%3Aarena-evals%3Alog-prompts.mp4)

Bây giờ bạn đã chạy các đánh giá Arena đầu tiên của mình, bạn nên:

1.  **Tùy chỉnh các số liệu của bạn**: Bạn có thể thay đổi các tiêu chí của số liệu để cụ thể hơn cho trường hợp sử dụng của bạn.
2.  **Chuẩn bị một bộ dữ liệu**: Nếu bạn không có, hãy [tạo một bộ](/docs/synthesizer-introduction) làm điểm khởi đầu để lưu trữ đầu vào của bạn dưới dạng goldens.

Số liệu arena chỉ được sử dụng để chọn người chiến thắng trong số các thí sinh, nó không được sử dụng để đánh giá chính các câu trả lời. Để đánh giá ứng dụng LLM của bạn trên các trường hợp sử dụng cụ thể, bạn có thể đọc các hướng dẫn nhanh khác tại đây:

[AI Agents](/docs/getting-started-agents)
*   Thiết lập LLM tracing
*   Kiểm thử hoàn thành tác vụ end-to-end
*   Đánh giá các thành phần riêng lẻ

[RAG](/docs/getting-started-rag)
*   Đánh giá RAG end-to-end
*   Kiểm thử retriever và generator riêng biệt
*   Đánh giá RAG nhiều lượt

[Chatbots](/docs/getting-started-chatbots)
*   Thiết lập test case nhiều lượt
*   Đánh giá các lượt trong một cuộc hội thoại
*   Mô phỏng tương tác người dùng

[Chỉnh sửa trang này](https://github.com/confident-ai/deepeval/edit/main/docs/docs/getting-started-llm-arena.mdx)

Cập nhật lần cuối vào **9 tháng 1, 2026** bởi **Jeffrey Ip**
