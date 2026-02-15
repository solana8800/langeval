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
        const res = await fetch('http://localhost:8003/resource/dashboard/summary');
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 md:p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">
            {t("subtitle")} <span className="font-semibold text-slate-900 hidden md:inline">{t("campaign")} #2025-10-25</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Bot className="h-4 w-4 text-slate-500 shrink-0" />
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="w-full md:w-[220px] h-9 bg-slate-50 border-slate-200 text-sm">
                <SelectValue placeholder={t("selectAgent")} />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <span>{agent.name}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1">{agent.type}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:block h-8 w-[1px] bg-slate-200"></div>

          <div className="flex flex-row items-center justify-between w-full md:w-auto gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-md border shrink-0">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] md:text-xs font-medium text-slate-600">{t("lastRun")}: {currentStats.lastRun || 'N/A'}</span>
            </div>

            <div className="hidden md:block h-8 w-[1px] bg-slate-200"></div>

            <div className="flex flex-col items-end shrink-0">
              <Badge variant={currentStats.status === 'GO' ? 'default' : 'destructive'} className="text-xs md:text-sm px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                {currentStats.status === 'GO' ? 'GO' : 'NO-GO'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#D13138] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              {t("kpis.passRate.title")}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">{t("kpis.passRate.tooltip")}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <Activity className="h-4 w-4 text-[#D13138]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{currentStats.passRate}%</div>
            <p className={`flex items-center text-xs mt-1 w-fit px-1.5 py-0.5 rounded ${getChangeColor(currentStats.passRateChange)}`}>
              {getChangeIcon(currentStats.passRateChange)} {Math.abs(currentStats.passRateChange)}% <span className="text-slate-400 ml-1 font-normal">{t("kpis.passRate.comparison")}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              {t("kpis.testCoverage.title")}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">{t("kpis.testCoverage.tooltip")}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{currentStats.totalCases}</div>
            <p className={`flex items-center text-xs mt-1 w-fit px-1.5 py-0.5 rounded ${getChangeColor(currentStats.casesChange)}`}>
              {getChangeIcon(currentStats.casesChange)} {currentStats.casesChange > 0 ? '+' : ''}{currentStats.casesChange} {t("kpis.testCoverage.unit")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              {t("kpis.criticalBugs.title")}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">{t("kpis.criticalBugs.tooltip")}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{currentStats.criticalBugs}</div>
            <p className="flex items-center text-xs text-orange-600 mt-1 bg-orange-50 w-fit px-1.5 py-0.5 rounded">
              {currentStats.criticalBugs > 0 ? t("kpis.criticalBugs.urgent") : t("kpis.criticalBugs.safe")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              {t("kpis.safetyScore.title")}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">{t("kpis.safetyScore.tooltip")}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currentStats.safetyScore}/100</div>
            <p className="flex items-center text-xs text-slate-500 mt-1">
              {currentStats.safetyScore >= 95 ? t("kpis.safetyScore.high") : t("kpis.safetyScore.low")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Health Radar Chart */}
        <Card className="col-span-full lg:col-span-4 shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{t("radar.title")}</CardTitle>
                <CardDescription>{t("radar.description")} <span className="font-semibold text-[#D13138]">{selectedAgent.name}</span>.</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs w-fit">Model: {selectedAgent.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <HealthRadar data={currentStats.radar} />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="flex flex-col gap-1 p-2 bg-slate-50 rounded border">
                <span className="font-bold text-slate-900">{t("radar.metrics.accuracy.title")}</span>
                <span>{t("radar.metrics.accuracy.description")}</span>
              </div>
              <div className="flex flex-col gap-1 p-2 bg-slate-50 rounded border">
                <span className="font-bold text-slate-900">{t("radar.metrics.safety.title")}</span>
                <span>{t("radar.metrics.safety.description")}</span>
              </div>
              <div className="flex flex-col gap-1 p-2 bg-slate-50 rounded border">
                <span className="font-bold text-slate-900">{t("radar.metrics.tone.title")}</span>
                <span>{t("radar.metrics.tone.description")}</span>
              </div>
              <div className="flex flex-col gap-1 p-2 bg-slate-50 rounded border">
                <span className="font-bold text-slate-900">{t("radar.metrics.speed.title")}</span>
                <span>{t("radar.metrics.speed.description")}</span>
              </div>
              <div className="flex flex-col gap-1 p-2 bg-slate-50 rounded border col-span-2">
                <span className="font-bold text-slate-900">{t("radar.metrics.cost.title")}</span>
                <span>{t("radar.metrics.cost.description")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Release Decision & Actions */}
        <Card className="col-span-full lg:col-span-3 shadow-sm border-slate-200 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("decision.title")}</CardTitle>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] p-4 bg-white border border-slate-200 shadow-xl rounded-lg text-slate-700 text-xs" side="left">
                    <p className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">{t("decision.tooltip.title")}</p>
                    <ul className="space-y-1.5">
                      <li className="flex justify-between">
                        <span>Pass Rate:</span>
                        <span className="font-mono font-semibold text-green-600">&ge; 90%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Critical Bugs:</span>
                        <span className="font-mono font-semibold text-green-600">0</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Test Coverage:</span>
                        <span className="font-mono font-semibold text-green-600">&ge; 80%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Safety Score:</span>
                        <span className="font-mono font-semibold text-green-600">&ge; 95/100</span>
                      </li>
                    </ul>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                      *{t("decision.tooltip.configBy")}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>{t("decision.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${currentStats.status === 'GO' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {currentStats.status === 'GO' ? (
                <CheckCircle2 className="h-28 w-28 text-green-500 relative z-10" />
              ) : (
                <AlertTriangle className="h-28 w-28 text-[#D13138] relative z-10" />
              )}
            </div>

            <div className="text-center space-y-2">
              <h3 className={`text-3xl font-bold ${currentStats.status === 'GO' ? 'text-green-600' : 'text-[#D13138]'}`}>
                {currentStats.status}
              </h3>
              <p className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                {t("decision.acceptanceThreshold")}: {currentStats.threshold}%
              </p>
            </div>

            <Separator />

            <div className="w-full grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t("decision.currentScore")}</p>
                <p className="text-xl font-bold text-slate-900">{currentStats.passRate}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t("decision.riskLevel.title")}</p>
                <p className={`text-xl font-bold ${currentStats.criticalBugs > 0 ? t("decision.riskLevel.medium") : t("decision.riskLevel.low")}`}>
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