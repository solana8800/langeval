"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { API_BASE_URL, IS_DEMO } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Bot, User, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      const isDemo = IS_DEMO;

      if (isDemo) {
        const { MOCK_CAMPAIGN_DETAIL } = await import("@/lib/mock-data");
        // Overwrite ID to match URL if needed
        const mockData = { ...MOCK_CAMPAIGN_DETAIL, campaign_id: id };
        setData(mockData);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/orchestrator/campaigns/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Fallback on 404/500 if enabled
        throw new Error("API call failed");
      }
    } catch (e) {
      console.error(e);
      // Fallback to Mock Data
      console.log("Detail API Failed. Falling back to Mock Data.");
      const { MOCK_CAMPAIGN_DETAIL } = await import("@/lib/mock-data");
      setData({ ...MOCK_CAMPAIGN_DETAIL, campaign_id: id });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // Poll status if running
    const interval = setInterval(() => {
      fetchDetail();
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading && !data) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;
  if (!data || data.error) return <div className="text-center p-12 text-slate-500">Campaign not found or initializing...</div>;

  const { status, values, created_at } = data;
  const { messages, current_score, metrics, metadata } = values || {};

  // Extract Scenario Name from metadata if available
  const scenarioName = metadata?.scenario_name || "Unknown Scenario";
  const executor = metadata?.created_by || { name: "System Admin", avatar: "https://github.com/shadcn.png" };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 pb-4 border-b border-slate-100">
          <div className="flex flex-col gap-4">
            {/* Top Row: Breadcrumbs & Status */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="hover:text-slate-800 cursor-pointer">Chiến dịch</span>
                  <span className="text-slate-300">/</span>
                  <span>Chi tiết kết quả</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  {scenarioName}
                </h1>
              </div>
              <div>
                {status === 'completed' && <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 px-3 py-1 text-sm shadow-none font-semibold"><CheckCircle2 className="w-4 h-4 mr-1.5" /> Completed</Badge>}
                {status === 'failed' && <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 px-3 py-1 text-sm shadow-none font-semibold"><XCircle className="w-4 h-4 mr-1.5" /> Failed</Badge>}
                {status === 'running' && <Badge className="bg-blue-50 text-blue-700 animate-pulse border-blue-200 px-3 py-1 text-sm shadow-none font-semibold"><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Running</Badge>}
              </div>
            </div>

            {/* Bottom Row: Executor & Key Stats */}
            <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
                  <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100 p-0.5">
                    <img src={executor.avatar} alt={executor.name} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Executed by</span>
                    <span className="text-xs font-semibold text-slate-700">{executor.name}</span>
                  </div>
                </div>
                <div className="pl-2 flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Started at</span>
                  <span className="text-xs font-medium text-slate-600">{new Date(created_at).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Score</span>
                  <span className={`text-xl font-bold ${current_score >= 5 ? 'text-green-600' : 'text-slate-700'}`}>{current_score?.toFixed(1) || '0.0'}<span className="text-xs text-slate-400 font-normal">/10</span></span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Duration</span>
                  <span className="text-xl font-bold text-slate-700 font-mono">
                    {status === 'completed' ? '45s' : '...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500 mt-1 font-mono">Campaign ID: {id}</p>

      <Tabs defaultValue="conversation" className="w-full h-[calc(100dvh-180px)] flex flex-col">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="metrics">Metrics Detail</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="conversation" className="mt-4 flex-1 min-h-0 flex flex-col h-full">
          <Card className="h-full flex flex-col shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="border-b py-3 bg-slate-50/50">
              <CardTitle className="text-base text-slate-700">Nội dung hội thoại</CardTitle>
            </CardHeader>
            <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/30 scroll-smooth">
              <div className="p-6 pb-20 space-y-6">
                {messages?.map((msg: any, idx: number) => {
                  if (msg.role === 'system') {
                    return (
                      <div key={idx} className="flex justify-center my-4">
                        <span className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full border border-slate-200 font-mono">
                          SYSTEM: {msg.content.substring(0, 100)}...
                        </span>
                      </div>
                    );
                  }

                  const isUser = msg.role === 'user';
                  // Use metadata.agent_name if available, else 'Target Agent'
                  const agentName = metadata?.agent_name || (metadata?.agent_id ? `Agent (${metadata.agent_id.substring(0, 8)})` : 'Target Agent');

                  return (
                    <div key={idx} className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm" title={agentName}>
                          <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                      )}

                      <div className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words break-all ${isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}>
                        <div className="font-semibold text-xs mb-1 opacity-70 uppercase tracking-wide">
                          {isUser ? (metadata?.user_name || 'User Simulator') : agentName}
                        </div>
                        {msg.content}
                      </div>

                      {isUser && (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                      )}
                    </div>
                  )
                })}

                {(!messages || messages.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-20">
                    <Bot className="w-10 h-10 opacity-20" />
                    <p>Đang chờ hội thoại bắt đầu...</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics && Object.entries(metrics).map(([key, value]: [string, any]) => {
              if (key.endsWith('_reason')) return null; // Skip reasoning fields in main loop

              const reason = metrics[`${key}_reason`] || "No specific reasoning provided.";
              const score = typeof value === 'number' ? value : 0;
              let colorClass = "text-slate-700";
              let bgClass = "bg-white";

              if (typeof value === 'number') {
                if (value >= 0.8) { colorClass = "text-green-600"; bgClass = "bg-green-50/50 hover:bg-green-50"; }
                else if (value >= 0.5) { colorClass = "text-yellow-600"; bgClass = "bg-yellow-50/50 hover:bg-yellow-50"; }
                else { colorClass = "text-red-600"; bgClass = "bg-red-50/50 hover:bg-red-50"; }
              }

              return (
                <Card key={key} className={`shadow-sm transition-all border-slate-200 ${bgClass}`}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                      {key.replace(/_/g, ' ')}
                    </CardTitle>
                    {typeof value === 'number' && (
                      <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${value >= 0.8 ? 'bg-green-100 text-green-700' : value >= 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {value >= 0.5 ? 'PASS' : 'FAIL'}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2 mb-3">
                      <div className={`text-3xl font-bold ${colorClass}`}>
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </div>
                      {typeof value === 'number' && <div className="text-sm text-slate-400 font-medium">/ 1.0</div>}
                    </div>

                    <div className="text-xs text-slate-600 bg-white/50 p-3 rounded-lg border border-slate-100 italic">
                      <span className="font-semibold not-italic text-slate-400 block mb-1 text-[10px] uppercase">Reasoning / Analysis</span>
                      "{reason}"
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {(!metrics || Object.keys(metrics).length === 0) && (
              <div className="col-span-3 text-center py-16 text-slate-500 border rounded-xl bg-slate-50 border-dashed">
                <p className="mb-2">Chưa có metrics nào được tính toán.</p>
                <p className="text-xs">Metrics sẽ xuất hiện sau khi hội thoại kết thúc.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="raw" className="mt-4 relative group">
          <Card>
            <CardContent className="p-0 relative">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    // Simple toast trigger could go here, for now just console log
                    console.log("Copied to clipboard");
                  }}
                  className="p-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 hover:text-white transition-colors"
                  title="Copy Raw JSON"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                </button>
              </div>
              <pre className="text-xs bg-slate-900 text-green-400 p-6 rounded-lg overflow-auto max-h-[600px] font-mono leading-normal whitespace-pre-wrap break-all">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
