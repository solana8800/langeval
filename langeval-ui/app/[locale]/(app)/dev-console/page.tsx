
"use client";

import { useState, useEffect } from "react";
// import { pipelineLogs, failureDetail } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ExternalLink, Terminal, CheckCircle2, XCircle, Info, ChevronUp, ChevronDown } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-utils";
import { useAgents } from "@/lib/use-agents";

export default function DeveloperConsolePage() {
   const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
   const [logs, setLogs] = useState<any[]>([]);
   const [failure, setFailure] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [showGuide, setShowGuide] = useState(true);
   const [selectedAgent, setSelectedAgent] = useState("ag_1");
   const { agents } = useAgents();

   useEffect(() => {
      // ... (no changes to fetch logic)
      Promise.all([
         fetch(`${API_BASE_URL}/dev-console/logs`).then(res => res.json()),
         fetch(`${API_BASE_URL}/dev-console/failure-detail`).then(res => res.json())
      ])
         .then(([logsData, failureData]) => {
            if (logsData?.data) setLogs(logsData.data);
            if (failureData?.data) setFailure(failureData.data);
         })
         .catch(err => console.error(err))
         .finally(() => setLoading(false));
   }, []);

   return (
      <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
            <div>
               <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">Developer Console</h1>
               <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">Giám sát CI/CD Pipeline & Phân tích nguyên nhân lỗi (RCA)</p>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 w-full md:w-auto">
               <span className="text-xs md:text-sm font-medium text-slate-600 pl-2 shrink-0">Pipeline:</span>
               <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-full md:w-[200px] bg-white border-slate-200 shadow-sm text-xs md:text-sm h-8 md:h-9">
                     <SelectValue placeholder="Chọn Agent" />
                  </SelectTrigger>
                  <SelectContent>
                     {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>

         {/* Hướng dẫn Dev Console */}
         <div className="bg-slate-100 border border-slate-200 rounded-lg overflow-hidden transition-all shrink-0">
            <div
               className="p-3 md:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-200/50"
               onClick={() => setShowGuide(!showGuide)}
            >
               <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  ℹ️ Hướng dẫn Debug
               </h3>
               <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-700 hover:text-slate-900 hover:bg-slate-300/50">
                  {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
            </div>

            {showGuide && (
               <div className="px-4 pb-4">
                  <ul className="list-disc ml-5 text-xs text-slate-700 space-y-1">
                     <li><strong>CI/CD Stream:</strong> Hiển thị log chạy realtime của Pipeline đánh giá. Các dòng màu đỏ là Test Case bị thất bại (Fail).</li>
                     <li><strong>Failure Analysis (RCA):</strong> Click vào một dòng lỗi để xem chi tiết nguyên nhân (Root Cause Analysis). Hệ thống sẽ so sánh Output thực tế vs Output mong đợi.</li>
                  </ul>
               </div>
            )}
         </div>

         <div className="flex flex-col lg:flex-row flex-1 gap-4 overflow-hidden min-h-0">
            {/* Left Panel: Terminal Stream */}
            <Card className="flex-1 flex flex-col bg-slate-950 text-slate-50 border-slate-800 min-h-[300px]">
               <CardHeader className="bg-slate-900 border-b border-slate-800 py-3 shrink-0">
                  <CardTitle className="text-sm font-mono flex items-center gap-2">
                     <Terminal className="h-4 w-4" />
                     ci-pipeline-stream
                  </CardTitle>
               </CardHeader>
               <ScrollArea className="flex-1 p-4 font-mono text-xs md:text-sm">
                  <div className="flex flex-col gap-1">
                     {loading ? <div className="text-slate-500 italic">Initializing pipeline...</div> : logs.map((log) => (
                        <div
                           key={log.id}
                           onClick={() => log.status === 'fail' && setSelectedLogId(log.id)}
                           className={cn(
                              "flex items-start md:items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors break-all md:break-normal",
                              log.status === 'pass' && "text-green-400 hover:bg-slate-900",
                              log.status === 'fail' && "text-red-400 bg-red-950/30 hover:bg-red-950/50 border border-red-900/50",
                              log.status === 'info' && "text-slate-400",
                              selectedLogId === log.id && "ring-1 ring-primary"
                           )}
                        >
                           <span className="text-slate-600 w-12 shrink-0 text-[10px] md:text-sm">[{log.time}]</span>
                           <span className="mr-1 md:mr-2 text-slate-700">{'>'}</span>
                           <span className="flex-1">{log.text}</span>
                           {log.status === 'pass' && <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 shrink-0" />}
                           {log.status === 'fail' && <XCircle className="h-3 w-3 md:h-4 md:w-4 shrink-0" />}
                        </div>
                     ))}
                     <div className="flex items-center gap-2 py-1 px-2 text-slate-500 animate-pulse">
                        <span className="text-slate-600 w-12 shrink-0 text-[10px] md:text-sm">[00:06]</span>
                        <span className="mr-2">{'>'}</span>
                        <span>_</span>
                     </div>
                  </div>
               </ScrollArea>
            </Card>

            {/* Right Panel: Failure Analysis */}
            {selectedLogId && failure ? (
               <Card className="w-full lg:w-[400px] flex flex-col border-l h-[400px] lg:h-auto shrink-0 shadow-lg lg:shadow-none z-10">
                  <CardHeader className="bg-red-50 dark:bg-red-950/20 border-b shrink-0">
                     <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        <CardTitle className="text-base truncate">LỖI: {failure.testName}</CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                     <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Nguyên nhân</h4>
                        <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-100 dark:border-red-900 text-red-800 dark:text-red-300 text-sm font-medium">
                           {failure.reason}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-1">
                           <h4 className="font-semibold text-sm text-muted-foreground">Input (Câu hỏi)</h4>
                           <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm">
                              {failure.input}
                           </div>
                        </div>
                        <div className="space-y-1">
                           <h4 className="font-semibold text-sm text-muted-foreground">Output Thực tế (Sai)</h4>
                           <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm border-l-4 border-red-500">
                              {failure.output}
                           </div>
                        </div>
                        <div className="space-y-1">
                           <h4 className="font-semibold text-sm text-muted-foreground">Output Mong đợi (Đúng)</h4>
                           <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm border-l-4 border-green-500">
                              {failure.expected}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-1">
                        <h4 className="font-semibold text-sm text-muted-foreground">Context (Tài liệu tham chiếu)</h4>
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm italic text-slate-600 dark:text-slate-400">
                           "{failure.context}"
                        </div>
                     </div>

                     <div className="pt-4 flex flex-col gap-2">
                        <Button className="w-full gap-2">
                           <ExternalLink className="h-4 w-4" />
                           Debug trong Trace View
                        </Button>
                        <Button variant="outline" className="w-full">Xem Raw Logs</Button>
                     </div>
                  </CardContent>
               </Card>
            ) : (
               <Card className="hidden lg:flex w-[400px] flex-col items-center justify-center text-center p-8 text-muted-foreground border-l border-dashed shrink-0">
                  <Info className="h-12 w-12 mb-4 opacity-20" />
                  <h3 className="font-semibold text-lg">Chưa chọn lỗi nào</h3>
                  <p className="text-sm">Vui lòng click vào một dòng lỗi (màu đỏ) bên cửa sổ log để xem chi tiết.</p>
               </Card>
            )}
         </div>
      </div>
   );
}
