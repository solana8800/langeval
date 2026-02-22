
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_BASE_URL } from "@/lib/api-utils";
import { ChevronLeft, History, ExternalLink, Calendar, Swords, Bot, Brain } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Page, BattleCampaign } from "@/lib/types"; // Assuming types exist or define locally
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function BattleArenaHistoryContent() {
    const searchParams = useSearchParams();
    const [campaigns, setCampaigns] = useState<BattleCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode && (mode === 'adversarial' || mode === 'comparison')) {
            setActiveTab(mode);
        }
    }, [searchParams]);

    useEffect(() => {
        // Fetch campaigns from our new API route
        fetch(`${API_BASE_URL}/battle-arena/campaigns?size=50`)
            .then(res => res.json())
            .then(data => {
                // If backend returns Page object { items: [], ... }
                if (data.items) {
                    setCampaigns(data.items);
                } else if (Array.isArray(data)) {
                    setCampaigns(data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const getModeLabel = (mode: string) => {
        if (mode === 'adversarial') return "Target AI (Simulator)";
        if (mode === 'comparison') return "Comparison A/B";
        return mode;
    };

    const filteredCampaigns = campaigns.filter(c => {
        if (activeTab === 'all') return true;
        if (activeTab === 'adversarial') return c.mode === 'adversarial';
        if (activeTab === 'comparison') return c.mode === 'comparison';
        return true;
    });

    return (
        <div className="flex flex-col space-y-6 container mx-auto py-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/battle-arena">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ChevronLeft className="h-4 w-4" /> Quay lại Arena
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <History className="h-5 w-5 text-slate-500" />
                            {activeTab === 'adversarial' ? 'Lịch Sử Simulation Mode' :
                                activeTab === 'comparison' ? 'Lịch Sử Comparison A/B' :
                                    'Lịch Sử Đấu Trường'}
                        </h1>
                        <p className="text-sm text-slate-500">Xem lại các trận đấu Battle Arena đã thực hiện</p>
                    </div>
                </div>
            </div>

            <Card className="border shadow-sm min-h-[500px]">
                <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-800">Danh sách trận đấu</CardTitle>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white/50 p-1 rounded-lg">
                        <TabsList className="h-8 bg-slate-200/50 p-0.5">
                            <TabsTrigger value="all" className="text-[10px] h-7 px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Tất cả</TabsTrigger>
                            <TabsTrigger value="adversarial" className="text-[10px] h-7 px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Simulator Mode</TabsTrigger>
                            <TabsTrigger value="comparison" className="text-[10px] h-7 px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Comparison A/B</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
                    ) : filteredCampaigns.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Chưa có trận đấu nào được ghi nhận.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Thời gian</TableHead>
                                    <TableHead>Chế độ</TableHead>
                                    <TableHead>Đối thủ / Participants</TableHead>
                                    <TableHead className="text-center">Số lượt</TableHead>
                                    <TableHead>Kết quả</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCampaigns.map((campaign) => (
                                    <TableRow key={campaign.id} className="group hover:bg-slate-50/50">
                                        <TableCell className="text-slate-600 flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            {campaign.created_at ? new Date(campaign.created_at).toLocaleString('vi-VN') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                                campaign.mode === 'adversarial' ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                                            )}>
                                                {getModeLabel(campaign.mode)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {campaign.mode === 'adversarial' ? (
                                                    <>
                                                        <div className="flex items-center gap-1 text-xs font-medium text-slate-900">
                                                            <Bot className="h-3 w-3 text-red-500" /> Target: {campaign.target_agent_id?.slice(0, 8)}...
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                            <Brain className="h-3 w-3" /> Simulator: {campaign.simulator_id?.slice(0, 8)}...
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-1 text-xs font-medium text-slate-900">
                                                            <Swords className="h-3 w-3 text-blue-500" /> {campaign.agent_a_id?.slice(0, 6)}... vs {campaign.agent_b_id?.slice(0, 6)}...
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {campaign.current_turn} / {campaign.max_turns}
                                        </TableCell>
                                        <TableCell>
                                            {campaign.mode === 'adversarial' ? (
                                                <div className="text-xs">
                                                    Score: <span className="font-bold text-primary">{campaign.score_sum || 0}</span>
                                                </div>
                                            ) : (
                                                <div className="text-xs flex gap-2">
                                                    <span className="text-primary font-bold">A: {campaign.agent_a_wins || 0}</span>
                                                    <span className="text-slate-600 font-bold">B: {campaign.agent_b_wins || 0}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "capitalize px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                                campaign.status === 'completed' ? "bg-green-50 text-green-700 border-green-200" :
                                                    campaign.status === 'failed' ? "bg-red-50 text-red-700 border-red-200" :
                                                        "bg-yellow-50 text-yellow-700 border-yellow-200"
                                            )}>
                                                {campaign.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Link to existing Battle Arena Detail Page but via Query Param or ID */}
                                            {/* Currently /battle-arena is the main page. Maybe we can pass campaignId to load history? */}
                                            {/* Or create /battle-arena/history/[id] */}
                                            {/* Let's link to the main page with query param for now, matching Red Teaming pattern */}
                                            <Link href={`/battle-arena?campaignId=${campaign.id}`}>
                                                <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-300">
                                                    Chi tiết <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function BattleArenaHistoryPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải lịch sử đấu trường...</div>}>
            <BattleArenaHistoryContent />
        </Suspense>
    );
}
