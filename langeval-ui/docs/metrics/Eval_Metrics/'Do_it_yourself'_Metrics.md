# 'Do it yourself' Metrics (Metric Tự làm)

Trong `deepeval`, bất kỳ ai cũng có thể dễ dàng xây dựng metric đánh giá LLM tùy chỉnh của riêng mình, được tích hợp tự động trong hệ sinh thái của `deepeval`, bao gồm:

- Chạy metric tùy chỉnh của bạn trong **CI/CD pipelines**.
- Tận dụng các khả năng của `deepeval` như **caching metric và đa xử lý (multi-processing)**.
- Kết quả metric tùy chỉnh được **gửi tự động đến Confident AI**.

Dưới đây là một vài lý do tại sao bạn có thể muốn xây dựng metric đánh giá LLM của riêng mình:

- **Bạn muốn kiểm soát tốt hơn** các tiêu chí đánh giá được sử dụng (và bạn nghĩ rằng [`GEval`](/docs/metrics-llm-evals) hoặc [`DAG`](/docs/metrics-dag) là không đủ).
- **Bạn không muốn sử dụng LLM** để đánh giá (vì tất cả các metric trong `deepeval` đều được hỗ trợ bởi LLM).
- **Bạn muốn kết hợp nhiều metric của `deepeval`** (ví dụ: sẽ rất hợp lý khi có một metric kiểm tra cả sự liên quan của câu trả lời và tính trung thực).

:::info
Có nhiều cách để triển khai một metric đánh giá LLM. Đây là một [bài viết tuyệt vời về mọi thứ bạn cần biết về việc chấm điểm các metric đánh giá LLM.](https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation)
:::

## Các Quy tắc Cần Tuân thủ Khi Tạo Metric Tùy chỉnh

### 1. Kế thừa lớp `BaseMetric`

Để bắt đầu, hãy tạo một lớp kế thừa từ lớp `BaseMetric` của `deepeval`:

```python
from deepeval.metrics import BaseMetric  
  
class CustomMetric(BaseMetric):  
    ...
```

Điều này rất quan trọng vì lớp `BaseMetric` sẽ giúp `deepeval` nhận ra metric tùy chỉnh của bạn trong quá trình đánh giá.

### 2. Triển khai phương thức `__init__()`

Lớp `BaseMetric` cung cấp cho metric tùy chỉnh của bạn một vài thuộc tính mà bạn có thể cấu hình và hiển thị sau khi đánh giá, hoặc cục bộ hoặc trên Confident AI.

Một ví dụ là thuộc tính `threshold` (ngưỡng), xác định xem `LLMTestCase` đang được đánh giá có đạt hay không. Mặc dù **thuộc tính `threshold` là tất cả những gì bạn cần để làm cho một metric tùy chỉnh hoạt động**, đây là một số thuộc tính bổ sung cho những người muốn tùy chỉnh nhiều hơn:

- `evaluation_model`: một `str` chỉ định tên của mô hình đánh giá được sử dụng.
- `include_reason`: một `bool` chỉ định xem có bao gồm lý do cùng với điểm số metric hay không. Điều này sẽ không cần thiết nếu bạn không có ý định sử dụng LLM để đánh giá.
- `strict_mode`: một `bool` chỉ định xem có chỉ thông qua metric nếu có điểm số hoàn hảo hay không.
- `async_mode`: một `bool` chỉ định xem có thực thi metric bất đồng bộ hay không.

:::tip
Đừng quá bận tâm vào các thuộc tính nâng cao ngay bây giờ, chúng ta sẽ xem xét cách chúng có thể hữu ích trong các phần sau của hướng dẫn này.
:::

Phương thức `__init__()` là nơi tuyệt vời để thiết lập các thuộc tính này:

```python
from deepeval.metrics import BaseMetric  
  
class CustomMetric(BaseMetric):  
    def __init__(  
        self,  
        threshold: float = 0.5,  
        # Optional  
        evaluation_model: str,  
        include_reason: bool = True,  
        strict_mode: bool = True,  
        async_mode: bool = True  
    ):  
        self.threshold = threshold  
        # Optional  
        self.evaluation_model = evaluation_model  
        self.include_reason = include_reason  
        self.strict_mode = strict_mode  
        self.async_mode = async_mode
```

### 3. Triển khai các phương thức `measure()` và `a_measure()`

Phương thức `measure()` và `a_measure()` là nơi tất cả quá trình đánh giá diễn ra. Trong `deepeval`, đánh giá là quá trình áp dụng một metric vào một `LLMTestCase` để tạo ra điểm số và tùy chọn một lý do cho điểm số (nếu bạn đang sử dụng LLM) dựa trên thuật toán chấm điểm.

Phương thức `a_measure()` đơn giản là triển khai bất đồng bộ của phương thức `measure()`, và do đó cả hai nên sử dụng cùng một thuật toán chấm điểm.

:::info
Phương thức `a_measure()` cho phép `deepeval` chạy metric tùy chỉnh của bạn một cách bất đồng bộ. Lấy hàm `assert_test` làm ví dụ:

```python
from deepeval import assert_test  
  
def test_multiple_metrics():  
    ...  
    assert_test(test_case, [metric1, metric2], run_async=True)
```

Khi bạn chạy `assert_test()` với `run_async=True` (đây là hành vi mặc định), `deepeval` gọi phương thức `a_measure()` cho phép tất cả các metric chạy đồng thời theo cách không chặn (non-blocking).
:::

Cả `measure()` và `a_measure()` **PHẢI**:

- chấp nhận một `LLMTestCase` làm đối số
- thiết lập `self.score`
- thiết lập `self.success`

Bạn cũng có thể tùy chọn thiết lập `self.reason` trong các phương thức đo lường (nếu bạn đang sử dụng LLM để đánh giá), hoặc bọc mọi thứ trong một khối `try` để bắt bất kỳ ngoại lệ nào và thiết lập nó cho `self.error`. Dưới đây là một ví dụ giả định:

```python
from deepeval.metrics import BaseMetric  
from deepeval.test_case import LLMTestCase  
  
class CustomMetric(BaseMetric):  
    ...  
  
    def measure(self, test_case: LLMTestCase) -> float:  
        # Although not required, we recommend catching errors  
        # in a try block  
        try:  
            self.score = generate_hypothetical_score(test_case)  
            if self.include_reason:  
                self.reason = generate_hypothetical_reason(test_case)  
            self.success = self.score >= self.threshold  
            return self.score  
        except Exception as e:  
            # set metric error and re-raise it  
            self.error = str(e)  
            raise  
  
    async def a_measure(self, test_case: LLMTestCase) -> float:  
        # Although not required, we recommend catching errors  
        # in a try block  
        try:  
            self.score = await async_generate_hypothetical_score(test_case)  
            if self.include_reason:  
                self.reason = await async_generate_hypothetical_reason(test_case)  
            self.success = self.score >= self.threshold  
            return self.score  
        except Exception as e:  
            # set metric error and re-raise it  
            self.error = str(e)  
            raise
```

:::tip
Thường thì, phần gây chặn (blocking) của một metric đánh giá LLM bắt nguồn từ các lệnh gọi API đến nhà cung cấp LLM của bạn (chẳng hạn như các điểm cuối API của OpenAI), và do đó cuối cùng bạn sẽ phải đảm bảo rằng việc suy luận LLM thực sự có thể được thực hiện bất đồng bộ.

Nếu bạn đã khám phá tất cả các lựa chọn và nhận ra không có triển khai bất đồng bộ nào cho cuộc gọi LLM của bạn (ví dụ: nếu bạn đang sử dụng mô hình mã nguồn mở từ thư viện `transformers` của Hugging Face), đơn giản là **tái sử dụng phương thức `measure` trong `a_measure()`**:

```python
from deepeval.metrics import BaseMetric  
from deepeval.test_case import LLMTestCase  
  
class CustomMetric(BaseMetric):  
    ...  
  
    async def a_measure(self, test_case: LLMTestCase) -> float:  
        return self.measure(test_case)
```

Bạn cũng có thể [nhấn vào đây để tìm một ví dụ về việc giảm tải suy luận LLM sang một luồng riêng biệt](/docs/metrics-introduction#mistral-7b-example) như một giải pháp thay thế, mặc dù nó có thể không hoạt động cho tất cả các trường hợp sử dụng.
:::

### 4. Triển khai phương thức `is_successful()`

Về cơ bản, `deepeval` gọi phương thức `is_successful()` để xác định trạng thái của metric của bạn cho một `LLMTestCase` nhất định. Hệ thống khuyên bạn nên sao chép và dán trực tiếp đoạn mã dưới đây làm triển khai `is_successful()` của bạn:

```python
from deepeval.metrics import BaseMetric  
from deepeval.test_case import LLMTestCase  
  
class CustomMetric(BaseMetric):  
    ...  
  
    def is_successful(self) -> bool:  
        if self.error is not None:  
            self.success = False  
        else:  
            return self.success
```

### 5. Đặt tên cho Metric Tùy chỉnh của Bạn

Có lẽ là bước dễ nhất, tất cả những gì còn lại là đặt tên cho metric tùy chỉnh của bạn:

```python
from deepeval.metrics import BaseMetric  
from deepeval.test_case import LLMTestCase  
  
class CustomMetric(BaseMetric):  
    ...  
  
    @property  
    def __name__(self):  
        return "My Custom Metric"
```

**Chúc mừng 🎉!** Bạn vừa học cách xây dựng một metric tùy chỉnh được tích hợp 100% với hệ sinh thái của `deepeval`. Trong phần tiếp theo, chúng ta sẽ đi qua một vài ví dụ thực tế.

## Thêm Ví dụ

### Non-LLM Evals (Đánh giá không dùng LLM)

LLM-Eval là một metric đánh giá LLM được chấm điểm bằng cách sử dụng một LLM, và do đó non-LLM eval đơn giản là một metric không được chấm điểm bằng cách sử dụng LLM. Trong ví dụ này, chúng tôi sẽ minh họa cách sử dụng [rouge score](https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation) thay thế:

```python
from deepeval.scorer import Scorer  
from deepeval.metrics import BaseMetric  
from deepeval.test_case import LLMTestCase  
  
class RougeMetric(BaseMetric):  
    def __init__(self, threshold: float = 0.5):  
        self.threshold = threshold  
        self.scorer = Scorer()  
  
    def measure(self, test_case: LLMTestCase):  
        self.score = self.scorer.rouge_score(  
            prediction=test_case.actual_output,  
            target=test_case.expected_output,  
            score_type="rouge1"  
        )  
        self.success = self.score >= self.threshold  
        return self.score  
  
    # Async implementation of measure(). If async version for  
    # scoring method does not exist, just reuse the measure method.  
    async def a_measure(self, test_case: LLMTestCase):  
        return self.measure(test_case)  
  
    def is_successful(self):  
        return self.success  
  
    @property  
    def __name__(self):  
        return "Rouge Metric"
```

:::note
Mặc dù bạn được tự do triển khai rouge scorer của riêng mình, bạn sẽ nhận thấy rằng dù không được ghi trong tài liệu, `deepeval` cung cấp thêm một module `scorer` cho phương pháp chấm điểm NLP truyền thống hơn và có thể được tìm thấy [tại đây.](https://github.com/confident-ai/deepeval/blob/main/deepeval/scorer/scorer.py)

Hãy chắc chắn chạy `pip install rouge-score` nếu `rouge-score` chưa được cài đặt trong môi trường của bạn.
:::

Bây giờ bạn có thể chạy metric tùy chỉnh này như một metric độc lập chỉ trong vài dòng mã:

```python
...  
  
#####################  
### Example Usage ###  
#####################  
test_case = LLMTestCase(input="...", actual_output="...", expected_output="...")  
metric = RougeMetric()  
  
metric.measure(test_case)  
print(metric.is_successful())
```

### Composite Metrics (Metric Hỗn hợp)

Trong ví dụ này, chúng tôi sẽ kết hợp hai metric mặc định của `deepeval` thành metric tùy chỉnh của chúng tôi, do đó tại sao chúng tôi gọi nó là metric "hỗn hợp" (composite).

Hệ thống sẽ kết hợp `AnswerRelevancyMetric` và `FaithfulnessMetric`, vì chúng tôi hiếm khi thấy người dùng nào quan tâm đến cái này mà không quan tâm đến cái kia.

```python
from deepeval.metrics import BaseMetric, AnswerRelevancyMetric, FaithfulnessMetric  
from deepeval.test_case import LLMTestCase  
  
class FaithfulRelevancyMetric(BaseMetric):  
    def __init__(  
        self,  
        threshold: float = 0.5,  
        evaluation_model: Optional[str] = "gpt-4-turbo",  
        include_reason: bool = True,  
        async_mode: bool = True,  
        strict_mode: bool = False,  
    ):  
        self.threshold = 1 if strict_mode else threshold  
        self.evaluation_model = evaluation_model  
        self.include_reason = include_reason  
        self.async_mode = async_mode  
        self.strict_mode = strict_mode  
  
    def measure(self, test_case: LLMTestCase):  
        try:  
            relevancy_metric, faithfulness_metric = initialize_metrics()  
            # Remember, deepeval's default metrics follow the same pattern as your custom metric!  
            relevancy_metric.measure(test_case)  
            faithfulness_metric.measure(test_case)  
  
            # Custom logic to set score, reason, and success  
            set_score_reason_success(relevancy_metric, faithfulness_metric)  
            return self.score  
        except Exception as e:  
            # Set and re-raise error  
            self.error = str(e)  
            raise  
  
    async def a_measure(self, test_case: LLMTestCase):  
        try:  
            relevancy_metric, faithfulness_metric = initialize_metrics()  
            # Here, we use the a_measure() method instead so both metrics can run concurrently  
            await relevancy_metric.a_measure(test_case)  
            await faithfulness_metric.a_measure(test_case)  
  
            # Custom logic to set score, reason, and success  
            set_score_reason_success(relevancy_metric, faithfulness_metric)  
            return self.score  
        except Exception as e:  
            # Set and re-raise error  
            self.error = str(e)  
            raise  
  
    def is_successful(self) -> bool:  
        if self.error is not None:  
            self.success = False  
        else:  
            return self.success  
  
    @property  
    def __name__(self):  
        return "Composite Relevancy Faithfulness Metric"  
  
  
    ######################  
    ### Helper methods ###  
    ######################  
    def initialize_metrics(self):  
        relevancy_metric = AnswerRelevancyMetric(  
            threshold=self.threshold,  
            model=self.evaluation_model,  
            include_reason=self.include_reason,  
            async_mode=self.async_mode,  
            strict_mode=self.strict_mode  
        )  
        faithfulness_metric = FaithfulnessMetric(  
            threshold=self.threshold,  
            model=self.evaluation_model,  
            include_reason=self.include_reason,  
            async_mode=self.async_mode,  
            strict_mode=self.strict_mode  
        )  
        return relevancy_metric, faithfulness_metric  
  
    def set_score_reason_success(  
        self,  
        relevancy_metric: BaseMetric,  
        faithfulness_metric: BaseMetric  
    ):  
        # Get scores and reasons for both  
        relevancy_score = relevancy_metric.score  
        relevancy_reason = relevancy_metric.reason  
        faithfulness_score = faithfulness_metric.score  
        faithfulness_reason = faithfulness_reason.reason  
  
        # Custom logic to set score  
        composite_score = min(relevancy_score, faithfulness_score)  
        self.score = 0 if self.strict_mode and composite_score < self.threshold else composite_score  
  
        # Custom logic to set reason  
        if include_reason:  
            self.reason = relevancy_reason + "\n" + faithfulness_reason  
  
        # Custom logic to set success  
        self.success = self.score >= self.threshold
```

Bây giờ hãy thử sử dụng nó:

`test_llm.py`

```python
from deepeval import assert_test  
from deepeval.test_case import LLMTestCase  
...  
  
def test_llm():  
    metric = FaithfulRelevancyMetric()  
    test_case = LLMTestCase(...)  
    assert_test(test_case, [metric])
```

```bash
deepeval test run test_llm.py
```
