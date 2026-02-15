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
      <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4 overflow-hidden">
         {/* Top Status Bar */}
         <div className="flex items-center justify-between px-4 py-2 bg-white border-b-2 border-slate-200 shrink-0 shadow-sm">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", status === 'running' ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{status === 'running' ? 'Live Arena' : 'Arena Idle'}</span>
               </div>
               {mode === 'adversarial' ? (
                  <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                     <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Average Quality</span>
                        <span className="text-sm font-black text-primary">{(stats.avgScore * 100).toFixed(1)}%</span>
                     </div>
                     <div className="flex flex-col border-l border-slate-200 pl-4">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Progress</span>
                        <span className="text-sm font-black text-slate-800">{turns.length}/{maxTurns}</span>
                     </div>
                  </div>
               ) : (
                  <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                     <span className="text-sm font-bold text-slate-800">Results: <span className="text-primary">{stats.aWins}</span> vs <span className="text-slate-600">{stats.bWins}</span> <span className="text-[10px] text-slate-400 font-normal">(Ties: {stats.ties})</span></span>
                  </div>
               )}
            </div>

            <div className="flex items-center gap-2">
               <Link href={`/battle-arena/history?mode=${mode}`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1.5 text-slate-500 hover:text-slate-800">
                     <History className="h-3.5 w-3.5" /> History
                  </Button>
               </Link>
               <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="bg-white/5 p-1 rounded-lg">
                  <TabsList className="h-7 bg-transparent p-0">
                     <TabsTrigger value="adversarial" className="text-[10px] h-6 px-3 data-[state=active]:bg-primary data-[state=active]:text-white">Simulator Mode</TabsTrigger>
                     <TabsTrigger value="comparison" className="text-[10px] h-6 px-3 data-[state=active]:bg-primary data-[state=active]:text-white">Comparison A/B</TabsTrigger>
                  </TabsList>
               </Tabs>
            </div>
         </div>

         {/* Configuration Row */}
         <div className={cn(
            "flex items-center gap-4 px-4 shrink-0",
            mode === 'adversarial' ? "justify-between" : "justify-between"
         )}>
            {mode === 'adversarial' ? (
               <>
                  {/* Left: Target AI */}
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border-2 shadow-sm">
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
                        <span className="text-[10px] font-black text-slate-400 uppercase">Turns</span>
                        <Input
                           type="number"
                           value={maxTurns}
                           onChange={(e) => setMaxTurns(parseInt(e.target.value) || 0)}
                           onFocus={(e) => e.target.select()}
                           className="w-16 h-9 text-center font-bold text-xs"
                        />
                     </div>
                     <Button
                        onClick={handleStartBattle}
                        disabled={loading || status === 'running'}
                        className={cn(
                           "h-9 px-6 font-black text-[11px] uppercase tracking-wider gap-2 shadow-lg transition-all active:scale-95",
                           status === 'running' ? "bg-slate-100 text-slate-400" : "bg-primary hover:bg-primary/90 text-white"
                        )}
                     >
                        {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                        {status === 'running' ? 'Battle in Progress' : 'Start Simulation'}
                     </Button>
                  </div>

                  {/* Right: User Simulator */}
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border-2 shadow-sm">
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
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border-2 shadow-sm border-blue-100">
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
                        <span className="text-[10px] font-black text-slate-400 uppercase">Turns</span>
                        <Input
                           type="number"
                           value={maxTurns}
                           onChange={(e) => setMaxTurns(parseInt(e.target.value) || 0)}
                           onFocus={(e) => e.target.select()}
                           className="w-16 h-9 text-center font-bold text-xs"
                        />
                     </div>
                     <Button
                        onClick={handleStartBattle}
                        disabled={loading || status === 'running'}
                        className={cn(
                           "h-9 px-6 font-black text-[11px] uppercase tracking-wider gap-2 shadow-lg transition-all active:scale-95",
                           status === 'running' ? "bg-slate-100 text-slate-400" : "bg-primary hover:bg-primary/90 text-white"
                        )}
                     >
                        {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                        {status === 'running' ? 'Battle in Progress' : 'Start Simulation'}
                     </Button>
                  </div>

                  {/* Right: Bot B */}
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border-2 shadow-sm border-purple-100">
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
         <div className="flex-1 flex gap-4 px-4 overflow-hidden pb-4">
            {/* Scrollable Container for 2 Columns */}
            <div className={cn(
               "flex-1 grid gap-4 overflow-hidden",
               mode === 'adversarial' ? "grid-cols-2" : "grid-cols-1"
            )}>
               {/* Left Column: Target Bot (Adversarial) or Sequential (Comparison) */}
               <div className="flex flex-col space-y-4 overflow-hidden">
                  <div className="shrink-0 flex items-center justify-between p-3 bg-white border-2 rounded-2xl">
                     <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black uppercase text-slate-700 tracking-tight">
                           {mode === 'adversarial' ? "Target AI Response" : "Battle Sequence"}
                        </span>
                     </div>
                     <Badge className="bg-slate-100 text-slate-500 font-bold text-[9px] px-2 py-0">BOT PANEL</Badge>
                  </div>

                  <ScrollArea className="flex-1 bg-white border-2 rounded-2xl shadow-inner-sm">
                     <div className="p-4 flex flex-col gap-6">
                        {/* Information Panel - Collapsible */}
                        {mode === 'adversarial' && (
                           <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden transition-all shrink-0">
                              <div
                                 className="p-3 flex items-center justify-between cursor-pointer hover:bg-blue-100/50"
                                 onClick={() => setShowGuide(!showGuide)}
                              >
                                 <h3 className="font-semibold text-blue-900 flex items-center gap-2 text-sm">
                                    ℹ️ Cơ chế hoạt động
                                 </h3>
                                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-700 hover:text-blue-900 hover:bg-blue-200/50">
                                    {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                 </Button>
                              </div>

                              {showGuide && (
                                 <div className="px-3 pb-3">
                                    <p className="text-sm text-blue-800 mb-2">
                                       Đây là môi trường đối kháng tự động (Adversarial Simulation).
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1 text-xs text-blue-800">
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
                                    <div className="bg-slate-50 border rounded-xl p-3 text-[11px] font-medium italic text-slate-600">"{turn.user_message}"</div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <div className={cn("p-4 rounded-xl border-2 bg-white", turn.winner === 'agent_a' && "border-primary bg-red-50/30 shadow-lg shadow-red-100")}>
                                          <div className="text-[9px] font-black text-primary mb-2 uppercase">Bot A</div>
                                          <div className="text-xs leading-relaxed">{turn.agent_a_response}</div>
                                       </div>
                                       <div className={cn("p-4 rounded-xl border-2 bg-white", turn.winner === 'agent_b' && "border-slate-400 bg-slate-50/30 shadow-lg shadow-slate-100")}>
                                          <div className="text-[9px] font-black text-slate-600 mb-2 uppercase">Bot B</div>
                                          <div className="text-xs leading-relaxed">{turn.agent_b_response}</div>
                                       </div>
                                    </div>
                                    <div className="bg-slate-900 text-white rounded-xl p-3 text-[10px] leading-relaxed italic opacity-80 border-t-2 border-primary">
                                       <span className="text-primary font-black mr-2 uppercase">Judge Reasoning:</span> {turn.judge_reasoning}
                                    </div>
                                 </div>
                              ) : (
                                 <div className="flex gap-4">
                                    <Bot className="h-6 w-6 text-primary shrink-0 mt-1" />
                                    <div className="flex flex-col gap-2 flex-1">
                                       <div className="p-4 rounded-2xl bg-slate-50 border shadow-sm text-xs leading-relaxed font-medium text-slate-800">
                                          {turn.agent_a_response}
                                       </div>
                                       <div className="flex items-center gap-3">
                                          <Badge className="bg-primary text-[9px] font-black px-2 py-0">Score: {Math.round(turn.score * 100)}%</Badge>
                                          <span className="text-[10px] italic text-slate-400 font-medium truncate max-w-[200px]">{turn.judge_reasoning}</span>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>
                        ))}
                        {status === 'running' && (
                           <div className="flex items-center gap-3 opacity-50 py-4">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analysing turn...</span>
                           </div>
                        )}
                     </div>
                  </ScrollArea>

                  {/* Intervention: Override AI */}
                  <div className="shrink-0 flex items-center gap-2 bg-white p-2 rounded-2xl border-2 shadow-lg ring-4 ring-indigo-50/50">
                     <Bot className="h-4 w-4 text-indigo-600 ml-2" />
                     <Input
                        placeholder="Ghi đè câu trả lời của AI ở lượt kế tiếp..."
                        value={overrideInput}
                        onChange={e => setOverrideInput(e.target.value)}
                        className="flex-1 border-0 h-9 text-xs font-medium focus-visible:ring-0 placeholder:italic placeholder:text-slate-300"
                     />
                     <Button className="h-7 w-7 p-0 rounded-lg bg-primary"><ChevronUp className="h-4 w-4" /></Button>
                  </div>
               </div>

               {/* Right Column: User Simulator (Adversarial ONLY) */}
               {mode === 'adversarial' && (
                  <div className="flex flex-col space-y-4 overflow-hidden animate-in slide-in-from-right-10 duration-500">
                     <div className="shrink-0 flex items-center justify-between p-3 bg-white border-2 rounded-2xl">
                        <div className="flex items-center gap-2">
                           <User className="h-4 w-4 text-green-600" />
                           <span className="text-xs font-black uppercase text-slate-700 tracking-tight">User Simulator Probes</span>
                        </div>
                        <Badge className="bg-green-100 text-green-600 font-bold text-[9px] px-2 py-0">SIM PANEL</Badge>
                     </div>

                     <ScrollArea className="flex-1 bg-white border-2 rounded-2xl shadow-inner-sm">
                        <div className="p-4 flex flex-col gap-6">
                           {turns.map((turn, i) => (
                              <div key={i} className="flex gap-4 justify-end animate-in fade-in duration-500">
                                 <div className="flex flex-col gap-1 items-end flex-1">
                                    <div className="p-3 rounded-2xl bg-primary text-white text-xs leading-relaxed font-bold shadow-md shadow-red-100">
                                       {turn.user_message}
                                    </div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Turn {turn.turn_number}</span>
                                 </div>
                                 <User className="h-6 w-6 text-slate-400 shrink-0 mt-1" />
                              </div>
                           ))}
                        </div>
                     </ScrollArea>

                     {/* Intervention: Inject Instruction */}
                     <div className="shrink-0 flex items-center gap-2 bg-white p-2 rounded-2xl border-2 shadow-lg ring-4 ring-slate-50">
                        <MessageSquare className="h-4 w-4 text-slate-600 ml-2" />
                        <Input
                           placeholder="Tiêm hướng dẫn (Inject) vào Simulator..."
                           value={injectInput}
                           onChange={e => setInjectInput(e.target.value)}
                           className="flex-1 border-0 h-9 text-xs font-medium focus-visible:ring-0 placeholder:italic placeholder:text-slate-300"
                        />
                        <Button className="h-7 w-7 p-0 rounded-lg bg-slate-600"><ChevronDown className="h-4 w-4" /></Button>
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
