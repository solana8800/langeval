# Bắt đầu
# Giới thiệu nhanh

## Giới thiệu nhanh

**DeepEval** là một framework đánh giá mã nguồn mở dành cho các LLM. DeepEval giúp việc xây dựng và lặp lại các ứng dụng LLM trở nên cực kỳ dễ dàng và được xây dựng với các nguyên tắc sau:

*   Dễ dàng "kiểm thử đơn vị" (unit test) các đầu ra của LLM theo cách tương tự như Pytest.
*   Sử dụng ngay hơn 50 số liệu đánh giá LLM (metrics), hầu hết đều có cơ sở nghiên cứu và tất cả đều đa phương thức (multi-modal).
*   Đánh giá cho RAG, agents, chatbots và hầu như mọi trường hợp sử dụng.
*   Hỗ trợ đánh giá cả end-to-end (từ đầu đến cuối) và cấp độ thành phần (component level).
*   Tạo bộ dữ liệu tổng hợp với các kỹ thuật tiến hóa tiên tiến nhất.
*   Các số liệu (metrics) đơn giản để tùy chỉnh và bao gồm tất cả các trường hợp sử dụng.
*   Red team, quét an toàn các ứng dụng LLM để tìm các lỗ hổng bảo mật.

Ngoài ra, DeepEval có một nền tảng đám mây [Confident AI](https://app.confident-ai.com), cho phép các nhóm sử dụng DeepEval để **đánh giá, kiểm thử hồi quy (regression test), red team và giám sát** các ứng dụng LLM trên đám mây.

Được cung cấp bởi

![](../images/9b2c4d8d.svg)

Confident AI

## Cài đặt

Trong một môi trường ảo mới được tạo, hãy chạy:

```bash
pip install -U deepeval
```

`deepeval` chạy các đánh giá cục bộ trên môi trường của bạn. Để giữ các báo cáo kiểm thử của bạn ở một nơi tập trung trên đám mây, hãy sử dụng [Confident AI](https://www.confident-ai.com), nền tảng đánh giá gốc cho DeepEval:

```bash
deepeval login
```

### Cấu hình Biến Môi trường

DeepEval tự động tải các file môi trường (tại thời điểm import)

*   **Độ ưu tiên:** env của tiến trình hiện tại -> `.env.local` -> `.env`
*   **Hủy kích hoạt:** đặt `DEEPEVAL_DISABLE_DOTENV=1`

Thông tin thêm về các cài đặt `env` có thể được [tìm thấy tại đây.](/docs/evaluation-flags-and-configs#environment-flags)

```bash
# bắt đầu nhanh
cp .env.example .env.local
# sau đó chỉnh sửa .env.local (được git bỏ qua)
```

:::note
Confident AI miễn phí và cho phép bạn giữ tất cả kết quả đánh giá trên đám mây. Đăng ký [tại đây.](https://app.confident-ai.com)
:::

## Tạo Lần Chạy Kiểm Thử Đầu Tiên Của Bạn

Tạo một file kiểm thử để chạy **đánh giá end-to-end** đầu tiên của bạn.

*   Single-Turn (Một lượt)
*   Multi-Turn (Nhiều lượt)

Một [LLM test case](/docs/evaluation-test-cases#llm-test-case) trong `deepeval` đại diện cho một **đơn vị tương tác ứng dụng LLM duy nhất**, và chứa các trường bắt buộc như `input` và `actual_output` (đầu ra do LLM tạo), và các trường tùy chọn như `expected_output`.

![LLM Test Case](../images/d28073bd.png)

Chạy `touch test_example.py` trong terminal của bạn và dán đoạn mã sau vào:

`test_example.py`

```python
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.metrics import GEval

def test_correctness():
    correctness_metric = GEval(
        name="Correctness",
        criteria="Determine if the 'actual output' is correct based on the 'expected output'.",
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
        threshold=0.5
    )
    test_case = LLMTestCase(
        input="I have a persistent cough and fever. Should I be worried?",
        # Thay thế phần này bằng đầu ra thực tế từ ứng dụng LLM của bạn
        actual_output="A persistent cough and fever could be a viral infection or something more serious. See a doctor if symptoms worsen or don't improve in a few days.",
        expected_output="A persistent cough and fever could indicate a range of illnesses, from a mild viral infection to more serious conditions like pneumonia or COVID-19. You should seek medical attention if your symptoms worsen, persist for more than a few days, or are accompanied by difficulty breathing, chest pain, or other concerning signs."
    )
    assert_test(test_case, [correctness_metric])
```

Sau đó, chạy `deepeval test run` từ thư mục gốc của dự án để đánh giá ứng dụng LLM của bạn **end-to-end**:

```bash
deepeval test run test_example.py
```

Chúc mừng! Test case của bạn đã vượt qua ✅ Hãy cùng phân tích những gì đã xảy ra.

*   Biến `input` mô phỏng đầu vào của người dùng, và `actual_output` là trình giữ chỗ cho những gì ứng dụng của bạn được cho là sẽ xuất ra dựa trên đầu vào này.
*   Biến `expected_output` đại diện cho câu trả lời lý tưởng cho một `input` nhất định, và [`GEval`](/docs/metrics-llm-evals) là một số liệu được hỗ trợ bởi nghiên cứu do `deepeval` cung cấp để bạn đánh giá đầu ra của LLM trên bất kỳ số liệu tùy chỉnh nào với độ chính xác giống như con người.
*   Trong ví dụ này, tiêu chí (`criteria`) của số liệu là tính đúng đắn của `actual_output` dựa trên `expected_output` được cung cấp, nhưng không phải tất cả các số liệu đều yêu cầu `expected_output`.
*   Tất cả các điểm số liệu nằm trong khoảng từ 0 - 1, trong đó ngưỡng `threshold=0.5` cuối cùng xác định xem bài kiểm tra của bạn có vượt qua hay không.

Nếu bạn chạy nhiều hơn một lần chạy kiểm thử, bạn sẽ có thể **bắt được các hồi quy (regressions)** bằng cách so sánh các test case song song. Điều này cũng dễ dàng hơn nếu bạn đang sử dụng `deepeval` cùng với Confident AI ([xem bên dưới](/docs/getting-started#save-results-on-cloud) để xem video demo).

Một [conversational test case](/docs/evaluation-multiturn-test-cases#conversational-test-case) trong `deepeval` đại diện cho một **tương tác nhiều lượt với ứng dụng LLM của bạn**, và chứa thông tin như cuộc hội thoại thực tế đã diễn ra dưới dạng các lượt (`turn`s), và tùy chọn kịch bản mà cuộc hội thoại đã xảy ra.

![Conversational Test Case](../images/7ceb025e.png)

Chạy `touch test_example.py` trong terminal của bạn và dán đoạn mã sau vào:

`test_example.py`

```python
from deepeval import assert_test
from deepeval.test_case import Turn, ConversationalTestCase
from deepeval.metrics import ConversationalGEval

def test_professionalism():
    professionalism_metric = ConversationalGEval(
        name="Professionalism",
        criteria="Determine whether the assistant has acted professionally based on the content.",
        threshold=0.5
    )
    test_case = ConversationalTestCase(
        turns=[
            Turn(role="user", content="What is DeepEval?"),
            Turn(role="assistant", content="DeepEval is an open-source LLM eval package.")
        ]
    )
    assert_test(test_case, [professionalism_metric])
```

Sau đó, chạy `deepeval test run` từ thư mục gốc của dự án để đánh giá ứng dụng LLM của bạn **end-to-end**:

```bash
deepeval test run test_example.py
```

🎉 Chúc mừng! Test case của bạn đã vượt qua ✅ Hãy cùng phân tích những gì đã xảy ra.

*   Biến `role` phân biệt giữa người dùng cuối và ứng dụng LLM của bạn, và `content` chứa đầu vào của người dùng hoặc đầu ra của LLM.
*   Trong ví dụ này, tiêu chí (`criteria`) số liệu đánh giá tính chuyên nghiệp của chuỗi `content`.
*   Tất cả các điểm số liệu nằm trong khoảng từ 0 - 1, trong đó ngưỡng `threshold=0.5` cuối cùng xác định xem bài kiểm tra của bạn có vượt qua hay không.

Nếu bạn chạy nhiều hơn một lần chạy kiểm thử, bạn sẽ có thể **bắt được các hồi quy (regressions)** bằng cách so sánh các test case song song. Điều này cũng dễ dàng hơn nếu bạn đang sử dụng `deepeval` cùng với Confident AI ([xem bên dưới](/docs/getting-started#save-results-on-cloud) để xem video demo).

:::info
Vì hầu hết các số liệu của `deepeval` bao gồm cả `GEval` đều là các số liệu LLM-as-a-Judge, bạn sẽ cần đặt `OPENAI_API_KEY` của mình làm biến môi trường. Bạn cũng có thể tùy chỉnh mô hình được sử dụng cho các đánh giá:

```python
correctness_metric = GEval(..., model="o1")
```

DeepEval cũng tích hợp với các nhà cung cấp mô hình sau: [Ollama](https://deepeval.com/integrations/models/ollama), [Azure OpenAI](https://deepeval.com/integrations/models/azure-openai), [Anthropic](https://deepeval.com/integrations/models/anthropic), [Gemini](https://deepeval.com/integrations/models/gemini), v.v. Để sử dụng **BẤT KỲ** LLM tùy chỉnh nào bạn chọn, [hãy xem phần này của tài liệu](/guides/guides-using-custom-llms).
:::

### Đánh giá bị "kẹt"?

Rất có thể LLM đánh giá của bạn đang thất bại và điều này có thể do giới hạn tốc độ (rate limits) hoặc không đủ hạn ngạch. Theo mặc định, `deepeval` thử lại các lỗi LLM **thoáng qua** một lần (tổng cộng 2 lần thử):

*   **Đã thử lại:** lỗi mạng/timeout và lỗi máy chủ **5xx**.
*   **Giới hạn tốc độ (429):** được thử lại trừ khi nhà cung cấp đánh dấu chúng là không thể thử lại (đối với OpenAI, `insufficient_quota` được coi là không thể thử lại).
*   **Backoff:** hàm mũ với jitter (ban đầu **1s**, cơ sở **2**, jitter **2s**, tối đa **5s**).

Bạn có thể điều chỉnh các điều này thông qua cờ môi trường (không thay đổi mã). Xem [biến môi trường](/docs/environment-variables) để biết chi tiết.

### Lưu Kết Quả

Bạn nên quản lý bộ kiểm thử của mình trên Confident AI, nền tảng của `deepeval`.

*   Confident AI
*   Cục bộ trong JSON

Confident AI là đám mây `deepeval`, và giúp bạn xây dựng pipeline đánh giá LLM tốt nhất. Chạy `deepeval view` để xem lần chạy kiểm thử mới chạy của bạn trên nền tảng:

```bash
deepeval view
```

Lệnh `deepeval view` yêu cầu lần chạy kiểm thử mà bạn đã chạy ở trên phải được lưu trữ thành công cục bộ. Nếu có lỗi xảy ra, chỉ cần chạy một lần chạy kiểm thử mới sau khi đăng nhập bằng `deepeval login`:

```bash
deepeval login
```

Sau khi bạn đã dán khóa API của mình, Confident AI sẽ **tạo báo cáo kiểm thử và tự động hóa kiểm thử hồi quy** bất cứ khi nào bạn chạy một lần chạy kiểm thử để đánh giá ứng dụng LLM của bạn trong bất kỳ môi trường nào, ở bất kỳ quy mô nào, ở bất kỳ đâu.

[](https://confident-docs.s3.us-east-1.amazonaws.com/evaluation:overview.mp4)

[Xem Hướng Dẫn Đầy Đủ trên Confident AI](https://confident-docs.s3.us-east-1.amazonaws.com/evaluation:overview.mp4)

**Khi bạn đã chạy nhiều hơn một lần chạy kiểm thử**, bạn sẽ có thể sử dụng [trang kiểm thử hồi quy](https://www.confident-ai.com/docs/llm-evaluation/dashboards/ab-regression-testing) được hiển thị ở gần cuối video. Các hàng màu xanh lá cây cho biết LLM của bạn đã cho thấy sự cải thiện trên các test case cụ thể, trong khi các hàng màu đỏ làm nổi bật các khu vực bị hồi quy.

Chỉ cần đặt biến môi trường `DEEPEVAL_RESULTS_FOLDER` thành đường dẫn tương đối bạn chọn.

```bash
# linux
export DEEPEVAL_RESULTS_FOLDER="./data"

# or windows
set DEEPEVAL_RESULTS_FOLDER=.\data
```

## Chạy Kiểm Thử Với LLM Tracing

Trong khi các đánh giá end-to-end coi ứng dụng LLM của bạn như một hộp đen, bạn cũng đánh giá **các thành phần riêng lẻ** trong ứng dụng LLM của mình thông qua **LLM tracing**. Đây là cách được khuyến nghị để đánh giá các AI agent.

![component level evals](../images/8f94fbce.png)

Đầu tiên hãy dán đoạn mã sau:

`main.py`

```python
from deepeval.tracing import observe, update_current_span
from deepeval.test_case import LLMTestCase
from deepeval.dataset import EvaluationDataset, Golden
from deepeval.metrics import AnswerRelevancyMetric

# 1. Decorate ứng dụng của bạn
@observe()
def llm_app(input: str):
  # 2. Decorate các thành phần với các số liệu bạn muốn đánh giá hoặc gỡ lỗi
  @observe(metrics=[AnswerRelevancyMetric()])
  def inner_component():
      # 3. Tạo test case tại thời gian chạy
      update_current_span(test_case=LLMTestCase(input="Why is the blue sky?", actual_output="You mean why is the sky blue?"))

  return inner_component()

# 4. Tạo bộ dữ liệu
dataset = EvaluationDataset(goldens=[Golden(input="Test input")])

# 5. Lặp qua bộ dữ liệu
for golden in dataset.evals_iterator():
  # 6. Gọi ứng dụng LLM
  llm_app(golden.input)
```

Sau đó chạy `python main.py` để chạy một đánh giá **cấp độ thành phần (component-level)**:

```bash
python main.py
```

🎉 Chúc mừng! Test case của bạn sẽ lại vượt qua ✅ Hãy cùng phân tích những gì đã xảy ra.

*   Decorator `@observe` cho `deepeval` biết mỗi thành phần ở đâu và **tạo một LLM trace** tại thời gian thực thi.
*   Bất kỳ `metrics` nào được cung cấp cho `@observe` đều cho phép `deepeval` đánh giá thành phần đó dựa trên `LLMTestCase` bạn tạo.
*   Trong ví dụ này `AnswerRelevancyMetric()` đã được sử dụng để đánh giá `inner_component()`.
*   `dataset` chỉ định các **goldens** sẽ được sử dụng để gọi `llm_app` của bạn trong quá trình đánh giá, điều này xảy ra trong một vòng lặp for đơn giản.

Khi vòng lặp for kết thúc, `deepeval` sẽ tổng hợp tất cả các số liệu, test case trong mỗi thành phần, và chạy các đánh giá trên tất cả chúng, trước khi tạo báo cáo kiểm thử cuối cùng.

:::info
Khi bạn thực hiện LLM tracing bằng `deepeval`, bạn có thể tự động đánh giá trên **traces, spans, và threads (cuộc hội thoại) trong production**. Chỉ cần lấy một [khóa API từ Confident AI](https://app.confident-ai.com) và đặt nó trong CLI:

```bash
CONFIDENT_API_KEY="confident_us..."
```

Việc triển khai LLM tracing của `deepeval` là **không xâm phạm (non-instrusive)**, nghĩa là nó sẽ không ảnh hưởng đến bất kỳ phần nào trong mã của bạn.
:::

*   Trace (end-to-end) Evals trong Prod
*   Span (component-level) Evals trong Prod
*   Thread (conversation) Evals trong Prod

Đánh giá trên traces là [các đánh giá end-to-end](/docs/evaluation-end-to-end-llm-evals), nơi một tương tác LLM duy nhất đang được đánh giá.

[](https://confident-docs.s3.us-east-1.amazonaws.com/llm-tracing:traces.mp4)

**Đánh giá Cấp độ Trace trong Production**

Spans tạo nên một trace và đánh giá trên spans đại diện cho [các đánh giá cấp độ thành phần](/docs/evaluation-component-level-llm-evals), nơi các thành phần riêng lẻ trong ứng dụng LLM của bạn đang được đánh giá.

[](https://confident-docs.s3.us-east-1.amazonaws.com/llm-tracing:spans.mp4)

**Đánh giá Cấp độ Span trong Production**

Threads được tạo thành từ **một hoặc nhiều traces**, và đại diện cho một tương tác nhiều lượt cần được đánh giá.

[](https://confident-docs.s3.us-east-1.amazonaws.com/llm-tracing:threads.mp4)

**Đánh giá Thread (hội thoại) trong Production**

## Tiếp Tục Với Trường Hợp Sử Dụng Của Bạn

Hãy cho chúng tôi biết bạn đang xây dựng cái gì để được hướng dẫn phù hợp hơn:

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

*\*Tất cả các hướng dẫn bắt đầu nhanh đều bao gồm hướng dẫn về cách đưa đánh giá vào production ở phần cuối*

## Hai Chế Độ Đánh Giá LLM

`deepeval` cung cấp hai chế độ đánh giá chính:

[End-to-End LLM Evals](/docs/evaluation-end-to-end-llm-evals)
Tốt nhất cho: Raw LLM APIs, ứng dụng đơn giản (không có agent), chatbots, và thỉnh thoảng là RAG.
*   Coi ứng dụng LLM của bạn như một hộp đen
*   Thiết lập tối thiểu, không áp đặt
*   Có thể được đưa vào CI/CD
*   Cho một lượt và nhiều lượt

[Component-Level LLM Evals](/docs/evaluation-component-level-llm-evals)
Tốt nhất cho: AI agents, quy trình làm việc phức tạp, đánh giá MCP, RAG dựa trên thành phần.
*   Khả năng hiển thị đầy đủ vào ứng dụng LLM của bạn, kiểm thử hộp trắng
*   Thiết lập LLM tracing không xâm phạm
*   Có thể được đưa vào CI/CD
*   Tốt nhất cho một lượt

## Tài Nguyên Cần Thiết

Đây là những điều bạn chắc chắn nên tìm hiểu:

[Metrics](/docs/metrics-introduction)
Tìm hiểu về hơn 50 số liệu có sẵn, cách chọn và cách tùy chỉnh chúng.

[Datasets](/docs/evaluation-datasets)
Tìm hiểu cách chúng được sử dụng trong DeepEval, khái niệm về goldens, và cách sử dụng chúng cho các đánh giá.

[Tracing](/docs/evaluation-llm-tracing)
Tìm hiểu cách trace các ứng dụng LLM của bạn, đánh giá ở cấp độ thành phần, và giám sát trong production.

## Các Sản Phẩm Khác

Tìm hiểu thêm các dịch vụ có sẵn trong hệ sinh thái của `deepeval`:

[Confident AI](https://www.confident-ai.com/docs)
Nền tảng đám mây cho DeepEval. Cho phép cả nhóm kỹ thuật và phi kỹ thuật cộng tác trong việc kiểm thử AI, từ đánh giá trong /dev đến /prod.

[DeepTeam](https://trydeepteam.com)
DeepTeam là DeepEval dành cho kiểm thử an toàn và bảo mật AI. Phơi bày hơn 50 lỗ hổng, với hơn 20 phương pháp tấn công như tree jailbreaking, tất cả đều tự động.

## Ví Dụ Đầy Đủ

Bạn có thể tìm thấy ví dụ đầy đủ [tại đây trên Github của chúng tôi](https://github.com/confident-ai/deepeval/blob/main/examples/getting_started/test_example.py).

[Chỉnh sửa trang này](https://github.com/confident-ai/deepeval/edit/main/docs/docs/getting-started.mdx)

Cập nhật lần cuối vào **9 tháng 1, 2026** bởi **Jeffrey Ip**
