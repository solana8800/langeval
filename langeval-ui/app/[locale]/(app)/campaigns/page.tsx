"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Loader2, RefreshCw, Bot, FileText, ChevronRight, GitBranch, Terminal, Workflow, AlertCircle } from "lucide-react";
import { API_BASE_URL, IS_DEMO } from "@/lib/api-client";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Models ---
interface Campaign {
    id: string;
    scenario_id: string;
    name: string;
    agent_id: string;
    created_at: string;
    updated_at?: string;
    status: string;
    current_score?: number;
    created_by?: {
        name: string;
        avatar: string;
    };
}

interface Agent {
    id: string;
    name: string;
    description?: string;
    endpoint_url?: string;
    type?: string;
    repo_url?: string;
    meta_data?: any;
}

interface Scenario {
    id: string;
    name: string;
    description?: string;
    difficulty?: string;
    tags?: string[];
    agent_id?: string;
    nodes?: any[];
    nodesCount?: number;
    updatedAt?: string;
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [agentsMap, setAgentsMap] = useState<Record<string, Agent>>({});
    const [scenariosMap, setScenariosMap] = useState<Record<string, Scenario>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations("ScenarioHistory");
    const commonT = useTranslations("Common");

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            setError(null);
            // Check for Demo Mode (Consolidated Logic)
            const isDemo = IS_DEMO;

            if (isDemo) {
                const { MOCK_AGENTS, MOCK_SCENARIOS, MOCK_CAMPAIGNS } = await import("@/lib/mock-data");

                const agentMap: Record<string, Agent> = {};
                MOCK_AGENTS.forEach((a: any) => agentMap[a.id] = a);
                setAgentsMap(agentMap);

                const scenarioMap: Record<string, Scenario> = {};
                MOCK_SCENARIOS.forEach((s: any) => scenarioMap[s.id] = s);
                setScenariosMap(scenarioMap);

                setCampaigns(MOCK_CAMPAIGNS as any);
                setLoading(false);
                return;
            }

            // 1. Fetch Agents
            try {
                const agentsRes = await fetch(`${API_BASE_URL}/resource/agents?page_size=100`);
                if (agentsRes.ok) {
                    const json = await agentsRes.json();
                    const items = Array.isArray(json) ? json : (json.items || json.data || []);
                    const map: Record<string, Agent> = {};
                    items.forEach((a: any) => map[a.id] = a);
                    setAgentsMap(map);
                }
            } catch (err) {
                console.warn("Failed to fetch agents:", err);
            }

            // 2. Fetch Scenarios
            try {
                const scenariosRes = await fetch(`${API_BASE_URL}/resource/scenarios?page_size=100`);
                if (scenariosRes.ok) {
                    const json = await scenariosRes.json();
                    const items = Array.isArray(json) ? json : (json.items || json.data || []);
                    const map: Record<string, Scenario> = {};
                    items.forEach((s: any) => map[s.id] = s);
                    setScenariosMap(map);
                }
            } catch (err) {
                console.warn("Failed to fetch scenarios:", err);
            }

            // 3. Fetch Campaigns
            const campaignsRes = await fetch(`${API_BASE_URL}/orchestrator/campaigns?limit=50`);
            if (campaignsRes.ok) {
                const contentType = campaignsRes.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await campaignsRes.json();
                    if (Array.isArray(data)) setCampaigns(data);
                } else {
                    throw new Error("Invalid response format from Campaigns API");
                }
            } else {
                throw new Error(`Campaigns API Failed: ${campaignsRes.status}`);
            }
        } catch (e) {
            console.error("Fetch Error:", e);
            setError("API Error. Falling back to local data.");

            // Fallback to Mock Data on Error
            try {
                const { MOCK_AGENTS, MOCK_SCENARIOS, MOCK_CAMPAIGNS } = await import("@/lib/mock-data");
                const agentMap: Record<string, Agent> = {};
                MOCK_AGENTS.forEach((a: any) => agentMap[a.id] = a);
                setAgentsMap(agentMap);

                const scenarioMap: Record<string, Scenario> = {};
                MOCK_SCENARIOS.forEach((s: any) => scenarioMap[s.id] = s);
                setScenariosMap(scenarioMap);

                if (campaigns.length === 0) setCampaigns(MOCK_CAMPAIGNS as any);
            } catch (mockErr) {
                console.error("Critical: Could not load mock data", mockErr);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetch(`${API_BASE_URL}/orchestrator/campaigns?limit=50`)
                .then(res => {
                    if (!res.ok) throw new Error("Silent update failed");
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) return res.json();
                    throw new Error("Non-JSON response");
                })
                .then(data => { if (Array.isArray(data)) setCampaigns(data); })
                .catch(err => {
                    // Silently ignore background polling errors if we have data
                });
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // --- Helpers ---
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20 shadow-none px-3 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {t("status.completed")}</Badge>;
            case 'failed': return <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 shadow-none px-3 py-1 rounded-full"><XCircle className="w-3.5 h-3.5 mr-1.5" /> {t("status.failed")}</Badge>;
            case 'running': return <Badge className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/20 shadow-none px-3 py-1 rounded-full"><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> {t("status.running")}</Badge>;
            case 'queued': return <Badge className="bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border-slate-500/20 shadow-none px-3 py-1 rounded-full"><Clock className="w-3.5 h-3.5 mr-1.5" /> {t("status.queued")}</Badge>;
            default: return <Badge variant="outline" className="border-white/10 text-slate-500">{status}</Badge>;
        }
    };

    const getDifficultyColor = (diff?: string) => {
        switch (diff?.toLowerCase()) {
            case 'hard': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'easy': return 'text-green-400 bg-green-500/10 border-green-500/20';
            default: return 'text-slate-400 bg-white/5 border-white/10';
        }
    };

    return (
        <div className="space-y-6 min-h-screen">
            {/* Dark Theme Backgrounds */}
            <div className="fixed inset-0 bg-[#0B0F19] -z-20" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />

            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{t("title")}</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1 font-medium">{t("subtitle")}</p>
                </div>
                <div className="flex items-center justify-center gap-3 relative z-10 w-full md:w-auto">
                    {error && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-full animate-pulse mr-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => fetchData()}
                        className="gap-2 bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all shadow-xl h-11 px-5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading ? "animate-spin text-indigo-400" : "")} />
                        {t("refresh")}
                    </Button>
                </div>
            </motion.div>

            {/* Main Table Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden rounded-2xl relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10" />
                    <CardHeader className="bg-white/[0.02] border-b border-white/5 py-5 px-8">
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            {t("recentCampaigns")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/[0.01]">
                                    <TableRow className="hover:bg-transparent border-white/5">
                                        <TableHead className="pl-8 text-slate-500 font-bold uppercase tracking-widest text-[10px] py-4">{t("table.scenario")}</TableHead>
                                        <TableHead className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t("table.agent")}</TableHead>
                                        <TableHead className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t("table.status")}</TableHead>
                                        <TableHead className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t("table.executor")}</TableHead>
                                        <TableHead className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t("table.result")}</TableHead>
                                        <TableHead className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{commonT("lastUpdated") || "Updated"}</TableHead>
                                        <TableHead className="text-right pr-8 text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t("table.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {loading && campaigns.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-24 text-slate-500 border-white/5">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="relative">
                                                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                                                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 relative z-10" />
                                                        </div>
                                                        <span className="text-sm font-medium tracking-wide text-slate-400 uppercase">{t("table.syncing")}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : campaigns.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-24 text-slate-500 border-white/5">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FileText className="w-12 h-12 text-slate-800 mb-2" />
                                                        <p className="text-slate-400">
                                                            {t.rich("table.empty", {
                                                                link: (chunks) => <Link href="/scenario-builder" className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold underline">{chunks}</Link>
                                                            })}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            campaigns.map((c, idx) => {
                                                const scenario = scenariosMap[c.scenario_id];
                                                const agent = agentsMap[c.agent_id];

                                                return (
                                                    <motion.tr
                                                        key={c.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="group hover:bg-white/[0.03] transition-all border-white/5"
                                                    >
                                                        {/* Column 1: Scenario Info */}
                                                        <TableCell className="pl-8 py-5 align-middle border-white/5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/10 shrink-0 group-hover:scale-110 transition-transform">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <TooltipProvider delayDuration={200}>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Link href={`/campaigns/${c.id}`} className="font-bold text-white hover:text-indigo-400 transition-colors truncate text-sm">
                                                                                    {c.name}
                                                                                </Link>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="right" className="p-0 border-0 shadow-2xl bg-transparent" align="start">
                                                                                {scenario && (
                                                                                    <Card className="w-[320px] bg-[#161B2B]/95 backdrop-blur-xl border-white/10 text-slate-300 overflow-hidden shadow-2xl">
                                                                                        <div className={`h-1.5 w-full ${(scenario.difficulty || 'Medium') === 'Hard' ? 'bg-red-500' : (scenario.difficulty || 'Medium') === 'Easy' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                                                                        <CardHeader className="p-4 pb-2 border-b border-white/5">
                                                                                            <div className="flex justify-between items-start gap-2">
                                                                                                <CardTitle className="text-sm font-bold text-white leading-tight truncate">{scenario.name}</CardTitle>
                                                                                                <Badge variant="outline" className="text-[9px] bg-white/5 border-white/10 shrink-0 uppercase tracking-tighter">
                                                                                                    {t(`table.difficulty.${(scenario.difficulty || 'medium').toLowerCase()}`)}
                                                                                                </Badge>
                                                                                            </div>
                                                                                        </CardHeader>
                                                                                        <CardContent className="p-4 space-y-3">
                                                                                            <div className="flex gap-4">
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Steps</span>
                                                                                                    <span className="text-sm font-black text-white flex items-center gap-1.5">
                                                                                                        <Workflow className="w-3.5 h-3.5 text-indigo-400" />
                                                                                                        {scenario.nodesCount || scenario.nodes?.length || 0}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5 italic">
                                                                                                {(scenario.tags || []).map((tag: string) => (
                                                                                                    <span key={tag} className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/10">#{tag}</span>
                                                                                                ))}
                                                                                            </div>
                                                                                        </CardContent>
                                                                                    </Card>
                                                                                )}
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase border", getDifficultyColor(scenario?.difficulty))}>
                                                                            {t(`table.difficulty.${(scenario?.difficulty || 'medium').toLowerCase()}`)}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                                                            <Workflow className="w-3 h-3 text-slate-600" /> {scenario?.nodesCount || scenario?.nodes?.length || 0} steps
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        {/* Column 2: Agent Info */}
                                                        <TableCell className="align-middle border-white/5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/10 shrink-0">
                                                                    <Bot className="w-4.5 h-4.5 text-violet-400" />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-bold text-slate-200 text-sm truncate">{agent?.name || c.agent_id.substring(0, 8)}</span>
                                                                    <span className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{agent?.type || "Standard"}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        {/* Column 3: Status */}
                                                        <TableCell className="align-middle border-white/5">
                                                            {getStatusBadge(c.status)}
                                                        </TableCell>

                                                        {/* Column: Executor */}
                                                        <TableCell className="align-middle border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                                                    {c.created_by?.avatar ? (
                                                                        <img src={c.created_by.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-[10px] font-black text-slate-500">{c.created_by?.name?.charAt(0) || "A"}</span>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-slate-400 font-medium truncate max-w-[80px]">
                                                                    {c.created_by?.name || "Admin"}
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        {/* Column 4: Score/Result */}
                                                        <TableCell className="align-middle border-white/5">
                                                            {c.current_score !== undefined ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-lg font-black text-white">{c.current_score.toFixed(1)}</span>
                                                                        <span className="text-[10px] text-slate-500 font-bold">/ 10</span>
                                                                    </div>
                                                                    <div className={cn(
                                                                        "text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full w-fit uppercase",
                                                                        c.current_score >= 5 ? 'bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-red-500/10 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                                                    )}>
                                                                        {c.current_score >= 5 ? 'PASS' : 'FAIL'}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="w-8 h-1 bg-white/5 rounded-full" />
                                                            )}
                                                        </TableCell>

                                                        {/* Column 5: Time */}
                                                        <TableCell className="align-middle border-white/5">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-1.5 font-bold text-slate-300 text-xs">
                                                                    <Clock className="w-3 h-3 text-slate-500" />
                                                                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 font-mono">
                                                                    {new Date(c.created_at).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        {/* Column 6: Action */}
                                                        <TableCell className="text-right pr-8 align-middle border-white/5">
                                                            <Link href={`/campaigns/${c.id}`} className="inline-flex items-center justify-center p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all group/btn border border-white/5">
                                                                <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
                                                            </Link>
                                                        </TableCell>
                                                    </motion.tr>
                                                )
                                            })
                                        )}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
