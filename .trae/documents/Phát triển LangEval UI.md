# Kế hoạch phát triển UI Evaluation (AI Studio)

Dựa trên tài liệu thiết kế và yêu cầu của bạn, tôi sẽ tạo một dự án Next.js mới để xây dựng giao diện người dùng hoàn chỉnh cho Evaluation.

## 1. Khởi tạo Dự án
*   Tạo thư mục dự án mới `langeval-ui` trong thư mục gốc.
*   Khởi tạo Next.js 14 với TypeScript, Tailwind CSS, và ESLint.
*   Cài đặt các thư viện UI và tiện ích cần thiết:
    *   `shadcn-ui`: Cho các component UI cơ bản (Button, Card, Input, etc.).
    *   `lucide-react`: Cho bộ icon.
    *   `recharts`: Để vẽ biểu đồ (Health Radar, Waterfall chart).
    *   `reactflow`: Để xây dựng Scenario Builder (kéo thả node).
    *   `framer-motion`: Cho các hiệu ứng chuyển động mượt mà.

## 2. Cấu trúc Ứng dụng
*   Thiết lập Layout chính (`app/layout.tsx`) bao gồm Sidebar Navigation để điều hướng giữa 14 màn hình.
*   Tạo Mock Data (`lib/mock-data.ts`) để mô phỏng dữ liệu cho tất cả các trang, đảm bảo giao diện hiển thị đầy đủ thông tin mà không cần backend thực tế.

## 3. Phát triển Các Màn hình (Pages)
Tôi sẽ xây dựng lần lượt các trang sau:

1.  **Home Dashboard**: Hiển thị Health Radar chart và Release Widget.
2.  **Developer Console**: Giao diện chia đôi, bên trái là Terminal log giả lập, bên phải là phân tích lỗi.
3.  **Test Data Contribution**: Form nhập liệu nhanh (Quick Add) và tính năng giả lập Git Sync.
4.  **Red Teaming Console**: Dashboard 3 cột cho cấu hình tấn công, log tấn công và báo cáo.
5.  **Benchmark Runner**: Giao diện chọn bộ test và hiển thị tiến độ chạy (Live Results).
6.  **Scenario Builder**: Tích hợp ReactFlow để tạo giao diện kéo thả các node (Persona, Task, Condition).
7.  **Battle Arena**: Giao diện chat chia đôi màn hình (Split-screen) với hiển thị "Inner Thoughts".
8.  **Trace Debugger**: Sử dụng iframe giả lập hoặc component mô phỏng giao diện Langfuse Trace.
9.  **Synthetic Dataset Generator**: Form upload và cấu hình sinh dữ liệu, kèm bảng xem trước (Preview).
10. **Prompt Optimizer**: Editor so sánh 2 phiên bản prompt (A/B testing).
11. **Metric Configurator**: Giao diện kéo thả metric và cấu hình ngưỡng (Threshold).
12. **Human Review Queue**: Danh sách các case cần review và form chấm điểm lại.
13. **Model Registry**: Bảng quản lý các model LLM và API Key.
14. **Campaign Report Detail**: Báo cáo chi tiết với biểu đồ Pass Rate và danh sách lỗi.

## 4. Kiểm thử và Preview
*   Sau khi hoàn thiện code, tôi sẽ khởi chạy server development (`npm run dev`).
*   Cung cấp đường dẫn Preview URL để bạn có thể trải nghiệm trực tiếp trên trình duyệt.

Bạn có đồng ý với kế hoạch này không? Nếu đồng ý, tôi sẽ bắt đầu thực thi ngay lập tức.