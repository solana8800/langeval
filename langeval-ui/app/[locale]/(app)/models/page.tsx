"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EyeOff, Plus, Trash2, RotateCw, Loader2, ChevronUp, ChevronDown, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

import { toast } from "sonner";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function ModelRegistryPage() {
   const [models, setModels] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   // Form State
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingId, setEditingId] = useState<string | null>(null);
   const [formData, setFormData] = useState({
      name: "",
      provider: "OpenAI",
      type: "API",
      api_key: "",
      base_url: ""
   });

   const [showGuide, setShowGuide] = useState(true);
   const [deleteId, setDeleteId] = useState<string | null>(null); // For Delete Dialog

   useEffect(() => {
      fetchModels();
   }, []);

   const fetchModels = async () => {
      try {
         const data = await apiClient('/resource/models');
         const items = Array.isArray(data) ? data : (data.items || []);
         setModels(items);
      } catch (error) {
         console.error("Failed to fetch models", error);
         toast.error("Không thể tải danh sách Models. Vui lòng kiểm tra kết nối Backend.");
         setModels([]);
      } finally {
         setLoading(false);
      }
   };

   const handleAddNewClick = () => {
      setEditingId(null);
      setFormData({ name: "", provider: "OpenAI", type: "API", api_key: "", base_url: "" });
      setIsDialogOpen(true);
   };

   const handleEditClick = (model: any) => {
      setEditingId(model.id);
      setFormData({
         name: model.name,
         provider: model.provider,
         type: model.type || "API",
         api_key: "", // Don't fill API key for security, user enters new one if needed
         base_url: model.base_url || ""
      });
      setIsDialogOpen(true);
   };

   const handleSaveModel = async () => {
      if (!formData.name) {
         toast.warning("Vui lòng nhập Tên Model");
         return;
      }

      // Allow empty API Key for Local models OR if editing (assuming keeping old key)
      if (formData.type === 'API' && !formData.api_key && !editingId) {
         toast.warning("Vui lòng nhập API Key cho Cloud Model");
         return;
      }

      try {
         const endpoint = editingId
            ? `/resource/models/${editingId}`
            : '/resource/models';

         await apiClient(endpoint, {
            method: editingId ? 'PUT' : 'POST',
            body: JSON.stringify(formData)
         });

         setIsDialogOpen(false);
         await fetchModels();
         // Reset form
         setFormData({ name: "", provider: "OpenAI", type: "API", api_key: "", base_url: "" });
         setEditingId(null);
         toast.success(editingId ? "✅ Cập nhật Model thành công!" : "✅ Thêm Model thành công!");
      } catch (e: any) {
         console.error(e);
         toast.error(`❌ ${editingId ? "Cập nhật" : "Thêm"} Model thất bại: ${e.message || "Lỗi kết nối tới máy chủ."}`);
      }
   };

   // Triggered when user clicks Delete icon
   const confirmDelete = (id: string) => {
      setDeleteId(id);
   };

   const handleDelete = async () => {
      if (!deleteId) return;
      try {
         await apiClient(`/resource/models/${deleteId}`, { method: 'DELETE' });
         setModels(prev => prev.filter(m => m.id !== deleteId));
         toast.success("🗑️ Đã xóa Model thành công!");
      } catch (e: any) {
         console.error(e);
         toast.error(`Không thể xóa Model: ${e.message || "Lỗi hệ thống"}`);
      } finally {
         setDeleteId(null);
      }
   };

   return (
      <div className="space-y-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
            <div>
               <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">Quản Lý Model (Model Registry)</h1>
               <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">Quản lý kết nối LLM cho các tác vụ Judge và Simulator.</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
               <DialogTrigger asChild>
                  <Button onClick={handleAddNewClick} className="w-full md:w-auto gap-2 bg-slate-900 hover:bg-slate-800 shadow-sm text-xs md:text-sm h-9">
                     <Plus className="h-3.5 w-3.5" /> Thêm Model Mới
                  </Button>
               </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>{editingId ? "Cập Nhật Model" : "Thêm Model Mới"}</DialogTitle>
                     <DialogDescription>
                        {editingId ? "Chỉnh sửa thông tin kết nối." : "Nhập thông tin kết nối tới LLM Provider."}
                     </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                     {editingId && (
                        <div className="space-y-2 opacity-70">
                           <Label>Model System ID (Database)</Label>
                           <Input value={editingId} readOnly className="bg-slate-50 font-mono text-xs cursor-default" />
                        </div>
                     )}
                     <div className="space-y-2">
                        <Label>Tên Model (ID)</Label>
                        <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="VD: gpt-4-turbo-preview" />
                        <p className="text-xs text-slate-500">Tên này sẽ được dùng để gọi API (vd: gpt-4, claude-3-opus).</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label>Nhà Cung Cấp</Label>
                           <Select value={formData.provider} onValueChange={v => setFormData({ ...formData, provider: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="OpenAI">OpenAI</SelectItem>
                                 <SelectItem value="Anthropic">Anthropic</SelectItem>
                                 <SelectItem value="Azure">Azure OpenAI</SelectItem>
                                 <SelectItem value="DeepSeek">DeepSeek</SelectItem>
                                 <SelectItem value="VLLM">VLLM (Local)</SelectItem>
                                 <SelectItem value="Gemini">Google Gemini</SelectItem>
                                 <SelectItem value="Custom">Custom / Khác</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label>Loại Kết Nối</Label>
                           <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="API">Cloud API</SelectItem>
                                 <SelectItem value="Local">Local Host</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label>API Base URL (Optional)</Label>
                        <Input value={formData.base_url} onChange={e => setFormData({ ...formData, base_url: e.target.value })} placeholder="https://api.openai.com/v1" />
                        <p className="text-xs text-slate-500">Bắt buộc cho Azure, VLLM hoặc Custom Endpoint.</p>
                     </div>
                     <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input type="password" value={formData.api_key} onChange={e => setFormData({ ...formData, api_key: e.target.value })} placeholder={editingId ? "Để trống nếu không đổi..." : "sk-..."} />
                        <p className="text-xs text-slate-500">Key sẽ được mã hóa đầu cuối (Encrypted at Rest).</p>
                     </div>
                  </div>
                  <DialogFooter>
                     <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                     <Button onClick={handleSaveModel}>{editingId ? "Lưu Thay Đổi" : "Thêm Mới"}</Button>
                  </DialogFooter>
               </DialogContent>
            </Dialog>
         </div>

         {/* Hướng dẫn sử dụng */}
         <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden transition-all">
            <div
               className="p-4 flex items-center justify-between cursor-pointer hover:bg-blue-100/50"
               onClick={() => setShowGuide(!showGuide)}
            >
               <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  ℹ️ Hướng dẫn sử dụng
               </h3>
               <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-700 hover:text-blue-900 hover:bg-blue-200/50">
                  {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
            </div>

            {showGuide && (
               <div className="px-4 pb-4">
                  <ul className="list-disc ml-5 text-sm text-blue-800 space-y-1">
                     <li><strong>Model Registry</strong> là nơi quản lý các kết nối API đến các LLM (Large Language Models) như GPT-4, Claude 3, hoặc Local VLLM.</li>
                     <li>Các Model được khai báo tại đây sẽ được hệ thống sử dụng cho 2 mục đích chính:
                        <ul className="list-[circle] ml-5 mt-1 text-blue-700">
                           <li><strong>Simulator (User Giả Lập):</strong> Đóng vai người dùng khó tính để chat với Bot của bạn trong Battle Arena.</li>
                           <li><strong>AI Judge (Giám Khảo):</strong> Đọc lịch sử chat và chấm điểm tự động các tiêu chí (Accuracy, Safety...).</li>
                        </ul>
                     </li>
                     <li>API Key được mã hóa an toàn và chỉ được giải mã khi thực thi.</li>
                  </ul>
               </div>
            )}
         </div>

         <Card className="shadow-sm border-slate-200">
            <Table>
               <TableHeader className="bg-slate-50">
                  <TableRow>
                     <TableHead className="font-semibold text-slate-700">Tên Model</TableHead>
                     <TableHead className="font-semibold text-slate-700">Nhà cung cấp (Provider)</TableHead>
                     <TableHead className="font-semibold text-slate-700">Loại (Type)</TableHead>
                     <TableHead className="font-semibold text-slate-700">Trạng thái</TableHead>
                     <TableHead className="font-semibold text-slate-700">Base URL</TableHead>
                     <TableHead className="font-semibold text-slate-700">Bảo mật</TableHead>
                     <TableHead className="text-right font-semibold text-slate-700">Thao tác</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {loading ? (
                     <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                           <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                           Đang tải dữ liệu...
                        </TableCell>
                     </TableRow>
                  ) : models.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                           Chưa có model nào. Hãy thêm mới!
                        </TableCell>
                     </TableRow>
                  ) : models.map((m) => (
                     <TableRow key={m.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-900">{m.name}</TableCell>
                        <TableCell className="text-slate-600">{m.provider}</TableCell>
                        <TableCell><Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">{m.type}</Badge></TableCell>
                        <TableCell>
                           {/* Ping check logic can be added later */}
                           <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none">Active</Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 font-mono text-xs max-w-[200px] truncate" title={m.base_url}>{m.base_url || '-'}</TableCell>
                        <TableCell>
                           {m.api_key_encrypted || m.api_key ? (
                              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1">
                                 <EyeOff className="h-3 w-3" /> Encrypted
                              </Badge>
                           ) : (
                              <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100">No Key</Badge>
                           )}
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" title="Chỉnh sửa" onClick={() => handleEditClick(m)} className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"><Edit className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" title="Xóa" onClick={() => confirmDelete(m.id)} className="text-slate-500 hover:text-[#D13138] hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                           </div>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </Card>

         <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Bạn có chắc muốn xóa?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Hành động này không thể hoàn tác. Model sẽ bị xóa vĩnh viễn khỏi hệ thống.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                     Xóa Model
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   );
}
