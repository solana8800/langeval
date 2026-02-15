"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Loader2, RefreshCw, Bot, FileText, ChevronRight, ExternalLink, GitBranch, Terminal, Layers, Workflow } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-utils";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

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
    agent_id?: string; // Default agent
    nodes?: any[]; // To count steps
    nodesCount?: number; // Số lượng nodes (từ API proxy)
    updatedAt?: string;
}
export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [agentsMap, setAgentsMap] = useState<Record<string, Agent>>({});
    const [scenariosMap, setScenariosMap] = useState<Record<string, Scenario>>({});
    const [loading, setLoading] = useState(true);
    const t = useTranslations("ScenarioHistory");
    const commonT = useTranslations("Common");

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            // Check for Demo Mode
            const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

            if (isDemo) {
                console.log("Using Mock Data (Demo Mode)");
                const { MOCK_AGENTS, MOCK_SCENARIOS, MOCK_CAMPAIGNS } = await import("@/lib/mock-data");

                // Map Agents
                const agentMap: Record<string, Agent> = {};
                MOCK_AGENTS.forEach((a: any) => agentMap[a.id] = a);
                setAgentsMap(agentMap);

                // Map Scenarios
                const scenarioMap: Record<string, Scenario> = {};
                MOCK_SCENARIOS.forEach((s: any) => scenarioMap[s.id] = s);
                setScenariosMap(scenarioMap);

                // Set Campaigns
                setCampaigns(MOCK_CAMPAIGNS as any);
                setLoading(false);
                return;
            }

            // 1. Fetch Agents
            const agentsRes = await fetch(`${API_BASE_URL}/resource/agents?page_size=100`);
            if (agentsRes.ok) {
                const json = await agentsRes.json();
                const items = Array.isArray(json) ? json : (json.items || json.data || []);
                const map: Record<string, Agent> = {};
                items.forEach((a: any) => map[a.id] = a);
                setAgentsMap(map);
            }

            // 2. Fetch Scenarios
            const scenariosRes = await fetch(`${API_BASE_URL}/resource/scenarios?page_size=100`);
            if (scenariosRes.ok) {
                const json = await scenariosRes.json();
                const items = Array.isArray(json) ? json : (json.items || json.data || []);
                const map: Record<string, Scenario> = {};
                items.forEach((s: any) => map[s.id] = s);
                setScenariosMap(map);
            }

            // 3. Fetch Campaigns
            const campaignsRes = await fetch(`${API_BASE_URL}/orchestrator/campaigns?limit=50`);
            if (campaignsRes.ok) {
                const data = await campaignsRes.json();
                if (Array.isArray(data)) setCampaigns(data);
            } else {
                throw new Error("Campaigns API Failed");
            }
        } catch (e) {
            console.error("Fetch Error:", e);
            // Fallback to Mock Data on Error
            console.log("API Failed. Falling back to Mock Data.");
            const { MOCK_AGENTS, MOCK_SCENARIOS, MOCK_CAMPAIGNS } = await import("@/lib/mock-data");

            const agentMap: Record<string, Agent> = {};
            MOCK_AGENTS.forEach((a: any) => agentMap[a.id] = a);
            setAgentsMap(agentMap);

            const scenarioMap: Record<string, Scenario> = {};
            MOCK_SCENARIOS.forEach((s: any) => scenarioMap[s.id] = s);
            setScenariosMap(scenarioMap);

            setCampaigns(MOCK_CAMPAIGNS as any);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            // Only refresh campaigns list periodically
            fetch(`${API_BASE_URL}/orchestrator/campaigns?limit=50`)
                .then(res => res.json())
                .then(data => { if (Array.isArray(data)) setCampaigns(data); })
                .catch(console.error);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- Helpers ---
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> {t("status.completed")}</Badge>;
            case 'failed': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 shadow-none"><XCircle className="w-3 h-3 mr-1" /> {t("status.failed")}</Badge>;
            case 'running': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 shadow-none"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> {t("status.running")}</Badge>;
            case 'queued': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 shadow-none"><Clock className="w-3 h-3 mr-1" /> {t("status.queued")}</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getDifficultyColor = (diff?: string) => {
        switch (diff?.toLowerCase()) {
            case 'hard': return 'text-red-600 bg-red-50 border-red-100';
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'easy': return 'text-green-600 bg-green-50 border-green-100';
            default: return 'text-slate-500 bg-slate-100 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-6 rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
                    <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
                </div>
                <Button variant="outline" onClick={() => fetchData()} className="gap-2 bg-white hover:bg-slate-50">
                    <RefreshCw className="w-4 h-4" /> {t("refresh")}
                </Button>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b py-4 px-6">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        {t("recentCampaigns")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="pl-6 w-[350px]">{t("table.scenario")}</TableHead>
                                <TableHead className="w-[280px]">{t("table.agent")}</TableHead>
                                <TableHead className="w-[140px]">{t("table.status")}</TableHead>
                                <TableHead className="w-[120px]">{t("table.executor")}</TableHead>
                                <TableHead className="w-[140px]">{t("table.result")}</TableHead>
                                <TableHead>{t("table.duration")}</TableHead>
                                <TableHead className="text-right pr-6">{t("table.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && campaigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                                            <span className="text-sm">{t("table.syncing")}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : campaigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 text-slate-500">
                                        {t.rich("table.empty", {
                                            link: (chunks) => <Link href="/scenario-builder" className="text-blue-600 hover:underline">{chunks}</Link>
                                        })}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                campaigns.map((c) => {
                                    const scenario = scenariosMap[c.scenario_id];
                                    const agent = agentsMap[c.agent_id];

                                    // Calculate duration
                                    let duration = "N/A";
                                    if (c.created_at && c.updated_at) {
                                        const start = new Date(c.created_at);
                                        const end = new Date(c.updated_at);
                                        const diffMs = end.getTime() - start.getTime();
                                        if (diffMs > 0) {
                                            const seconds = Math.floor((diffMs / 1000) % 60);
                                            const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
                                            duration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                                        } else {
                                            duration = "< 1s";
                                        }
                                    } else if (c.status === 'running') {
                                        duration = t("table.running");
                                    }

                                    return (
                                        <TableRow key={c.id} className="group hover:bg-slate-50 transition-colors">
                                            {/* Column 1: Scenario Info */}
                                            <TableCell className="pl-6 py-4 align-top">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 p-1.5 bg-blue-50 rounded text-blue-600">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <TooltipProvider delayDuration={200}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Link href={`/scenario-builder/${c.scenario_id}`} className="font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1 text-base">
                                                                        {c.name}
                                                                    </Link>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="right" className="p-0 border-0 shadow-xl" align="start">
                                                                    {scenario ? (
                                                                        <Card className="w-[320px] border-slate-200">
                                                                            <div className={`h-1.5 w-full rounded-t-lg ${(scenario.difficulty || 'Medium') === 'Hard' ? 'bg-red-500' :
                                                                                (scenario.difficulty || 'Medium') === 'Easy' ? 'bg-green-500' : 'bg-orange-500'
                                                                                }`}></div>
                                                                            <CardHeader className="p-4 bg-slate-50/50 pb-2 border-b">
                                                                                <div className="flex justify-between items-start">
                                                                                    <CardTitle className="text-base font-bold text-slate-800 leading-tight">
                                                                                        {scenario.name}
                                                                                    </CardTitle>
                                                                                    <Badge variant="outline" className="bg-white ml-2 shrink-0">
                                                                                        {t(`table.difficulty.${(scenario.difficulty || 'medium').toLowerCase()}`)}
                                                                                    </Badge>
                                                                                </div>
                                                                                <CardDescription className="text-xs mt-1 line-clamp-3">
                                                                                    {scenario.description || "Chưa có mô tả cho kịch bản này."}
                                                                                </CardDescription>
                                                                            </CardHeader>
                                                                            <CardContent className="p-4 space-y-3">
                                                                                <div className="flex gap-4 text-xs">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <span className="text-slate-400 font-medium uppercase text-[10px]">Steps</span>
                                                                                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                                                                                            <Workflow className="w-3 h-3 text-blue-500" />
                                                                                            {scenario.nodesCount || scenario.nodes?.length || 0}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <span className="text-slate-400 font-medium uppercase text-[10px]">Created</span>
                                                                                        <span className="font-semibold text-slate-700">
                                                                                            {new Date(scenario.updatedAt || Date.now()).toLocaleDateString()}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                {/* Tags */}
                                                                                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-dashed">
                                                                                    {(scenario.tags || []).map((tag: string) => (
                                                                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md border">#{tag}</span>
                                                                                    ))}
                                                                                    {(!scenario.tags || scenario.tags.length === 0) && (
                                                                                        <span className="text-[10px] text-slate-400 italic">No tags</span>
                                                                                    )}
                                                                                </div>
                                                                            </CardContent>
                                                                            <div className="bg-slate-50 p-2 text-[10px] text-slate-400 font-mono border-t rounded-b-lg text-center">
                                                                                ID: {c.scenario_id}
                                                                            </div>
                                                                        </Card>
                                                                    ) : (
                                                                        <div className="p-3 text-xs text-slate-500">{t("table.loadingInfo")}</div>
                                                                    )}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-normal ${getDifficultyColor(scenario?.difficulty || 'Medium')}`}>
                                                                {t(`table.difficulty.${(scenario?.difficulty || 'medium').toLowerCase()}`)}
                                                            </Badge>
                                                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                                <Workflow className="w-3 h-3" /> {scenario?.nodesCount || scenario?.nodes?.length || 0} {t("table.steps")}
                                                            </span>
                                                        </div>

                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Column 2: Agent Info */}
                                            <TableCell className="align-top py-4">
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-3 cursor-help group/agent">
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 group-hover/agent:border-indigo-300 transition-colors relative">
                                                                    <Bot className="w-5 h-5 text-slate-500 group-hover/agent:text-indigo-600 transition-colors" />
                                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-sm text-slate-800 group-hover/agent:text-indigo-700 transition-colors">
                                                                        {agent?.name || "Unknown Agent"}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 rounded-sm w-fit mt-0.5">
                                                                        {agent?.type || "Chatbot"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="p-0 border-slate-200 shadow-xl" side="right" align="start">
                                                            {agent ? (
                                                                <Card className="w-[300px] border-slate-200">
                                                                    <div className="h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-lg relative">
                                                                        <div className="absolute -bottom-6 left-4 border-4 border-white rounded-full bg-white">
                                                                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                                                                                <Bot className="w-7 h-7 text-indigo-600" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="pt-8 px-4 pb-4">
                                                                        <h4 className="font-bold text-slate-900 text-lg">
                                                                            {agent.name}
                                                                        </h4>
                                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                                            {agent.description || "No description available."}
                                                                        </p>

                                                                        <div className="mt-4 space-y-2">
                                                                            {agent.endpoint_url && (
                                                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                                                    <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                                    <span className="truncate max-w-[200px] font-mono bg-slate-50 px-1 rounded">{agent.endpoint_url}</span>
                                                                                </div>
                                                                            )}
                                                                            {agent.repo_url && (
                                                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                                                    <GitBranch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                                    <span className="truncate max-w-[200px] font-medium text-blue-600">{agent.repo_url.replace('https://', '')}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </Card>
                                                            ) : (
                                                                <div className="p-3 text-xs text-slate-500">{t("table.loadingInfo")}</div>
                                                            )}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>

                                            {/* Column 3: Status */}
                                            <TableCell className="align-top py-4">
                                                {getStatusBadge(c.status)}
                                            </TableCell>

                                            {/* Column: Executor */}
                                            <TableCell className="align-top py-4">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                                                        {c.created_by?.avatar ? (
                                                            <img
                                                                src={c.created_by.avatar}
                                                                alt={c.created_by.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                                {c.created_by?.name ? c.created_by.name.charAt(0) : "U"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-medium max-w-[80px] truncate text-center" title={c.created_by?.name || "Unknown"}>
                                                        {c.created_by?.name || "Admin"}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Column 4: Score/Result */}
                                            <TableCell className="align-top py-4">
                                                {c.current_score !== undefined ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="font-bold text-sm text-slate-900">
                                                            {c.current_score.toFixed(1)} <span className="text-xs font-normal text-slate-400">/10</span>
                                                        </div>
                                                        {c.status === 'completed' && (
                                                            <div className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit ${c.current_score >= 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {c.current_score >= 5 ? 'PASS' : 'FAIL'}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </TableCell>

                                            {/* Column 5: Time & Duration */}
                                            <TableCell className="text-xs text-slate-500 align-top py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        {duration}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {new Date(c.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Column 6: Action */}
                                            <TableCell className="text-right pr-6 align-top py-4">
                                                <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 group-hover:bg-white border border-transparent group-hover:border-slate-200 group-hover:shadow-sm transition-all h-8">
                                                    <Link href={`/campaigns/${c.id}`}>
                                                        {t("table.details")} <ChevronRight className="w-4 h-4 ml-1" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
