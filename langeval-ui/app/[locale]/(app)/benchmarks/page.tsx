"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
   Play, History, CheckCircle2, XCircle, ChevronRight, BarChart3,
   Bot, Brain, ArrowLeft, BookOpen, Calculator, Scale
} from "lucide-react";
import { useAgents } from "@/lib/use-agents";
import { useModels } from "@/lib/use-models";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// Define benchmark types with metadata
const BENCHMARKS = [
   {
      id: "mmlu",
      name: "MMLU",
      fullName: "Massive Multitask Language Understanding",
      description: "Evaluates models on a wide range of subjects including STEM, the humanities, and others.",
      icon: BookOpen,
      color: "bg-blue-100 text-blue-700",
   },
   {
      id: "gsm8k",
      name: "GSM8K",
      fullName: "Grade School Math 8K",
      description: "High quality grade school math problems to measuring reasoning capabilities.",
      icon: Calculator,
      color: "bg-green-100 text-green-700",
   },
   {
      id: "truthfulqa",
      name: "TruthfulQA",
      fullName: "Truthful Question Answering",
      description: "Measures whether a language model is truthful in generating answers to questions.",
      icon: Scale,
      color: "bg-purple-100 text-purple-700",
   },
];

export default function BenchmarksPage() {
   const [activeTab, setActiveTab] = useState("run");
   const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | null>(null);

   // Configuration State
   const [subjectType, setSubjectType] = useState<"agent" | "model">("agent");
   const [selectedAgentId, setSelectedAgentId] = useState("");
   const [selectedModelId, setSelectedModelId] = useState("");

   // Execution State
   const [isRunning, setIsRunning] = useState(false);
   const [result, setResult] = useState<any>(null);

   // History State
   const [history, setHistory] = useState<any[]>([]);
   const [loadingHistory, setLoadingHistory] = useState(false);
   const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

   const { agents, loading: agentsLoading } = useAgents();
   const { models, loading: modelsLoading } = useModels();

   // Auto-select first available options
   useEffect(() => {
      if (!selectedAgentId && agents.length > 0) setSelectedAgentId(agents[0].id);
   }, [agents, selectedAgentId]);

   useEffect(() => {
      if (!selectedModelId && models.length > 0) setSelectedModelId(models[0].id);
   }, [models, selectedModelId]);

   useEffect(() => {
      if (activeTab === "history") {
         fetchHistory();
      }
   }, [activeTab]);

   const handleRunBenchmark = async () => {
      if (!selectedBenchmarkId) return;

      if (subjectType === "agent" && !selectedAgentId) {
         toast.error("Please select an Agent.");
         return;
      }
      if (subjectType === "model" && !selectedModelId) {
         toast.error("Please select a Model.");
         return;
      }

      setIsRunning(true);
      setResult(null);

      try {
         const data = await apiClient("/benchmarks/run", {
            method: "POST",
            body: JSON.stringify({
               benchmark_id: selectedBenchmarkId,
               model_id: subjectType === "model" ? selectedModelId : undefined,
               agent_id: subjectType === "agent" ? selectedAgentId : undefined,
               // generator_model_id is omitted, handled by backend default
            }),
         });
         if (data.success) {
            setResult(data.data);
            toast.success("Benchmark completed successfully!");
            fetchHistory(); // Refresh history
         } else {
            toast.error("Benchmark failed: " + (data.detail || "Unknown error"));
         }
      } catch (error) {
         toast.error("An error occurred while running the benchmark.");
         console.error(error);
      } finally {
         setIsRunning(false);
      }
   };

   const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
         const data = await apiClient("/benchmarks/history");
         if (data.success) {
            setHistory(data.data);
         }
      } catch (error) {
         console.error("Failed to load history:", error);
      } finally {
         setLoadingHistory(false);
      }
   };

   const fetchHistoryDetail = async (id: string, resultData: any) => {
      try {
         const data = await apiClient(`/benchmarks/history/${id}`);
         if (data.success) {
            setSelectedHistoryItem(data.data);
         }
      } catch (error) {
         toast.error("Failed to load history details.");
         setSelectedHistoryItem(resultData); // Fallback
      }
   };

   const selectedBenchmark = BENCHMARKS.find(b => b.id === selectedBenchmarkId);

   return (
      <div className="space-y-6 min-h-screen relative">
         {/* Background Effects matching overall system theme */}
         <div className="fixed inset-0 bg-[#0B0F19] -z-20" />
         <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
         <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-violet-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

         {/* Header Section - Glass Style */}
         <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
               <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Benchmarks</span>
               </h1>
               <p className="text-xs md:text-sm text-slate-400 line-clamp-1 md:line-clamp-none flex items-center gap-2">
                  Evaluate Agents and Models against standard academic datasets.
               </p>
            </div>
         </div>

         <Tabs defaultValue="run" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full max-w-sm grid grid-cols-2 bg-white/5 border border-white/10 p-1 rounded-xl">
               <TabsTrigger
                  value="run"
                  className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 hover:text-white transition-all"
               >
                  Run Benchmark
               </TabsTrigger>
               <TabsTrigger
                  value="history"
                  className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 hover:text-white transition-all"
               >
                  History
               </TabsTrigger>
            </TabsList>

            <TabsContent value="run" className="flex-1 mt-6">
               {!selectedBenchmarkId ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {BENCHMARKS.map((benchmark) => (
                        <Card
                           key={benchmark.id}
                           className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                           onClick={() => setSelectedBenchmarkId(benchmark.id)}
                        >
                           <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                              <div className={cn("p-2 rounded-lg", benchmark.color)}>
                                 <benchmark.icon className="w-6 h-6" />
                              </div>
                              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                 {benchmark.name}
                              </CardTitle>
                           </CardHeader>
                           <CardContent>
                              <div className="text-sm font-medium text-muted-foreground mb-2">
                                 {benchmark.fullName}
                              </div>
                              <p className="text-sm text-muted-foreground/80 leading-relaxed">
                                 {benchmark.description}
                              </p>
                           </CardContent>
                           <CardFooter className="pt-0">
                              <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5">
                                 Select Benchmark
                                 <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                              </Button>
                           </CardFooter>
                        </Card>
                     ))}
                  </div>
               ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                           setSelectedBenchmarkId(null);
                           setResult(null);
                        }}>
                           <ArrowLeft className="w-4 h-4 mr-1" />
                           Back to Benchmarks
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Badge variant="outline" className="text-base px-3 py-1">
                           {selectedBenchmark?.name}
                        </Badge>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                        {/* Configuration Panel */}
                        <Card className="lg:col-span-4 h-fit border-l-4 border-l-primary">
                           <CardHeader>
                              <CardTitle>Configuration</CardTitle>
                              <CardDescription>Setup your evaluation parameters.</CardDescription>
                           </CardHeader>
                           <CardContent className="space-y-6">
                              <div className="space-y-3">
                                 <div className="text-sm font-medium">Target Subject</div>
                                 <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                                    <button
                                       onClick={() => setSubjectType("agent")}
                                       className={cn(
                                          "flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                                          subjectType === "agent"
                                             ? "bg-white shadow-sm text-primary"
                                             : "text-muted-foreground hover:text-foreground"
                                       )}
                                    >
                                       <Bot className="w-4 h-4" />
                                       Agent
                                    </button>
                                    <button
                                       onClick={() => setSubjectType("model")}
                                       className={cn(
                                          "flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                                          subjectType === "model"
                                             ? "bg-white shadow-sm text-primary"
                                             : "text-muted-foreground hover:text-foreground"
                                       )}
                                    >
                                       <Brain className="w-4 h-4" />
                                       Model
                                    </button>
                                 </div>
                              </div>

                              <div className="space-y-3">
                                 <div className="text-sm font-medium">
                                    Select {subjectType === "agent" ? "Agent" : "Model"}
                                 </div>
                                 {subjectType === "agent" ? (
                                    <Select value={selectedAgentId} onValueChange={setSelectedAgentId} disabled={agentsLoading}>
                                       <SelectTrigger>
                                          <SelectValue placeholder="Select Agent" />
                                       </SelectTrigger>
                                       <SelectContent>
                                          {agents.map(a => (
                                             <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                          ))}
                                       </SelectContent>
                                    </Select>
                                 ) : (
                                    <Select value={selectedModelId} onValueChange={setSelectedModelId} disabled={modelsLoading}>
                                       <SelectTrigger>
                                          <SelectValue placeholder="Select Model" />
                                       </SelectTrigger>
                                       <SelectContent>
                                          {models.map(m => (
                                             <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                          ))}
                                       </SelectContent>
                                    </Select>
                                 )}

                                 {subjectType === "agent" && (
                                    <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-md flex items-start gap-2">
                                       <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                       <span>Using Agent's configured API credentials.</span>
                                    </div>
                                 )}
                              </div>

                              <Button
                                 className="w-full"
                                 size="lg"
                                 onClick={handleRunBenchmark}
                                 disabled={isRunning || (subjectType === "agent" && !selectedAgentId) || (subjectType === "model" && !selectedModelId)}
                              >
                                 {isRunning ? (
                                    <>
                                       <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                       Running Evaluation...
                                    </>
                                 ) : (
                                    <>
                                       <Play className="mr-2 h-4 w-4" />
                                       Start Benchmark
                                    </>
                                 )}
                              </Button>
                           </CardContent>
                        </Card>

                        {/* Results Panel */}
                        <div className="lg:col-span-8 space-y-6">
                           {result ? (
                              <BenchmarkResultView result={result} />
                           ) : isRunning ? (
                              <Card className="h-[400px] flex flex-col items-center justify-center border-dashed">
                                 <div className="relative">
                                    <div className="h-16 w-16 rounded-full border-4 border-primary/20 animate-pulse" />
                                    <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                 </div>
                                 <h3 className="mt-6 text-xl font-semibold">Running Evaluation...</h3>
                                 <p className="text-muted-foreground mt-2 max-w-sm text-center">
                                    This process may take a few minutes. We are generating questions and evaluating responses.
                                 </p>
                              </Card>
                           ) : (
                              <Card className="h-[400px] flex flex-col items-center justify-center border-dashed bg-muted/30">
                                 <div className="p-4 bg-muted rounded-full mb-4 opacity-50">
                                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                                 </div>
                                 <h3 className="text-lg font-medium">Ready to Start</h3>
                                 <p className="text-muted-foreground max-w-sm text-center mt-2">
                                    Select your target subject on the left config panel and start the benchmark evaluation.
                                 </p>
                              </Card>
                           )}
                        </div>
                     </div>
                  </div>
               )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
               <Card>
                  <CardHeader>
                     <CardTitle>Benchmark History</CardTitle>
                     <CardDescription>View past evaluation runs.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     {loadingHistory ? (
                        <div className="flex justify-center p-12">
                           <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                     ) : history.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
                           No history found. Run a benchmark to see results here.
                        </div>
                     ) : (
                        <Table>
                           <TableHeader>
                              <TableRow>
                                 <TableHead>Date</TableHead>
                                 <TableHead>Benchmark</TableHead>
                                 <TableHead>Subject</TableHead>
                                 <TableHead>Score</TableHead>
                                 <TableHead>Status</TableHead>
                                 <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {history.map((run) => (
                                 <TableRow key={run.run_id}>
                                    <TableCell className="font-medium">
                                       {new Date(run.completed_at || run.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                       <Badge variant="outline" className="capitalize">
                                          {BENCHMARKS.find(b => b.id === run.benchmark_id)?.name || run.benchmark_id}
                                       </Badge>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex items-center gap-2">
                                          {run.agent_id ? <Bot className="w-3 h-3 text-muted-foreground" /> : <Brain className="w-3 h-3 text-muted-foreground" />}
                                          {run.agent_id ? "Agent" : "Model"}
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className={cn(
                                          "font-bold",
                                          run.score >= 70 ? "text-green-600" : run.score >= 40 ? "text-yellow-600" : "text-red-600"
                                       )}>
                                          {run.score?.toFixed(1)}%
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <Badge variant={run.status === "completed" ? "default" : "secondary"} className="capitalize">
                                          {run.status}
                                       </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                       <Dialog>
                                          <DialogTrigger asChild>
                                             <Button variant="ghost" size="sm" onClick={() => fetchHistoryDetail(run.run_id, run)}>
                                                Details <ChevronRight className="ml-1 h-3 w-3" />
                                             </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                                             <DialogHeader>
                                                <DialogTitle>Benchmark Details</DialogTitle>
                                                <DialogDescription>
                                                   Run {run.run_id} - {new Date(run.completed_at || run.created_at).toLocaleString()}
                                                </DialogDescription>
                                             </DialogHeader>
                                             {selectedHistoryItem ? (
                                                <BenchmarkResultView result={selectedHistoryItem} />
                                             ) : (
                                                <div className="flex justify-center p-8">
                                                   <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                                </div>
                                             )}
                                          </DialogContent>
                                       </Dialog>
                                    </TableCell>
                                 </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     )}
                  </CardContent>
               </Card>
            </TabsContent>
         </Tabs>
      </div>
   );
}

function BenchmarkResultView({ result }: { result: any }) {
   if (!result) return null;

   const total = result.total_items || 0;
   const correct = result.correct_items || 0;
   const incorrect = total - correct;
   const score = result.score || 0;

   return (
      <div className="space-y-6">
         <Card className="bg-slate-50 border-primary/20">
            <CardHeader className="pb-2">
               <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Result Summary
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                     <div className={cn("text-3xl font-bold mb-1", score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-red-600")}>
                        {score.toFixed(1)}%
                     </div>
                     <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Overall Score</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                     <div className="text-3xl font-bold mb-1 text-slate-800">{total}</div>
                     <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Questions</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                     <div className="text-3xl font-bold mb-1 text-green-600">{correct}</div>
                     <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Correct</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                     <div className="text-3xl font-bold mb-1 text-red-500">{incorrect}</div>
                     <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Incorrect</div>
                  </div>
               </div>
            </CardContent>
         </Card>

         <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
               <History className="mr-2 h-5 w-5" />
               Detailed Breakdown
            </h3>
            <ScrollArea className="h-[600px] pr-4">
               <div className="space-y-4">
                  {result.results?.map((item: any) => (
                     <Card key={item.item_id} className={cn("border-l-4 transition-all hover:shadow-sm", item.is_correct ? "border-l-green-500" : "border-l-red-500")}>
                        <CardHeader className="py-3">
                           <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                 <span className="text-xs font-mono text-muted-foreground">ID: {item.item_id}</span>
                                 <CardTitle className="text-base font-medium leading-relaxed">
                                    {item.question}
                                 </CardTitle>
                              </div>
                              <Badge variant={item.is_correct ? "default" : "destructive"} className="shrink-0">
                                 {item.is_correct ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                 {item.is_correct ? "Correct" : "Incorrect"}
                              </Badge>
                           </div>
                        </CardHeader>
                        <CardContent className="py-3 pt-0 text-sm space-y-3">
                           <Separator />
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className={cn("p-3 rounded-md border", item.is_correct ? "bg-green-50/50 border-green-100 text-green-900" : "bg-red-50/50 border-red-100 text-red-900")}>
                                 <span className="font-semibold block mb-1 text-xs uppercase tracking-wide opacity-70">Model Answer</span>
                                 {item.model_answer}
                              </div>
                              <div className="p-3 bg-slate-50 rounded-md border border-slate-100 text-slate-900">
                                 <span className="font-semibold block mb-1 text-xs uppercase tracking-wide opacity-70">Correct Answer</span>
                                 {item.correct_answer}
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
                  {!result.results?.length && (
                     <div className="text-center py-8 text-muted-foreground">
                        No detailed results available.
                     </div>
                  )}
               </div>
            </ScrollArea>
         </div>
      </div>
   );
}
