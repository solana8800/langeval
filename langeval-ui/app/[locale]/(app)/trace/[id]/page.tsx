"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    ChevronDown, ChevronUp, Clock, Database,
    Brain, MessageSquare, Terminal, DollarSign,
    CheckCircle2, AlertCircle, Copy, RefreshCw, ArrowLeft, Wifi, WifiOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TraceDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [selectedSpan, setSelectedSpan] = useState<any>(null);
    const [showGuide, setShowGuide] = useState(true);

    // Fetch trace detail from API
    const { data, error, isLoading, mutate } = useSWR(
        `/api/v1/resource/traces/${params.id}`,
        fetcher
    );

    const traceData = data?.data;
    const source = data?.source || "unknown";
    const isLive = source === "langfuse";

    // Transform Langfuse observations to spans format
    const spans = traceData?.observations?.map((obs: any, index: number) => ({
        id: obs.id,
        name: obs.name,
        type: obs.type?.toLowerCase() || "span",
        startTime: obs.startTime,
        endTime: obs.endTime,
        duration: obs.endTime && obs.startTime
            ? (new Date(obs.endTime).getTime() - new Date(obs.startTime).getTime()) / 1000
            : 0,
        status: obs.statusMessage || "success",
        tokens: obs.usage?.totalTokens || 0,
        cost: obs.calculatedTotalCost || 0,
        input: obs.input,
        output: obs.output,
        metadata: obs.metadata || {},
        level: obs.level || 0,
        model: obs.model
    })) || [];

    // Set first span as selected by default
    if (!selectedSpan && spans.length > 0) {
        setSelectedSpan(spans[0]);
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'span': return <MessageSquare className="h-4 w-4 text-slate-500" />;
            case 'tool': return <Database className="h-4 w-4 text-orange-500" />;
            case 'generation': return <Brain className="h-4 w-4 text-blue-500" />;
            default: return <Terminal className="h-4 w-4 text-slate-500" />;
        }
    };

    if (isLoading) {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error || !traceData) {
        return (
            <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg text-slate-600">Không thể tải trace</p>
                <Button onClick={() => router.push("/traces")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    const totalDuration = traceData.latency ||
        (spans.length > 0 ? Math.max(...spans.map((s: any) => s.duration)) : 0);

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/traces")}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">
                            {traceData.name || "Trace Detail"}
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 mt-1 font-mono">{params.id}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Data Source Badge */}
                    <Badge
                        variant="outline"
                        className={cn(
                            "px-3 py-1.5 gap-2",
                            isLive
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                    >
                        {isLive ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {isLive ? "Live Data" : "Mock Data"}
                    </Badge>

                    <Badge variant="outline" className="px-2 md:px-3 py-1 bg-green-50 text-green-700 border-green-200 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {traceData.status || "Success"}
                    </Badge>
                    <Badge variant="outline" className="px-2 md:px-3 py-1 bg-slate-50 text-slate-600 gap-1">
                        <Clock className="h-3 w-3" /> {totalDuration.toFixed(2)}s
                    </Badge>
                    <Badge variant="outline" className="px-2 md:px-3 py-1 bg-slate-50 text-slate-600 gap-1">
                        <DollarSign className="h-3 w-3" /> ${(traceData.totalCost || 0).toFixed(4)}
                    </Badge>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mutate()}
                        className="gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Guide */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg overflow-hidden transition-all">
                <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-cyan-100/50"
                    onClick={() => setShowGuide(!showGuide)}
                >
                    <h3 className="font-semibold text-cyan-900 flex items-center gap-2 text-sm">
                        ℹ️ Hướng dẫn sử dụng Trace View
                    </h3>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-cyan-700">
                        {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>

                {showGuide && (
                    <div className="px-4 pb-4">
                        <div className="grid md:grid-cols-2 gap-4 text-sm text-cyan-800">
                            <ul className="list-disc ml-5 space-y-1">
                                <li><strong>Waterfall View (Trái):</strong> Hiển thị cấu trúc cây của request với timeline.</li>
                                <li><strong>Span Detail (Phải):</strong> Xem Input/Output chi tiết của từng bước.</li>
                            </ul>
                            <ul className="list-disc ml-5 space-y-1">
                                <li><strong>Màu sắc:</strong> <span className="text-blue-600">Generation (LLM)</span>, <span className="text-orange-600">Tools/DB</span></li>
                                <li><strong>Debug:</strong> Phát hiện bước nào gây chậm hoặc tốn nhiều tiền.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-1 gap-4 overflow-hidden border rounded-lg bg-white shadow-sm">
                {/* Left Panel: Waterfall Tree */}
                <div className="w-1/3 border-r min-w-[350px] flex flex-col bg-slate-50/30">
                    <div className="p-3 border-b bg-slate-50 text-xs font-semibold text-slate-500 uppercase flex justify-between">
                        <span>Execution Path</span>
                        <span>Duration</span>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col">
                            {spans.map((span: any) => {
                                const isSelected = selectedSpan?.id === span.id;
                                const widthPercent = Math.max((span.duration / totalDuration) * 100, 2);
                                const leftPercent = span.startTime
                                    ? ((new Date(span.startTime).getTime() - new Date(spans[0]?.startTime).getTime()) / 1000 / totalDuration) * 100
                                    : 0;

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
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {getIcon(span.type)}
                                                <span className={cn("text-sm font-medium truncate", isSelected ? "text-blue-700" : "text-slate-700")}>
                                                    {span.name}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500 font-mono shrink-0">{span.duration.toFixed(2)}s</span>
                                        </div>

                                        {/* Waterfall Bar */}
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
                                            {span.cost > 0 && <span>• ${span.cost.toFixed(4)}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right Panel: Detail View */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {selectedSpan ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b flex justify-between items-start bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                                        {getIcon(selectedSpan.type)}
                                        {selectedSpan.name}
                                    </h2>
                                    <div className="text-xs text-slate-500 mt-1 font-mono">{selectedSpan.id}</div>
                                </div>
                                <Button variant="outline" size="sm" className="gap-1">
                                    <Copy className="h-3 w-3" /> JSON
                                </Button>
                            </div>

                            <Tabs defaultValue="io" className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-4 border-b">
                                    <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                                        <TabsTrigger value="io" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#D13138] rounded-none px-0 py-3 h-full">Input / Output</TabsTrigger>
                                        <TabsTrigger value="metadata" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#D13138] rounded-none px-0 py-3 h-full">Metadata</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="io" className="flex-1 overflow-hidden p-0 m-0">
                                    <ScrollArea className="h-full">
                                        <div className="grid grid-rows-2 h-full min-h-[500px]">
                                            <div className="p-4 border-b">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Input</h4>
                                                <div className="bg-slate-50 p-3 rounded-md border text-sm font-mono whitespace-pre-wrap text-slate-800 h-full overflow-auto">
                                                    {JSON.stringify(selectedSpan.input, null, 2)}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-blue-50/10">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Output</h4>
                                                <div className="bg-white p-3 rounded-md border border-blue-100 text-sm font-mono whitespace-pre-wrap text-slate-800 shadow-sm h-full overflow-auto">
                                                    {JSON.stringify(selectedSpan.output, null, 2)}
                                                </div>
                                            </div>
                                        </div>
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="metadata" className="flex-1 p-6 m-0">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedSpan.model && (
                                                <div className="space-y-1">
                                                    <span className="text-xs text-slate-500 uppercase">Model</span>
                                                    <div className="text-sm font-medium">{selectedSpan.model}</div>
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <span className="text-xs text-slate-500 uppercase">Type</span>
                                                <div className="text-sm font-medium">{selectedSpan.type}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-slate-500 uppercase">Duration</span>
                                                <div className="text-sm font-medium">{selectedSpan.duration.toFixed(3)}s</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-slate-500 uppercase">Cost</span>
                                                <div className="text-sm font-medium">${selectedSpan.cost.toFixed(4)}</div>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-auto">
                                            {JSON.stringify(selectedSpan, null, 2)}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            Chọn một Span để xem chi tiết
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
