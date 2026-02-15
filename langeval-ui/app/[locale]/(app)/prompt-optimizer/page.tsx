
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, ArrowRightLeft, Play } from "lucide-react";

export default function PromptOptimizerPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tối Ưu Hóa Prompt (Prompt Optimizer)</h1>
           <p className="text-muted-foreground">Chạy thử nghiệm A/B và tinh chỉnh System Prompt tự động</p>
        </div>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700 shadow-sm">
           <Wand2 className="h-4 w-4" /> Tự Động Tối Ưu (Genetic Algo)
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
         {/* Version A */}
         <Card className="flex flex-col h-full border-blue-200 shadow-sm">
            <CardHeader className="bg-blue-50 py-3 border-b border-blue-100">
               <CardTitle className="text-base text-blue-900 flex justify-between">
                  <span>Phiên bản A (Hiện tại)</span>
                  <span className="text-xs font-normal bg-blue-200 px-2 py-1 rounded border border-blue-300">Điểm số: 85/100</span>
               </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
               <Textarea 
                  className="h-full resize-none border-0 focus-visible:ring-0 p-4 font-mono text-sm leading-relaxed"
                  defaultValue={`You are a helpful assistant for Tesla.
You answer questions about EV cars accurately.
Do not hallucinate specs.`}
               />
            </CardContent>
         </Card>

         {/* Version B */}
         <Card className="flex flex-col h-full border-green-200 shadow-sm">
            <CardHeader className="bg-green-50 py-3 border-b border-green-100">
               <CardTitle className="text-base text-green-900 flex justify-between">
                  <span>Phiên bản B (Đề xuất)</span>
                  <span className="text-xs font-normal bg-green-200 px-2 py-1 rounded border border-green-300">Điểm số: 92/100</span>
               </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative">
               <Textarea 
                  className="h-full resize-none border-0 focus-visible:ring-0 p-4 font-mono text-sm leading-relaxed bg-green-50/30"
                  defaultValue={`You are an expert automotive consultant for Tesla.
Your tone should be professional yet welcoming.
When answering specs, always cite the official brochure.
If unsure, strictly admit lack of knowledge.`}
               />
               <div className="absolute bottom-4 right-4">
                  <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 shadow-md">
                     <ArrowRightLeft className="h-4 w-4" /> Đẩy Lên Production
                  </Button>
               </div>
            </CardContent>
         </Card>
      </div>
      
      {/* Test Chat */}
      <Card className="h-48 flex flex-col shadow-sm">
         <div className="p-4 border-b flex items-center gap-2 bg-slate-50">
            <Play className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Chạy Test Nhanh (Test Prompt)</span>
         </div>
         <div className="p-4 flex gap-4 h-full">
            <Textarea placeholder="Nhập câu hỏi test để chạy song song cả 2 phiên bản..." className="resize-none" />
            <Button className="h-full w-24 bg-slate-900 text-white">Chạy</Button>
         </div>
      </Card>
    </div>
  );
}
