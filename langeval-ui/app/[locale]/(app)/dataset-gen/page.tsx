
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, FileText, Sparkles, Clock, CheckCircle, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAgents } from "@/lib/use-agents";
import { apiClient } from "@/lib/api-client";

export default function DatasetGeneratorPage() {
   const [loading, setLoading] = useState(false);
   const [history, setHistory] = useState<any[]>([]);
   const [showGuide, setShowGuide] = useState(true);
   const { agents } = useAgents();
   const [selectedAgent, setSelectedAgent] = useState<string>("all");

   useEffect(() => {
      fetchHistory();
   }, []);

   const fetchHistory = async () => {
      try {
         const data = await apiClient('/dataset-gen/history');
         setHistory(data);
      } catch (e) {
         console.error(e);
      }
   };

   const handleGenerate = async () => {
      setLoading(true);
      try {
         await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay
         await apiClient('/dataset-gen/generate', {
            method: 'POST',
            body: JSON.stringify({ topic: "General", quantity: 50 })
         });
         toast.success("Bắt đầu sinh dữ liệu thành công! Hệ thống sẽ xử lý trong nền.");
         fetchHistory(); // Refresh history
      } catch (e: any) {
         toast.error(`Có lỗi xảy ra: ${e.message || "Unknown error"}`);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
            <div>
               <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">Sinh Dữ Liệu Tự Động</h1>
               <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">Tự động chuyển đổi tài liệu nghiệp vụ thành các bộ test case chuẩn.</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 w-full md:w-auto">
               <span className="text-xs md:text-sm font-medium text-slate-600 pl-2 shrink-0">Generate for:</span>
               <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-full md:w-[200px] h-8 md:h-9 bg-white border-slate-200 shadow-sm text-xs md:text-sm">
                     <SelectValue placeholder="Chọn Agent" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Tất cả Agent</SelectItem>
                     {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>

         {/* Hướng dẫn quy trình */}
         {/* Hướng dẫn quy trình */}
         <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden transition-all">
            <div
               className="p-4 flex items-center justify-between cursor-pointer hover:bg-green-100/50"
               onClick={() => setShowGuide(!showGuide)}
            >
               <h3 className="font-semibold text-green-900 flex items-center gap-2">
                  ℹ️ Quy trình sinh dữ liệu
               </h3>
               <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-700 hover:text-green-900 hover:bg-green-200/50">
                  {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
            </div>

            {showGuide && (
               <div className="px-4 pb-4">
                  <ol className="list-decimal ml-5 text-sm text-green-800 space-y-1">
                     <li><strong>Bước 1 (Upload):</strong> Tải lên các tài liệu nghiệp vụ mẫu (PDF, Word, Text) chứa kiến thức chuẩn.</li>
                     <li><strong>Bước 2 (Config):</strong> Cấu hình độ khó, loại câu hỏi (Fact-checking hay Suy luận) và số lượng mẫu cần sinh.</li>
                     <li><strong>Bước 3 (Generate):</strong> Hệ thống sẽ dùng LLM để đóng vai chuyên gia, đọc tài liệu và tự tạo ra bộ câu hỏi + câu trả lời mẫu (Golden Dataset).</li>
                  </ol>
               </div>
            )}
         </div>

         <div className="grid gap-8 lg:grid-cols-2">
            <Card className="shadow-sm border-slate-200">
               <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-slate-800">Nguồn Tài Liệu (Source Material)</CardTitle>
                  <CardDescription>Tải lên tài liệu nghiệp vụ (PDF, DOCX) để hệ thống học.</CardDescription>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                     <div className="bg-slate-100 p-4 rounded-full w-fit mx-auto mb-4 group-hover:bg-slate-200 transition-colors">
                        <Upload className="h-8 w-8 text-slate-400" />
                     </div>
                     <h3 className="font-medium text-lg text-slate-700">Kéo & Thả file vào đây</h3>
                     <p className="text-sm text-slate-500 mt-2">hoặc click để duyệt file từ máy</p>
                  </div>
                  <div className="mt-6 space-y-2">
                     <h4 className="text-sm font-semibold text-slate-600 mb-2">Đã tải lên:</h4>
                     <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded shadow-sm hover:border-blue-300 transition-colors">
                        <div className="bg-blue-100 p-2 rounded">
                           <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                           <p className="text-sm font-medium text-slate-900">Chinh_Sach_Bao_Hanh_VF3_v2.pdf</p>
                           <p className="text-xs text-slate-500">2.4 MB • Đã tải xong</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
                           <span className="sr-only">Xóa</span>
                           &times;
                        </Button>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
               <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-slate-800">Cấu Hình Sinh Dữ Liệu</CardTitle>
                  <CardDescription>Tùy chỉnh các tham số cho quá trình sinh test case.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6 p-6">
                  <div className="space-y-2">
                     <Label className="text-slate-700">Chủ đề tập trung (Topic Focus)</Label>
                     <Input placeholder="Ví dụ: Chính sách pin, Bảo hành, Sạc xe..." className="bg-white" />
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between">
                        <Label className="text-slate-700">Độ phức tạp (Complexity)</Label>
                        <span className="text-sm font-medium text-[#D13138]">Trung bình (50%)</span>
                     </div>
                     <Slider defaultValue={[50]} max={100} step={10} className="[&>.range]:bg-[#D13138]" />
                     <div className="flex justify-between text-xs text-slate-500">
                        <span>Truy xuất đơn giản</span>
                        <span>Suy luận đa bước</span>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-slate-700">Loại câu hỏi (Question Type)</Label>
                     <Select defaultValue="mixed">
                        <SelectTrigger className="bg-white">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="mixed">Hỗn hợp (Mixed)</SelectItem>
                           <SelectItem value="fact">Kiểm tra sự thật (Fact-checking)</SelectItem>
                           <SelectItem value="reasoning">Suy luận logic (Multi-hop Reasoning)</SelectItem>
                           <SelectItem value="adversarial">Gài bẫy (Adversarial/Trick)</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-slate-700">Số lượng (Quantity)</Label>
                     <Select defaultValue="50">
                        <SelectTrigger className="bg-white">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="10">10 cases (Xem trước)</SelectItem>
                           <SelectItem value="50">50 cases</SelectItem>
                           <SelectItem value="100">100 cases</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </CardContent>
               <CardFooter className="bg-slate-50 border-t p-4">
                  <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2 bg-[#D13138] hover:bg-[#b71c1c] text-white shadow-sm h-11 text-base">
                     {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                     {loading ? "Đang Xử Lý..." : "Bắt Đầu Sinh Dữ Liệu"}
                  </Button>
               </CardFooter>
            </Card>
         </div>

         {/* History Section */}
         <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <Clock className="w-5 h-5 text-slate-500" /> Lịch Sử Sinh Gần Đây
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {history.map((item: any) => (
                  <Card key={item.id}>
                     <CardContent className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                           <span className="font-semibold text-slate-700">{item.topic || 'Không tiêu đề'}</span>
                           <Badge variant="outline">{item.status}</Badge>
                        </div>
                        <div className="text-sm text-slate-500">
                           <div>Số lượng: {item.quantity}</div>
                           <div>Ngày tạo: {item.date}</div>
                        </div>
                     </CardContent>
                  </Card>
               ))}
               {history.length === 0 && <p className="text-slate-500">Chưa có lịch sử.</p>}
            </div>
         </div>
      </div>
   );
}
