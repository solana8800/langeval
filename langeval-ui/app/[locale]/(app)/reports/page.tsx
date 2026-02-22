"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Printer, PieChart, BarChart, TrendingUp, AlertTriangle, Search, Filter, HelpCircle, Bot } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { aiAgents } from "@/lib/mock-data";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@/components/ui/tooltip";

const CustomFailureTooltip = ({ active, payload, t }: any) => {
   if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
         <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg max-w-[250px] text-xs">
            <div className="flex items-center gap-2 mb-1">
               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
               <p className="font-bold text-slate-900">{data.name}</p>
            </div>
            <p className="font-semibold text-slate-700 mb-1">{t('table.count') || 'Quantity'}: {data.value} {t('table.errors') || 'errors'}</p>
            <p className="text-slate-500 leading-tight">
               {t(`failures.${data.name}`) || t('failures.undefined')}
            </p>
         </div>
      );
   }
   return null;
};

// Mock Data per Agent
const REPORT_DATA: Record<string, any> = {
   "agent-001": { // Tesla CSKH
      trend: [
         { build: 'v2.0', accuracy: 80, latency: 2.0, cost: 10 },
         { build: 'v2.1', accuracy: 82, latency: 1.8, cost: 12 },
         { build: 'v2.2', accuracy: 85, latency: 1.5, cost: 15 },
         { build: 'v2.3', accuracy: 84, latency: 1.6, cost: 14 },
         { build: 'v2.4', accuracy: 88, latency: 1.2, cost: 18 },
      ],
      failure: [
         { name: 'Hallucination', value: 40, color: '#ef5350' },
         { name: 'Safety', value: 30, color: '#ff9800' },
         { name: 'Logic Loop', value: 20, color: '#fdd835' },
         { name: 'Timeout', value: 10, color: '#9e9e9e' },
      ],
      details: [
         { id: 'ERR-001', topic: 'Chính sách bảo hành VF5', type: 'Hallucination', input: 'Bảo hành VF5 bao lâu?', output: 'Trọn đời (Sai)', status: 'Critical' },
         { id: 'ERR-002', topic: 'Giá thuê pin', type: 'Hallucination', input: 'Giá thuê pin tháng 10?', output: 'Miễn phí (Sai)', status: 'High' },
      ],
      drillDown: [
         { topic: "Chính sách bảo hành VF5", count: 15, percent: 25 },
         { topic: "Giá thuê bao pin 2024", count: 12, percent: 20 },
      ],
      aiAnalysis: "agent001"
   },
   "agent-002": { // Sentosa Resort Booking
      trend: [
         { build: 'v1.0', accuracy: 70, latency: 3.0, cost: 5 },
         { build: 'v1.1', accuracy: 75, latency: 2.5, cost: 8 },
         { build: 'v1.2', accuracy: 72, latency: 2.8, cost: 7 },
      ],
      failure: [
         { name: 'API Error', value: 50, color: '#ef5350' },
         { name: 'Wrong Param', value: 30, color: '#ff9800' },
         { name: 'Auth Fail', value: 20, color: '#9e9e9e' },
      ],
      details: [
         { id: 'ERR-101', topic: 'Đặt phòng', type: 'API Error', input: 'Đặt phòng ngày mai', output: '500 Server Error', status: 'Critical' },
         { id: 'ERR-102', topic: 'Tìm kiếm', type: 'Wrong Param', input: 'Tìm villa 5 người', output: 'Không tìm thấy', status: 'Medium' },
      ],
      drillDown: [
         { topic: "Lỗi kết nối API Sentosa Resort", count: 20, percent: 40 },
         { topic: "Sai định dạng ngày tháng", count: 15, percent: 30 },
      ],
      aiAnalysis: "agent002"
   }
};

const DEFAULT_DATA = REPORT_DATA["agent-001"];

export default function ReportsPage() {
   const t = useTranslations('Reports');
   const commonT = useTranslations('Common');
   const [selectedAgentId, setSelectedAgentId] = useState<string>("agent-001");
   const currentData = REPORT_DATA[selectedAgentId] || DEFAULT_DATA;

   return (
      <div className="space-y-8">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border shadow-sm gap-3 shrink-0">
            <div>
               <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
               <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">{t('description')} <span className="font-semibold text-slate-900">#2025-05-20</span>.</p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full md:w-auto">
               <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-200">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs text-slate-600 hidden md:inline">{t('filter')}</span>
                  <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                     <SelectTrigger className="flex-1 md:w-[180px] h-8 bg-white border-slate-200 text-xs">
                        <SelectValue placeholder={t('selectAgent')} />
                     </SelectTrigger>
                     <SelectContent>
                        {aiAgents.map((agent) => (
                           <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 md:flex-none gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 h-9 text-xs md:text-sm">
                     <Printer className="h-3.5 w-3.5" /> <span className="inline">{t('print')}</span>
                  </Button>
                  <Button className="flex-1 md:flex-none gap-2 bg-[#D13138] hover:bg-[#b71c1c] text-white shadow-sm h-9 text-xs md:text-sm">
                     <FileDown className="h-3.5 w-3.5" /> <span className="inline">{t('exportPdf')}</span>
                  </Button>
               </div>
            </div>
         </div>

         {/* Top Metrics Grid */}
         <div className="grid gap-6 md:grid-cols-4">
            <Card className="md:col-span-1 shadow-sm border-l-4 border-l-green-500">
               <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-600 font-medium flex items-center gap-2">
                     {t('overallScore')}
                     <TooltipProvider>
                        <Tooltip>
                           <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500" /></TooltipTrigger>
                           <TooltipContent><p className="text-xs">{t('overallScoreTooltip')}</p></TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                  </CardTitle>
               </CardHeader>
               <CardContent className="flex flex-col items-center justify-center py-6">
                  <TooltipProvider>
                     <Tooltip>
                        <TooltipTrigger>
                           <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-[8px] border-green-100 cursor-help hover:scale-105 transition-transform">
                              <div className="absolute inset-0 rounded-full border-[8px] border-green-500 border-l-transparent border-b-transparent rotate-[-45deg]"></div>
                              <span className="text-3xl font-bold text-slate-900">
                                 {currentData.trend[currentData.trend.length - 1].accuracy}%
                              </span>
                           </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs text-center bg-slate-900 text-white border-slate-800">
                           <p className="font-bold mb-1 text-green-400">{t('scoreFormula')}</p>
                           <p>{t('scoreFormulaDetail')}</p>
                           <p className="mt-1 italic text-slate-400">{t('scoreFormulaNote')}</p>
                        </TooltipContent>
                     </Tooltip>
                  </TooltipProvider>
                  <div className="mt-4 text-center">
                     <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 px-3 py-1">{t('pass')}</Badge>
                     <p className="text-xs text-slate-500 mt-2">{t('failThreshold')}</p>
                  </div>
               </CardContent>
            </Card>

            {/* Trend Analysis Chart */}
            <Card className="md:col-span-3 shadow-sm">
               <CardHeader className="border-b bg-slate-50/50 pb-2">
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-slate-500" />
                        {t('trendTitle')}
                        <TooltipProvider>
                           <Tooltip>
                              <TooltipTrigger><HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600" /></TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                 <p className="font-bold mb-1">{t('trendTooltip.title')}</p>
                                 <ul className="list-disc pl-4 space-y-1">
                                    <li><strong>{t('trendTooltip.accuracy')}</strong></li>
                                    <li><strong>{t('trendTooltip.latency')}</strong></li>
                                    <li><strong>{t('trendTooltip.cost')}</strong></li>
                                 </ul>
                              </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>
                     </CardTitle>
                     <Badge variant="outline">{t('buildsCount')}</Badge>
                  </div>
               </CardHeader>
               <CardContent className="p-4 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={currentData.trend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="build" />
                        <YAxis yAxisId="left" orientation="left" stroke="#16a34a" />
                        <YAxis yAxisId="right" orientation="right" stroke="#dc2626" />
                        <RechartsTooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="accuracy" name={t('accuracyLabel')} stroke="#16a34a" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="latency" name={t('latencyLabel')} stroke="#2563eb" strokeWidth={2} strokeDasharray="5 5" />
                        <Line yAxisId="right" type="monotone" dataKey="cost" name={t('costLabel')} stroke="#dc2626" strokeWidth={2} />
                     </LineChart>
                  </ResponsiveContainer>
               </CardContent>
            </Card>
         </div>

         {/* Failure Analysis & RCA */}
         <div className="grid gap-6 md:grid-cols-2">
            {/* Failure Clustering Pie Chart */}
            <Card className="shadow-sm">
               <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                     <PieChart className="h-5 w-5 text-slate-500" />
                     {t('failureClustering')}
                     <TooltipProvider>
                        <Tooltip>
                           <TooltipTrigger><HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600" /></TooltipTrigger>
                           <TooltipContent className="max-w-xs text-xs">
                              <p>{t('failureClusteringTooltip')}</p>
                           </TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                  </CardTitle>
               </CardHeader>
               <CardContent className="flex items-center justify-center h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <RePieChart>
                        <Pie
                           data={currentData.failure}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                        >
                           {currentData.failure.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <RechartsTooltip content={<CustomFailureTooltip t={t} />} />
                        <Legend verticalAlign="bottom" height={36} />
                     </RePieChart>
                  </ResponsiveContainer>
               </CardContent>
            </Card>

            {/* Drill Down List */}
            <Card className="shadow-sm">
               <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                     <AlertTriangle className="h-5 w-5 text-slate-500" />
                     {t('failureReason')}
                     <TooltipProvider>
                        <Tooltip>
                           <TooltipTrigger><HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600" /></TooltipTrigger>
                           <TooltipContent className="max-w-xs text-xs">
                              <p>{t('failureReasonTooltip')}</p>
                           </TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="divide-y">
                     {currentData.drillDown.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50">
                           <span className="font-medium text-slate-700">{item.topic}</span>
                           <div className="flex items-center gap-4">
                              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-[#D13138]" style={{ width: `${item.percent * 2}%` }}></div>
                              </div>
                              <span className="text-sm font-bold text-[#D13138]">{item.count} cases</span>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="p-4 bg-slate-50 m-4 rounded border border-slate-200">
                     <h4 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Bot className="h-4 w-4 text-blue-600" />
                        {t('aiAnalysis')}:
                     </h4>
                     <p className="text-xs text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.raw(`aiAnalysisContent.${currentData.aiAnalysis}`) }}>
                     </p>
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Detailed Cases Table */}
         <Card className="shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                     <BarChart className="h-5 w-5 text-slate-500" />
                     {t('testCasesTitle')}
                  </CardTitle>
                  <CardDescription>{t('testCasesDesc')}</CardDescription>
               </div>
               <div className="flex gap-2">
                  <div className="relative">
                     <Search className="h-4 w-4 absolute left-2 top-2.5 text-slate-400" />
                     <input
                        type="text"
                        placeholder={commonT('search')}
                        className="pl-8 h-9 w-40 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D13138]"
                     />
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>{t('table.topic')}</TableHead>
                        <TableHead>{t('table.type')}</TableHead>
                        <TableHead className="w-[300px]">{t('table.inputOutput')}</TableHead>
                        <TableHead>{t('table.severity')}</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {currentData.details.map((detail: any) => (
                        <TableRow key={detail.id}>
                           <TableCell className="font-mono text-xs">{detail.id}</TableCell>
                           <TableCell className="font-medium text-slate-700">{detail.topic}</TableCell>
                           <TableCell>
                              <Badge variant="outline" className="bg-slate-50">{detail.type}</Badge>
                           </TableCell>
                           <TableCell>
                              <div className="space-y-1">
                                 <p className="text-xs text-slate-500 truncate" title={detail.input}>Q: {detail.input}</p>
                                 <p className="text-xs text-[#D13138] truncate" title={detail.output}>A: {detail.output}</p>
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge className={
                                 detail.status === 'Critical' ? "bg-red-100 text-red-700 hover:bg-red-200" :
                                    detail.status === 'High' ? "bg-orange-100 text-orange-700 hover:bg-orange-200" :
                                       "bg-slate-100 text-slate-600"
                              }>
                                 {detail.status}
                              </Badge>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
               <div className="p-4 border-t flex justify-center">
                  <Button variant="ghost" size="sm" className="text-slate-500">{t('viewMore')}</Button>
               </div>
            </CardContent>
         </Card>
      </div>
   );
}
