---
title: Đánh giá LLM End-to-End
---

# Đánh giá LLM End-to-End

Đánh giá end-to-end đánh giá các đầu vào và đầu ra "có thể quan sát được" của ứng dụng LLM của bạn - đó là những gì người dùng nhìn thấy, và coi ứng dụng LLM của bạn như một hộp đen.

![end-to-end evals](../images/ab9e086d.png)

**Khi nào bạn nên chạy đánh giá End-to-End?**

Đối với các ứng dụng LLM đơn giản như các pipeline RAG cơ bản với kiến trúc "phẳng" có thể được biểu diễn bằng một `LLMTestCase` duy nhất, đánh giá end-to-end là lý tưởng. Các trường hợp sử dụng phổ biến phù hợp cho đánh giá end-to-end bao gồm (nhưng không giới hạn):

* RAG QA (Hỏi đáp RAG)
* PDF extraction (Trích xuất PDF)
* Writing assitants (Trợ lý viết lách)
* Summarization (Tóm tắt)
* v.v.

Bạn sẽ nhận thấy rằng các trường hợp sử dụng với kiến trúc đơn giản hơn phù hợp hơn cho đánh giá end-to-end. Tuy nhiên, nếu hệ thống của bạn là một quy trình làm việc agentic cực kỳ phức tạp, bạn cũng có thể thấy đánh giá end-to-end phù hợp hơn vì bạn có thể kết luận rằng đánh giá cấp thành phần mang lại quá nhiều nhiễu trong kết quả đánh giá của nó.

Hầu hết những gì bạn thấy trong [quickstart](/docs/getting-started) của DeepEval là đánh giá end-to-end!

## Đánh giá E2E là gì

Chạy một đánh giá LLM end-to-end tạo ra một **test run** — một tập hợp các test cases đo lường hiệu năng ứng dụng LLM của bạn tại một thời điểm cụ thể. Bạn thường sẽ:

* Lặp qua một danh sách các `Golden`s
* Gọi ứng dụng LLM của bạn với mỗi `input` của golden
* Tạo một tập hợp các test cases sẵn sàng cho đánh giá
* Áp dụng metrics cho các test cases của bạn và chạy đánh giá

:::info
Để nhận được một [báo cáo kiểm thử LLM](https://www.confident-ai.com/docs/llm-evaluation/dashboards/testing-reports) đầy đủ hơn có thể chia sẻ, hãy đăng nhập vào Confident AI [tại đây](https://app.confident-ai.com) hoặc chạy lệnh sau trong terminal của bạn:

```bash
deepeval login
```
:::

## Thiết lập môi trường kiểm thử của bạn

### Tạo một dataset

[Datasets](/docs/evaluation-datasets) trong `deepeval` cho phép bạn lưu trữ [`Golden`](/docs/evaluation-datasets#what-are-goldens)s, giống như tiền thân của các test cases. Chúng cho phép bạn tạo test case một cách linh hoạt trong thời gian đánh giá bằng cách gọi ứng dụng LLM của bạn. Đây là cách bạn có thể tạo goldens:

* Single-Turn (Lượt đơn)
* Multi-Turn (Đa lượt)

```python
from deepeval.dataset import Golden  
  
goldens=[  
    Golden(input="What is your name?"),  
    Golden(input="Choose a number between 1 to 100"),  
    ...  
]
```

```python
from deepeval.dataset import ConversationalGolden  
  
goldens = [  
    ConversationalGolden(  
        scenario="Andy Byron wants to purchase a VIP ticket to a Coldplay concert.",  
        expected_outcome="Successful purchase of a ticket.",  
        user_description="Andy Byron is the CEO of Astronomer.",  
    ),  
    ...  
]
```

Bạn cũng có thể tạo goldens tổng hợp tự động bằng cách sử dụng `Synthesizer`. Tìm hiểu thêm [tại đây](/docs/synthesizer-introduction). Bây giờ bạn có thể sử dụng các goldens này để tạo một evaluation dataset có thể được lưu trữ và tải lại bất cứ lúc nào.

Dưới đây là ví dụ cho thấy cách bạn có thể tạo và lưu trữ datasets trong `deepeval`:

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

### Chọn metrics

Khi nói đến việc chọn metrics cho ứng dụng của bạn, chúng tôi khuyên bạn nên chọn không quá 5 metrics, bao gồm:

* (2 - 3) **Generic metrics** (Metrics chung) cho loại ứng dụng của bạn. (*ví dụ: Agents, RAG, Chabot*)
* (1 - 2) **Custom metrics** (Metrics tùy chỉnh) cho trường hợp sử dụng cụ thể của bạn.

Bạn có thể đọc [phần metrics](/docs/metrics-introduction) của chúng tôi để tìm hiểu về hơn 50 metrics mà chúng tôi cung cấp. Hoặc đến [discord của chúng tôi](https://discord.com/invite/a3K9c8GRGt) và nhận một số đề xuất phù hợp từ đội ngũ của chúng tôi.

Bây giờ bạn có thể sử dụng các test cases và metrics này để chạy đánh giá end-to-end [lượt đơn (single-turn)](#single-turn-end-to-end-evals) và [đa lượt (multi-turn)](#multi-turn-end-to-end-evals). Nếu bạn đã thiết lập [tracing](/docs/evaluation-llm-tracing) cho ứng dụng LLM của mình, bạn có thể tự động [chạy đánh giá end-to-end cho traces](#end-to-end-evals-for-tracing) bằng cách sử dụng một dòng code.

## Đánh giá E2E lượt đơn (Single-Turn)

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

### Tạo test cases sử dụng dataset

Bây giờ bạn có thể tạo các `LLMTestCase` bằng cách sử dụng các goldens bằng cách gọi ứng dụng LLM của bạn.

**main.py**

```python
from your_agent import your_llm_app # Replace with your LLM app  
from deepeval.dataset import EvaluationDataset  
from deepeval.test_case import LLMTestCase  
  
dataset = EvaluationDataset()  
  
test_cases = []  
  
# Create test cases from goldens  
for golden in dataset.goldens:  
    res, text_chunks = your_llm_app(golden.input)  
    test_case = LLMTestCase(input=golden.input, actual_output=res, retrieval_context=text_chunks)  
    test_cases.append(test_case)
```

Bạn cũng có thể thêm test cases trực tiếp vào dataset của mình bằng cách sử dụng phương thức `add_test_case()`.

### Chạy đánh giá end-to-end

Bạn nên truyền `test_cases` và `metrics` mà bạn đã quyết định vào hàm `evaluate()` để chạy đánh giá end-to-end.

**main.py**

```python
from your_agent import your_llm_app # Replace with your LLM app  
from deepeval.metrics import AnswerRelevancyMetric  
from deepeval import evaluate  
...  
  
evaluate(  
    test_cases=test_cases,  
    metrics=[AnswerRelevancyMetric()],  
    hyperparameters={  
        model="gpt-4.1",  
        system_prompt="..."  
    }  
)
```

Có **HAI** tham số bắt buộc và **SÁU** tham số tùy chọn khi gọi hàm `evaluate()` cho đánh giá **END-TO-END**:

* `test_cases`: một danh sách các `LLMTestCase` **HOẶC** `ConversationalTestCase`, hoặc một `EvaluationDataset`. Bạn không thể đánh giá `LLMTestCase` và `ConversationalTestCase` trong cùng một test run.
* `metrics`: một danh sách các metrics kiểu `BaseMetric`.
* [Tùy chọn] `hyperparameters`: một dict kiểu `dict[str, Union[str, int, float]]`. Bạn có thể log bất kỳ hyperparameter tùy ý nào liên quan đến test run này để chọn ra các hyperparameters tốt nhất cho ứng dụng LLM của bạn trên Confident AI.
* [Tùy chọn] `identifier`: một chuỗi cho phép bạn định danh tốt hơn test run của mình trên Confident AI.
* [Tùy chọn] `async_config`: một instance kiểu `AsyncConfig` cho phép bạn [tùy chỉnh mức độ đồng thời](/docs/evaluation-flags-and-configs#async-configs) trong quá trình đánh giá. Mặc định là các giá trị `AsyncConfig` mặc định.
* [Tùy chọn] `display_config`: một instance kiểu `DisplayConfig` cho phép bạn [tùy chỉnh những gì được hiển thị](/docs/evaluation-flags-and-configs#display-configs) ra console trong quá trình đánh giá. Mặc định là các giá trị `DisplayConfig` mặc định.
* [Tùy chọn] `error_config`: một instance kiểu `ErrorConfig` cho phép bạn [tùy chỉnh cách xử lý lỗi](/docs/evaluation-flags-and-configs#error-configs) trong quá trình đánh giá. Mặc định là các giá trị `ErrorConfig` mặc định.
* [Tùy chọn] `cache_config`: một instance kiểu `CacheConfig` cho phép bạn [tùy chỉnh hành vi caching](/docs/evaluation-flags-and-configs#cache-configs) trong quá trình đánh giá. Mặc định là các giá trị `CacheConfig` mặc định.

Điều này hoàn toàn giống với `assert_test()` trong `deepeval test run`, nhưng ở một giao diện khác.

:::tip
Hệ thống khuyên bạn nên log `hyperparameters` trong quá trình đánh giá của mình vì chúng cho phép bạn tìm ra cấu hình model tốt nhất cho ứng dụng của mình.

[](https://confident-docs.s3.us-east-1.amazonaws.com/evaluation:parameter-insights.mp4)

Parameter Insights To Find Best Model
:::

## Đánh giá E2E đa lượt (Multi-Turn)

### Bọc chatbot trong callback

Bạn cần định nghĩa một chatbot callback để tạo các test cases tổng hợp từ goldens bằng cách sử dụng `ConversationSimulator`. Vì vậy, hãy định nghĩa một hàm callback để tạo ra **phản hồi chatbot tiếp theo** trong một cuộc hội thoại, dựa trên lịch sử hội thoại.

* Python
* OpenAI
* LangChain
* LlamaIndex
* OpenAI Agents
* Pydantic

**main.py**

```python
from deepeval.test_case import Turn  
  
async def model_callback(input: str, turns: List[Turn], thread_id: str) -> Turn:  
    # Replace with your chatbot  
    response = await your_chatbot(input, turns, thread_id)  
    return Turn(role="assistant", content=response)
```

```python
from deepeval.test_case import Turn  
from openai import OpenAI  
  
client = OpenAI()  
  
async def model_callback(input: str, turns: List[Turn]) -> str:  
    messages = [  
        {"role": "system", "content": "You are a ticket purchasing assistant"},  
        *[{"role": t.role, "content": t.content} for t in turns],  
        {"role": "user", "content": input},  
    ]  
    response = await client.chat.completions.create(model="gpt-4.1", messages=messages)  
    return Turn(role="assistant", content=response.choices[0].message.content)
```

```python
from langchain_openai import ChatOpenAI  
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder  
from langchain_core.runnables.history import RunnableWithMessageHistory  
from langchain_community.chat_message_histories import ChatMessageHistory  
  
store = {}  
llm = ChatOpenAI(model="gpt-4")  
prompt = ChatPromptTemplate.from_messages([("system", "You are a ticket purchasing assistant."), MessagesPlaceholder(variable_name="history"), ("human", "{input}")])  
chain_with_history = RunnableWithMessageHistory(prompt | llm, lambda session_id: store.setdefault(session_id, ChatMessageHistory()), input_messages_key="input", history_messages_key="history")  
  
async def model_callback(input: str, thread_id: str) -> Turn:  
    response = chain_with_history.invoke(  
        {"input": input},  
        config={"configurable": {"session_id": thread_id}}  
    )  
    return Turn(role="assistant", content=response.content)
```

**main.py**

```python
from llama_index.core.storage.chat_store import SimpleChatStore  
from llama_index.llms.openai import OpenAI  
from llama_index.core.chat_engine import SimpleChatEngine  
from llama_index.core.memory import ChatMemoryBuffer  
  
chat_store = SimpleChatStore()  
llm = OpenAI(model="gpt-4")  
  
async def model_callback(input: str, thread_id: str) -> Turn:  
    memory = ChatMemoryBuffer.from_defaults(chat_store=chat_store, chat_store_key=thread_id)  
    chat_engine = SimpleChatEngine.from_defaults(llm=llm, memory=memory)  
    response = chat_engine.chat(input)  
    return Turn(role="assistant", content=response.response)
```

**main.py**

```python
from agents import Agent, Runner, SQLiteSession  
  
sessions = {}  
agent = Agent(name="Test Assistant", instructions="You are a helpful assistant that answers questions concisely.")  
  
async def model_callback(input: str, thread_id: str) -> Turn:  
    if thread_id not in sessions:  
        sessions[thread_id] = SQLiteSession(thread_id)  
    session = sessions[thread_id]  
    result = await Runner.run(agent, input, session=session)  
    return Turn(role="assistant", content=result.final_output)
```

**main.py**

```python
from pydantic_ai.messages import ModelRequest, ModelResponse, UserPromptPart, TextPart  
from deepeval.test_case import Turn  
from datetime import datetime  
from pydantic_ai import Agent  
from typing import List  
  
agent = Agent('openai:gpt-4', system_prompt="You are a helpful assistant that answers questions concisely.")  
  
async def model_callback(input: str, turns: List[Turn]) -> Turn:  
    message_history = []  
    for turn in turns:  
        if turn.role == "user":  
            message_history.append(ModelRequest(parts=[UserPromptPart(content=turn.content, timestamp=datetime.now())], kind='request'))  
        elif turn.role == "assistant":  
            message_history.append(ModelResponse(parts=[TextPart(content=turn.content)], model_name='gpt-4', timestamp=datetime.now(), kind='response'))  
    result = await agent.run(input, message_history=message_history)  
    return Turn(role="assistant", content=result.output)
```

:::info
Callback model của bạn nên chấp nhận một `input`, và tùy chọn `turns` và `thread_id`. Nó nên trả về một đối tượng `Turn`.
:::

### Tải dataset của bạn

`deepeval` hỗ trợ tải các dataset được lưu trữ trong file JSON, file CSV, và hugging face datasets vào một `EvaluationDataset` dưới dạng test cases hoặc goldens.

* Confident AI
* From JSON
* From CSV

```python
from deepeval.dataset import EvaluationDataset  
  
dataset = EvaluationDataset()  
dataset.pull(alias="My Evals Dataset")
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

```python
from deepeval.dataset import EvaluationDataset  
  
dataset = EvaluationDataset()  
  
dataset.add_goldens_from_csv_file(  
    # file_path is the absolute path to your .csv file  
    file_path="example.csv",  
    input_col_name="query"  
)
```

Bạn có thể [tìm hiểu thêm về tải datasets tại đây](/docs/evaluation-datasets#load-dataset).

### Mô phỏng lượt (Simulate turns)

Sử dụng `ConversationSimulator` của `deepeval` để mô phỏng các lượt (turns) sử dụng goldens trong dataset của bạn:

**main.py**

```python
from deepeval.conversation_simulator import ConversationSimulator  
  
simulator = ConversationSimulator(model_callback=chatbot_callback)  
conversational_test_cases = simulator.simulate(goldens=dataset.goldens, max_turns=10)
```

Ở đây, chúng ta chỉ có 1 test case, nhưng trong thực tế bạn sẽ muốn mô phỏng từ ít nhất 20 goldens.

<details>
<summary>Click to view an example simulated test case</summary>

Các test cases được tạo của bạn nên được điền với các `Turn` được mô phỏng, cùng với `scenario`, `expected_outcome`, và `user_description` từ conversation golden.

```python
ConversationalTestCase(  
    scenario="Andy Byron wants to purchase a VIP ticket to a Coldplay concert.",  
    expected_outcome="Successful purchase of a ticket.",  
    user_description="Andy Byron is the CEO of Astronomer.",  
    turns=[  
        Turn(role="user", content="Hello, how are you?"),  
        Turn(role="assistant", content="I'm doing well, thank you!"),  
        Turn(role="user", content="How can I help you today?"),  
        Turn(role="assistant", content="I'd like to buy a ticket to a Coldplay concert."),  
    ]  
)
```
</details>

### Chạy một đánh giá

Chạy một đánh giá giống như cách bạn đã học trong phần trước:

**main.py**

```python
from deepeval.metrics import TurnRelevancyMetric  
from deepeval import evaluate  
...  
  
evaluate(  
  conversational_test_cases,  
  metrics=[TurnRelevancyMetric()],  
  hyperparameters={  
      model="gpt-4.1",  
      system_prompt="..."  
  }  
)
```

Có **HAI** tham số bắt buộc và **SÁU** tham số tùy chọn khi gọi hàm `evaluate()` cho đánh giá **END-TO-END**:

* `test_cases`: một danh sách các `LLMTestCase` **HOẶC** `ConversationalTestCase`, hoặc một `EvaluationDataset`. Bạn không thể đánh giá `LLMTestCase` và `ConversationalTestCase` trong cùng một test run.
* `metrics`: một danh sách các metrics kiểu `BaseConversationalMetric`.
* [Tùy chọn] `hyperparameters`: một dict kiểu `dict[str, Union[str, int, float]]`. Bạn có thể log bất kỳ hyperparameter tùy ý nào liên quan đến test run này để chọn ra các hyperparameters tốt nhất cho ứng dụng LLM của bạn trên Confident AI.
* [Tùy chọn] `identifier`: một chuỗi cho phép bạn định danh tốt hơn test run của mình trên Confident AI.
* [Tùy chọn] `async_config`: một instance kiểu `AsyncConfig` cho phép bạn [tùy chỉnh mức độ đồng thời](/docs/evaluation-flags-and-configs#async-configs) trong quá trình đánh giá. Mặc định là các giá trị `AsyncConfig` mặc định.
* [Tùy chọn] `display_config`: một instance kiểu `DisplayConfig` cho phép bạn [tùy chỉnh những gì được hiển thị](/docs/evaluation-flags-and-configs#display-configs) ra console trong quá trình đánh giá. Mặc định là các giá trị `DisplayConfig` mặc định.
* [Tùy chọn] `error_config`: một instance kiểu `ErrorConfig` cho phép bạn [tùy chỉnh cách xử lý lỗi](/docs/evaluation-flags-and-configs#error-configs) trong quá trình đánh giá. Mặc định là các giá trị `ErrorConfig` mặc định.
* [Tùy chọn] `cache_config`: một instance kiểu `CacheConfig` cho phép bạn [tùy chỉnh hành vi caching](/docs/evaluation-flags-and-configs#cache-configs) trong quá trình đánh giá. Mặc định là các giá trị `CacheConfig` mặc định.

Điều này hoàn toàn giống với `assert_test()` trong `deepeval test run`, nhưng ở một giao diện khác.

Hệ thống thực sự khuyên bạn nên thiết lập [Confident AI](https://app.confident-ai.com) với các đánh giá `deepeval` của bạn để nhận được các báo cáo kiểm thử chuyên nghiệp và quan sát xu hướng hiệu năng của ứng dụng LLM của bạn theo thời gian như thế này:

[](https://confident-docs.s3.us-east-1.amazonaws.com/evaluation:multi-turn-e2e-report.mp4)

Test Reports After Running Evals on Confident AI

## Đánh giá E2E cho Tracing

Nếu bạn đã [thiết lập tracing](/docs/evaluation-llm-tracing) cho ứng dụng LLM của mình, bạn có thể chạy đánh giá end-to-end bằng cách sử dụng hàm `evals_iterator()`.

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

### Cập nhật test cases của bạn cho trace

Bạn có thể cập nhật các test cases end-to-end của mình cho trace bằng cách sử dụng hàm `update_current_trace` được cung cấp bởi `deepeval`

```python
from openai import OpenAI  
from deepeval.tracing import observe, update_current_trace  
  
@observe()  
def llm_app(query: str) -> str:  
  
    @observe()  
    def retriever(query: str) -> list[str]:  
        chunks = ["List", "of", "text", "chunks"]  
        update_current_trace(retrieval_context=chunks)  
        return chunks  
  
    @observe()  
    def generator(query: str, text_chunks: list[str]) -> str:  
        res = OpenAI().chat.completions.create(model="gpt-4o", messages=[{"role": "user", "content": query}]  
        ).choices[0].message.content  
        update_current_trace(input=query, output=res)  
        return res  
  
    return generator(query, retriever(query))
```

Có **HAI** cách để tạo test cases khi sử dụng hàm `update_current_trace`:

* [Tùy chọn] `test_case`: Nhận một `LLMTestCase` để tạo một span level test case cho thành phần đó.
* Hoặc, bạn cũng có thể chọn cung cấp các giá trị của `LLMTestCase` trực tiếp bằng cách sử dụng các thuộc tính sau:
  + [Tùy chọn] `input`
  + [Tùy chọn] `output`
  + [Tùy chọn] `retrieval_context`
  + [Tùy chọn] `context`
  + [Tùy chọn] `expected_output`
  + [Tùy chọn] `tools_called`
  + [Tùy chọn] `expected_tools`

:::note
Bạn có thể sử dụng các tham số `LLMTestCase` riêng lẻ trong hàm `update_current_trace` để ghi đè các giá trị của `test_case` bạn đã truyền.
:::

### Chạy đánh giá end-to-end

Bạn có thể chạy đánh giá end-to-end cho các traces của mình bằng cách cung cấp `metrics` của bạn trong hàm `evals_iterator`.

```python
from deepeval.metrics import AnswerRelevancyMetric  
from deepeval.dataset import EvaluationDataset  
  
dataset = EvaluationDataset()  
dataset.pull(alias="YOUR-DATASET-ALIAS")  
  
for golden in dataset.evals_iterator(metrics=[AnswerRelevancyMetric()]):  
    llm_app(golden.input) # Replace with your LLM app
```

Có **SÁU** tham số tùy chọn khi sử dụng `evals_iterator()`:

* [Tùy chọn] `metrics`: một danh sách các `BaseMetric` cho phép bạn chạy đánh giá end-to-end cho các traces của bạn.
* [Tùy chọn] `identifier`: một chuỗi cho phép bạn định danh tốt hơn test run của mình trên Confident AI.
* [Tùy chọn] `async_config`: một instance kiểu `AsyncConfig` cho phép bạn [tùy chỉnh mức độ đồng thời](/docs/evaluation-flags-and-configs#async-configs) trong quá trình đánh giá. Mặc định là các giá trị `AsyncConfig` mặc định.
* [Tùy chọn] `display_config`: một instance kiểu `DisplayConfig` cho phép bạn [tùy chỉnh những gì được hiển thị](/docs/evaluation-flags-and-configs#display-configs) ra console trong quá trình đánh giá. Mặc định là các giá trị `DisplayConfig` mặc định.
* [Tùy chọn] `error_config`: một instance kiểu `ErrorConfig` cho phép bạn [tùy chỉnh cách xử lý lỗi](/docs/evaluation-flags-and-configs#error-configs) trong quá trình đánh giá. Mặc định là các giá trị `ErrorConfig` mặc định.
* [Tùy chọn] `cache_config`: một instance kiểu `CacheConfig` cho phép bạn [tùy chỉnh hành vi caching](/docs/evaluation-flags-and-configs#cache-configs) trong quá trình đánh giá. Mặc định là các giá trị `CacheConfig` mặc định.

Đó là tất cả những gì cần thiết để chạy các đánh giá end-to-end, với lợi ích bổ sung là một báo cáo kiểm thử đầy đủ với tracing được bao gồm trên Confident AI.

[](https://confident-docs.s3.us-east-1.amazonaws.com/evaluation:single-turn-e2e-report-tracing.mp4)

Test Reports For Evals and Traces on Confident AI

Nếu bạn muốn chạy đánh giá end-to-end trong các pipeline CI/CD, [nhấp vào đây](/docs/evaluation-unit-testing-in-ci-cd#end-to-end-evals-in-cicd).
