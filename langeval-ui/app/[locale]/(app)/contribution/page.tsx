
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Plus, FileJson, Save, Eye, Send, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function ContributionPage() {
  const [commits, setCommits] = useState<any[]>([]);
  const [loadingComs, setLoadingComs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [input, setInput] = useState("");
  const [showGuide, setShowGuide] = useState(true);
  const [expected, setExpected] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    fetchCommits();
  }, []);

  const fetchCommits = async () => {
    try {
      const res = await fetch('/api/v1/contribution/commits');
      const data = await res.json();
      setCommits(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComs(false);
    }
  };

  const handleCommit = async () => {
    if (!input) {
      toast.warning("Vui lòng nhập nội dung!");
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      await fetch('/api/v1/contribution/commit', {
        method: 'POST',
        body: JSON.stringify({ input, expected, tags })
      });

      toast.success("Đã commit thành công!");
      setInput("");
      setExpected("");
      fetchCommits();
    } catch (e) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">Đóng Góp Dữ Liệu Test</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">Crowdsourcing: Bổ sung các trường hợp biên (edge-cases) vào tập dữ liệu chuẩn (Golden Dataset).</p>
        </div>
      </div>

      {/* Hướng dẫn Đóng Góp */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg overflow-hidden transition-all">
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-indigo-100/50"
          onClick={() => setShowGuide(!showGuide)}
        >
          <h3 className="font-semibold text-indigo-900 flex items-center gap-2 text-sm">
            ℹ️ Hướng Dẫn Đóng Góp
          </h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-200/50">
            {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {showGuide && (
          <div className="px-4 pb-4">
            <div className="grid md:grid-cols-3 gap-6 text-sm text-indigo-800">
              <div className="space-y-1">
                <h4 className="font-semibold">1. Tính Cụ Thể</h4>
                <p>Đảm bảo `User Input` mô tả rõ ràng ngữ cảnh. Tránh các câu hỏi quá mơ hồ như "Xe thế nào?".</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold">2. Chất Lượng hơn Số Lượng</h4>
                <p>Tập trung vào các ca khó (edge cases) mà Bot hiện tại đang xử lý sai.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold">3. Gắn Thẻ (Tagging)</h4>
                <p>Sử dụng hashtag nhất quán để dễ dàng lọc và kiểm thử lại sau này.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="quick-add" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="quick-add" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md">Form Nhập Nhanh</TabsTrigger>
              <TabsTrigger value="batch" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md">Nhập Hàng Loạt (JSON)</TabsTrigger>
            </TabsList>
            <TabsContent value="quick-add" className="mt-4">
              <Card className="border shadow-sm">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-lg font-semibold text-slate-800">Thêm Trường Hợp Mới</CardTitle>
                  <CardDescription>
                    Nhập một tình huống cụ thể mà Bot hiện tại đang trả lời sai hoặc chưa tốt.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="input" className="text-slate-700 font-medium">Đầu vào người dùng (User Input)</Label>
                    <Textarea
                      id="input"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="VD: Khách hàng hỏi về chính sách thuê pin Tesla T4 khi mua xe tháng 10..."
                      className="min-h-[100px] focus-visible:ring-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expected" className="text-slate-700 font-medium">Đầu ra mong đợi (Expected Output) - <span className="font-normal text-slate-500">Tùy chọn</span></Label>
                    <Textarea
                      id="expected"
                      value={expected}
                      onChange={(e) => setExpected(e.target.value)}
                      placeholder="Câu trả lời lý tưởng mà Bot nên đưa ra..."
                      className="focus-visible:ring-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-slate-700 font-medium">Thẻ phân loại (Tags)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="VD: #edge-case, #vf3, #policy"
                      className="focus-visible:ring-red-500"
                    />
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">#edge-case</Badge>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">#vf3</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between bg-slate-50 border-t p-4">
                  <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900">
                    <Eye className="h-4 w-4" /> Xem trước JSON
                  </Button>
                  <Button onClick={handleCommit} disabled={isSubmitting} className="bg-[#D13138] hover:bg-[#b71c1c] text-white gap-2">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
                    Commit vào Dataset
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="batch" className="mt-4">
              <Card className="border shadow-sm">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-lg font-semibold text-slate-800">Trình Soạn Thảo Batch</CardTitle>
                  <CardDescription>
                    Dán danh sách các đối tượng JSON để thêm nhiều trường hợp cùng lúc.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="bg-slate-950 text-slate-50 p-4 font-mono text-sm min-h-[300px] overflow-auto">
                      <span className="text-slate-500">{`// Mảng các object test case`}</span>
                      <br />{`[`}
                      <br />&nbsp;&nbsp;{`{`}
                      <br />&nbsp;&nbsp;&nbsp;&nbsp;{`"input": "...",`}
                      <br />&nbsp;&nbsp;&nbsp;&nbsp;{`"expected_output": "..."`}
                      <br />&nbsp;&nbsp;{`},`}
                      <br />&nbsp;&nbsp;{`...`}
                      <br />{`]`}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end bg-slate-50 border-t p-4">
                  <Button className="bg-[#D13138] hover:bg-[#b71c1c] text-white gap-2">
                    <GitBranch className="h-4 w-4" /> Commit Batch
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-fit border shadow-sm sticky top-4">
            <CardHeader className="bg-blue-50/50 border-b py-4">
              <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                <GitBranch className="h-4 w-4" /> Commits Gần Đây
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingComs ? <p className="p-4 text-sm text-slate-500">Đang tải...</p> : (
                <ul className="divide-y divide-slate-100">
                  {commits.map((c) => (
                    <li key={c.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="text-sm font-medium text-slate-900 line-clamp-2">{c.message}</div>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 font-normal text-slate-500 border-slate-200">User Contribution</Badge>
                        <span className="text-xs text-slate-400">{c.time}</span>
                      </div>
                    </li>
                  ))}
                  {commits.length === 0 && <li className="p-4 text-sm text-slate-500 text-center">Chưa có commit nào</li>}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/*
        <div>
          <Card className="h-fit border shadow-sm">
             <CardHeader className="bg-slate-50 border-b py-4">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                   <GitBranch className="h-4 w-4" /> Commits Gần Đây
                </CardTitle>
             </CardHeader>
             <CardContent className="p-4">
                {loadingComs ? <p className="text-sm text-slate-500">Đang tải...</p> : (
                   <ul className="space-y-4">
                     {commits.map((c) => (
                       <li key={c.id} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                         <div className="text-sm font-medium text-slate-900">{c.message}</div>
                         <div className="text-xs text-slate-500 mt-1">{c.time}</div>
                       </li>
                     ))}
                   </ul>
                )}
             </CardContent>
          </Card>
        </div>
        */}
    </div>
  );
}
