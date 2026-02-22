"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAgents } from "@/lib/use-agents";
import {
    Search, RefreshCw, CheckCircle2, XCircle, Clock,
    DollarSign, ChevronLeft, ChevronRight, Database, Wifi, WifiOff
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TracesPage() {
    const { agents } = useAgents();
    const [selectedAgent, setSelectedAgent] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const limit = 20;

    // Fetch traces from API
    const { data, error, isLoading, mutate } = useSWR(
        `/api/v1/resource/traces?${selectedAgent !== "all" ? `agentId=${selectedAgent}&` : ""}limit=${limit}&offset=${(page - 1) * limit}`,
        fetcher,
        { refreshInterval: 30000 } // Auto-refresh every 30s
    );

    const traces = data?.data || [];
    const total = data?.total || 0;
    const source = data?.source || "unknown";
    const isLive = source === "langfuse";

    // Filter traces by search query
    const filteredTraces = traces.filter((trace: any) =>
        trace.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trace.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(total / limit);

    const getStatusBadge = (status: string) => {
        if (status === "success") {
            return (
                <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Success
                </Badge>
            );
        }
        return (
            <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                <XCircle className="h-3 w-3 mr-1" />
                Error
            </Badge>
        );
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        } catch {
            return timestamp;
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
                <div>
                    <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">Trace Management</h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Quản lý và phân tích traces từ Langfuse</p>
                </div>

                <div className="flex items-center gap-3">
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

                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mutate()}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="shrink-0">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Agent Filter */}
                        <div className="flex-1">
                            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Filter theo Agent</label>
                            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue placeholder="Chọn Agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả Agent</SelectItem>
                                    {agents.map((agent) => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search */}
                        <div className="flex-1">
                            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Tìm kiếm</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Tìm theo Trace ID hoặc Name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Traces Table */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50 shrink-0">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Database className="h-4 w-4 text-[#D13138]" />
                        Danh sách Traces ({filteredTraces.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                            Đang tải...
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full text-red-500">
                            <XCircle className="h-6 w-6 mr-2" />
                            Lỗi khi tải traces
                        </div>
                    ) : filteredTraces.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            <Database className="h-6 w-6 mr-2" />
                            Không có traces nào
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow>
                                    <TableHead className="w-[200px]">Trace ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead className="w-[100px] text-right">Latency</TableHead>
                                    <TableHead className="w-[100px] text-right">Cost</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTraces.map((trace: any) => (
                                    <TableRow
                                        key={trace.id}
                                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <TableCell className="font-mono text-xs text-slate-600">
                                            {trace.id}
                                        </TableCell>
                                        <TableCell className="font-medium">{trace.name}</TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {formatTimestamp(trace.timestamp)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="gap-1 font-mono text-xs">
                                                <Clock className="h-3 w-3" />
                                                {trace.latency?.toFixed(2)}s
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="gap-1 font-mono text-xs">
                                                <DollarSign className="h-3 w-3" />
                                                {trace.totalCost?.toFixed(4)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(trace.status)}</TableCell>
                                        <TableCell>
                                            <Link href={`/trace/${trace.id}`}>
                                                <Button variant="ghost" size="sm" className="text-[#D13138] hover:text-[#D13138] hover:bg-red-50">
                                                    Chi tiết
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>

                {/* Pagination */}
                {!isLoading && filteredTraces.length > 0 && (
                    <div className="border-t p-4 flex items-center justify-between shrink-0 bg-slate-50/50">
                        <div className="text-sm text-slate-600">
                            Trang {page} / {totalPages} • Tổng {total} traces
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
