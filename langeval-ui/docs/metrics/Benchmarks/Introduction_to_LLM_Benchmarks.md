* Benchmarks
* Giới thiệu

Trên trang này

Giới thiệu về LLM Benchmarks
==============================

Tóm tắt nhanh[​](#quick-summary "Direct link to Quick Summary")
---------------------------------------------------------------

Benchmark LLM cung cấp một phương pháp tiêu chuẩn hóa để định lượng hiệu suất của LLM trên nhiều tác vụ khác nhau. `deepeval` cung cấp một số benchmark hiện đại (state-of-the-art), được hỗ trợ bởi nghiên cứu để bạn có thể nhanh chóng đánh giá **BẤT KỲ** LLM tùy chỉnh nào mà bạn chọn. Các benchmark này bao gồm:

* BIG-Bench Hard
* HellaSwag
* MMLU (Massive Multitask Language Understanding)
* DROP
* TruthfulQA
* HumanEval
* GSM8K

Để benchmark LLM của bạn, bạn sẽ cần bao đóng (wrap) việc triển khai LLM của mình (có thể là bất kỳ thứ gì như một cuộc gọi API đơn giản đến OpenAI, hoặc một mô hình transformers của Hugging Face) bên trong lớp `DeepEvalBaseLLM` của `deepeval`. Truy cập mục [mô hình tùy chỉnh](/docs/metrics-introduction#using-a-custom-llm) để xem hướng dẫn chi tiết về cách tạo một đối tượng mô hình tùy chỉnh.

info

Trong `deepeval`, bất kỳ ai cũng có thể benchmark **BẤT KỲ** LLM nào họ chọn chỉ với vài dòng mã. Tất cả các benchmark được cung cấp bởi `deepeval` đều tuân theo việc triển khai của các bài báo nghiên cứu gốc tương ứng.

LLM Benchmarks là gì?[​](#what-are-llm-benchmarks "Direct link to What are LLM Benchmarks?")
-----------------------------------------------------------------------------------------------

LLM benchmarks là một tập hợp các bài kiểm tra được tiêu chuẩn hóa được thiết kế để đánh giá hiệu suất của một LLM trên các kỹ năng khác nhau, chẳng hạn như suy luận và đọc hiểu. Một benchmark được tạo thành từ:

* một hoặc nhiều **tác vụ (tasks)**, trong đó mỗi tác vụ là tập dữ liệu đánh giá riêng của nó với các nhãn mục tiêu (hoặc `expected_outputs`)
* một **bộ chấm điểm (scorer)**, để xác định xem dự đoán từ LLM của bạn có đúng hay không (bằng cách sử dụng nhãn mục tiêu làm tham chiếu)
* nhiều **kỹ thuật prompting** khác nhau, có thể bao gồm few-shot learning và/hoặc CoTs prompting

LLM cần được đánh giá sẽ tạo ra các "dự đoán" cho mỗi tác vụ trong một benchmark với sự hỗ trợ của các kỹ thuật prompting đã vạch ra, trong khi bộ chấm điểm sẽ chấm điểm các dự đoán này bằng cách sử dụng các nhãn mục tiêu làm tham chiếu. Không có cách chấm điểm tiêu chuẩn nào giữa các benchmark khác nhau, nhưng hầu hết chỉ đơn giản sử dụng **exact match scorer** (bộ chấm điểm khớp chính xác) để đánh giá.

tip

Một nhãn mục tiêu trong tập dữ liệu benchmark đơn giản là `expected_output` theo thuật ngữ của `deepeval`.

Benchmark LLM của bạn[​](#benchmarking-your-llm "Direct link to Benchmarking Your LLM")
---------------------------------------------------------------------------------------

Dưới đây là một ví dụ về cách đánh giá một [mô hình Mistral 7B](https://huggingface.co/docs/transformers/model_doc/mistral) (được hiển thị thông qua thư viện `transformers` của Hugging Face) dựa trên benchmark `MMLU`.

danger

Thông thường, các LLM mà bạn đang cố gắng benchmark có thể không tạo ra các đầu ra có cấu trúc chính xác để các benchmark công khai này hoạt động. Các benchmark công khai này, như bạn sẽ tìm hiểu sau, hầu hết đều yêu cầu đầu ra dưới dạng các chữ cái đơn lẻ vì chúng thường được trình bày ở định dạng trắc nghiệm (MCQ), và việc không tạo ra gì khác ngoài các chữ cái đơn lẻ có thể khiến các benchmark này đưa ra kết quả sai lệch. Nếu bạn gặp phải trường hợp điểm số benchmark thấp một cách vô lý, rất có thể là do LLM của bạn không tạo ra các đầu ra hợp lệ.

Có một vài cách để giải quyết vấn đề này, chẳng hạn như tinh chỉnh (fine-tuning) mô hình trên các tác vụ hoặc tập dữ liệu cụ thể gần giống với tác vụ mục tiêu (ví dụ: MCQs). Tuy nhiên, việc này khá phức tạp và may mắn là trong `deepeval` bạn không cần phải làm điều đó.

**Chỉ cần làm theo [hướng dẫn nhanh này](/guides/guides-using-custom-llms#json-confinement-for-custom-llms) để tìm hiểu cách tạo ra các đầu ra chính xác trong việc triển khai LLM tùy chỉnh của bạn để benchmark LLM tùy chỉnh.**

### Tạo một Custom LLM[​](#create-a-custom-llm "Direct link to Create A Custom LLM")

Bắt đầu bằng cách tạo một mô hình tùy chỉnh mà **bạn sẽ tiến hành benchmark** bằng cách kế thừa lớp `DeepEvalBaseLLM` (truy cập mục [mô hình tùy chỉnh](/docs/metrics-introduction#using-a-custom-llm) để xem hướng dẫn đầy đủ về cách tạo một mô hình tùy chỉnh):

```python
from transformers import AutoModelForCausalLM, AutoTokenizer  
from deepeval.models.base_model import DeepEvalBaseLLM  
  
class Mistral7B(DeepEvalBaseLLM):  
    def __init__(  
        self,  
        model,  
        tokenizer  
    ):  
        self.model = model  
        self.tokenizer = tokenizer  
  
    def load_model(self):  
        return self.model  
  
    def generate(self, prompt: str) -> str:  
        model = self.load_model()  
  
        device = "cuda" # thiết bị để tải mô hình lên  
  
        model_inputs = self.tokenizer([prompt], return_tensors="pt").to(device)  
        model.to(device)  
  
        generated_ids = model.generate(**model_inputs, max_new_tokens=100, do_sample=True)  
        return self.tokenizer.batch_decode(generated_ids)[0]  
  
    async def a_generate(self, prompt: str) -> str:  
        return self.generate(prompt)  
  
    # Phần này là tùy chọn.  
    def batch_generate(self, prompts: List[str]) -> List[str]:  
        model = self.load_model()  
        device = "cuda" # thiết bị để tải mô hình lên  
  
        model_inputs = self.tokenizer(prompts, return_tensors="pt").to(device)  
        model.to(device)  
  
        generated_ids = model.generate(**model_inputs, max_new_tokens=100, do_sample=True)  
        return self.tokenizer.batch_decode(generated_ids)  
  
    def get_model_name(self):  
        return "Mistral 7B"  
  
model = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.1")  
tokenizer = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1")  
  
mistral_7b = Mistral7B(model=model, tokenizer=tokenizer)  
print(mistral_7b("Write me a joke"))
```

tip

Lưu ý rằng bạn cũng có thể **tùy chọn** định nghĩa một phương thức `batch_generate()` nếu LLM của bạn cung cấp API để tạo đầu ra theo lô (batch).

Tiếp theo, định nghĩa một benchmark MMLU bằng cách sử dụng lớp `MMLU`:

```python
from deepeval.benchmarks import MMLU  
...  
  
benchmark = MMLU()
```

Cuối cùng, gọi phương thức `evaluate()` để benchmark LLM tùy chỉnh của bạn:

```python
...  
  
# Khi bạn đặt batch_size, đầu ra cho các benchmark sẽ được tạo theo lô  
# nếu `batch_generate()` được triển khai cho LLM tùy chỉnh của bạn  
results = benchmark.evaluate(model=mistral_7b, batch_size=5)  
print("Overall Score: ", results)
```

✅ **Chúc mừng! Bây giờ bạn có thể đánh giá bất kỳ LLM tùy chỉnh nào mà bạn chọn trên tất cả các benchmark LLM được cung cấp bởi `deepeval`.**

tip

Khi bạn đặt `batch_size`, đầu ra cho các benchmark sẽ được tạo theo lô nếu `batch_generate()` được triển khai cho LLM tùy chỉnh của bạn. Điều này có thể tăng tốc độ benchmark lên rất nhiều.

Tham số `batch_size` có sẵn cho tất cả các benchmark **ngoại trừ** `HumanEval` và `GSM8K`.

Sau khi chạy đánh giá, bạn có thể truy cập kết quả theo nhiều cách để phân tích hiệu suất của mô hình. Điều này bao gồm điểm tổng thể, điểm số cụ thể cho từng tác vụ và chi tiết về từng dự đoán.

### Điểm Tổng Thể (Overall Score)[​](#overall-score "Direct link to Overall Score")

`overall_score`, đại diện cho hiệu suất của mô hình của bạn trên tất cả các tác vụ được chỉ định, có thể được truy cập thông qua thuộc tính `overall_score`:

```python
...  
  
print("Overall Score:", benchmark.overall_score)
```

### Điểm Số Tác Vụ (Task Scores)[​](#task-scores "Direct link to Task Scores")

Điểm số của từng tác vụ riêng lẻ có thể được truy cập thông qua thuộc tính `task_scores`:

```python
...  
  
print("Task-specific Scores: ", benchmark.task_scores)
```

Thuộc tính `task_scores` xuất ra một pandas DataFrame chứa thông tin về điểm số đạt được trong các tác vụ khác nhau. Dưới đây là một ví dụ về DataFrame:

| Task | Score |
| --- | --- |
| high\_school\_computer\_science | 0.75 |
| astronomy | 0.93 |

### Chi Tiết Dự Đoán (Prediction Details)[​](#prediction-details "Direct link to Prediction Details")

Bạn cũng có thể truy cập bảng phân tích toàn diện về các dự đoán của mô hình trên các tác vụ khác nhau thông qua thuộc tính `predictions`:

```python
...  
  
print("Detailed Predictions: ", benchmark.predictions)
```

Thuộc tính `benchmark.predictions` cũng trả về một pandas DataFrame chứa thông tin chi tiết về các dự đoán được thực hiện bởi mô hình. Dưới đây là một ví dụ về DataFrame:

| Task | Input | Prediction | Correct |
| --- | --- | --- | --- |
| high\_school\_computer\_science | In Python 3, which of the following function convert a string to an int in python? | A | 0 |
| high\_school\_computer\_science | Let x = 1. What is `x << 3` in Python 3? | B | 1 |
| ... | ... | ... | ... |

Cấu hình LLM Benchmarks[​](#configurating-llm-benchmarks "Direct link to Configurating LLM Benchmarks")
------------------------------------------------------------------------------------------------------------

Tất cả các benchmark đều có thể định cấu hình theo cách này hay cách khác, và `deepeval` cung cấp một giao diện dễ dàng để thực hiện điều đó.

note

Bạn sẽ nhận thấy rằng mặc dù các tác vụ và kỹ thuật prompting có thể định cấu hình, nhưng các bộ chấm điểm (scorers) thì không. Điều này là do loại bộ chấm điểm là một tiêu chuẩn chung trong bất kỳ benchmark LLM nào.

### Tác vụ (Tasks)[​](#tasks "Direct link to Tasks")

Một tác vụ cho một benchmark LLM là một thách thức hoặc vấn đề được thiết kế để đánh giá khả năng của LLM trong một lĩnh vực trọng tâm cụ thể. Ví dụ: bạn có thể chỉ định **tập con (subset)** nào của benchmark `MMLU` để đánh giá LLM của bạn bằng cách cung cấp danh sách `MMLUTASK`:

```python
from deepeval.benchmarks import MMLU  
from deepeval.benchmarks.task import MMLUTask  
  
tasks = [MMLUTask.HIGH_SCHOOL_COMPUTER_SCIENCE, MMLUTask.ASTRONOMY]  
benchmark = MMLU(tasks=tasks)
```

Trong ví dụ này, chúng ta chỉ đánh giá mô hình Mistral 7B của mình trên các tác vụ `HIGH_SCHOOL_COMPUTER_SCIENCE` và `ASTRONOMY` của MMLU.

info

Mỗi benchmark được liên kết với một enum **Task** duy nhất có thể được tìm thấy trên các trang tài liệu riêng lẻ của mỗi benchmark. Các tác vụ này được lấy từ các bài báo nghiên cứu gốc cho mỗi benchmark tương ứng và ánh xạ một-một với các tập dữ liệu benchmark có sẵn trên Hugging Face.

Theo mặc định, `deepeval` sẽ đánh giá LLM của bạn trên tất cả các tác vụ có sẵn cho một benchmark cụ thể.

### Few-Shot Learning[​](#few-shot-learning "Direct link to Few-Shot Learning")

Few-shot learning, còn được gọi là in-context learning, là một kỹ thuật prompting bao gồm việc cung cấp cho LLM của bạn một vài ví dụ như một phần của mẫu prompt để hỗ trợ việc tạo nội dung của nó. Những ví dụ này có thể giúp hướng dẫn độ chính xác hoặc hành vi. Số lượng ví dụ cần cung cấp có thể được chỉ định trong tham số `n_shots`:

```python
from deepeval.benchmarks import HellaSwag  
  
benchmark = HellaSwag(n_shots=3)
```

note

Mỗi benchmark có một phạm vi giá trị `n_shots` được phép. `deepeval` xử lý tất cả logic liên quan đến giá trị `n_shots` theo các bài báo nghiên cứu gốc cho mỗi benchmark tương ứng.

### CoTs Prompting[​](#cots-prompting "Direct link to CoTs Prompting")

Chain of thought (CoTs) prompting là một cách tiếp cận trong đó mô hình được nhắc (prompted) để nói rõ quá trình suy luận của nó nhằm đi đến câu trả lời. Điều này thường dẫn đến việc tăng độ chính xác của dự đoán.

```python
from deepeval.benchmarks import BigBenchHard  
  
benchmark = BigBenchHard(enable_cot=True)
```

note

Không phải tất cả các benchmark đều cung cấp CoTs như một kỹ thuật prompting, nhưng [bài báo gốc cho BIG-Bench Hard](https://arxiv.org/abs/2210.09261) đã tìm thấy những cải tiến lớn khi sử dụng CoTs prompting trong quá trình benchmarking.

[Chỉnh sửa trang này](https://github.com/confident-ai/deepeval/edit/main/docs/docs/benchmarks-introduction.mdx)

Cập nhật lần cuối vào **Jan 9, 2026** bởi **Jeffrey Ip**