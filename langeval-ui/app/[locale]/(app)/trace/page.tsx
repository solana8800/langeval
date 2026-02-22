"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
   ChevronRight, ChevronDown, ChevronUp, Clock, Database,
   Brain, Calculator, MessageSquare, Terminal, DollarSign,
   Search, CheckCircle2, AlertCircle, Copy, Loader2, RefreshCw,
   ChevronLeft, ChevronsLeft, ChevronsRight,
   PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
   Maximize2, Minimize2, MoveHorizontal
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgents } from "@/lib/use-agents";
import { cn } from "@/lib/utils";
import { MOCK_TRACE_DETAIL, MOCK_TRACE_PAGE_DATA } from "@/lib/mock-data";
import { toast } from "sonner";
import { ObservationMetadata } from "@/components/trace/observation-metadata";
import { ObservationScores } from "@/components/trace/observation-scores";
import TraceFlowGraph from "@/components/trace/trace-flow-graph";
import { apiClient } from "@/lib/api-client";

export default function TraceDebuggerPage() {
   const [selectedSpan, setSelectedSpan] = useState<any>(MOCK_TRACE_PAGE_DATA.spans[0]);
   const [showGuide, setShowGuide] = useState(true);
   const { agents, loading: agentsLoading } = useAgents();
   const [selectedAgent, setSelectedAgent] = useState<string>("all");

   // Traces state
   const [traces, setTraces] = useState<any[]>([]);
   const [selectedTrace, setSelectedTrace] = useState<any>(null);
   const [loadingTraces, setLoadingTraces] = useState(false);
   const [traceError, setTraceError] = useState<string | null>(null);

   // Pagination state
   const [page, setPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const PAGE_SIZE = 50;

   // Trace detail state
   const [traceDetail, setTraceDetail] = useState<any>(null);
   const [loadingDetail, setLoadingDetail] = useState(false);

   // Layout visibility state
   const [showTraceList, setShowTraceList] = useState(true);
   const [showExecution, setShowExecution] = useState(true);
   const [showDetail, setShowDetail] = useState(true);

   // Fetch traces when agent or page changes
   useEffect(() => {
      fetchTraces();
   }, [selectedAgent, page]);

   // Fetch trace detail when selectedTrace changes
   useEffect(() => {
      if (selectedTrace?.id) {
         fetchTraceDetail(selectedTrace.id);
      } else {
         setTraceDetail(null);
      }
   }, [selectedTrace]);

   const fetchTraces = async () => {
      setLoadingTraces(true);
      setTraceError(null);

      try {
         const params = new URLSearchParams();
         if (selectedAgent && selectedAgent !== "all") {
            params.append("agentId", selectedAgent);
         }

         const offset = (page - 1) * PAGE_SIZE;
         params.append("limit", PAGE_SIZE.toString());
         params.append("offset", offset.toString());

         const data = await apiClient(`/resource/traces?${params.toString()}`);

         if (data.data && Array.isArray(data.data)) {
            setTraces(data.data);

            // Calculate total pages if total count is available
            if (data.total) {
               setTotalPages(Math.ceil(data.total / PAGE_SIZE));
            } else {
               // Fallback if no total provided but we have data
               // If full page returned, assume there might be more
               setTotalPages(data.data.length === PAGE_SIZE ? page + 1 : page);
            }

            if (data.data.length > 0) {
               setSelectedTrace(data.data[0]);
            } else {
               setSelectedTrace(null);
            }
         } else {
            setTraces([]);
            setSelectedTrace(null);
         }

         if (data.source === "mock") {
            toast.info("Đang sử dụng mock data - Backend chưa có traces");
         }
      } catch (error) {
         console.error("Error fetching traces:", error);
         setTraceError("Không thể tải traces");
         toast.error("Lỗi khi tải traces");
      } finally {
         setLoadingTraces(false);
      }
   };

   const fetchTraceDetail = async (traceId: string) => {
      setLoadingDetail(true);
      try {
         const data = await apiClient(`/resource/traces/${traceId}`);
         if (data.data && data.data.observations && data.data.observations.length > 0) {
            setTraceDetail(data.data);
         } else {
            // Fallback to mock data if API returns empty or no observations
            setTraceDetail(MOCK_TRACE_DETAIL);
         }
      } catch (error) {
         console.error("Error fetching trace detail:", error);
         // Use mock data on error
         setTraceDetail(MOCK_TRACE_DETAIL);
      } finally {
         setLoadingDetail(false);
      }
   };

   const getIcon = (type: string) => {
      switch (type) {
         case 'chain': return <MessageSquare className="h-4 w-4 text-slate-500" />;
         case 'tool': return <Database className="h-4 w-4 text-orange-500" />;
         case 'model': return <Brain className="h-4 w-4 text-purple-500" />;
         case 'generation': return <Brain className="h-4 w-4 text-blue-500" />;
         default: return <Terminal className="h-4 w-4 text-slate-500" />;
      }
   };

   const selectedAgentData = agents.find(a => a.id === selectedAgent);

   // Helper to build tree structure from flat list
   const processObservations = (observations: any[]) => {
      if (!observations || observations.length === 0) return [];

      // 1. Sort by startTime temporarily to help with order, though parent-child matters more
      const sorted = [...observations].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      // 2. Build map and identify roots
      const map = new Map();
      const roots: any[] = [];

      sorted.forEach(obs => {
         obs.children = [];
         // Initialize level if not present
         if (obs.level === undefined) obs.level = 0;
         map.set(obs.id, obs);
      });

      sorted.forEach(obs => {
         if (obs.parentObservationId && map.has(obs.parentObservationId)) {
            const parent = map.get(obs.parentObservationId);
            parent.children.push(obs);
         } else {
            roots.push(obs);
         }
      });

      // 3. Flatten back to list with calculated levels
      const result: any[] = [];
      const traverse = (nodes: any[], level: number) => {
         nodes.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
         nodes.forEach(node => {
            node.level = level;
            result.push(node);
            if (node.children.length > 0) {
               traverse(node.children, level + 1);
            }
         });
      };

      traverse(roots, 0);
      return result;
   };

   // Memoize processed observations to avoid recalculating on every render
   // But since we don't have useMemo ready for deep comparison, we'll do it in render or effect
   // Simplest is to process when traceDetail is set.

   return (
      <div className="min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] flex flex-col space-y-4 pb-4 lg:pb-0">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
            <div>
               <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">Trace Debugger</h1>
               <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">
                  Phân tích chi tiết luồng thực thi từ Langfuse.
               </p>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
               <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 w-full md:w-auto">
                  <span className="text-xs md:text-sm font-medium text-slate-600 pl-2 shrink-0">Agent:</span>
                  <Select value={selectedAgent} onValueChange={(val) => {
                     setSelectedAgent(val);
                     setPage(1); // Reset to first page when agent changes
                  }} disabled={agentsLoading}>
                     <SelectTrigger className="w-full md:w-[220px] h-8 md:h-9 bg-white border-slate-200 shadow-sm text-xs md:text-sm">
                        <SelectValue placeholder="Chọn Agent" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">Tất cả Agent</SelectItem>
                        {agents.map(agent => (
                           <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                              {agent.langfuse_project_name && (
                                 <span className="text-xs text-slate-500 ml-2">({agent.langfuse_project_name})</span>
                              )}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTraces}
                  disabled={loadingTraces}
                  className="gap-2"
               >
                  <RefreshCw className={cn("h-3.5 w-3.5", loadingTraces && "animate-spin")} />
                  Refresh
               </Button>

               {selectedAgentData && selectedAgentData.langfuse_project_name && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                     <Database className="h-3.5 w-3.5 text-blue-600" />
                     <span className="text-xs font-medium text-blue-900">
                        {selectedAgentData.langfuse_project_name}
                     </span>
                  </div>
               )}
            </div>
         </div>

         {/* Hướng dẫn Trace Debugger */}
         <div className="bg-cyan-50 border border-cyan-200 rounded-lg overflow-hidden transition-all">
            <div
               className="p-4 flex items-center justify-between cursor-pointer hover:bg-cyan-100/50"
               onClick={() => setShowGuide(!showGuide)}
            >
               <h3 className="font-semibold text-cyan-900 flex items-center gap-2 text-sm">
                  ℹ️ Hướng dẫn sử dụng Trace View
               </h3>
               <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-cyan-700 hover:text-cyan-900 hover:bg-cyan-200/50">
                  {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
            </div>

            {showGuide && (
               <div className="px-4 pb-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-cyan-800">
                     <ul className="list-disc ml-5 space-y-1">
                        <li><strong>Chọn Agent:</strong> Filter traces theo agent cụ thể để xem traces từ Langfuse project của agent đó.</li>
                        <li><strong>Trace List (Trái):</strong> Danh sách các traces được fetch từ Langfuse. Click để xem chi tiết.</li>
                     </ul>
                     <ul className="list-disc ml-5 space-y-1">
                        <li><strong>Waterfall View:</strong> Hiển thị cấu trúc cây của request với thời gian thực thi.</li>
                        <li><strong>Debug:</strong> Phát hiện bước nào gây chậm (Latency cao) hoặc tốn nhiều tiền (Cost cao).</li>
                     </ul>
                  </div>
               </div>
            )}
         </div>

         <div className="flex flex-col lg:flex-row flex-1 gap-4 overflow-visible lg:overflow-hidden">
            {/* Left Panel: Traces List */}
            {showTraceList ? (
               <Card className="w-full lg:w-1/4 lg:min-w-[280px] flex flex-col shadow-sm transition-all duration-300 h-[400px] lg:h-auto">
                  <CardHeader className="bg-slate-50 border-b pb-3 flex flex-row items-center justify-between space-y-0">
                     <div>
                        <CardTitle className="text-sm">Traces</CardTitle>
                        <CardDescription className="text-xs">
                           {loadingTraces ? "Đang tải..." : `${traces.length} traces`}
                        </CardDescription>
                     </div>
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTraceList(false)}>
                        <PanelLeftClose className="h-4 w-4 text-slate-400" />
                     </Button>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden">
                     {loadingTraces ? (
                        <div className="flex items-center justify-center h-full">
                           <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                     ) : traceError ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                           <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
                           <p className="text-sm text-slate-600">{traceError}</p>
                        </div>
                     ) : traces.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                           <Database className="h-8 w-8 text-slate-300 mb-2" />
                           <p className="text-sm text-slate-600">Không có traces</p>
                           <p className="text-xs text-slate-400 mt-1">
                              {selectedAgent === "all" ? "Chọn agent để xem traces" : "Agent chưa có traces"}
                           </p>
                        </div>
                     ) : (
                        <ScrollArea className="h-full">
                           <div className="flex flex-col">
                              {traces.map((trace) => (
                                 <div
                                    key={trace.id}
                                    className={cn(
                                       "p-3 border-b cursor-pointer hover:bg-slate-50 transition-colors",
                                       selectedTrace?.id === trace.id && "bg-blue-50 border-l-4 border-l-blue-500"
                                    )}
                                    onClick={() => setSelectedTrace(trace)}
                                 >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                       <span className="text-sm font-medium text-slate-900 line-clamp-1">
                                          {trace.name || trace.id}
                                       </span>
                                       {trace.status === "success" ? (
                                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                       ) : (
                                          <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                       )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                       <Clock className="h-3 w-3" />
                                       <span>{trace.latency || 0}s</span>
                                       {trace.totalCost !== undefined && (
                                          <>
                                             <span>•</span>
                                             <DollarSign className="h-3 w-3" />
                                             <span>${Number(trace.totalCost).toFixed(5)}</span>
                                          </>
                                       )}
                                    </div>
                                    {trace.timestamp && (
                                       <div className="text-xs text-slate-400 mt-1">
                                          {new Date(trace.timestamp).toLocaleString('vi-VN')}
                                       </div>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </ScrollArea>
                     )}
                  </CardContent>
                  <CardFooter className="p-2 border-t bg-slate-50 flex justify-between items-center">
                     <div className="text-xs text-slate-500">
                        Trang {page} / {totalPages || 1}
                     </div>
                     <div className="flex items-center gap-1">
                        <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8"
                           onClick={() => setPage(1)}
                           disabled={page === 1 || loadingTraces}
                        >
                           <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8"
                           onClick={() => setPage((p) => Math.max(1, p - 1))}
                           disabled={page === 1 || loadingTraces}
                        >
                           <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Page indicators */}
                        <div className="flex items-center px-2 gap-1">
                           {page > 1 && (
                              <Button
                                 variant="ghost"
                                 size="sm"
                                 className="h-7 w-7 p-0 text-xs"
                                 onClick={() => setPage(page - 1)}
                              >
                                 {page - 1}
                              </Button>
                           )}
                           <Button
                              variant="secondary"
                              size="sm"
                              className="h-7 w-7 p-0 text-xs bg-white shadow-sm border"
                           >
                              {page}
                           </Button>
                           {page < totalPages && (
                              <Button
                                 variant="ghost"
                                 size="sm"
                                 className="h-7 w-7 p-0 text-xs"
                                 onClick={() => setPage(page + 1)}
                              >
                                 {page + 1}
                              </Button>
                           )}
                        </div>

                        <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8"
                           onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                           disabled={page >= totalPages || loadingTraces}
                        >
                           <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8"
                           onClick={() => setPage(totalPages)}
                           disabled={page >= totalPages || loadingTraces}
                        >
                           <ChevronsRight className="h-4 w-4" />
                        </Button>
                     </div>
                  </CardFooter>
               </Card>
            ) : (
               <div className="w-full lg:w-12 h-12 lg:h-auto flex flex-row lg:flex-col items-center justify-start lg:justify-start px-4 lg:px-0 py-0 lg:py-4 bg-white border rounded-lg shadow-sm gap-4 transition-all duration-300 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setShowTraceList(true)} title="Show Traces">
                     <PanelLeftOpen className="h-5 w-5 text-slate-500" />
                  </Button>
                  <div className="hidden lg:block h-px w-8 bg-slate-200" />
                  <div className="lg:[writing-mode:vertical-rl] text-xs font-medium text-slate-500 tracking-wider">
                     <span className="lg:hidden">TRACES LIST</span>
                     <span className="hidden lg:inline">TRACES LIST</span>
                  </div>
               </div>
            )}

            {/* Middle + Right Panel: Waterfall + Details */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-0 overflow-hidden border rounded-lg bg-white shadow-sm min-h-[600px] lg:min-h-0">
               {/* Middle Panel: Waterfall Tree / Flow Graph */}
               {showExecution ? (
                  <div className={cn(
                     "flex flex-col bg-slate-50/30 transition-all duration-300 h-[400px] lg:h-full border-b lg:border-b-0",
                     showDetail ? "w-full lg:w-1/3 lg:border-r lg:min-w-[350px]" : "flex-1"
                  )}>
                     <Tabs defaultValue="waterfall" className="flex-1 flex flex-col h-full">
                        <div className="p-3 border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase flex justify-between items-center h-[53px]">
                           <TabsList className="h-8 bg-slate-200">
                              <TabsTrigger value="waterfall" className="text-xs h-6 px-2">Waterfall</TabsTrigger>
                              <TabsTrigger value="graph" className="text-xs h-6 px-2">Flow Graph</TabsTrigger>
                           </TabsList>
                           <div className="flex items-center gap-2">
                              {/* <span>Duration</span> */}
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowExecution(false)}>
                                 {showDetail ? <PanelLeftClose className="h-4 w-4 text-slate-400" /> : <Maximize2 className="h-4 w-4 text-slate-400" />}
                              </Button>
                           </div>
                        </div>

                        <TabsContent value="waterfall" className="flex-1 flex flex-col overflow-hidden m-0 data-[state=inactive]:hidden">
                           <div className="px-3 py-2 border-b bg-slate-50/50 flex justify-between text-[10px] text-slate-400 font-mono hidden lg:flex">
                              <span>EXECUTION STEP ({traceDetail?.observations?.length || 0})</span>
                              <span>LATENCY / ERROR / COST</span>
                           </div>
                           <div className="flex-1 overflow-y-auto min-h-0 bg-white">
                              {/* Content: Waterfall List */}
                              {loadingDetail ? (
                                 <div className="flex items-center justify-center h-full p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                 </div>
                              ) : traceDetail?.observations && traceDetail.observations.length > 0 ? (
                                 <div className="flex flex-col">
                                    {/* Apply processObservations here */}
                                    {processObservations(traceDetail.observations).map((obs: any) => {
                                       const isSelected = selectedSpan?.id === obs.id;
                                       const traceStart = new Date(traceDetail.timestamp).getTime();
                                       const obsStart = new Date(obs.startTime).getTime();
                                       const obsEnd = obs.endTime ? new Date(obs.endTime).getTime() : obsStart;
                                       const duration = (obsEnd - obsStart) / 1000;
                                       const totalDuration = traceDetail.latency || 10;
                                       const widthPercent = Math.max((duration / totalDuration) * 100, 2);
                                       const leftPercent = ((obsStart - traceStart) / 1000 / totalDuration) * 100;

                                       const hasCost = obs.calculatedTotalCost !== undefined && obs.calculatedTotalCost > 0;

                                       return (
                                          <div
                                             key={obs.id}
                                             className={cn(
                                                "group flex flex-col p-3 border-b last:border-0 cursor-pointer transition-colors hover:bg-slate-100",
                                                isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"
                                             )}
                                             onClick={() => setSelectedSpan(obs)}
                                             style={{ paddingLeft: `${(obs.level || 0) * 16 + 12}px` }}
                                          >
                                             <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2 overflow-x-auto min-w-0 flex-1 pb-1" title={obs.name || obs.type}>
                                                   {getIcon(obs.type?.toLowerCase() || 'span')}
                                                   <span className={cn("text-sm font-medium whitespace-nowrap", isSelected ? "text-blue-700" : "text-slate-700")}>
                                                      {obs.name || obs.type}
                                                   </span>
                                                </div>
                                                <span className="text-xs text-slate-500 font-mono shrink-0">{duration.toFixed(2)}s</span>
                                             </div>
                                             <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden relative">
                                                <div
                                                   className={cn(
                                                      "absolute top-0 bottom-0 rounded-full opacity-70",
                                                      obs.type === 'GENERATION' ? "bg-blue-500" : "bg-slate-400"
                                                   )}
                                                   style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                                                ></div>
                                             </div>
                                             <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
                                                <span>{obs.type}</span>
                                                {obs.usage?.totalTokens && <span>• {obs.usage.totalTokens} toks</span>}
                                                {hasCost && <span className="text-emerald-600 font-medium">• ${Number(obs.calculatedTotalCost).toFixed(6)}</span>}
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              ) : selectedTrace ? (
                                 <div className="p-4 text-center text-sm text-slate-500">
                                    <Database className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                    <p>Không có observations</p>
                                 </div>
                              ) : (
                                 <div className="flex flex-col">
                                    {/* Mock Data Rendering */}
                                    {MOCK_TRACE_PAGE_DATA.spans.map((span: any) => {
                                       const isSelected = selectedSpan.id === span.id;
                                       const totalDuration = MOCK_TRACE_PAGE_DATA.latency;
                                       const widthPercent = Math.max((span.duration / totalDuration) * 100, 2);
                                       const leftPercent = (span.startTime / totalDuration) * 100;

                                       return (
                                          <div
                                             key={span.id}
                                             className={cn(
                                                "group flex flex-col p-3 border-b last:border-0 cursor-pointer transition-colors relative hover:bg-slate-100",
                                                isSelected ? "bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"
                                             )}
                                             onClick={() => setSelectedSpan(span)}
                                             style={{ paddingLeft: `${span.level * 16 + 12}px` }}
                                          >
                                             <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2 overflow-x-auto min-w-0 flex-1 pb-1" title={span.name}>
                                                   {getIcon(span.type)}
                                                   <span className={cn("text-sm font-medium whitespace-nowrap", isSelected ? "text-blue-700" : "text-slate-700")}>
                                                      {span.name}
                                                   </span>
                                                </div>
                                                <span className="text-xs text-slate-500 font-mono shrink-0">{span.duration}s</span>
                                             </div>

                                             <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden relative">
                                                <div
                                                   className={cn(
                                                      "absolute top-0 bottom-0 rounded-full opacity-70",
                                                      span.type === 'generation' ? "bg-blue-500" :
                                                         span.type === 'tool' ? "bg-orange-500" : "bg-slate-400"
                                                   )}
                                                   style={{
                                                      left: `${leftPercent}%`,
                                                      width: `${widthPercent}%`
                                                   }}
                                                ></div>
                                             </div>

                                             <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
                                                <span>{span.type}</span>
                                                {span.tokens > 0 && <span>• {span.tokens} toks</span>}
                                                {span.cost > 0 && <span className="text-emerald-600 font-medium">• ${span.cost.toFixed(4)}</span>}
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              )}
                           </div>
                        </TabsContent>

                        <TabsContent value="graph" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                           {loadingDetail ? (
                              <div className="flex items-center justify-center h-full">
                                 <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                              </div>
                           ) : (
                              <TraceFlowGraph
                                 observations={traceDetail?.observations || MOCK_TRACE_PAGE_DATA.spans.map(s => ({
                                    ...s,
                                    startTime: new Date().toISOString(), // Mock fallback
                                    level: s.level,
                                    parentObservationId: s.level > 0 ? MOCK_TRACE_PAGE_DATA.spans[0].id : null,
                                    calculatedTotalCost: s.cost
                                 }))}
                                 selectedSpanId={selectedSpan?.id}
                                 onSelectSpan={setSelectedSpan}
                              />
                           )}
                        </TabsContent>
                     </Tabs>
                  </div>
               ) : (
                  <div className="w-full lg:w-10 h-10 lg:h-auto lg:border-r flex flex-row lg:flex-col items-center justify-start lg:justify-start px-4 lg:px-0 py-0 lg:py-4 bg-slate-50/50 gap-4 shrink-0 border-b lg:border-b-0">
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowExecution(true)} title="Show Execution Path">
                        <PanelLeftOpen className="h-5 w-5 text-slate-500" />
                     </Button>
                     <div className="lg:[writing-mode:vertical-rl] text-xs font-medium text-slate-500 tracking-wider whitespace-nowrap">
                        <span className="lg:hidden">EXECUTION PATH</span>
                        <span className="hidden lg:inline">EXECUTION PATH</span>
                     </div>
                  </div>
               )}

               {/* Right Panel: Detail View */}
               {showDetail ? (
                  <div className={cn(
                     "flex-1 flex flex-col min-w-0 bg-white transition-all duration-300 h-[500px] lg:h-auto",
                     !showExecution && "border-l" // Add border if middle is collapsed
                  )}>
                     {selectedSpan ? (
                        <div className="flex flex-col h-full">
                           <div className="p-4 border-b flex justify-between items-start bg-slate-50/50 min-h-[53px]">
                              <div>
                                 <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                    {/* Add Toggle Button for Detail View */}
                                    {!showExecution && (
                                       <Button variant="ghost" size="icon" className="h-6 w-6 mr-1" onClick={() => setShowExecution(true)} title="Show Execution Path">
                                          <PanelLeftOpen className="h-4 w-4 text-slate-400" />
                                       </Button>
                                    )}
                                    {getIcon(selectedSpan.type)}
                                    {selectedSpan.name}
                                 </h2>
                                 <div className="text-xs text-slate-500 mt-1 font-mono">{selectedSpan.id}</div>
                                 {selectedSpan.calculatedTotalCost > 0 && (
                                    <Badge variant="outline" className="mt-2 text-emerald-600 border-emerald-200 bg-emerald-50">
                                       <DollarSign className="h-3 w-3 mr-1" />
                                       {selectedSpan.calculatedTotalCost.toFixed(6)}
                                    </Badge>
                                 )}
                              </div>
                              <div className="flex items-center gap-2">
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => {
                                       navigator.clipboard.writeText(JSON.stringify(selectedSpan, null, 2));
                                       toast.success("Đã copy JSON");
                                    }}
                                 >
                                    <Copy className="h-3 w-3" /> JSON
                                 </Button>
                                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowDetail(false)} title="Collapse Details">
                                    <PanelRightClose className="h-5 w-5 text-slate-400" />
                                 </Button>
                              </div>
                           </div>

                           <Tabs defaultValue="io" className="flex-1 flex flex-col overflow-hidden">
                              <div className="px-4 border-b">
                                 <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                                    <TabsTrigger value="io" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#D13138] rounded-none px-0 py-3 h-full">Input / Output</TabsTrigger>
                                    <TabsTrigger value="scores" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#D13138] rounded-none px-0 py-3 h-full">Scores & Eval</TabsTrigger>
                                    <TabsTrigger value="metadata" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#D13138] rounded-none px-0 py-3 h-full">Metadata</TabsTrigger>
                                 </TabsList>
                              </div>

                              <TabsContent value="io" className="flex-1 overflow-hidden p-0 m-0">
                                 <ScrollArea className="h-full">
                                    <div className="p-4 space-y-4">
                                       <div>
                                          <h3 className="text-sm font-semibold text-slate-700 mb-2">Input</h3>
                                          <pre className="bg-slate-50 p-3 rounded-md text-xs overflow-x-auto border">
                                             {JSON.stringify(selectedSpan.input, null, 2)}
                                          </pre>
                                       </div>
                                       <Separator />
                                       <div>
                                          <h3 className="text-sm font-semibold text-slate-700 mb-2">Output</h3>
                                          <pre className="bg-slate-50 p-3 rounded-md text-xs overflow-x-auto border">
                                             {JSON.stringify(selectedSpan.output, null, 2)}
                                          </pre>
                                       </div>
                                    </div>
                                 </ScrollArea>
                              </TabsContent>

                              <TabsContent value="scores" className="flex-1 overflow-hidden p-0 m-0">
                                 <ObservationScores observation={selectedSpan} />
                              </TabsContent>

                              <TabsContent value="metadata" className="flex-1 overflow-hidden p-0 m-0">
                                 <ObservationMetadata observation={selectedSpan} />
                              </TabsContent>
                           </Tabs>
                        </div>
                     ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 relative">
                           <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => setShowDetail(false)} title="Collapse Details">
                              <PanelRightClose className="h-5 w-5 text-slate-400" />
                           </Button>
                           <div className="text-center">
                              <Terminal className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Chọn một span để xem chi tiết</p>
                           </div>
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="w-full lg:w-10 h-10 lg:h-auto flex flex-row lg:flex-col items-center justify-start lg:justify-start px-4 lg:px-0 py-0 lg:py-4 bg-white gap-4 border-l-0 lg:border-l shrink-0">
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowDetail(true)} title="Show Details">
                        <PanelRightOpen className="h-5 w-5 text-slate-500" />
                     </Button>
                     <div className="lg:[writing-mode:vertical-rl] text-xs font-medium text-slate-500 tracking-wider whitespace-nowrap">
                        <span className="lg:hidden">DETAILS</span>
                        <span className="hidden lg:inline">DETAILS</span>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
