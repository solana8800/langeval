"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Bot, User, Brain, Play, Pause, RefreshCw, ChevronUp, ChevronDown, Trophy, Scale, MessageSquare, ListFilter, History } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/api-utils";
import { useAgents } from "@/lib/use-agents";
import { useModels } from "@/lib/use-models";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function BattleArenaContent() {
   const searchParams = useSearchParams();
   const [mode, setMode] = useState<'comparison' | 'adversarial'>('adversarial');
   const [campaignId, setCampaignId] = useState<string | null>(null);
   const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
   const [turns, setTurns] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);

   // Selection & Intervention
   const [agentA, setAgentA] = useState("");
   const [agentB, setAgentB] = useState("");
   const [targetAgent, setTargetAgent] = useState("");
   const [simulator, setSimulator] = useState("");
   const [injectInput, setInjectInput] = useState("");
   const [overrideInput, setOverrideInput] = useState("");
   const [showGuide, setShowGuide] = useState(true);

   const [maxTurns, setMaxTurns] = useState(10);
   const [stats, setStats] = useState({ aWins: 0, bWins: 0, ties: 0, avgScore: 0 });

   const { agents } = useAgents();
   const { models } = useModels();
   const pollInterval = useRef<NodeJS.Timeout | null>(null);

   // Auto-select initial agents if empty
   useEffect(() => {
      // If NOT loading from URL (fresh start)
      if (!searchParams.get('campaignId')) {
         if (agents.length > 0) {
            if (!targetAgent) setTargetAgent(agents[0].id);
            if (!agentA) setAgentA(agents[0].id);
            if (agents.length >= 2) {
               if (!agentB) setAgentB(agents[1].id);
            }
         }
         if (models.length > 0) {
            if (!simulator) setSimulator(models[0].id);
         }
      }
   }, [agents, models, searchParams]);

   // Load Campaign from URL
   useEffect(() => {
      const id = searchParams.get('campaignId');
      if (id) {
         setCampaignId(id);
         loadCampaign(id);
      }
   }, [searchParams]);

   const loadCampaign = async (id: string) => {
      setLoading(true);
      try {
         const res = await fetch(`${API_BASE_URL}/battle-arena/history?campaign_id=${id}`);
         const data = await res.json();
         if (data.success) {
            const c = data.data.campaign;
            setMode(c.mode as any);
            setStatus(c.status);
            setMaxTurns(c.max_turns);

            if (c.mode === 'adversarial') {
               if (c.target_agent_id) setTargetAgent(c.target_agent_id);
               if (c.simulator_id) setSimulator(c.simulator_id);
            } else {
               if (c.agent_a_id) setAgentA(c.agent_a_id);
               if (c.agent_b_id) setAgentB(c.agent_b_id);
            }

            setTurns(data.data.turns);
            setStats({
               aWins: c.agent_a_wins || 0,
               bWins: c.agent_b_wins || 0,
               ties: c.ties || 0,
               avgScore: c.current_turn > 0 ? (c.score_sum / c.current_turn) : 0
            });
         }
      } catch (err) {
         console.error("Failed to load campaign:", err);
      } finally {
         setLoading(false);
      }
   };

   // Polling logic
   useEffect(() => {
      if (status === 'running' && campaignId) {
         pollInterval.current = setInterval(fetchUpdate, 3000);
      } else {
         if (pollInterval.current) clearInterval(pollInterval.current!);
      }
      return () => { if (pollInterval.current) clearInterval(pollInterval.current!); };
   }, [status, campaignId]);

   const fetchUpdate = async () => {
      if (!campaignId) return;
      try {
         const res = await fetch(`${API_BASE_URL}/battle-arena/history?campaign_id=${campaignId}`);
         const data = await res.json();
         if (data.success) {
            setTurns(data.data.turns);
            setStatus(data.data.campaign.status);
            const s = data.data.campaign;
            setStats({
               aWins: s.agent_a_wins || 0,
               bWins: s.agent_b_wins || 0,
               ties: s.ties || 0,
               avgScore: s.current_turn > 0 ? (s.score_sum / s.current_turn) : 0
            });
         }
      } catch (err) { console.error(err); }
   };

   const handleStartBattle = async () => {
      setLoading(true);
      setTurns([]);
      const body = mode === 'comparison'
         ? { mode, agentA, agentB, maxTurns, instructionInjection: injectInput, responseOverride: overrideInput }
         : { mode, targetAgent, simulator, maxTurns, instructionInjection: injectInput, responseOverride: overrideInput };

      try {
         const res = await fetch(`${API_BASE_URL}/battle-arena/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, language: 'vi' })
         });

         // Kiểm tra response status
         if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error(`Backend error: ${res.status} - ${errorData.error || res.statusText}`);
            setStatus('failed');
            setLoading(false);
            return;
         }

         const data = await res.json();
         if (data.success) {
            setCampaignId(data.campaign_id);
            setStatus('running');
         } else {
            console.error('Failed to start simulation: Backend returned unsuccessful response');
            setStatus('failed');
         }
      } catch (err) {
         console.error('Error starting simulation:', err);
         setStatus('failed');
      }
      finally { setLoading(false); }
   };

   const getUniqueName = (item: any, list: any[]) => {
      const sameName = list.filter(i => i.name === item.name);
      if (sameName.length > 1) {
         return `${item.name} (${item.id.slice(0, 4)})`;
      }
      return item.name;
   };

   return (
      <div className="flex flex-col h-[calc(100vh-4rem)] space-y-6 overflow-hidden relative">
         {/* Background Effects */}
         <div className="fixed inset-0 bg-[#0B0F19] -z-20" />
         <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-red-600/5 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
         <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-indigo-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

         {/* Top Status Bar - Glass Style */}
         <div className="flex items-center justify-between px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shrink-0 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center justify-between w-full">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                     <div className={cn("h-2 w-2 rounded-full", status === 'running' ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                     <span className="text-[10px] font-bold text-slate-100 uppercase tracking-widest">{status === 'running' ? 'Live Arena' : 'Arena Idle'}</span>
                  </div>
                  {mode === 'adversarial' ? (
                     <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                        <div className="flex flex-col">
                           <span className="text-[9px] text-slate-500 font-bold uppercase">Average Quality</span>
                           <span className="text-sm font-black text-red-500">{(stats.avgScore * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex flex-col border-l border-white/10 pl-4">
                           <span className="text-[9px] text-slate-500 font-bold uppercase">Progress</span>
                           <span className="text-sm font-black text-slate-100">{turns.length}/{maxTurns}</span>
                        </div>
                     </div>
                  ) : (
                     <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                        <span className="text-sm font-bold text-slate-100">Results: <span className="text-red-500">{stats.aWins}</span> vs <span className="text-slate-400">{stats.bWins}</span> <span className="text-[10px] text-slate-500 font-normal">(Ties: {stats.ties})</span></span>
                     </div>
                  )}
               </div>

               <div className="flex items-center gap-2">
                  <Link href={`/battle-arena/history?mode=${mode}`}>
                     <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] gap-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <History className="h-3.5 w-3.5" /> History
                     </Button>
                  </Link>
                  <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="bg-white/5 p-1 rounded-xl border border-white/10">
                     <TabsList className="h-7 bg-transparent p-0">
                        <TabsTrigger value="adversarial" className="text-[10px] h-6 px-3 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 transition-all">Simulator Mode</TabsTrigger>
                        <TabsTrigger value="comparison" className="text-[10px] h-6 px-3 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 transition-all">Comparison A/B</TabsTrigger>
                     </TabsList>
                  </Tabs>
               </div>
            </div>
         </div>

         {/* Configuration Row */}
         <div className={cn(
            "flex items-center gap-4 shrink-0",
            mode === 'adversarial' ? "justify-between" : "justify-between"
         )}>
            {mode === 'adversarial' ? (
               <>
                  {/* Left: Target AI */}
                  <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-white/10 shadow-sm">
                     <Select value={targetAgent} onValueChange={setTargetAgent} disabled={status === 'running'}>
                        <SelectTrigger className="w-[200px] h-9 border-0 bg-red-50/50 text-red-700 font-bold text-xs ring-0 focus:ring-0">
                           <Bot className="h-4 w-4 mr-2" /><SelectValue placeholder="Target AI" />
                        </SelectTrigger>
                        <SelectContent>{agents.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{getUniqueName(a, agents)}</SelectItem>)}</SelectContent>
                     </Select>
                  </div>

                  {/* Center: Controls */}
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Turns</span>
                        <Input
                           type="number"
                           value={maxTurns}
                           onChange={(e) => setMaxTurns(parseInt(e.target.value) || 0)}
                           onFocus={(e) => e.target.select()}
                           className="w-16 h-9 text-center font-bold text-xs bg-white"
                        />
                     </div>
                     <Button
                        onClick={handleStartBattle}
                        disabled={loading || status === 'running'}
                        className={cn(
                           "h-9 px-6 font-black text-[11px] uppercase tracking-wider gap-2 shadow-lg transition-all active:scale-95",
                           status === 'running' ? "bg-slate-800 text-slate-400" : "bg-red-600 hover:bg-red-500 text-white"
                        )}
                     >
                        {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                        {status === 'running' ? 'Battle in Progress' : 'Start Simulation'}
                     </Button>
                  </div>

                  {/* Right: User Simulator */}
                  <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-white/10 shadow-sm">
                     <Select value={simulator} onValueChange={setSimulator} disabled={status === 'running'}>
                        <SelectTrigger className="w-[200px] h-9 border-0 bg-slate-50 text-slate-700 font-bold text-xs ring-0 focus:ring-0">
                           <Brain className="h-4 w-4 mr-2" /><SelectValue placeholder="System Model" />
                        </SelectTrigger>
                        <SelectContent>
                           {models.map(m => (
                              <SelectItem key={m.id} value={m.id} className="text-xs">
                                 {getUniqueName(m, models)}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </>
            ) : (
               <>
                  {/* Left: Bot A */}
                  <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-white/10 shadow-sm">
                     <Select value={agentA} onValueChange={setAgentA} disabled={status === 'running'}>
                        <SelectTrigger className="w-[200px] h-9 border-0 bg-blue-50/50 text-blue-700 font-bold text-xs ring-0 focus:ring-0">
                           <Bot className="h-4 w-4 mr-2" /><SelectValue placeholder="Bot A (Model 1)" />
                        </SelectTrigger>
                        <SelectContent>{agents.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{getUniqueName(a, agents)}</SelectItem>)}</SelectContent>
                     </Select>
                  </div>

                  {/* Center: Controls */}
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Turns</span>
                        <Input
                           type="number"
                           value={maxTurns}
                           onChange={(e) => setMaxTurns(parseInt(e.target.value) || 0)}
                           onFocus={(e) => e.target.select()}
                           className="w-16 h-9 text-center font-bold text-xs bg-white"
                        />
                     </div>
                     <Button
                        onClick={handleStartBattle}
                        disabled={loading || status === 'running'}
                        className={cn(
                           "h-9 px-6 font-black text-[11px] uppercase tracking-wider gap-2 shadow-lg transition-all active:scale-95",
                           status === 'running' ? "bg-slate-800 text-slate-400" : "bg-red-600 hover:bg-red-500 text-white"
                        )}
                     >
                        {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                        {status === 'running' ? 'Battle in Progress' : 'Start Simulation'}
                     </Button>
                  </div>

                  {/* Right: Bot B */}
                  <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-white/10 shadow-sm">
                     <Select value={agentB} onValueChange={setAgentB} disabled={status === 'running'}>
                        <SelectTrigger className="w-[200px] h-9 border-0 bg-purple-50/50 text-purple-700 font-bold text-xs ring-0 focus:ring-0">
                           <Bot className="h-4 w-4 mr-2" /><SelectValue placeholder="Bot B (Model 2)" />
                        </SelectTrigger>
                        <SelectContent>{agents.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{getUniqueName(a, agents)}</SelectItem>)}</SelectContent>
                     </Select>
                  </div>
               </>
            )}
         </div>

         {/* Main Content Area */}
         <div className="flex-1 flex gap-4 overflow-hidden pb-4">
            {/* Scrollable Container for 2 Columns */}
            <div className={cn(
               "flex-1 grid gap-4 overflow-hidden",
               mode === 'adversarial' ? "grid-cols-2" : "grid-cols-1"
            )}>
               {/* Left Column: Target Bot (Adversarial) or Sequential (Comparison) */}
               <div className="flex flex-col space-y-4 overflow-hidden">
                  <div className="shrink-0 flex items-center justify-between p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-sm">
                     <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-red-500" />
                        <span className="text-xs font-black uppercase text-slate-100 tracking-tight">
                           {mode === 'adversarial' ? "Target AI Response" : "Battle Sequence"}
                        </span>
                     </div>
                     <Badge className="bg-white/5 text-slate-400 font-bold text-[9px] px-2 py-0 border border-white/10 italic">BOT PANEL</Badge>
                  </div>

                  <ScrollArea className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-inner-sm">
                     <div className="p-4 flex flex-col gap-6">
                        {/* Information Panel - Collapsible */}
                        {mode === 'adversarial' && (
                           <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl overflow-hidden transition-all shrink-0">
                              <div
                                 className="p-3 flex items-center justify-between cursor-pointer hover:bg-blue-500/20"
                                 onClick={() => setShowGuide(!showGuide)}
                              >
                                 <h3 className="font-semibold text-blue-400 flex items-center gap-2 text-sm">
                                    ℹ️ Cơ chế hoạt động
                                 </h3>
                                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-white/5">
                                    {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                 </Button>
                              </div>

                              {showGuide && (
                                 <div className="px-3 pb-3">
                                    <p className="text-sm text-blue-300/80 mb-2 font-medium">
                                       Đây là môi trường đối kháng tự động (Adversarial Simulation).
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1 text-xs text-blue-300/60 font-medium">
                                       <li><strong>Cột Trái (Target AI):</strong> Bot của bạn (đối tượng được kiểm thử).</li>
                                       <li><strong>Cột Phải (User Simulator):</strong> Bot đóng vai người dùng (có kịch bản, tính cách, mục tiêu).</li>
                                       <li>Hệ thống sẽ tự động chấm điểm từng lượt hội thoại dựa trên tiêu chí đã cấu hình.</li>
                                    </ul>
                                 </div>
                              )}
                           </div>
                        )}

                        {turns.map((turn, i) => (
                           <div key={i} className="flex flex-col gap-4 animate-in fade-in duration-500">
                              {mode === 'comparison' ? (
                                 <div className="flex flex-col gap-4">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-medium italic text-slate-400 leading-relaxed italic">"{turn.user_message}"</div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <div className={cn("p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm", turn.winner === 'agent_a' && "border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10")}>
                                          <div className="text-[9px] font-black text-red-500 mb-2 uppercase tracking-wider">Bot A</div>
                                          <div className="text-xs leading-relaxed text-slate-200">{turn.agent_a_response}</div>
                                       </div>
                                       <div className={cn("p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm", turn.winner === 'agent_b' && "border-indigo-500/50 bg-indigo-500/5 shadow-lg shadow-indigo-500/10")}>
                                          <div className="text-[9px] font-black text-indigo-400 mb-2 uppercase tracking-wider">Bot B</div>
                                          <div className="text-xs leading-relaxed text-slate-200">{turn.agent_b_response}</div>
                                       </div>
                                    </div>
                                    <div className="bg-slate-900/80 backdrop-blur-xl text-white rounded-xl p-3 text-[10px] leading-relaxed italic opacity-90 border border-white/10">
                                       <span className="text-red-500 font-black mr-2 uppercase tracking-wide">Judge Reasoning:</span> {turn.judge_reasoning}
                                    </div>
                                 </div>
                              ) : (
                                 <div className="flex gap-4">
                                    <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0 h-fit mt-1">
                                       <Bot className="h-4 w-4 text-red-500" />
                                    </div>
                                    <div className="flex flex-col gap-2 flex-1">
                                       <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-sm text-xs leading-relaxed font-medium text-slate-200 backdrop-blur-sm">
                                          {turn.agent_a_response}
                                       </div>
                                       <div className="flex items-center gap-3">
                                          <Badge className="bg-red-600 text-[9px] font-black px-2 py-0 border-0">Score: {Math.round(turn.score * 100)}%</Badge>
                                          <span className="text-[10px] italic text-slate-500 font-medium truncate max-w-[200px]">{turn.judge_reasoning}</span>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>
                        ))}
                        {status === 'running' && (
                           <div className="flex items-center gap-3 opacity-50 py-4">
                              <RefreshCw className="h-4 w-4 animate-spin text-red-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Analysing turn...</span>
                           </div>
                        )}
                     </div>
                  </ScrollArea>

                  {/* Intervention: Override AI */}
                  <div className="shrink-0 flex items-center gap-2 bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-lg ring-1 ring-white/10">
                     <div className="p-2 rounded-lg bg-red-500/10 ml-1">
                        <Bot className="h-4 w-4 text-red-500" />
                     </div>
                     <Input
                        placeholder="Ghi đè câu trả lời của AI ở lượt kế tiếp..."
                        value={overrideInput}
                        onChange={e => setOverrideInput(e.target.value)}
                        className="flex-1 border-0 h-9 text-xs font-medium focus-visible:ring-0 placeholder:italic placeholder:text-slate-500 bg-transparent text-white"
                     />
                     <Button className="h-8 w-8 p-0 rounded-xl bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20 group"><ChevronUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" /></Button>
                  </div>
               </div>

               {/* Right Column: User Simulator (Adversarial ONLY) */}
               {mode === 'adversarial' && (
                  <div className="flex flex-col space-y-4 overflow-hidden animate-in slide-in-from-right-10 duration-500">
                     <div className="shrink-0 flex items-center justify-between p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2">
                           <User className="h-4 w-4 text-emerald-400" />
                           <span className="text-xs font-black uppercase text-slate-100 tracking-tight">User Simulator Probes</span>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 font-bold text-[9px] px-2 py-0 border border-emerald-500/20 italic">SIM PANEL</Badge>
                     </div>

                     <ScrollArea className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-inner-sm">
                        <div className="p-4 flex flex-col gap-6">
                           {turns.map((turn, i) => (
                              <div key={i} className="flex gap-4 justify-end animate-in fade-in duration-500">
                                 <div className="flex flex-col gap-1 items-end flex-1">
                                    <div className="p-3 rounded-2xl bg-indigo-600 text-white text-xs leading-relaxed font-bold shadow-lg shadow-indigo-900/20">
                                       {turn.user_message}
                                    </div>
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Turn {turn.turn_number}</span>
                                 </div>
                                 <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0 h-fit mt-1">
                                    <User className="h-4 w-4 text-indigo-400" />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </ScrollArea>

                     {/* Intervention: Inject Instruction */}
                     <div className="shrink-0 flex items-center gap-2 bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-lg ring-1 ring-white/10">
                        <div className="p-2 rounded-lg bg-emerald-500/10 ml-1">
                           <MessageSquare className="h-4 w-4 text-emerald-400" />
                        </div>
                        <Input
                           placeholder="Tiêm hướng dẫn (Inject) vào Simulator..."
                           value={injectInput}
                           onChange={e => setInjectInput(e.target.value)}
                           className="flex-1 border-0 h-9 text-xs font-medium focus-visible:ring-0 placeholder:italic placeholder:text-slate-500 bg-transparent text-white"
                        />
                        <Button className="h-8 w-8 p-0 rounded-xl bg-slate-700 hover:bg-slate-600 shadow-lg group"><ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" /></Button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}

export default function BattleArenaPage() {
   return (
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang khởi tạo đấu trường...</div>}>
         <BattleArenaContent />
      </Suspense>
   );
}
