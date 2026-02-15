
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_BASE_URL } from "@/lib/api-utils";
import { ChevronLeft, History, ExternalLink, Calendar, Target, Shield } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function RedTeamingHistoryPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE_URL}/orchestrator/red-teaming/campaigns`)
            .then(res => res.json())
            .then(data => {
                setCampaigns(data.items || []);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/red-teaming">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ChevronLeft className="h-4 w-4" /> Quay lại Console
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <History className="h-5 w-5 text-slate-500" />
                            Lịch Sử Red Teaming
                        </h1>
                        <p className="text-sm text-slate-500">Xem lại các chiến dịch tấn công bảo mật đã thực hiện</p>
                    </div>
                </div>
            </div>

            <Card className="border shadow-sm min-h-[500px]">
                <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="text-sm font-semibold text-slate-800">Danh sách chiến dịch</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
                    ) : campaigns.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Chưa có chiến dịch nào được thực hiện.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Ngày thực hiện</TableHead>
                                    <TableHead>Tên chiến dịch / Agent</TableHead>
                                    <TableHead>Chiến thuật</TableHead>
                                    <TableHead>Kết quả (Success/Blocked)</TableHead>
                                    <TableHead>Tiến độ</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map((campaign) => (
                                    <TableRow key={campaign.id} className="group hover:bg-slate-50/50">
                                        <TableCell className="text-slate-600 flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(campaign.created_at).toLocaleString('vi-VN')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">
                                                Attack on {campaign.agent_name || campaign.agent_id} - {campaign.strategy}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <Target className="h-3 w-3" /> {campaign.agent_id}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="capitalize px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-medium">
                                                {campaign.strategy}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-red-600">{campaign.successful_attacks} S</span>
                                                <span className="text-xs font-bold text-green-600">{campaign.blocked_attacks} B</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-500",
                                                            campaign.status === 'completed' ? "bg-green-500" : "bg-blue-500"
                                                        )}
                                                        style={{ width: `${campaign.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-500">{campaign.progress}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/red-teaming?attackId=${campaign.id}`}>
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
