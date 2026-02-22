
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";

const metrics = [
  { name: "Faithfulness (Độ trung thực)", desc: "Đảm bảo câu trả lời được trích xuất chính xác từ context", threshold: 0.7, blocking: true },
  { name: "Answer Relevancy (Độ liên quan)", desc: "Đảm bảo câu trả lời giải quyết đúng câu hỏi của user", threshold: 0.6, blocking: true },
  { name: "Contextual Recall (Độ phủ context)", desc: "Truy xuất đầy đủ các thông tin cần thiết", threshold: 0.5, blocking: false },
  { name: "Toxicity (Độ độc hại)", desc: "Không chứa nội dung thù địch, bạo lực", threshold: 0.9, blocking: true },
  { name: "Tone Consistency (Giọng văn)", desc: "Phù hợp với nhận diện thương hiệu Tesla", threshold: 0.8, blocking: false },
];

export default function MetricConfiguratorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cấu Hình Chỉ Số Đánh Giá (Metric Configurator)</h1>
        <p className="text-muted-foreground">Thiết lập tiêu chuẩn chất lượng và chính sách chặn Release (Blocking Policy).</p>
      </div>

      <div className="grid gap-6">
         {metrics.map((metric, i) => (
            <Card key={i} className="flex flex-col md:flex-row items-start md:items-center p-6 gap-6 shadow-sm border-slate-200 hover:border-blue-300 transition-colors">
               <div className="cursor-grab text-slate-300 hover:text-slate-500 hidden md:block">
                  <GripVertical className="h-6 w-6" />
               </div>
               <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                     <h3 className="font-semibold text-lg text-slate-800">{metric.name}</h3>
                     {metric.blocking && <Badge variant="destructive" className="text-[10px] h-5 bg-[#D13138] hover:bg-[#b71c1c]">BLOCKING</Badge>}
                  </div>
                  <p className="text-sm text-slate-500">{metric.desc}</p>
               </div>
               
               <div className="w-full md:w-64 space-y-4">
                  <div className="flex justify-between text-sm">
                     <Label className="text-slate-600">Ngưỡng đạt (Threshold)</Label>
                     <span className="font-mono font-bold text-slate-900">{metric.threshold}</span>
                  </div>
                  <Slider defaultValue={[metric.threshold * 100]} max={100} step={5} className="[&>.range]:bg-blue-600" />
               </div>

               <div className="flex items-center gap-3 pl-0 md:pl-6 md:border-l border-slate-100 w-full md:w-auto justify-between md:justify-start">
                  <Label htmlFor={`block-${i}`} className="cursor-pointer text-slate-700">Chặn Release?</Label>
                  <Switch id={`block-${i}`} checked={metric.blocking} />
               </div>
            </Card>
         ))}
      </div>
    </div>
  );
}
