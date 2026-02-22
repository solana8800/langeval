"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { HealthRadar } from "@/components/dashboard/health-radar";
import { releaseStatus, mockAgentStats } from "@/lib/mock-data";
import { useAgents } from "@/lib/use-agents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertTriangle, Activity, Zap, ShieldCheck, ArrowUpRight, Clock, Bot, HelpCircle, ArrowDownRight, Minus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  const t = useTranslations("Dashboard");
  const { agents, loading } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  // State for Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Use apiClient for standardized headers (X-Workspace-ID) and configuration
        const data = await apiClient('/resource/dashboard/summary');
        setDashboardData(data);
      } catch (e) {
        // Log warning instead of error to avoid loud alerts in Demo Mode when backend is down
        console.warn("Failed to fetch dashboard data, using mock data", e);
      } finally {
        setLoadingDashboard(false);
      }
    };
    fetchDashboard();
  }, []);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || (agents[0] ?? { name: "Loading...", type: "..." });

  // Use API data if available, otherwise fallback to mock
  // We map the API response structure to the UI structure if needed
  // API: { total_evaluations, avg_score, failure_rate, active_agents, trends }
  // UI expects: { passRate, passRateChange, totalCases, casesChange, criticalBugs, safetyScore, status, threshold, radar }

  const currentStats = dashboardData ? {
    ...mockAgentStats[selectedAgentId] || releaseStatus, // Keep some mocks for radar/safety if not currently in API
    passRate: Math.round(dashboardData.avg_score * 100),
    totalCases: dashboardData.total_evaluations,
    criticalBugs: Math.round(dashboardData.failure_rate * 100), // Mapping failure rate % to bugs count roughly for demo
    status: dashboardData.avg_score > 0.8 ? 'GO' : 'NO-GO'
  } : (mockAgentStats[selectedAgentId] || releaseStatus);


  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-3 w-3 mr-1" />;
    if (change < 0) return <ArrowDownRight className="h-3 w-3 mr-1" />;
    return <Minus className="h-3 w-3 mr-1" />;
  };

  const getChangeColor = (change: number, inverse = false) => {
    if (change === 0) return "text-slate-500 bg-slate-50";
    if (inverse) {
      return change > 0 ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50";
    }
    return change > 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
  };

  return (
    <div className="space-y-6 min-h-screen">
      {/* Background Effects matching landing page */}
      <div className="fixed inset-0 bg-[#0B0F19] -z-20" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-violet-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{t("title")}</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 line-clamp-1 md:line-clamp-none flex items-center gap-2">
            {t("subtitle")}
            <span className="w-1 h-1 rounded-full bg-slate-700 mx-1 hidden md:block" />
            <span className="font-semibold text-indigo-400 hidden md:inline">{t("campaign")} #2025-10-25</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 w-full md:w-auto relative z-10">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Bot className="h-4 w-4 text-indigo-400 shrink-0" />
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="w-full md:w-[220px] h-10 bg-white/5 border-white/10 text-white text-sm rounded-xl focus:ring-indigo-500/50">
                <SelectValue placeholder={t("selectAgent")} />
              </SelectTrigger>
              <SelectContent className="bg-[#161B2B] border-white/10 text-slate-300">
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id} className="focus:bg-white/10 focus:text-white">
                    <div className="flex items-center gap-2">
                      <span>{agent.name}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1 border-white/10 text-slate-500">{agent.type}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:block h-8 w-[1px] bg-white/10"></div>

          <div className="flex flex-row items-center justify-between w-full md:w-auto gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 shrink-0">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-[10px] md:text-xs font-medium text-slate-400">{t("lastRun")}: {currentStats.lastRun || 'N/A'}</span>
            </div>

            <div className="hidden md:block h-8 w-[1px] bg-white/10"></div>

            <div className="flex flex-col items-end shrink-0">
              <Badge
                variant={currentStats.status === 'GO' ? 'default' : 'destructive'}
                className={cn(
                  "text-xs md:text-sm px-4 py-1 rounded-full shadow-lg whitespace-nowrap border-0",
                  currentStats.status === 'GO' ? "bg-green-500/90 hover:bg-green-500 text-white shadow-green-500/20" : "bg-red-500/90 hover:bg-red-500 text-white shadow-red-500/20"
                )}
              >
                {currentStats.status === 'GO' ? 'GO' : 'NO-GO'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: t("kpis.passRate.title"),
            value: `${currentStats.passRate}%`,
            icon: Activity,
            color: "text-blue-400",
            border: "border-blue-500/50",
            bg: "bg-blue-500/5",
            change: currentStats.passRateChange,
            comparison: t("kpis.passRate.comparison"),
            tooltip: t("kpis.passRate.tooltip")
          },
          {
            title: t("kpis.testCoverage.title"),
            value: currentStats.totalCases,
            icon: Zap,
            color: "text-indigo-400",
            border: "border-indigo-500/50",
            bg: "bg-indigo-500/5",
            change: currentStats.casesChange,
            unit: t("kpis.testCoverage.unit"),
            tooltip: t("kpis.testCoverage.tooltip")
          },
          {
            title: t("kpis.criticalBugs.title"),
            value: currentStats.criticalBugs,
            icon: AlertTriangle,
            color: "text-orange-400",
            border: "border-orange-500/50",
            bg: "bg-orange-500/5",
            accent: "text-orange-400 bg-orange-500/10",
            status: currentStats.criticalBugs > 0 ? t("kpis.criticalBugs.urgent") : t("kpis.criticalBugs.safe"),
            tooltip: t("kpis.criticalBugs.tooltip")
          },
          {
            title: t("kpis.safetyScore.title"),
            value: `${currentStats.safetyScore}/100`,
            icon: ShieldCheck,
            color: "text-green-400",
            border: "border-green-500/50",
            bg: "bg-green-500/5",
            status: currentStats.safetyScore >= 95 ? t("kpis.safetyScore.high") : t("kpis.safetyScore.low"),
            tooltip: t("kpis.safetyScore.tooltip")
          }
        ].map((card, i) => (
          <Card key={i} className={cn("bg-white/5 backdrop-blur-md border border-white/10 shadow-xl relative overflow-hidden group hover:bg-white/[0.08] transition-all", `border-l-4 ${card.border}`)}>
            <div className={cn("absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30", card.bg)} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                {card.title}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-slate-600 hover:text-slate-400 transition-colors" /></TooltipTrigger>
                    <TooltipContent className="bg-slate-900 border-white/10 text-white"><p className="text-xs">{card.tooltip}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white tracking-tight">{card.value}</div>
              {card.change !== undefined ? (
                <p className={cn(
                  "flex items-center text-xs mt-2 w-fit px-2 py-0.5 rounded-full font-medium transition-colors",
                  getChangeColor(card.change).includes("green") ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
                )}>
                  {getChangeIcon(card.change)} {Math.abs(card.change)}{card.unit ? ` ${card.unit}` : "%"}
                  <span className="text-slate-500 ml-1 font-normal">{card.comparison}</span>
                </p>
              ) : (
                <p className={cn("flex items-center text-xs mt-2 font-medium px-2 py-0.5 rounded-full w-fit", card.accent || "text-slate-400 bg-white/5")}>
                  {card.status}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Health Radar Chart */}
        <Card className="col-span-full lg:col-span-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10" />
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-white">{t("radar.title")}</CardTitle>
                <CardDescription className="text-slate-400">{t("radar.description")} <span className="font-semibold text-indigo-400">{selectedAgent.name}</span>.</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] w-fit border-white/10 text-slate-500 bg-white/5">Model: {selectedAgent.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <HealthRadar data={currentStats.radar} />
            <div className="mt-6 grid grid-cols-2 gap-3 text-[11px] text-slate-400">
              {[
                { title: t("radar.metrics.accuracy.title"), desc: t("radar.metrics.accuracy.description") },
                { title: t("radar.metrics.safety.title"), desc: t("radar.metrics.safety.description") },
                { title: t("radar.metrics.tone.title"), desc: t("radar.metrics.tone.description") },
                { title: t("radar.metrics.speed.title"), desc: t("radar.metrics.speed.description") },
                { title: t("radar.metrics.cost.title"), desc: t("radar.metrics.cost.description"), full: true },
              ].map((m, i) => (
                <div key={i} className={cn("flex flex-col gap-1 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors", m.full ? "col-span-2" : "")}>
                  <span className="font-bold text-white">{m.title}</span>
                  <span className="leading-relaxed opacity-70">{m.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Release Decision & Actions */}
        <Card className="col-span-full lg:col-span-3 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl relative overflow-hidden flex flex-col group">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 blur-[100px] -z-10" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white">{t("decision.title")}</CardTitle>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] p-4 bg-[#161B2B] border border-white/10 shadow-2xl rounded-2xl text-slate-300 text-xs" side="left">
                    <p className="font-bold text-white mb-3 border-b border-white/5 pb-2">{t("decision.tooltip.title")}</p>
                    <ul className="space-y-2">
                      {[
                        { label: 'Pass Rate', val: '≥ 90%', color: 'text-green-400' },
                        { label: 'Critical Bugs', val: '0', color: 'text-green-400' },
                        { label: 'Test Coverage', val: '≥ 80%', color: 'text-green-400' },
                        { label: 'Safety Score', val: '≥ 95/100', color: 'text-green-400' }
                      ].map((item, i) => (
                        <li key={i} className="flex justify-between items-center">
                          <span className="opacity-80">{item.label}:</span>
                          <span className={cn("font-mono font-bold", item.color)}>{item.val}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-500 italic">
                      *{t("decision.tooltip.configBy")}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription className="text-slate-400">{t("decision.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-8 py-10 relative z-10">
            <div className="relative group/icon">
              <div className={cn(
                "absolute inset-0 rounded-full blur-[40px] opacity-20 transition-all duration-700 group-hover/icon:opacity-40 group-hover/icon:blur-[60px]",
                currentStats.status === 'GO' ? 'bg-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]'
              )}></div>
              {currentStats.status === 'GO' ? (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
                  <CheckCircle2 className="h-32 w-32 text-green-500 relative z-10 drop-shadow-2xl" />
                </motion.div>
              ) : (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
                  <AlertTriangle className="h-32 w-32 text-red-500 relative z-10 drop-shadow-2xl" />
                </motion.div>
              )}
            </div>

            <div className="text-center space-y-3">
              <h3 className={cn(
                "text-4xl font-black tracking-tighter drop-shadow-md",
                currentStats.status === 'GO' ? 'text-green-400' : 'text-red-500'
              )}>
                {currentStats.status}
              </h3>
              <p className="text-xs text-slate-400 font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/5 inline-block">
                {t("decision.acceptanceThreshold")}: <span className="text-white">{currentStats.threshold}%</span>
              </p>
            </div>

            <Separator className="bg-white/5" />

            <div className="w-full grid grid-cols-2 gap-6 text-center">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{t("decision.currentScore")}</p>
                <p className="text-2xl font-black text-white">{currentStats.passRate}%</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{t("decision.riskLevel.title")}</p>
                <p className={cn(
                  "text-2xl font-black",
                  currentStats.criticalBugs > 0 ? "text-orange-400" : "text-green-400"
                )}>
                  {currentStats.criticalBugs > 0 ? t("decision.riskLevel.medium") : t("decision.riskLevel.low")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}