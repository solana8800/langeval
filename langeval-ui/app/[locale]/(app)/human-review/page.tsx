
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, Check, X, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgents } from "@/lib/use-agents";

export default function HumanReviewPage() {
   const [queue, setQueue] = useState<any[]>([]);
   const [selectedItem, setSelectedItem] = useState<any>(null);
   const [loadingItem, setLoadingItem] = useState(false);
   const [correction, setCorrection] = useState("");
   const [rating, setRating] = useState(0);
   const [showGuide, setShowGuide] = useState(true);
   const { agents } = useAgents();
   const [selectedAgent, setSelectedAgent] = useState<string>("all");
   const [activeTab, setActiveTab] = useState<'list' | 'review'>('list');

   useEffect(() => {
      fetchQueue();
   }, []);

   const fetchQueue = async () => {
      try {
         // Call Resource Service directly (CORS enabled)
         const res = await fetch('http://localhost:8003/resource/reviews/manual-reviews?page=1&page_size=50');
         const data = await res.json();
         // data is Page<ManualReview> { items: [], ... }

         const formattedQueue = data.items.map((item: any) => ({
            id: item.id,
            query: item.test_case_input,
            response: item.actual_output,
            confidence: item.auto_score,
            timestamp: new Date(item.created_at).toLocaleString(),
            original: item
         }));

         setQueue(formattedQueue);
         if (formattedQueue.length > 0 && !selectedItem) {
            setSelectedItem(formattedQueue[0]);
            setCorrection(formattedQueue[0].response);
         }
      } catch (e) {
         console.error("Failed to fetch queue", e);
         toast.error("Không thể tải danh sách đánh giá");
      }
   };

   const handleSelect = (item: any) => {
      setSelectedItem(item);
      setCorrection(item.response);
      setRating(item.original.human_score || 0);
      setActiveTab('review');
   };

   const handleSubmit = async () => {
      if (!selectedItem) return;
      setLoadingItem(true);
      try {
         const payload = {
            status: "approved", // or overridden if correction changed
            human_score: rating > 0 ? rating / 5.0 : undefined, // Normalize 1-5 to 0-1
            reviewer_notes: correction !== selectedItem.response ? "Correction applied: " + correction : "Approved via UI"
         };

         const res = await fetch(`http://localhost:8003/resource/reviews/manual-reviews/${selectedItem.id}/decision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
         });

         if (!res.ok) throw new Error("API call failed");

         // Remove from local queue
         const nextQueue = queue.filter(i => i.id !== selectedItem.id);
         setQueue(nextQueue);
         if (nextQueue.length > 0) {
            handleSelect(nextQueue[0]);
         } else {
            setSelectedItem(null);
            setCorrection(""); // Clear correction
            setActiveTab('list');
         }
         toast.success("Đã gửi đánh giá thành công!");
      } catch (e) {
         console.error(e);
         toast.error("Lỗi khi gửi đánh giá");
      } finally {
         setLoadingItem(false);
      }
   };

   return (
      <div className="space-y-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
            <div>
               <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">Hàng Đợi Đánh Giá (Human Review)</h1>
               <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">Duyệt lại các câu trả lời có độ tin cậy thấp và đóng góp vào tập dữ liệu chuẩn (Golden Dataset).</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 w-full md:w-auto">
               <span className="text-xs md:text-sm font-medium text-slate-600 pl-2 shrink-0">Queue for:</span>
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

         {/* Hướng dẫn Human Review */}
         <div className="bg-purple-50 border border-purple-200 rounded-lg overflow-hidden transition-all">
            <div
               className="p-4 flex items-center justify-between cursor-pointer hover:bg-purple-100/50"
               onClick={() => setShowGuide(!showGuide)}
            >
               <h3 className="font-semibold text-purple-900 flex items-center gap-2 text-sm">
                  ℹ️ Hướng dẫn Human-in-the-loop
               </h3>
               <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-purple-700 hover:text-purple-900 hover:bg-purple-200/50">
                  {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
            </div>

            {showGuide && (
               <div className="px-4 pb-4">
                  <div className="grid md:grid-cols-2 gap-4 mt-2">
                     <div>
                        <h4 className="font-medium text-purple-800 text-xs uppercase mb-1">Mục đích:</h4>
                        <ul className="list-disc ml-5 text-xs text-purple-800 space-y-1">
                           <li>Xử lý các câu hỏi mà AI trả lời với <strong>độ tin cậy thấp</strong> (Confidence Score &lt; 0.5).</li>
                           <li>Thu thập feedback từ chuyên gia để tái huấn luyện (Re-train) hoặc bổ sung vào Knowledge Base.</li>
                        </ul>
                     </div>
                     <div>
                        <h4 className="font-medium text-purple-800 text-xs uppercase mb-1">Quy trình:</h4>
                        <ol className="list-decimal ml-5 text-xs text-purple-800 space-y-1">
                           <li>Chọn hội thoại từ hàng đợi bên trái.</li>
                           <li>Đọc câu hỏi và câu trả lời hiện tại của AI.</li>
                           <li>Chấm điểm (1-5 sao) và <strong>viết lại câu trả lời đúng</strong> vào ô "Golden Answer".</li>
                           <li>Bấm "Chấp Nhận" để lưu vào tập dữ liệu chuẩn.</li>
                        </ol>
                     </div>
                  </div>
               </div>
            )}
         </div>

         <div className="flex flex-col md:grid md:grid-cols-12 gap-6">
            {/* List */}
            <div className={`md:col-span-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto ${activeTab === 'review' ? 'hidden md:block' : ''}`}>
               {queue.map((item) => (
                  <Card
                     key={item.id}
                     onClick={() => handleSelect(item)}
                     className={`cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'ring-2 ring-[#D13138] bg-red-50/30 border-red-100' : 'hover:bg-slate-50 opacity-80 hover:opacity-100'}`}
                  >
                     <CardContent className="p-4">
                        <div className="flex justify-between mb-2">
                           <Badge variant="outline" className={`${item.confidence < 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100'}`}>
                              Độ tin cậy: {item.confidence}
                           </Badge>
                           <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                        </div>
                        <p className="font-medium text-sm line-clamp-2 text-slate-900">"{item.query}"</p>
                     </CardContent>
                  </Card>
               ))}
               {queue.length === 0 && <div className="text-center py-8 text-slate-500">Hàng đợi trống 🎉</div>}
            </div>

            {/* Review Panel */}
            <div className={`md:col-span-8 ${activeTab === 'list' ? 'hidden md:block' : ''}`}>
               {/* Mobile Back Button */}
               <div className="md:hidden mb-2">
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('list')} className="text-slate-500 hover:text-slate-900 -ml-2">
                     <ChevronUp className="h-4 w-4 mr-1 rotate-[-90deg]" /> Quay lại danh sách
                  </Button>
               </div>

               {selectedItem ? (
                  <Card className="h-full flex flex-col shadow-sm">
                     <CardHeader className="border-b bg-slate-50/50">
                        <CardTitle className="text-lg">Duyệt Item #{selectedItem.id}</CardTitle>
                     </CardHeader>
                     <CardContent className="flex-1 p-6 space-y-6">
                        <div className="space-y-2">
                           <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Câu Hỏi (User Input)</h4>
                           <div className="p-4 bg-slate-100 rounded-md text-slate-900">
                              {selectedItem.query}
                           </div>
                        </div>
                        <div className="space-y-2">
                           <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Câu Trả Lời Của AI (AI Response)</h4>
                           <div className="p-4 bg-blue-50 border border-blue-100 rounded-md text-blue-900">
                              {selectedItem.response}
                           </div>
                        </div>

                        <div className="p-6 border rounded-lg space-y-4 bg-slate-50/50">
                           <h3 className="font-semibold text-slate-900">Đánh Giá Của Bạn</h3>
                           <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-600">Xếp hạng:</span>
                              <div className="flex gap-1">
                                 {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                       key={s}
                                       onClick={() => setRating(s)}
                                       className={`h-6 w-6 cursor-pointer ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300 hover:text-yellow-400"}`}
                                    />
                                 ))}
                              </div>
                           </div>
                           <div className="space-y-2">
                              <span className="text-sm font-medium text-slate-600">Câu Trả Lời Đúng (Golden Answer):</span>
                              <Textarea
                                 className="bg-white border-slate-300 focus:ring-[#D13138]"
                                 value={correction}
                                 onChange={(e) => setCorrection(e.target.value)}
                              />
                           </div>
                           <div className="flex gap-3 pt-2">
                              <Button className="flex-1 bg-green-600 hover:bg-green-700 gap-2 shadow-sm" onClick={handleSubmit} disabled={loadingItem}>
                                 {loadingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                 Chấp Nhận Sửa Đổi
                              </Button>
                              <Button variant="outline" className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100">
                                 <X className="h-4 w-4" /> Hủy Bỏ
                              </Button>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               ) : (
                  <div className="h-full flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                     Chọn một item để đánh giá
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
