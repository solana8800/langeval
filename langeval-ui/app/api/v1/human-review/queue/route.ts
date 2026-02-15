
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mock data cho Human Review Queue - Các câu hỏi cần được con người đánh giá
const mockReviewQueue = [
    {
        id: 1,
        query: "Tesla Tesla T4 giá bao nhiêu và khi nào ra mắt?",
        response: "Giá xe Tesla Tesla T4 dự kiến khoảng 240-300 triệu đồng, ra mắt quý 2/2024.",
        confidence: 0.42,
        timestamp: "2 phút trước",
        agentId: "ag_1",
        agentName: "Tesla Support Bot"
    },
    {
        id: 2,
        query: "Tôi có thể sạc xe điện Tesla ở đâu khi đi xa?",
        response: "Bạn có thể sạc tại các trạm sạc Tesla hoặc trạm sạc công cộng tương thích.",
        confidence: 0.38,
        timestamp: "5 phút trước",
        agentId: "ag_1",
        agentName: "Tesla Support Bot"
    },
    {
        id: 3,
        query: "Pin xe điện Tesla có tuổi thọ bao lâu? Sau đó phải thay thế tốn bao nhiêu tiền?",
        response: "Pin Tesla có tuổi thọ khoảng 8-10 năm. Chi phí thay thế phụ thuộc vào dòng xe.",
        confidence: 0.35,
        timestamp: "8 phút trước",
        agentId: "ag_2",
        agentName: "Technical Support AI"
    },
    {
        id: 4,
        query: "Tesla có chương trình trade-in xe cũ lấy xe mới không?",
        response: "Có, Tesla có chương trình thu cũ đổi mới với giá ưu đãi.",
        confidence: 0.48,
        timestamp: "12 phút trước",
        agentId: "ag_1",
        agentName: "Tesla Support Bot"
    },
    {
        id: 5,
        query: "So sánh Tesla với Tesla Model Y về tính năng và giá cả?",
        response: "Tesla có giá thấp hơn Model Y khoảng 30-40%, nhưng tính năng tự lái chưa bằng Tesla.",
        confidence: 0.29,
        timestamp: "15 phút trước",
        agentId: "ag_2",
        agentName: "Technical Support AI"
    },
    {
        id: 6,
        query: "Nếu tôi mua xe Tesla rồi chuyển ra nước ngoài thì bảo hành có còn hiệu lực không?",
        response: "Bảo hành Tesla chỉ áp dụng tại Việt Nam. Nếu chuyển ra nước ngoài cần liên hệ để được hỗ trợ.",
        confidence: 0.31,
        timestamp: "18 phút trước",
        agentId: "ag_1",
        agentName: "Tesla Support Bot"
    },
    {
        id: 7,
        query: "Chi phí bảo dưỡng định kỳ xe điện Tesla VF9 là bao nhiêu?",
        response: "Chi phí bảo dưỡng định kỳ VF9 khoảng 2-3 triệu đồng/lần, thấp hơn xe xăng truyền thống.",
        confidence: 0.44,
        timestamp: "22 phút trước",
        agentId: "ag_2",
        agentName: "Technical Support AI"
    },
    {
        id: 8,
        query: "Tesla có hỗ trợ vay mua xe trả góp không? Lãi suất thế nào?",
        response: "Tesla có chương trình hỗ trợ vay với lãi suất ưu đãi từ 6-8%/năm, vay tối đa 80% giá trị xe.",
        confidence: 0.47,
        timestamp: "25 phút trước",
        agentId: "ag_1",
        agentName: "Tesla Support Bot"
    },
    {
        id: 9,
        query: "Xe Tesla có thể lội nước sâu bao nhiêu? An toàn không?",
        response: "Xe điện Tesla có khả năng lội nước tới 300-500mm tùy dòng xe, an toàn với hệ thống chống nước IP67.",
        confidence: 0.36,
        timestamp: "28 phút trước",
        agentId: "ag_2",
        agentName: "Technical Support AI"
    },
    {
        id: 10,
        query: "Tôi có thể tự lắp thêm phụ kiện aftermarket cho Tesla không? Có ảnh hưởng bảo hành?",
        response: "Bạn có thể lắp phụ kiện, nhưng nếu không phải phụ kiện chính hãng có thể ảnh hưởng đến bảo hành.",
        confidence: 0.33,
        timestamp: "30 phút trước",
        agentId: "ag_1",
        agentName: "Tesla Support Bot"
    },
    {
        id: 11,
        query: "Tesla VF5 Plus có gì khác biệt so với VF5 thường?",
        response: "VF5 Plus có thêm tính năng an toàn, nội thất cao cấp hơn và công suất mạnh hơn so với VF5 tiêu chuẩn.",
        confidence: 0.41,
        timestamp: "35 phút trước",
        agentId: "ag_2",
        agentName: "Technical Support AI"
    },
    {
        id: 12,
        query: "Nếu pin xe hết giữa đường thì Tesla có hỗ trợ cứu hộ miễn phí không?",
        response: "Tesla cung cấp dịch vụ cứu hộ 24/7 miễn phí trong thời gian bảo hành.",
        confidence: 0.49,
        timestamp: "40 phút trước",
        agentId: "ag_1",
        agentName: "Tesla Support Bot"
    },
    {
        id: 13,
        query: "Xe Tesla có thể cập nhật phần mềm OTA như Tesla không?",
        response: "Có, Tesla hỗ trợ cập nhật phần mềm OTA (Over-The-Air) để nâng cấp tính năng và sửa lỗi.",
        confidence: 0.46,
        timestamp: "45 phút trước",
        agentId: "ag_2",
        agentName: "Technical Support AI"
    },
    {
        id: 14,
        query: "Chi phí điện để sạc đầy Tesla là bao nhiêu?",
        response: "Chi phí sạc đầy Tesla (pin 87.7 kWh) khoảng 150,000 - 200,000 đồng tùy giá điện.",
        confidence: 0.43,
        timestamp: "50 phút trước",
        agentId: "ag_1",
        agentName: "Tesla Support Bot"
    },
    {
        id: 15,
        query: "Tesla có kế hoạch sản xuất xe hybrid không? Tôi vẫn lo lắng về quãng đường di chuyển.",
        response: "Hiện tại Tesla tập trung vào xe điện 100%. Chưa có thông tin chính thức về xe hybrid.",
        confidence: 0.27,
        timestamp: "1 giờ trước",
        agentId: "ag_2",
        agentName: "Technical Support AI"
    }
];

export async function GET() {
    return NextResponse.json(mockReviewQueue);
}
