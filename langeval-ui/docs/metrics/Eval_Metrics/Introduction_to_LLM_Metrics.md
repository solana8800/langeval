# Introduction to LLM Metrics (Giới thiệu về các Metric LLM)

`deepeval` cung cấp hơn 50 metric SOTA (hiện đại nhất), sẵn sàng sử dụng để bạn bắt đầu nhanh chóng. Về cơ bản, trong khi test case đại diện cho thứ bạn đang cố gắng đo lường, thì metric đóng vai trò như cây thước dựa trên một tiêu chí quan tâm cụ thể.

## Tóm tắt Nhanh

Hầu hết các metric được định nghĩa trước trên `deepeval` đều sử dụng **LLM-as-a-judge** (LLM làm giám khảo), với các kỹ thuật khác nhau như **QAG** (question-answer-generation - tạo câu hỏi-câu trả lời), **DAG** (deep acyclic graphs - đồ thị không chu trình sâu), và **G-Eval** để chấm điểm [test cases](/docs/evaluation-test-cases), đại diện cho các tương tác nguyên tử với ứng dụng LLM của bạn.

Tất cả các metric của `deepeval` đều xuất ra một **điểm số từ 0-1** dựa trên phương trình tương ứng của nó, cũng như **lý do** cho điểm số. Một metric chỉ thành công nếu điểm đánh giá bằng hoặc lớn hơn `threshold` (ngưỡng), được mặc định là `0.5` cho tất cả các metric.

- **Custom metrics (Metric tùy chỉnh)** cho phép bạn định nghĩa **tiêu chí tùy chỉnh** của mình bằng cách sử dụng các triển khai SOTA của metric LLM-as-a-Judge bằng ngôn ngữ hàng ngày:
    - G-Eval
    - DAG (Deep Acyclic Graph)
    - Conversational G-Eval
    - Conversational DAG
    - Arena G-Eval
    - Do it yourself, 100% self-coded metrics (ví dụ: nếu bạn muốn sử dụng BLEU, ROUGE)

Bạn nên nhắm đến việc có **ít nhất một** metric tùy chỉnh trong quy trình đánh giá LLM của mình.

- **RAG metrics** tập trung vào các **thành phần retriever (truy xuất) và generator (tạo sinh)** một cách độc lập.
    - Retriever:
        - Contextual Relevancy
        - Contextual Precision
        - Contextual Recall
    - Generator:
        - Answer Relevancy
        - Faithfulness

- **Agentic metrics** đánh giá **toàn bộ luồng thực thi** của tác nhân (agent) của bạn. Trong `deepeval`, có sáu metric agentic chính:
    - Task Completion
    - Argument Correctness
    - Tool Correctness
    - Step Efficiency
    - Plan Adherence
    - Plan Quality

Metric hoàn thành nhiệm vụ (task completion) không yêu cầu test case và sẽ lấy một LLM trace để đánh giá việc hoàn thành nhiệm vụ (tức là bạn sẽ phải [thiết lập LLM tracing](/docs/evaluation-llm-tracing)).

- **Multi-turn metrics** (Metric đa lượt) có trường hợp sử dụng chính là để đánh giá chatbot và sử dụng `ConversationalTestCase`. Chúng bao gồm:
    - Knowledge Retention
    - Role Adherence
    - Conversation Completeness
    - Conversation Relevancy

Metric đa lượt đánh giá các cuộc hội thoại như một tổng thể và xem xét ngữ cảnh trước đó khi thực hiện.

- **Safety metrics** (Metric an toàn) quan tâm nhiều hơn đến bảo mật LLM. Chúng bao gồm:
    - Bias
    - Toxicity
    - Non-Advice
    - Misuse
    - PIILeakage
    - Role Violation

Đối với những người đang tìm kiếm một framework điều phối red teaming LLM đầy đủ, hãy xem [DeepTeam](https://www.trydeepteam.com/). DeepTeam là DeepEval nhưng dành riêng cho red teaming LLM.

- **Image metrics** (Metric hình ảnh) trong `deepeval` là đa phương thức theo mặc định, các metric nhắm mục tiêu hình ảnh là các metric chắc chắn mong đợi một hình ảnh trong test case. Chúng bao gồm:
    - Image Coherence
    - Image Helpfulness
    - Image Reference
    - Text-to-Image
    - Image-Editing

Lưu ý rằng các metric đa phương thức yêu cầu [`MLLMImage`s](/docs/evaluation-test-cases#mllmimage-data-model) trong `LLMTestCase`s.

- **Others**: Không đặc thù cho trường hợp sử dụng, nhưng vẫn hữu ích cho một số trường hợp:
    - Hallucination
    - Json Correctness
    - Summarization
    - Ragas

:::info
**Hầu hết các metric chỉ yêu cầu 1-2 tham số** trong một test case, vì vậy điều quan trọng là bạn phải truy cập các trang tài liệu của từng metric để tìm hiểu những gì được yêu cầu.
:::

Ứng dụng LLM của bạn có thể được đánh giá **end-to-end** (ví dụ cấp thành phần ở bên dưới) bằng cách cung cấp danh sách các metric và test case:

`main.py`

```python
from deepeval.test_case import LLMTestCase  
from deepeval.metrics import AnswerRelevancyMetric  
from deepeval import evaluate  
  
evaluate(  
    metrics=[AnswerRelevancyMetric()],  
    test_cases=[LLMTestCase(input="What's DeepEval?", actual_output="Your favorite eval framework's favorite evals framework.")]  
)
```

Nếu bạn đã đăng nhập vào [Confident AI](https://confident-ai.com) trước khi chạy đánh giá (`deepeval login` hoặc `deepeval view` trong CLI), bạn cũng sẽ nhận được toàn bộ báo cáo kiểm thử trên nền tảng.

## Tại sao chọn DeepEval Metrics?

Ngoài sự đa dạng của các metric được cung cấp, các metric của `deepeval` là một bước tiến so với các triển khai khác vì chúng:

- Là LLM-as-as-Judge (`GEval`) được hỗ trợ bởi nghiên cứu.
- Một trong những loại được sử dụng nhiều nhất trên thế giới (hơn 20 triệu đánh giá hàng ngày).
- Làm cho điểm số metric tất định trở nên khả thi (khi sử dụng `DAGMetric`).
- Cực kỳ đáng tin cậy vì LLM chỉ được sử dụng cho các nhiệm vụ cực kỳ giới hạn trong quá trình đánh giá để giảm đáng kể tính ngẫu nhiên và sự không ổn định trong điểm số.
- Cung cấp lý do toàn diện cho các điểm số được tính toán.
- Tích hợp 100% với Confident AI.

## Tạo Metric Đầu tiên của Bạn

### Custom Metrics (Metric Tùy chỉnh)

`deepeval` cung cấp G-Eval, một framework đánh giá LLM hiện đại cho phép bất kỳ ai tạo metric đánh giá LLM tùy chỉnh bằng ngôn ngữ tự nhiên. G-Eval có sẵn cho tất cả các đánh giá đơn lượt, đa lượt và đa phương thức.

- G-Eval
- Conversational G-Eval

```python
from deepeval.test_case import LLMTestCase, LLMTestCaseParams  
from deepeval.metrics import GEval  
  
test_case = LLMTestCase(input="...", actual_output="...", expected_output="...")  
correctness = GEval(  
    name="Correctness",  
    criteria="Correctness - determine if the actual output is correct according to the expected output.",  
    evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],  
    strict_mode=True  
)  
  
correctness.measure(test_case)  
print(correctness.score, correctness.reason)
```

```python
from deepeval.test_case import Turn, TurnParams, ConversationalTestCase  
from deepeval.metrics import ConversationalGEval  
  
convo_test_case = ConversationalTestCase(turns=[Turn(role="...", content="..."), Turn(role="...", content="...")])  
professionalism_metric = ConversationalGEval(  
    name="Professionalism",  
    criteria="Determine whether the assistant has acted professionally based on the content."  
    evaluation_params=[TurnParams.CONTENT],  
    strict_mode=True  
)  
  
professionalism_metric.measure(convo_test_case)  
print(professionalism_metric.score, professionalism_metric.reason)
```

Về cơ bản, `deepeval` trước tiên tạo ra một loạt các bước đánh giá, trước khi sử dụng các bước này kết hợp với thông tin trong một `LLMTestCase` để đánh giá. Để biết thêm thông tin, hãy truy cập [trang tài liệu G-Eval.](/docs/metrics-llm-evals)

:::tip
Nếu bạn đang tìm kiếm LLM-as-a-Judge dựa trên cây quyết định (decision-tree), hãy xem metric [Deep Acyclic Graph (DAG)](/docs/metrics-dag).
:::

### Default Metrics (Metric Mặc định)

- RAG
- Agents
- Chatbots
- Images
- Safety

Các metric RAG được sử dụng nhiều nhất bao gồm:

- **Answer Relevancy:** Đánh giá xem câu trả lời được tạo ra có liên quan đến truy vấn của người dùng hay không.
- **Faithfulness:** Đo lường xem câu trả lời được tạo ra có nhất quán về mặt thực tế với ngữ cảnh được cung cấp hay không.
- **Contextual Relevancy:** Đánh giá xem ngữ cảnh được truy xuất có liên quan đến truy vấn của người dùng hay không.
- **Contextual Recall:** Đánh giá xem ngữ cảnh được truy xuất có chứa tất cả thông tin liên quan hay không.
- **Contextual Precision:** Đo lường xem ngữ cảnh được truy xuất có chính xác và tập trung hay không.

Có thể được nhập đơn giản từ module `deepeval.metrics`:

`main.py`

```python
from deepeval.test_case import LLMTestCase  
from deepeval.metrics import AnswerRelevancyMetric  
  
test_case = LLMTestCase(input="...", actual_output="...")  
relevancy = AnswerRelevancyMetric(threshold=0.5)  
  
relevancy.measure(test_case)  
print(relevancy.score, relevancy.reason)
```

Các metric agentic được sử dụng nhiều nhất bao gồm:

- **Task Completion:** Đánh giá xem tác nhân có hoàn thành thành công một nhiệm vụ nhất định cho một LLM trace nhất định hay không.
- **Tool Correctness:** Đánh giá xem các công cụ có được gọi và sử dụng chính xác hay không.

Không cần nhiều metric cho các tác nhân vì hầu hết được xử lý bởi task completion. Để sử dụng metric hoàn thành nhiệm vụ, bạn phải [thiết lập tracing](/docs/evaluation-llm-tracing) (giống như đối với các đánh giá cấp thành phần được hiển thị ở trên):

`main.py`

```python
from deepeval.metrics import TaskCompletionMetric  
from deepeval.tracing import observe  
from deepeval.dataset import Golden  
from deepeval import evaluate  
  
task_completion = TaskCompletionMetric(threshold=0.5)  
  
@observe(metrics=[task_completion])  
def trip_planner_agent(input):  
  
    @observe()  
    def itinerary_generator(destination, days):  
        return ["Eiffel Tower", "Louvre Museum", "Montmartre"][:days]  
  
    return itinerary_generator("Paris", 2)  
  
evaluate(observed_callback=trip_planner_agent, goldens=[Golden(input="Paris, 2")])
```

Chatbot yêu cầu các metric "hội thoại" (hoặc đa lượt) và chúng bao gồm:

- **Conversation Completeness:** Đánh giá xem cuộc hội thoại có thỏa mãn nhu cầu của người dùng hay không.
- **Conversation Relevancy:** Đo lường xem các đầu ra được tạo ra có liên quan đến đầu vào của người dùng hay không.
- **Role Adherence:** Đánh giá xem chatbot có giữ đúng nhân vật trong suốt cuộc hội thoại hay không.
- **Knowledge Retention:** Đánh giá xem chatbot có khả năng lưu giữ kiến thức đã học trong suốt cuộc hội thoại hay không.

Bạn cũng sẽ cần sử dụng [`ConversationalTestCase`](/docs/evaluation-multiturn-test-cases#conversational-test-case) thay vì `LLMTestCase` thông thường cho các metric hội thoại:

`main.py`

```python
from deepeval.test_case import Turn, ConversationalTestCase  
from deepeval.metrics import ConversationalGEval  
  
convo_test_case = ConversationalTestCase(turns=[Turn(role="...", content="..."), Turn(role="...", content="...")])  
role_adherence = RoleAdherenceMetric(threshold=0.5)  
  
role_adherence.measure(convo_test_case)  
print(role_adherence.score, role_adherence.reason)
```

```python
from deepeval.test_case import LLMTestCase, MLLMImage  
from deepeval.metrics import ImageCoherenceMetric  
  
test_case = LLMTestCase(input=f"What does thsi image say? {MLLMImage(...)}", actual_output="No idea!")  
image_coherence = ImageCoherenceMetric(threshold=0.5)  
  
image_coherence.measure(m_test_case)  
print(image_coherence.score, image_coherence.reason)
```

```python
from deepeval.test_case import LLMTestCase  
from deepeval.metrics import BiasMetric  
  
test_case = LLMTestCase(input="...", actual_output="...")  
bias = BiasMetric(threshold=0.5)  
  
bias.measure(test_case)  
print(bias.score, bias.reason)
```

## Chọn Metric của Bạn

Đây là các danh mục metric cần xem xét khi chọn metric của bạn:

- **Custom metrics (Metric tùy chỉnh)** dành riêng cho trường hợp sử dụng và không phụ thuộc vào kiến trúc:
    - G-Eval – tốt nhất cho các tiêu chí **chủ quan** như độ chính xác, sự mạch lạc, hoặc giọng điệu; dễ thiết lập.
    - DAG – metric **cây quyết định** cho các tiêu chí **khách quan hoặc hỗn hợp** (ví dụ: xác minh định dạng trước giọng điệu).
    - Bắt đầu với G-Eval cho đơn giản; sử dụng DAG để kiểm soát nhiều hơn. Bạn cũng có thể tạo lớp con `BaseMetric` để tạo metric riêng của mình.
- **Generic metrics (Metric chung)** dành riêng cho hệ thống và không phụ thuộc vào trường hợp sử dụng:
    - RAG metrics: đo lường retriever và generator riêng biệt.
    - Agent metrics: đánh giá việc sử dụng công cụ và hoàn thành nhiệm vụ.
    - Multi-turn metrics: đo lường chất lượng đối thoại tổng thể.
    - Kết hợp các metric này cho các hệ thống LLM đa thành phần.
- **Reference vs. Referenceless (Dựa trên tham chiếu vs. Không tham chiếu)**:
    - Các metric dựa trên tham chiếu cần **ground truth** (ví dụ: contextual recall hoặc tool correctness).
    - Các metric không tham chiếu hoạt động **không cần dữ liệu được dán nhãn**, lý tưởng cho đánh giá trực tuyến hoặc sản xuất.
    - Kiểm tra tài liệu của từng metric để biết các tham số bắt buộc.

:::info
Nếu bạn đang chạy các metric trong môi trường sản xuất, bạn *phải* chọn một metric không tham chiếu vì sẽ không có dữ liệu được dán nhãn.
:::

Khi quyết định về các metric, bất kể hấp dẫn đến mức nào, hãy cố gắng giới hạn bản thân ở **không quá 5 metric**, với sự phân chia như sau:

- **2-3** metric chung, dành riêng cho hệ thống (ví dụ: contextual precision cho RAG, tool correctness cho agents).
- **1-2** metric tùy chỉnh, dành riêng cho trường hợp sử dụng (ví dụ: sự hữu ích cho chatbot y tế, độ chính xác định dạng cho tóm tắt).

Mục tiêu là buộc bạn phải ưu tiên và xác định rõ ràng các tiêu chí đánh giá của mình. Điều này không chỉ giúp bạn sử dụng `deepeval` mà còn giúp bạn hiểu điều gì bạn quan tâm nhất trong ứng dụng LLM của mình.

Dưới đây là một số ý tưởng bổ sung nếu bạn không chắc chắn:

- **RAG**: Tập trung vào `AnswerRelevancyMetric` (đánh giá sự liên kết của `actual_output` với `input`) và `FaithfulnessMetric` (kiểm tra ảo giác so với `retrieved_context`).
- **Agents**: Sử dụng `ToolCorrectnessMetric` để xác minh việc lựa chọn và sử dụng công cụ phù hợp.
- **Chatbots**: Triển khai `ConversationCompletenessMetric` để đánh giá chất lượng cuộc hội thoại tổng thể.
- **Custom Requirements (Yêu cầu tùy chỉnh)**: Khi các metric tiêu chuẩn không phù hợp với nhu cầu của bạn, hãy tạo các đánh giá tùy chỉnh với framework `G-Eval` hoặc `DAG`.

Trong một số trường hợp, khi mô hình LLM của bạn đang thực hiện hầu hết các công việc nặng nhọc, việc có nhiều metric dành riêng cho trường hợp sử dụng hơn là điều không hiếm.

## Cấu hình LLM Judges (Giám khảo LLM)

Bạn có thể sử dụng **BẤT KỲ** LLM judge nào trong `deepeval`, bao gồm OpenAI, Azure OpenAI, Ollama, Anthropic, Gemini, LiteLLM, v.v. Bạn cũng có thể bọc API LLM của riêng mình trong lớp `DeepEvalBaseLLM` của `deepeval` để sử dụng BẤT KỲ mô hình nào bạn chọn. [Nhấn vào đây](/guides/guides-using-custom-llms) để xem hướng dẫn đầy đủ.

Để sử dụng OpenAI cho các metric LLM của `deepeval`, hãy cung cấp `OPENAI_API_KEY` của bạn trong CLI:

```bash
export OPENAI_API_KEY=<your-openai-api-key>
```

Ngoài ra, nếu bạn đang làm việc trong môi trường notebook (Jupyter hoặc Colab), hãy thiết lập `OPENAI_API_KEY` của bạn trong một ô:

```python
%env OPENAI_API_KEY=<your-openai-api-key>
```

:::note
Vui lòng **không bao gồm** dấu ngoặc kép khi thiết lập `API_KEYS` làm biến môi trường nếu bạn đang làm việc trong môi trường notebook.
:::

`deepeval` cũng cho phép bạn sử dụng Azure OpenAI cho các metric được đánh giá bằng LLM. Chạy lệnh sau trong CLI để cấu hình môi trường `deepeval` của bạn sử dụng Azure OpenAI cho **tất cả** các metric dựa trên LLM.

```bash
deepeval set-azure-openai \  
    --base-url=<endpoint> \ # e.g. https://example-resource.azure.openai.com/  
    --model=<model_name> \ # e.g. gpt-4.1  
    --deployment-name=<deployment_name> \  # e.g. Test Deployment  
    --api-version=<api_version> \ # e.g. 2025-01-01-preview  
    --model-version=<model_version> # e.g. 2024-11-20
```

:::info
Phiên bản OpenAI API của bạn phải ít nhất là `2024-08-01-preview`, khi đầu ra có cấu trúc được phát hành.

Lưu ý rằng `model-version` là **tùy chọn**. Nếu bạn muốn ngừng sử dụng Azure OpenAI và quay lại OpenAI thông thường, chỉ cần chạy:

```bash
deepeval unset-azure-openai
```
:::

:::note
Trước khi bắt đầu, hãy đảm bảo [mô hình Ollama](https://ollama.com/search) của bạn đã được cài đặt và đang chạy. Bạn cũng có thể xem danh sách đầy đủ các mô hình có sẵn bằng cách nhấp vào liên kết trước đó.

```bash
ollama run deepseek-r1:1.5b
```

Để sử dụng các mô hình **Ollama** cho các metric của bạn, hãy chạy `deepeval set-ollama --model=<model>` trong CLI của bạn. Ví dụ:

```bash
deepeval set-ollama --model=deepseek-r1:1.5b
```

Tùy chọn, bạn có thể chỉ định **base URL** của phiên bản mô hình Ollama cục bộ của mình nếu bạn đã định nghĩa một cổng tùy chỉnh. Base URL mặc định được đặt thành `http://localhost:11434`.

```bash
deepeval set-ollama --model=deepseek-r1:1.5b \  
    --base-url="http://localhost:11434"
```

Để ngừng sử dụng mô hình Ollama cục bộ và quay lại OpenAI, hãy chạy:

```bash
deepeval unset-ollama
```
:::

:::caution
Lệnh `deepeval set-ollama` được sử dụng riêng để cấu hình các mô hình LLM. Nếu bạn có ý định sử dụng mô hình embedding tùy chỉnh từ Ollama với synthesizer, vui lòng [tham khảo phần này của hướng dẫn](/guides/guides-using-custom-embedding-models).
:::

Để sử dụng các mô hình Gemini với `deepeval`, hãy chạy lệnh sau trong CLI của bạn.

```bash
deepeval set-gemini \  
    --model=<model_name> # e.g. "gemini-2.0-flash-001"
```

`deepeval` cho phép bạn sử dụng **BẤT KỲ** LLM tùy chỉnh nào để đánh giá. Điều này bao gồm các LLM từ module `chat_model` của langchain, thư viện `transformers` của Hugging Face, hoặc thậm chí các LLM ở định dạng GGML.

Tất cả các ví dụ có thể được [tìm thấy tại đây](/guides/guides-using-custom-llms#more-examples), nhưng dưới đây là một ví dụ nhanh về mô hình Azure OpenAI tùy chỉnh thông qua module `AzureChatOpenAI` của langchain để đánh giá:

```python
from langchain_openai import AzureChatOpenAI  
from deepeval.models.base_model import DeepEvalBaseLLM  
  
class AzureOpenAI(DeepEvalBaseLLM):  
    def __init__(  
        self,  
        model  
    ):  
        self.model = model  
  
    def load_model(self):  
        return self.model  
  
    def generate(self, prompt: str) -> str:  
        chat_model = self.load_model()  
        return chat_model.invoke(prompt).content  
  
    async def a_generate(self, prompt: str) -> str:  
        chat_model = self.load_model()  
        res = await chat_model.ainvoke(prompt)  
        return res.content  
  
    def get_model_name(self):  
        return "Custom Azure OpenAI Model"  
  
# Replace these with real values  
custom_model = AzureChatOpenAI(  
    openai_api_version=api_version,  
    azure_deployment=azure_deployment,  
    azure_endpoint=azure_endpoint,  
    openai_api_key=openai_api_key,  
)  
azure_openai = AzureOpenAI(model=custom_model)  
print(azure_openai.generate("Write me a joke"))
```

Khi tạo một mô hình đánh giá LLM tùy chỉnh, bạn nên **LUÔN LUÔN**:

- kế thừa `DeepEvalBaseLLM`.
- triển khai phương thức `get_model_name()`, đơn giản trả về một chuỗi đại diện cho tên mô hình tùy chỉnh của bạn.
- triển khai phương thức `load_model()`, chịu trách nhiệm trả về một đối tượng mô hình.
- triển khai phương thức `generate()` với **một và chỉ một** tham số kiểu chuỗi đóng vai trò là prompt cho LLM tùy chỉnh của bạn.
- phương thức `generate()` nên trả về chuỗi đầu ra cuối cùng của LLM tùy chỉnh của bạn.
- triển khai phương thức `a_generate()`, với cùng chữ ký hàm như `generate()`. **Lưu ý rằng đây là một phương thức async**.

:::tip
Phương thức `a_generate()` là thứ `deepeval` sử dụng để tạo đầu ra LLM khi bạn thực thi các metric / chạy đánh giá bất đồng bộ.

Nếu đối tượng mô hình tùy chỉnh của bạn không có giao diện bất đồng bộ, chỉ cần sử dụng lại cùng mã từ `generate()`. Tuy nhiên, điều này sẽ làm cho `a_generate()` trở thành một quá trình chặn, bất kể bạn có bật `async_mode` cho một metric hay không.
:::

Cuối cùng, để sử dụng nó cho đánh giá cho một LLM-Eval:

```python
from deepeval.metrics import AnswerRelevancyMetric  
...  
  
metric = AnswerRelevancyMetric(model=azure_openai)
```

:::note
Trong khi lệnh Azure OpenAI cấu hình `deepeval` để sử dụng Azure OpenAI trên toàn cục cho tất cả các LLM-Eval, một LLM tùy chỉnh phải được thiết lập mỗi khi bạn khởi tạo một metric. Hãy nhớ cung cấp phiên bản LLM tùy chỉnh của bạn thông qua tham số `model` cho các metric bạn muốn sử dụng nó.
:::

:::caution
Hệ thống **KHÔNG THỂ** đảm bảo rằng các đánh giá sẽ hoạt động như mong đợi khi sử dụng một mô hình tùy chỉnh. Điều này là do đánh giá đòi hỏi mức độ suy luận cao và khả năng làm theo hướng dẫn như xuất câu trả lời ở định dạng JSON hợp lệ. [**Để kích hoạt tốt hơn các LLM tùy chỉnh xuất ra JSON hợp lệ, hãy đọc hướng dẫn này**](/guides/guides-using-custom-llms).

Ngoài ra, nếu bạn thấy mình gặp lỗi JSON và muốn bỏ qua nó, hãy sử dụng cờ [`-c` và `-i` trong khi `deepeval test run`](/docs/evaluation-flags-and-configs#flags-for-deepeval-test-run):

```bash
deepeval test run test_example.py -i -c
```

Cờ `-i` bỏ qua lỗi trong khi cờ `-c` sử dụng bộ đệm `deepeval` cục bộ, vì vậy đối với một lần chạy thử nghiệm thành công một phần, bạn không phải chạy lại các test case không bị lỗi.
:::

## Sử dụng Metrics

Có ba cách bạn có thể sử dụng các metric:

1. **End-to-end evals** (Đánh giá đầu cuối), coi hệ thống LLM của bạn như một hộp đen và đánh giá đầu vào và đầu ra của hệ thống.
2. **Component-level evals** (Đánh giá cấp thành phần), đặt các metric trên các thành phần riêng lẻ trong ứng dụng LLM của bạn thay thế.
3. **One-off (or standalone) evals** (Đánh giá một lần hoặc độc lập), nơi bạn sẽ sử dụng một metric để thực thi nó riêng lẻ.

### Cho End-to-End Evals

Để chạy đánh giá end-to-end cho hệ thống LLM của bạn bằng bất kỳ metric nào bạn chọn, chỉ cần cung cấp một danh sách các [test cases](/docs/evaluation-test-cases) để đánh giá các metric của bạn dựa trên đó:

```python
from deepeval.test_case import LLMTestCase  
from deepeval.metrics import AnswerRelevancyMetric  
from deepeval import evaluate  
  
test_case = LLMTestCase(input="...", actual_output="...")  
  
evaluate(test_cases=[test_case], metrics=[AnswerRelevancyMetric()])
```

Hàm [`evaluate()`](/docs/evaluation-introduction#evaluating-without-pytest) hoặc `deepeval test run` **là cách tốt nhất để chạy đánh giá**. Chúng cung cấp vô số tính năng ngay lập tức, bao gồm caching, song song hóa, theo dõi chi phí, xử lý lỗi và tích hợp với [Confident AI.](https://confident-ai.com)

:::tip
[`deepeval test run`](/docs/evaluation-introduction#evaluating-with-pytest) là tích hợp Pytest gốc của `deepeval`, cho phép bạn chạy evals trong các đường ống CI/CD.
:::

### Cho Component-Level Evals

Để chạy đánh giá cấp thành phần cho hệ thống LLM của bạn bằng bất kỳ metric nào bạn chọn, chỉ cần trang trí các thành phần của bạn bằng `@observe` và tạo [test cases](/docs/evaluation-test-cases) tại thời điểm chạy:

```python
from deepeval.dataset import EvaluationDataset, Golden  
from deepeval.tracing import observe, update_current_span  
from deepeval.metrics import AnswerRelevancyMetric  
  
# 1. observe() decorator traces LLM components  
@observe()  
def llm_app(input: str):  
    # 2. Supply metric at any component  
    @observe(metrics=[AnswerRelevancyMetric()])  
    def nested_component():  
        # 3. Create test case at runtime  
        update_current_span(test_case=LLMTestCase(...))  
        pass  
  
    nested_component()  
  
# 4. Create dataset  
dataset = EvaluationDataset(goldens=[Golden(input="Test input")])  
  
# 5. Loop through dataset  
for goldens in dataset.evals_iterator():  
    # Call LLM app  
    llm_app(golden.input)
```

### Cho One-Off Evals

Bạn cũng có thể thực thi từng metric riêng lẻ. Tất cả các metric trong `deepeval`, bao gồm [metric tùy chỉnh mà bạn tạo](/docs/metrics-custom):

- có thể được thực thi thông qua phương thức `metric.measure()`
- có thể truy cập điểm số thông qua `metric.score`, nằm trong khoảng từ 0 - 1
- có thể truy cập lý do điểm số thông qua `metric.reason`
- có thể truy cập trạng thái thông qua `metric.is_successful()`
- có thể được sử dụng để đánh giá các test case hoặc toàn bộ tập dữ liệu, có hoặc không có Pytest
- có một `threshold` đóng vai trò là ngưỡng thành công. `metric.is_successful()` chỉ đúng nếu `metric.score` trên/dưới `threshold`
- có thuộc tính `strict_mode`, khi được bật sẽ buộc `metric.score` thành nhị phân
- có thuộc tính `verbose_mode`, khi được bật sẽ in nhật ký metric bất cứ khi nào một metric được thực thi

Ngoài ra, tất cả các metric trong `deepeval` thực thi bất đồng bộ theo mặc định. Bạn có thể cấu hình hành vi này bằng tham số `async_mode` khi khởi tạo một metric.

:::tip
Truy cập trang metric riêng lẻ để tìm hiểu cách chúng được tính toán và những gì được yêu cầu khi tạo một `LLMTestCase` để thực thi nó.
:::

Dưới đây là một ví dụ nhanh:

```python
from deepeval.metrics import AnswerRelevancyMetric  
from deepeval.test_case import LLMTestCase  
  
# Initialize a test case  
test_case = LLMTestCase(...)  
  
# Initialize metric with threshold  
metric = AnswerRelevancyMetric(threshold=0.5)  
metric.measure(test_case)  
  
print(metric.score, metric.reason)
```

Tất cả các metric của `deepeval` đều đưa ra một `reason` cùng với điểm số của nó.

## Sử dụng Metrics Async (Bất đồng bộ)

Khi `async_mode=True` của một metric (đây là mặc định cho tất cả các metric), việc gọi `metric.measure()` sẽ thực thi các thuật toán bên trong đồng thời. Tuy nhiên, điều quan trọng cần lưu ý là trong khi các hoạt động **BÊN TRONG** `measure()` thực thi đồng thời, bản thân lệnh gọi `metric.measure()` vẫn chặn luồng chính.

:::info
Hãy lấy [thuật toán `FaithfulnessMetric`](/docs/metrics-faithfulness#how-is-it-calculated) làm ví dụ:

1. **Trích xuất tất cả các tuyên bố thực tế** được đưa ra trong `actual_output`
2. **Trích xuất tất cả các sự thật thực tế** được tìm thấy trong `retrieval_context`
3. **So sánh các tuyên bố và sự thật đã trích xuất** để tạo ra điểm số cuối cùng và lý do.

```python
from deepeval.metrics import FaithfulnessMetric  
...  
  
metric = FaithfulnessMetric(async_mode=True)  
metric.measure(test_case)  
print("Metric finished!")
```

Khi `async_mode=True`, các bước 1 và 2 thực thi đồng thời (tức là cùng một lúc) vì chúng độc lập với nhau, trong khi `async_mode=False` khiến các bước 1 và 2 thực thi tuần tự (tức là cái này sau cái kia).

Trong cả hai trường hợp, "Metric finished!" sẽ đợi `metric.measure()` chạy xong trước khi in, nhưng đặt `async_mode` thành `True` sẽ làm cho câu lệnh in xuất hiện sớm hơn, vì `async_mode=True` cho phép `metric.measure()` chạy nhanh hơn.
:::

Để đo lường nhiều metric cùng một lúc và **KHÔNG** chặn luồng chính, hãy sử dụng phương thức bất đồng bộ `a_measure()` thay thế.

```python
import asyncio  
...  
  
# Remember to use async  
async def long_running_function():  
    # These will all run at the same time  
    await asyncio.gather(  
        metric1.a_measure(test_case),  
        metric2.a_measure(test_case),  
        metric3.a_measure(test_case),  
        metric4.a_measure(test_case)  
    )  
    print("Metrics finished!")  
  
asyncio.run(long_running_function())
```

## Debug Một Đánh giá Metric

Bạn có thể bật `verbose_mode` cho **BẤT KỲ** metric `deepeval` nào khi khởi tạo metric để gỡ lỗi một metric bất cứ khi nào phương thức `measure()` hoặc `a_measure()` được gọi:

```python
...  
  
metric = AnswerRelevancyMetric(verbose_mode=True)  
metric.measure(test_case)
```

:::note
Bật `verbose_mode` sẽ in các hoạt động bên trong của một metric bất cứ khi nào `measure()` hoặc `a_measure()` được gọi.
:::

## Tùy chỉnh Metric Prompts

Tất cả các metric của `deepeval` đều sử dụng đánh giá LLM-as-a-judge với các mẫu prompt mặc định duy nhất cho mỗi metric. Mặc dù `deepeval` có các thuật toán được thiết kế tốt cho mỗi metric, bạn có thể tùy chỉnh các mẫu prompt này để cải thiện độ chính xác và ổn định của đánh giá. Đơn giản chỉ cần cung cấp một lớp mẫu tùy chỉnh làm tham số `evaluation_template` cho metric bạn chọn (ví dụ bên dưới).

:::info
Ví dụ, trong `AnswerRelevancyMetric`, bạn có thể không đồng ý với những gì chúng tôi coi là "liên quan", nhưng với khả năng này, giờ đây bạn có thể ghi đè bất kỳ ý kiến nào mà `deepeval` có trong các prompt đánh giá mặc định của nó.

Bạn sẽ thấy điều này đặc biệt có giá trị khi [sử dụng một LLM tùy chỉnh](/guides/guides-using-custom-llms), vì các metric mặc định của `deepeval` được tối ưu hóa cho các mô hình của OpenAI, thường mạnh hơn hầu hết các LLM tùy chỉnh.
:::

:::note
Điều này có nghĩa là bạn có thể xử lý tốt hơn các đầu ra JSON không hợp lệ (cùng với [giới hạn JSON](/guides/guides-using-custom-llms#json-confinement-for-custom-llms)) đi kèm với các mô hình yếu hơn, và cung cấp các ví dụ tốt hơn cho việc học trong ngữ cảnh (in-context learning) cho các giám khảo LLM tùy chỉnh của bạn để có độ chính xác metric tốt hơn.
:::

Dưới đây là một ví dụ nhanh về cách bạn có thể định nghĩa một `AnswerRelevancyTemplate` tùy chỉnh và tiêm nó vào `AnswerRelevancyMetric` thông qua tham số `evaluation_params`:

```python
from deepeval.metrics import AnswerRelevancyMetric  
from deepeval.metrics.answer_relevancy import AnswerRelevancyTemplate  
  
# Define custom template  
class CustomTemplate(AnswerRelevancyTemplate):  
    @staticmethod  
    def generate_statements(actual_output: str):  
        return f"""Given the text, breakdown and generate a list of statements presented.  
  
Example:  
Our new laptop model features a high-resolution Retina display for crystal-clear visuals.  
  
{{  
    "statements": [  
        "The new laptop model has a high-resolution Retina display."  
    ]  
}}  
===== END OF EXAMPLE ======  
  
Text:  
{actual_output}  
  
JSON:  
"""  
  
# Inject custom template to metric  
metric = AnswerRelevancyMetric(evaluation_template=CustomTemplate)  
metric.measure(...)
```

:::tip
Bạn có thể tìm thấy các ví dụ về cách thực hiện điều này chi tiết hơn trên phần **Customize Your Template** của mỗi trang metric riêng lẻ, hiển thị các ví dụ mã và liên kết đến GitHub của `deepeval` hiển thị các mẫu mặc định hiện đang được sử dụng.
:::

## Còn về các Metric Không phải LLM-as-a-judge thì sao?

Nếu bạn đang tìm cách sử dụng thứ gì đó như **ROUGE**, **BLEU**, hoặc **BLEURT**, v.v., bạn có thể tạo một metric tùy chỉnh và sử dụng module `scorer` có sẵn trong `deepeval` để chấm điểm bằng cách làm theo [hướng dẫn này](/docs/metrics-custom).

[Module `scorer`](https://github.com/confident-ai/deepeval/blob/main/deepeval/scorer/scorer.py) có sẵn nhưng không được ghi trong tài liệu vì kinh nghiệm của chúng tôi cho thấy các bộ chấm điểm này không hữu ích như các metric LLM, nơi đầu ra đòi hỏi mức độ suy luận cao để đánh giá.
