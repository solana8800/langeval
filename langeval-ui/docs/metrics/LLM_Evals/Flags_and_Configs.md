---
title: Cờ (Flags) và Cấu hình (Configs)
---

# Cờ (Flags) và Cấu hình (Configs)

Đôi khi bạn có thể muốn tùy chỉnh hành vi của các cài đặt khác nhau cho `evaluate()` và `assert_test()`, và điều này có thể được thực hiện bằng cách sử dụng "configs" (viết tắt của configurations - cấu hình) và "flags" (cờ).

:::note
Ví dụ, nếu bạn đang sử dụng một [LLM judge tùy chỉnh cho đánh giá](/guides/guides-using-custom-llms), bạn có thể muốn `ignore_errors` để không làm gián đoạn các đánh giá bất cứ khi nào model của bạn không tạo ra được JSON hợp lệ, hoặc tránh lỗi giới hạn tốc độ hoàn toàn bằng cách giảm giá trị `max_concurrent`.
:::

## Cấu hình cho evaluate()

### Cấu hình bất đồng bộ (Async Configs)

`AsyncConfig` kiểm soát mức độ đồng thời mà `metrics`, `observed_callback`, và `test_cases` sẽ được đánh giá trong quá trình `evaluate()`.

```python
from deepeval.evaluate import AsyncConfig  
from deepeval import evaluate  
  
evaluate(async_config=AsyncConfig(), ...)
```

Có **BA** tham số tùy chọn khi tạo một `AsyncConfig`:

* [Tùy chọn] `run_async`: một boolean mà khi được đặt là `True`, cho phép đánh giá đồng thời test cases **VÀ** metrics. Mặc định là `True`.
* [Tùy chọn] `throttle_value`: một số nguyên xác định thời gian (tính bằng giây) để điều tiết việc đánh giá từng test case. Bạn có thể tăng giá trị này nếu model đánh giá của bạn đang gặp lỗi giới hạn tốc độ. Mặc định là 0.
* [Tùy chọn] `max_concurrent`: một số nguyên xác định số lượng test cases tối đa có thể được chạy song song tại bất kỳ thời điểm nào. Bạn có thể giảm giá trị này nếu model đánh giá của bạn đang gặp lỗi giới hạn tốc độ. Mặc định là `20`.

Tham số `throttle_value` và `max_concurrent` chỉ được sử dụng khi `run_async` được đặt là `True`. Sự kết hợp của `throttle_value` và `max_concurrent` là cách tốt nhất để xử lý lỗi giới hạn tốc độ, hoặc trong LLM judge hoặc ứng dụng LLM của bạn, khi chạy đánh giá.

### Cấu hình hiển thị (Display Configs)

`DisplayConfig` kiểm soát cách kết quả và các bước thực thi trung gian được hiển thị trong quá trình `evaluate()`.

```python
from deepeval.evaluate import DisplayConfig  
from deepeval import evaluate  
  
evaluate(display_config=DisplayConfig(), ...)
```

Có **BỐN** tham số tùy chọn khi tạo một `DisplayConfig`:

* [Tùy chọn] `verbose_mode`: một boolean tùy chọn mà khi **KHÔNG PHẢI** là `None`, sẽ ghi đè giá trị [`verbose_mode` của từng metric](/docs/metrics-introduction#debugging-a-metric). Mặc định là `None`.
* [Tùy chọn] `display`: một chuỗi là `"all"`, `"failing"` hoặc `"passing"`, cho phép bạn quyết định một cách chọn lọc loại test cases nào để hiển thị như kết quả cuối cùng. Mặc định là `"all"`.
* [Tùy chọn] `show_indicator`: một boolean mà khi được đặt là `True`, hiển thị chỉ báo tiến trình đánh giá cho từng metric riêng lẻ. Mặc định là `True`.
* [Tùy chọn] `print_results`: một boolean mà khi được đặt là `True`, in kết quả của mỗi đánh giá. Mặc định là `True`.
* [Tùy chọn] `file_output_dir`: một chuỗi mà khi được đặt, sẽ ghi kết quả của đánh giá vào thư mục được chỉ định. Mặc định là `None`.

### Cấu hình lỗi (Error Configs)

`ErrorConfig` kiểm soát cách lỗi được xử lý trong `evaluate()`.

```python
from deepeval.evaluate import ErrorConfig  
from deepeval import evaluate  
  
evaluate(error_config=ErrorConfig(), ...)
```

Có **HAI** tham số tùy chọn khi tạo một `ErrorConfig`:

* [Tùy chọn] `skip_on_missing_params`: một boolean mà khi được đặt là `True`, bỏ qua tất cả các lần thực thi metric cho các test cases bị thiếu tham số. Mặc định là `False`.
* [Tùy chọn] `ignore_errors`: một boolean mà khi được đặt là `True`, bỏ qua tất cả các ngoại lệ (exceptions) được ném ra trong quá trình thực thi metrics cho mỗi test case. Mặc định là `False`.

Nếu cả `skip_on_missing_params` và `ignore_errors` đều được đặt là `True`, `skip_on_missing_params` được ưu tiên. Điều này có nghĩa là nếu một metric bị thiếu các tham số test case bắt buộc, nó sẽ bị bỏ qua (và kết quả sẽ bị thiếu) thay vì xuất hiện như một lỗi bị bỏ qua trong test run cuối cùng.

### Cấu hình Cache (Cache Configs)

`CacheConfig` kiểm soát hành vi caching của `evaluate()`.

```python
from deepeval.evaluate import CacheConfig  
from deepeval import evaluate  
  
evaluate(cache_config=CacheConfig(), ...)
```

Có **HAI** tham số tùy chọn khi tạo một `CacheConfig`:

* [Tùy chọn] `use_cache`: một boolean mà khi được đặt là `True`, sử dụng kết quả test run đã được cache thay thế. Mặc định là `False`.
* [Tùy chọn] `write_cache`: một boolean mà khi được đặt là `True`, sử dụng ghi kết quả test run vào **DISK**. Mặc định là `True`.

Tham số `write_cache` ghi vào đĩa và vì vậy bạn nên vô hiệu hóa nó nếu điều đó gây ra bất kỳ lỗi nào trong môi trường của bạn.

## Các cờ cho deepeval test run

### Song song hóa

Đánh giá từng test case song song bằng cách cung cấp một con số cho cờ `-n` để chỉ định bao nhiêu tiến trình (processes) để sử dụng.

```bash
deepeval test run test_example.py -n 4
```

### Cache

Cung cấp cờ `-c` (không có đối số) để đọc từ cache `deepeval` cục bộ thay vì đánh giá lại các test cases trên cùng các metrics.

```bash
deepeval test run test_example.py -c
```

:::info
Điều này cực kỳ hữu ích nếu bạn đang chạy lượng lớn test cases. Ví dụ, giả sử bạn đang chạy 1000 test cases sử dụng `deepeval test run`, nhưng bạn gặp lỗi ở test case thứ 999. Chức năng cache sẽ cho phép bạn bỏ qua tất cả 999 test cases đã được đánh giá trước đó, và chỉ đánh giá cái còn lại.
:::

### Bỏ qua lỗi

Cờ `-i` (không có đối số) cho phép bạn bỏ qua lỗi cho các lần thực thi metrics trong quá trình chạy test. Một ví dụ về nơi điều này hữu ích là nếu bạn đang sử dụng một LLM tùy chỉnh và thường thấy nó tạo ra các JSON không hợp lệ sẽ làm dừng việc thực thi của toàn bộ test run.

```bash
deepeval test run test_example.py -i
```

:::tip
Bạn có thể kết hợp các cờ khác nhau, chẳng hạn như cờ `-i`, `-c`, và `-n` để thực thi bất kỳ test cases nào chưa được cache song song trong khi bỏ qua bất kỳ lỗi nào trên đường đi:

```bash
deepeval test run test_example.py -i -c -n 2
```
:::

### Chế độ chi tiết (Verbose Mode)

Cờ `-v` (không có đối số) cho phép bạn bật [`verbose_mode` cho tất cả metrics](/docs/metrics-introduction#debugging-a-metric) chạy bằng `deepeval test run`. Không cung cấp cờ `-v` sẽ mặc định `verbose_mode` của mỗi metric về giá trị của nó lúc khởi tạo.

```bash
deepeval test run test_example.py -v
```

:::note
Khi `verbose_mode` của một metric là `True`, nó in các bước trung gian được sử dụng để tính toán metric đó ra console trong quá trình đánh giá.
:::

### Bỏ qua Test Cases

Cờ `-s` (không có đối số) cho phép bạn bỏ qua các lần thực thi metric nơi test case bị thiếu/không đủ tham số (chẳng hạn như `retrieval_context`) được yêu cầu cho đánh giá. Một ví dụ về nơi điều này hữu ích là nếu bạn đang sử dụng một metric như `ContextualPrecisionMetric` nhưng không muốn áp dụng nó khi `retrieval_context` là `None`.

```bash
deepeval test run test_example.py -s
```

### Định danh

Cờ `-id` theo sau là một chuỗi cho phép bạn đặt tên cho các test runs và định danh chúng tốt hơn trên [Confident AI](https://confident-ai.com). Một ví dụ về nơi điều này hữu ích là nếu bạn đang chạy các pipeline triển khai tự động, có các ID triển khai, hoặc chỉ muốn một cách để xác định test run nào là cái nào cho mục đích so sánh.

```bash
deepeval test run test_example.py -id "My Latest Test Run"
```

### Chế độ hiển thị

Cờ `-d` theo sau là một chuỗi "all", "passing", hoặc "failing" cho phép bạn chỉ hiển thị các test cases nhất định trong terminal. Ví dụ, bạn có thể chỉ hiển thị "failing" nếu bạn chỉ quan tâm đến các test cases bị thất bại.

```bash
deepeval test run test_example.py -d "failing"
```

### Lặp lại

Lặp lại mỗi test case bằng cách cung cấp một con số cho cờ `-r` để chỉ định bao nhiêu lần chạy lại mỗi test case.

```bash
deepeval test run test_example.py -r 2
```

### Hooks

Tích hợp Pytest của `deepeval` cho phép bạn chạy code tùy chỉnh ở cuối mỗi đánh giá thông qua decorator `@deepeval.on_test_run_end`:

**test_example.py**

```python
...  
  
@deepeval.on_test_run_end  
def function_to_be_called_after_test_run():  
    print("Test finished!")
```
