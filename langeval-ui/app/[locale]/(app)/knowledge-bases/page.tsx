"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Database, FileText, Upload, Server, Trash2, ExternalLink, Search, ChevronUp, ChevronDown, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
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

interface KnowledgeBase {
   id: string;
   name: string;
   description?: string;
   source_path: string;
   type: string;
   status: string;
   chunking_strategy?: string;
   meta_data?: Record<string, any>;
   created_at: string;
}

const MOCK_KBS: KnowledgeBase[] = [
   {
      id: "kb-001",
      name: "Tesla Sale Policy 2024",
      description: "Quy định bán hàng, hậu mãi và chính sách pin mới nhất.",
      type: "document",
      source_path: "s3://vinfast-data/policy/2024_v2.pdf",
      status: "Ready",
      chunking_strategy: "Semantic",
      created_at: new Date().toISOString()
   },
   {
      id: "kb-002",
      name: "Mayo Clinic Medical Guidelines",
      description: "Hướng dẫn chẩn đoán và phác đồ điều trị sơ cấp cứu.",
      type: "vectordb",
      source_path: "qdrant://vinmec-med-v1",
      status: "Indexing",
      chunking_strategy: "Recursive",
      created_at: new Date(Date.now() - 86400000).toISOString()
   },
   {
      id: "kb-003",
      name: "Marina Bay Sand Zone 1 Specs",
      description: "Thông số kỹ thuật các phân khu Ocean Park.",
      type: "web",
      source_path: "https://vinhomes.vn/ocean-park/specs",
      status: "Error",
      chunking_strategy: "Markdown",
      created_at: new Date(Date.now() - 172800000).toISOString()
   }
];

export default function KnowledgeBasePage() {
   const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
   const [loading, setLoading] = useState(true);
   const [newKbOpen, setNewKbOpen] = useState(false);
   const [showGuide, setShowGuide] = useState(true);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [deleteId, setDeleteId] = useState<string | null>(null);

   // Form State
   const [formData, setFormData] = useState({
      name: "",
      description: "",
      type: "document",
      source_path: "",
      chunking_strategy: "fixed-size",
      status: "ready"
   });

   const fetchKBs = async () => {
      setLoading(true);
      try {
         const data = await apiClient("/resource/knowledge-bases");
         // Handle Paginated Response (Page[T]) or List
         const items = data.items || data;
         if (Array.isArray(items) && items.length > 0) {
            setKbs(items);
         } else {
            // Fallback to MOCK if empty or invalid
            console.warn("API returned empty/invalid, using MOCK data"); // Debug safe
            setKbs(MOCK_KBS);
         }
      } catch (error) {
         console.error(error);
         toast.error("Error connecting to server, showing Mock Data");
         setKbs(MOCK_KBS);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchKBs();
   }, []);

   const handleCreate = async () => {
      setIsSubmitting(true);
      try {
         const payload = {
            ...formData,
            meta_data: { source: "ui-created" }
         };

         await apiClient("/resource/knowledge-bases", {
            method: "POST",
            body: JSON.stringify(payload)
         });

         toast.success("Knowledge Base created successfully");
         setNewKbOpen(false);
         fetchKBs();
         setFormData({
            name: "",
            description: "",
            type: "document",
            source_path: "",
            chunking_strategy: "fixed-size",
            status: "ready"
         });
      } catch (error: any) {
         toast.error(`Failed to create KB: ${error.message || "Error submitting form"}`);
      } finally {
         setIsSubmitting(false);
      }
   };

   const confirmDelete = (id: string) => {
      setDeleteId(id);
   };

   const handleDelete = async () => {
      if (!deleteId) return;

      try {
         await apiClient(`/resource/knowledge-bases/${deleteId}`, {
            method: "DELETE"
         });

         toast.success("Deleted successfully");
         fetchKBs();
      } catch (error) {
         toast.error("Error deleting KB");
      } finally {
         setDeleteId(null);
      }
   };

   return (
      <div className="space-y-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
            <div>
               <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">Knowledge Base Registry</h1>
               <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">Quản lý kết nối tới các nguồn dữ liệu (Vector DB, CMS, File Storage) để phục vụ RAG Evaluation.</p>
            </div>

            <div className="flex items-center gap-2">
               <Button variant="outline" size="icon" onClick={fetchKBs} disabled={loading}>
                  <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
               </Button>

               <Dialog open={newKbOpen} onOpenChange={setNewKbOpen}>
                  <DialogTrigger asChild>
                     <Button className="w-full md:w-auto gap-2 bg-[#D13138] hover:bg-[#b71c1c] shadow-sm text-xs md:text-sm h-9">
                        <Plus className="h-3.5 w-3.5" /> Thêm Knowledge Base
                     </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                     <DialogHeader>
                        <DialogTitle>Kết Nối Knowledge Base Mới</DialogTitle>
                        <DialogDescription>Chọn loại nguồn dữ liệu bạn muốn kết nối.</DialogDescription>
                     </DialogHeader>

                     <Tabs defaultValue="document" className="w-full py-4" onValueChange={(val) => setFormData({ ...formData, type: val })}>
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                           <TabsTrigger value="document">Document Store</TabsTrigger>
                           <TabsTrigger value="vectordb">Vector DB</TabsTrigger>
                           <TabsTrigger value="web">Web Resource</TabsTrigger>
                        </TabsList>

                        <div className="space-y-4">
                           <div className="space-y-2">
                              <Label>Tên Knowledge Base</Label>
                              <Input
                                 placeholder="Ví dụ: Product Manuals"
                                 value={formData.name}
                                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label>Mô Tả</Label>
                              <Input
                                 placeholder="Mô tả ngắn về dữ liệu..."
                                 value={formData.description}
                                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label>Nguồn Dữ Liệu (Source Path/URL)</Label>
                              <Input
                                 placeholder="s3://bucket/path hoặc https://api.qdrant.io"
                                 value={formData.source_path}
                                 onChange={(e) => setFormData({ ...formData, source_path: e.target.value })}
                              />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <Label>Trạng Thái</Label>
                                 <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                 >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="ready">Ready</SelectItem>
                                       <SelectItem value="indexing">Indexing</SelectItem>
                                       <SelectItem value="error">Error</SelectItem>
                                       <SelectItem value="maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                              <div className="space-y-2">
                                 <Label>Strategy</Label>
                                 <Select
                                    value={formData.chunking_strategy}
                                    onValueChange={(val) => setFormData({ ...formData, chunking_strategy: val })}
                                 >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="fixed-size">Fixed Size</SelectItem>
                                       <SelectItem value="recursive">Recursive</SelectItem>
                                       <SelectItem value="semantic">Semantic (AI)</SelectItem>
                                       <SelectItem value="markdown">Markdown</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                           </div>
                        </div>
                     </Tabs>

                     <DialogFooter>
                        <Button variant="outline" onClick={() => setNewKbOpen(false)}>Hủy</Button>
                        <Button
                           className="bg-[#D13138] hover:bg-[#b71c1c]"
                           onClick={handleCreate}
                           disabled={isSubmitting}
                        >
                           {isSubmitting ? "Đang xử lý..." : "Kết Nối"}
                        </Button>
                     </DialogFooter>
                  </DialogContent>
               </Dialog>
            </div>
         </div>

         {/* Hướng dẫn sử dụng */}
         <div className="bg-orange-50 border border-orange-200 rounded-lg overflow-hidden transition-all">
            <div
               className="p-4 flex items-center justify-between cursor-pointer hover:bg-orange-100/50"
               onClick={() => setShowGuide(!showGuide)}
            >
               <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                  ℹ️ Knowledge Base là gì?
               </h3>
               <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-orange-700 hover:text-orange-900 hover:bg-orange-200/50">
                  {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
            </div>

            {showGuide && (
               <div className="px-4 pb-4">
                  <p className="text-sm text-orange-800 mb-2">
                     <strong>Knowledge Base (KB)</strong> là kho dữ liệu kiến thức chuẩn (Golden Knowledge) được sử dụng để đánh giá độ chính xác của câu trả lời (RAG Evaluation).
                  </p>
                  <ul className="list-disc ml-5 text-sm text-orange-800 space-y-1">
                     <li>Bạn cần kết nối tới <strong>Vector Database</strong> (như Qdrant, Pinecone) nơi chứa dữ liệu embedding của Bot.</li>
                     <li>Hoặc upload tài liệu gốc (PDF, Docx) để hệ thống tự động chunking và tạo index so sánh.</li>
                     <li>Hệ thống sẽ dùng KB này để kiểm tra xem câu trả lời của Bot có bị <strong>Hallucination</strong> (bịa đặt) so với tài liệu gốc hay không.</li>
                  </ul>
               </div>
            )}
         </div>

         <div className="grid gap-6">
            <Card className="shadow-sm border-slate-200">
               <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-slate-800">Connected Knowledge Sources</CardTitle>
                  <CardDescription>Danh sách các nguồn dữ liệu đang được kết nối.</CardDescription>
               </CardHeader>
               <CardContent className="p-0">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Tên Knowledge Base</TableHead>
                           <TableHead>Mô Tả</TableHead>
                           <TableHead>Loại</TableHead>
                           <TableHead>Source Path</TableHead>
                           <TableHead>Chiến lược Chunking</TableHead>
                           <TableHead>Trạng Thái</TableHead>
                           <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {kbs.length === 0 && !loading && (
                           <TableRow>
                              <TableCell colSpan={7} className="text-center h-24 text-slate-500">
                                 Chưa có dữ liệu. Hãy thêm mới!
                              </TableCell>
                           </TableRow>
                        )}
                        {(Array.isArray(kbs) ? kbs : []).map((kb) => (
                           <TableRow key={kb.id}>
                              <TableCell className="font-medium flex items-center gap-2">
                                 {kb.type === 'vectordb' && <Database className="h-4 w-4 text-purple-500" />}
                                 {kb.type === 'document' && <FileText className="h-4 w-4 text-blue-500" />}
                                 {kb.type === 'web' && <Server className="h-4 w-4 text-orange-500" />}
                                 <div className="flex flex-col">
                                    <span>{kb.name}</span>
                                    <span className="text-xs text-slate-400 font-normal">{new Date(kb.created_at).toLocaleDateString()}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-slate-600 max-w-[200px] truncate" title={kb.description}>{kb.description || "-"}</TableCell>
                              <TableCell>{kb.type}</TableCell>
                              <TableCell className="text-slate-500 font-mono text-xs max-w-[150px] truncate" title={kb.source_path}>{kb.source_path}</TableCell>
                              <TableCell><Badge variant="outline">{kb.chunking_strategy}</Badge></TableCell>
                              <TableCell>
                                 {kb.status?.toLowerCase() === 'active' || kb.status?.toLowerCase() === 'ready' ?
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 shadow-none">Ready</Badge> : null
                                 }
                                 {kb.status?.toLowerCase() === 'syncing' || kb.status?.toLowerCase() === 'indexing' ?
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-none animate-pulse">Indexing</Badge> : null
                                 }
                                 {kb.status?.toLowerCase() === 'error' &&
                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 shadow-none">Error</Badge>
                                 }
                                 {kb.status?.toLowerCase() === 'maintenance' &&
                                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 shadow-none">Maintenance</Badge>
                                 }
                              </TableCell>
                              <TableCell className="text-right">
                                 <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                                       <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(kb.id)} className="h-8 w-8 text-slate-500 hover:text-red-600">
                                       <Trash2 className="h-4 w-4" />
                                    </Button>
                                 </div>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </CardContent>
            </Card>
         </div>

         <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
                  <AlertDialogDescription>
                     This action cannot be undone. This knowledge base will be permanently removed.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                     Delete
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   );
}
