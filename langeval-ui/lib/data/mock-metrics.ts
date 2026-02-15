import { Metric } from "@/components/metrics/metric-card";

export const INITIAL_METRICS: Metric[] = [
    // Custom Metrics
    { id: 'g_eval', name: 'G-Eval', description: 'Đánh giá chung sử dụng LLM-as-a-judge với tiêu chí tùy chỉnh.', category: 'Custom Metrics', enabled: true, threshold: 0.7, isCustom: true },
    { id: 'dag', name: 'DAG (Deep Acyclic Graph)', description: 'Đánh giá luồng logic và sự phụ thuộc bằng phân tích đồ thị.', category: 'Custom Metrics', enabled: false, threshold: 0.5 },
    { id: 'conversational_g_eval', name: 'Conversational G-Eval', description: 'G-Eval được tối ưu cho hội thoại nhiều lượt.', category: 'Custom Metrics', enabled: false, threshold: 0.7 },
    { id: 'conversational_dag', name: 'Conversational DAG', description: 'DAG được tối ưu cho hội thoại nhiều lượt.', category: 'Custom Metrics', enabled: false, threshold: 0.5 },
    { id: 'arena_g_eval', name: 'Arena G-Eval', description: 'Metric so sánh đối kháng trực tiếp (Battle Arena).', category: 'Custom Metrics', enabled: false, threshold: 0.5 },
    { id: 'diy', name: 'Do it yourself', description: 'Tự viết code Python để chấm điểm (ví dụ: BLEU, ROUGE).', category: 'Custom Metrics', enabled: false, threshold: 0.0 },

    // RAG
    { id: 'answer_relevancy', name: 'Answer Relevancy', description: 'Đo lường mức độ liên quan của câu trả lời với câu hỏi.', category: 'RAG', enabled: true, threshold: 0.7 },
    { id: 'faithfulness', name: 'Faithfulness', description: 'Đo lường mức độ trung thực, đảm bảo câu trả lời dựa trên ngữ cảnh (check ảo giác).', category: 'RAG', enabled: true, threshold: 0.7 },
    { id: 'contextual_precision', name: 'Contextual Precision', description: 'Đo lường độ chính xác của thứ hạng ngữ cảnh được trích xuất (Ranking).', category: 'RAG', enabled: false, threshold: 0.5 },
    { id: 'contextual_recall', name: 'Contextual Recall', description: 'Đo lường khả năng trích xuất đầy đủ thông tin cần thiết từ dữ liệu nguồn.', category: 'RAG', enabled: false, threshold: 0.5 },
    { id: 'contextual_relevancy', name: 'Contextual Relevancy', description: 'Đo lường mức độ liên quan của ngữ cảnh trích xuất đối với câu hỏi.', category: 'RAG', enabled: false, threshold: 0.5 },

    // Agentic
    { id: 'task_completion', name: 'Task Completion', description: 'Kiểm tra xem mục tiêu cuối cùng của người dùng có hoàn thành không.', category: 'Agentic', enabled: true, threshold: 0.8 },
    { id: 'tool_correctness', name: 'Tool Correctness', description: 'Đánh giá agent có chọn đúng công cụ và tham số hay không.', category: 'Agentic', enabled: true, threshold: 0.8 },
    { id: 'argument_correctness', name: 'Argument Correctness', description: 'Xác minh tính chính xác của các tham số truyền vào tool.', category: 'Agentic', enabled: true, threshold: 0.8 },
    { id: 'step_efficiency', name: 'Step Efficiency', description: 'Đo lường xem agent có sử dụng số bước tối thiểu để hoàn thành task không.', category: 'Agentic', enabled: false, threshold: 0.7 },
    { id: 'plan_adherence', name: 'Plan Adherence', description: 'Kiểm tra xem agent có tuân thủ kế hoạch hoặc quy trình (SOP) đã định không.', category: 'Agentic', enabled: true, threshold: 0.8 },
    { id: 'plan_quality', name: 'Plan Quality', description: 'Đánh giá chất lượng và tính khả thi của kế hoạch do agent tạo ra.', category: 'Agentic', enabled: false, threshold: 0.7 },

    // Multi-Turn
    { id: 'turn_relevancy', name: 'Turn Relevancy', description: 'Đo lường mức độ liên quan của một lượt hội thoại cụ thể.', category: 'Multi-Turn', enabled: false, threshold: 0.7 },
    { id: 'role_adherence', name: 'Role Adherence', description: 'Xác minh xem agent có giữ đúng vai trò (persona) quy định không.', category: 'Multi-Turn', enabled: false, threshold: 0.8 },
    { id: 'knowledge_retention', name: 'Knowledge Retention', description: 'Kiểm tra xem agent có nhớ thông tin quan trọng từ các lượt trước không.', category: 'Multi-Turn', enabled: false, threshold: 0.6 },
    { id: 'conversation_completeness', name: 'Conversation Completeness', description: 'Đánh giá độ hoàn thiện và toàn diện của cuộc hội thoại.', category: 'Multi-Turn', enabled: false, threshold: 0.7 },
    { id: 'goal_accuracy', name: 'Goal Accuracy', description: 'Đo lường độ chính xác mục tiêu xuyên suốt các lượt hội thoại.', category: 'Multi-Turn', enabled: true, threshold: 0.8 },
    { id: 'tool_use', name: 'Tool Use', description: 'Đánh giá hiệu quả sử dụng công cụ trong ngữ cảnh nhiều lượt.', category: 'Multi-Turn', enabled: false, threshold: 0.8 },
    { id: 'topic_adherence', name: 'Topic Adherence', description: 'Đảm bảo agent không đi lạc đề khỏi chủ đề quy định.', category: 'Multi-Turn', enabled: false, threshold: 0.8 },
    { id: 'turn_faithfulness', name: 'Turn Faithfulness', description: 'Kiểm tra tính trung thực (Faithfulness) cho một lượt cụ thể.', category: 'Multi-Turn', enabled: false, threshold: 0.7 },
    { id: 'turn_contextual_precision', name: 'Turn Contextual Precision', description: 'Độ chính xác ngữ cảnh (Contextual Precision) cho một lượt.', category: 'Multi-Turn', enabled: false, threshold: 0.5 },
    { id: 'turn_contextual_recall', name: 'Turn Contextual Recall', description: 'Độ phủ ngữ cảnh (Recall) cho một lượt.', category: 'Multi-Turn', enabled: false, threshold: 0.5 },
    { id: 'turn_contextual_relevancy', name: 'Turn Contextual Relevancy', description: 'Độ liên quan ngữ cảnh (Relevancy) cho một lượt.', category: 'Multi-Turn', enabled: false, threshold: 0.5 },

    // MCP
    { id: 'mcp_use', name: 'MCP-Use', description: 'Đánh giá việc sử dụng các công cụ chuẩn Model Context Protocol.', category: 'MCP', enabled: false, threshold: 0.8 },
    { id: 'multi_turn_mcp_use', name: 'Multi-Turn MCP-Use', description: 'Đánh giá sử dụng MCP tool xuyên suốt nhiều lượt hội thoại.', category: 'MCP', enabled: false, threshold: 0.8 },
    { id: 'mcp_task_completion', name: 'MCP Task Completion', description: 'Tỷ lệ hoàn thành nhiệm vụ dành riêng cho các MCP Agent.', category: 'MCP', enabled: false, threshold: 0.8 },

    // Safety
    { id: 'bias', name: 'Bias', description: 'Phát hiện thiên kiến về giới tính, chủng tộc hoặc quan điểm chính trị.', category: 'Safety', enabled: true, threshold: 0.1 },
    { id: 'toxicity', name: 'Toxicity', description: 'Phát hiện nội dung độc hại, xúc phạm hoặc gây kích động.', category: 'Safety', enabled: true, threshold: 0.1 },
    { id: 'non_advice', name: 'Non-Advice', description: 'Đảm bảo agent không đưa ra lời khuyên nguy hiểm (y tế, pháp lý, tài chính).', category: 'Safety', enabled: true, threshold: 0.1 },
    { id: 'misuse', name: 'Misuse', description: 'Phát hiện các nỗ lực tấn công (jailbreak) hoặc sử dụng sai mục đích.', category: 'Safety', enabled: true, threshold: 0.1 },
    { id: 'pii_leakage', name: 'PII Leakage', description: 'Đảm bảo không lộ thông tin cá nhân (email, sđt) trong câu trả lời.', category: 'Safety', enabled: true, threshold: 0.0 },
    { id: 'role_violation', name: 'Role Violation', description: 'Kiểm tra vi phạm các hướng dẫn an toàn hoặc vai trò của agent.', category: 'Safety', enabled: true, threshold: 0.1 },

    // Non-LLM
    { id: 'exact_match', name: 'Exact Match', description: 'So sánh chuỗi ký tự chính xác tuyệt đối (String equality).', category: 'Non-LLM', enabled: false, threshold: 1.0 },
    { id: 'pattern_match', name: 'Pattern Match', description: 'Kiểm tra đầu ra có khớp mẫu Regex quy định không.', category: 'Non-LLM', enabled: false, threshold: 1.0 },
    { id: 'json_correctness', name: 'Json Correctness', description: 'Xác thực đầu ra có phải là format JSON hợp lệ không.', category: 'Non-LLM', enabled: true, threshold: 1.0 },

    // Images
    { id: 'image_coherence', name: 'Image Coherence', description: 'Đánh giá tính nhất quán và logic của hình ảnh được tạo ra.', category: 'Images', enabled: false, threshold: 0.7 },
    { id: 'image_helpfulness', name: 'Image Helpfulness', description: 'Đo lường mức độ hữu ích của ảnh đối với yêu cầu người dùng.', category: 'Images', enabled: false, threshold: 0.7 },
    { id: 'image_reference', name: 'Image Reference', description: 'So sánh ảnh tạo ra với ảnh mẫu hoặc phong cách tham chiếu.', category: 'Images', enabled: false, threshold: 0.7 },
    { id: 'text_to_image', name: 'Text to Image', description: 'Đánh giá sự căn chỉnh nội dung giữa văn bản prompt và ảnh.', category: 'Images', enabled: false, threshold: 0.7 },
    { id: 'image_editing', name: 'Image Editing', description: 'Đánh giá chất lượng của các thao tác chỉnh sửa ảnh.', category: 'Images', enabled: false, threshold: 0.7 },

    // Others
    { id: 'summarization', name: 'Summarization', description: 'Đánh giá chất lượng của việc tóm tắt văn bản.', category: 'Others', enabled: false, threshold: 0.7 },
    { id: 'prompt_alignment', name: 'Prompt Alignment', description: 'Kiểm tra xem phản hồi có tuân thủ đúng các hướng dẫn trong System Prompt không.', category: 'Others', enabled: false, threshold: 0.7 },
    { id: 'hallucination', name: 'Hallucination', description: 'Phát hiện các thông tin bịa đặt (ảo giác) nói chung.', category: 'Others', enabled: true, threshold: 0.7 },
    { id: 'ragas', name: 'RAGAS', description: 'Tích hợp các metrics từ thư viện đánh giá RAGAS.', category: 'Others', enabled: false, threshold: 0.7 },
];
