"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { redTeamingLogs, vulnerabilityReport } from "@/lib/mock-data";
import { ShieldAlert, Zap, FileDown, Terminal, Play, ChevronUp, ChevronDown, History, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { API_BASE_URL } from "@/lib/api-utils";
import { useAgents } from "@/lib/use-agents";

export default function RedTeamingPage() {
   return (
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium animate-pulse">Đang chuẩn bị Console...</div>}>
         <RedTeamingContent />
      </Suspense>
   );
}

function RedTeamingContent() {
   const searchParams = useSearchParams();
   const urlAttackId = searchParams.get('attackId');
   const [logs, setLogs] = useState<any[]>([]);
   const [report, setReport] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [attacking, setAttacking] = useState(false);
   const [showGuide, setShowGuide] = useState(true);
   const [selectedAgent, setSelectedAgent] = useState("ag_1");
   const { agents } = useAgents();
   const [attackId, setAttackId] = useState<string | null>(null);
   const [strategy, setStrategy] = useState("jailbreak");
   const [intensity, setIntensity] = useState(75);
   const [language, setLanguage] = useState("en");
   const [isRestored, setIsRestored] = useState(false);

   // Khôi phục trạng thái từ LocalStorage hoặc URL khi mount
   useEffect(() => {
      // 1. Ưu tiên tải dữ liệu từ attackId trên URL nếu có
      if (urlAttackId) {
         setLoading(true);
         setAttackId(urlAttackId);

         // Fetch chi tiết campaign để lấy agentId & strategy
         fetch(`${API_BASE_URL}/orchestrator/red-teaming/campaigns`) // Dùng proxy list để tìm hoặc thêm endpoint getById nếu cần
            .then(res => res.json())
            .then(data => {
               const campaign = data.items?.find((c: any) => c.id === urlAttackId);
               if (campaign) {
                  setSelectedAgent(campaign.agent_id);
                  setStrategy(campaign.strategy);
                  setIntensity(campaign.intensity);

                  // Fetch logs và stats cho attackId này
                  fetch(`${API_BASE_URL}/red-teaming/logs?attackId=${urlAttackId}`).then(res => res.json()).then(setLogs);
                  fetch(`${API_BASE_URL}/red-teaming/stats?attackId=${urlAttackId}`).then(res => res.json()).then(setReport);
               }
            })
            .catch(err => console.error("Error loading detail view:", err))
            .finally(() => setLoading(false));
      } else {
         // 2. Nếu không có URL param, khôi phục từ LocalStorage như cũ
         const savedState = localStorage.getItem('red_teaming_state');
         if (savedState) {
            try {
               const parsed = JSON.parse(savedState);
               const { logs: sLogs, report: sReport, strategy: sStrategy, intensity: sIntensity, attackId: sAttackId, agentId: sAgentId } = parsed;
               if (sLogs) setLogs(sLogs);
               if (sReport) setReport(sReport);
               if (sStrategy) setStrategy(sStrategy);
               if (sIntensity) setIntensity(sIntensity);
               if (sAttackId) setAttackId(sAttackId);
               if (sAgentId) setSelectedAgent(sAgentId);
               if (parsed.language) setLanguage(parsed.language);
            } catch (e) {
               console.error("Failed to parse saved state", e);
            }
         }
         setIsRestored(true);
         setLoading(false);
      }
   }, [urlAttackId]);

   // Effect riêng để đồng bộ selectedAgent khi agents list đã load xong từ hook useAgents
   useEffect(() => {
      if (isRestored && agents && agents.length > 0) {
         const savedState = localStorage.getItem('red_teaming_state');
         if (savedState) {
            try {
               const { agentId } = JSON.parse(savedState);
               if (agentId && agents.some(a => a.id === agentId)) {
                  setSelectedAgent(agentId);
               }
            } catch (e) { }
         }
      }
   }, [agents, isRestored]);

   // Lưu trạng thái vào LocalStorage khi có thay đổi quan trọng
   useEffect(() => {
      if (!isRestored) return; // Không lưu nếu chưa khôi phục xong

      const stateToSave = {
         logs,
         report,
         agentId: selectedAgent,
         strategy,
         intensity,
         attackId
      };
      localStorage.setItem('red_teaming_state', JSON.stringify(stateToSave));
   }, [logs, report, selectedAgent, strategy, intensity, attackId, isRestored]);

   // Polling logic
   useEffect(() => {
      let interval: any;
      if (attacking && attackId) {
         interval = setInterval(() => {
            fetch(`${API_BASE_URL}/red-teaming/stats?attackId=${attackId}`)
               .then(res => res.json())
               .then(data => {
                  setReport(data);
                  if (data.status === 'completed' || data.status === 'failed') {
                     setAttacking(false);
                     clearInterval(interval);
                  }
               });

            fetch(`${API_BASE_URL}/red-teaming/logs?attackId=${attackId}`)
               .then(res => res.json())
               .then(data => {
                  if (data) setLogs(data);
               });
         }, 3000); // Poll mỗi 3s
      }
      return () => clearInterval(interval);
   }, [attacking, attackId]);

   const handleStartAttack = () => {
      setAttacking(true);
      setLogs([{ id: 'init', probe: "Initializing security probes...", result: "QUEUED", type: "pending" }]);

      fetch(`${API_BASE_URL}/red-teaming/start`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            agentId: selectedAgent,
            strategy: strategy,
            intensity: intensity,
            language: language
         })
      })
         .then(res => res.json())
         .then(res => {
            if (res.success) {
               setAttackId(res.attackId);
            } else {
               setAttacking(false);
               alert("Failed to start attack: " + res.error);
            }
         })
         .catch(err => {
            setAttacking(false);
            console.error(err);
         });
   };

   const handleExportCSV = () => {
      if (!logs || logs.length === 0) return;

      // Helper: Format timestamp to readable format (without milliseconds)
      const formatTimestamp = (ts: string) => {
         if (!ts) return '';
         const date = new Date(ts);
         return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
         });
      };

      // Helper: Generate readable filename
      const generateFilename = (ext: string) => {
         const agentName = agents.find(a => a.id === selectedAgent)?.name || 'Unknown';
         const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
         return `RedTeaming_${agentName}_${strategy}_${timestamp}.${ext}`;
      };

      const headers = ["ID", "Probe", "Response", "Analysis", "Result", "Severity", "Timestamp"];
      const csvData = [
         headers.join(","),
         ...logs.map(log => [
            log.id,
            `"${(log.probe || "").replace(/"/g, '""')}"`,
            `"${(log.response || "").replace(/"/g, '""')}"`,
            `"${(log.analysis || "").replace(/"/g, '""')}"`,
            log.result,
            log.severity,
            formatTimestamp(log.timestamp)
         ].join(","))
      ].join("\n");

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", generateFilename('csv'));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const handleExportPDF = async () => {
      if (!logs || logs.length === 0) return;

      // Dynamically import jsPDF and autoTable
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF('p', 'mm', 'a4');

      // Colors matching the UI
      const colors = {
         primary: [209, 19, 56], // #D13138
         success: [34, 197, 94], // green
         warning: [251, 191, 36], // amber
         danger: [239, 68, 68], // red
         dark: [15, 23, 42], // slate-950
         light: [248, 250, 252], // slate-50
         gray: [100, 116, 139] // slate-500
      };

      // Header with gradient background
      doc.setFillColor(...(colors.primary as [number, number, number]));
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('Red Teaming Security Report', 14, 20);

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${new Date().toLocaleString('vi-VN')}`, 14, 30);

      // Metadata section
      let yPos = 50;
      doc.setTextColor(...(colors.dark as [number, number, number]));
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Campaign Information', 14, yPos);

      yPos += 8;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');

      const metaData = [
         ['Attack ID', attackId || 'N/A'],
         ['Strategy', strategy.toUpperCase()],
         ['Intensity', `${intensity}%`],
         ['Total Probes', logs.length.toString()],
         ['Agent', agents.find(a => a.id === selectedAgent)?.name || selectedAgent]
      ];

      autoTable(doc, {
         startY: yPos,
         head: [],
         body: metaData,
         theme: 'plain',
         styles: { fontSize: 9, cellPadding: 2 },
         columnStyles: {
            0: { fontStyle: 'bold', textColor: colors.gray as [number, number, number], cellWidth: 40 },
            1: { textColor: colors.dark as [number, number, number] }
         },
         margin: { left: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Vulnerability Summary
      if (report) {
         doc.setFontSize(12);
         doc.setFont(undefined, 'bold');
         doc.text('Vulnerability Summary', 14, yPos);

         yPos += 8;

         const summaryData = [
            ['Critical', report.critical || 0, colors.danger],
            ['High', report.high || 0, colors.warning],
            ['Medium', report.medium || 0, [59, 130, 246]], // blue
            ['Low', report.low || 0, colors.success],
            ['Success Rate', `${report.successRate || 0}%`, colors.primary]
         ];

         autoTable(doc, {
            startY: yPos,
            head: [['Severity', 'Count']],
            body: summaryData.map(([severity, count]) => [severity, count]),
            theme: 'striped',
            headStyles: { fillColor: colors.dark as [number, number, number], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
               0: { fontStyle: 'bold', cellWidth: 50 },
               1: { halign: 'right', cellWidth: 30 }
            },
            didParseCell: function (data: any) {
               if (data.section === 'body' && data.column.index === 0) {
                  const rowIndex = data.row.index;
                  const color = summaryData[rowIndex][2] as number[];
                  data.cell.styles.textColor = color;
               }
            },
            margin: { left: 14 }
         });

         yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Attack Logs Table
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Attack Logs', 14, yPos);

      yPos += 8;

      // Helper: Format timestamp
      const formatTimestamp = (ts: string) => {
         if (!ts) return 'N/A';
         const date = new Date(ts);
         return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
         });
      };

      // Helper: Generate readable filename
      const generateFilename = (ext: string) => {
         const agentName = agents.find(a => a.id === selectedAgent)?.name || 'Unknown';
         const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
         return `RedTeaming_${agentName}_${strategy}_${timestamp}.${ext}`;
      };

      const tableData = logs.map((log, index) => [
         `#${index + 1}`,
         log.probe || 'N/A',
         log.response || 'Waiting...',
         log.analysis || '-',
         log.result || 'PENDING',
         log.severity || '-',
         formatTimestamp(log.timestamp)
      ]);

      autoTable(doc, {
         startY: yPos,
         head: [['#', 'Probe (P)', 'AI Response (R)', 'Analysis', 'Result', 'Severity', 'Timestamp']],
         body: tableData,
         theme: 'grid',
         headStyles: {
            fillColor: colors.dark as [number, number, number],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center'
         },
         styles: {
            fontSize: 7,
            cellPadding: 2,
            overflow: 'linebreak',
            cellWidth: 'wrap'
         },
         columnStyles: {
            0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 38, textColor: colors.gray as [number, number, number] },
            2: { cellWidth: 42, fontStyle: 'bold', textColor: colors.dark as [number, number, number] },
            3: { cellWidth: 35, textColor: colors.gray as [number, number, number], fontSize: 6 },
            4: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
            5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
            6: { cellWidth: 28, fontSize: 6, textColor: colors.gray as [number, number, number] }
         },
         didParseCell: function (data: any) {
            if (data.section === 'body') {
               const log = logs[data.row.index];

               // Color code Result column
               if (data.column.index === 4) {
                  if (log.result === 'SUCCESS' || log.type === 'success') {
                     data.cell.styles.textColor = colors.danger;
                  } else if (log.result === 'Blocked' || log.type === 'blocked') {
                     data.cell.styles.textColor = colors.success;
                  } else {
                     data.cell.styles.textColor = colors.warning;
                  }
               }

               // Color code Severity column
               if (data.column.index === 5) {
                  const severity = log.severity?.toLowerCase();
                  if (severity === 'critical') {
                     data.cell.styles.textColor = colors.danger;
                     data.cell.styles.fillColor = [254, 242, 242]; // red-50
                  } else if (severity === 'high') {
                     data.cell.styles.textColor = colors.warning;
                     data.cell.styles.fillColor = [254, 252, 232]; // amber-50
                  } else if (severity === 'medium') {
                     data.cell.styles.textColor = [59, 130, 246];
                     data.cell.styles.fillColor = [239, 246, 255]; // blue-50
                  } else if (severity === 'low') {
                     data.cell.styles.textColor = colors.success;
                     data.cell.styles.fillColor = [240, 253, 244]; // green-50
                  }
               }
            }
         },
         margin: { left: 14, right: 14 }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
         doc.setPage(i);
         doc.setFontSize(8);
         doc.setTextColor(...(colors.gray as [number, number, number]));
         doc.text(
            `Page ${i} of ${pageCount} | Red Teaming Report | Confidential`,
            105,
            287,
            { align: 'center' }
         );
      }

      // Save PDF with readable filename
      doc.save(generateFilename('pdf'));
   };

   return (
      <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
            <div>
               <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">Red Teaming Console</h1>
               <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">Kiểm thử bảo mật tự động & Phát hiện lỗ hổng (Adversarial Testing)</p>
            </div>

            <div className="flex items-center gap-4">
               <Link href="/red-teaming/history">
                  <Button variant="outline" size="sm" className="gap-2 border-slate-300">
                     <History className="h-4 w-4" /> Lịch sử
                  </Button>
               </Link>


               <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 w-full md:w-auto">
                  <span className="text-xs md:text-sm font-medium text-slate-600 pl-2 shrink-0">Target:</span>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                     <SelectTrigger className="w-full md:w-[240px] bg-white border-slate-200 shadow-sm text-xs md:text-sm h-8 md:h-9">
                        <SelectValue placeholder="Chọn Agent cần test" />
                     </SelectTrigger>
                     <SelectContent>
                        {agents.map(agent => (
                           <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
            </div>
         </div>

         {/* Hướng dẫn Red Teaming */}
         {/* Hướng dẫn Red Teaming */}
         <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden transition-all">
            <div
               className="p-4 flex items-center justify-between cursor-pointer hover:bg-red-100/50"
               onClick={() => setShowGuide(!showGuide)}
            >
               <h3 className="font-semibold text-red-900 flex items-center gap-2">
                  ℹ️ Red Teaming là gì?
               </h3>
               <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-700 hover:text-red-900 hover:bg-red-200/50">
                  {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
            </div>

            {showGuide && (
               <div className="px-4 pb-4">
                  <p className="text-sm text-red-800 mb-2">
                     Đây là quá trình giả lập các cuộc tấn công vào AI Model để tìm lỗ hổng bảo mật học máy (Adversarial Attacks).
                  </p>
                  <ul className="list-disc ml-5 text-sm text-red-800 space-y-1">
                     <li><strong>Jailbreak (DAN/AutoDAN):</strong> Cố gắng lừa Model vượt qua các rào cản đạo đức để trả lời câu hỏi cấm.</li>
                     <li><strong>Prompt Injection:</strong> Tiêm mã lệnh ẩn vào câu hỏi để chiếm quyền điều khiển Model.</li>
                     <li><strong>PII Leakage:</strong> Thử thách khả năng bảo mật thông tin cá nhân (Email, SĐT) của Model.</li>
                  </ul>
               </div>
            )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto md:overflow-hidden p-1">
            {/* Column 1: Config */}
            <div className="col-span-1 md:col-span-3 h-fit">
               <Card className="h-full flex flex-col border shadow-sm sticky top-0">
                  <CardHeader className="bg-slate-50 border-b py-4">
                     <CardTitle className="text-lg font-semibold text-slate-800">Cấu Hình</CardTitle>
                     <CardDescription>Thiết lập tấn công</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-4">
                     <div className="space-y-2">
                        <Label className="text-slate-700">Chiến thuật (Strategy)</Label>
                        <Select value={strategy} onValueChange={setStrategy}>
                           <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Chọn chiến thuật" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="jailbreak">Jailbreak (DAN/AutoDAN)</SelectItem>
                              <SelectItem value="prompt-injection">Prompt Injection</SelectItem>
                              <SelectItem value="pii-leakage">Trích xuất PII (Dữ liệu cá nhân)</SelectItem>
                              <SelectItem value="toxicity">Kích động độc hại (Toxicity)</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-2">
                        <Label className="text-slate-700">Ngôn ngữ (Language)</Label>
                        <Select value={language} onValueChange={setLanguage}>
                           <SelectTrigger className="bg-white">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="vi">Tiếng Việt</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-4">
                        <div className="flex justify-between">
                           <Label className="text-slate-700">Cường độ (Số lượng Probe)</Label>
                           <span className="text-sm font-medium text-[#D13138]">{intensity}% ({Math.max(1, Math.floor(intensity / 10))} probes)</span>
                        </div>
                        <Slider
                           value={[intensity]}
                           onValueChange={(val) => setIntensity(val[0])}
                           max={100}
                           step={1}
                           className="[&>.range]:bg-[#D13138]"
                        />
                     </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 border-t p-4">
                     <Button
                        className="w-full bg-[#D13138] hover:bg-[#b71c1c] gap-2 h-12 text-lg shadow-sm transition-all hover:scale-[1.02]"
                        onClick={handleStartAttack}
                        disabled={attacking}
                     >
                        {attacking ? "Đang Tấn Công..." : <><Play className="h-5 w-5" /> Bắt Đầu Tấn Công</>}
                     </Button>
                  </CardFooter>
               </Card>
            </div>

            {/* Column 2: Logs */}
            <div className="col-span-1 md:col-span-6 h-[400px] md:h-full">
               <Card className="h-full flex flex-col bg-slate-950 border-slate-800 text-slate-50 shadow-md">
                  <CardHeader className="py-3 border-b border-slate-800 bg-slate-900/50">
                     <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-slate-400" />
                        <span className="font-mono text-sm font-medium">attack-log-stream</span>
                        <span className="ml-auto flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                           <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                           </span>
                           Đang chạy
                        </span>
                     </div>
                  </CardHeader>
                  <ScrollArea className="flex-1 p-4 font-mono text-sm max-h-[600px] overflow-y-auto">
                     <div className="space-y-3">
                        <div className="text-slate-500 italic">
                           {`> Đang khởi tạo probes (0/100)...`}
                        </div>
                        {loading ? <div className="text-slate-500">Đang tải logs...</div> : (Array.isArray(logs) ? logs : []).map((log: any) => (
                           <div key={log.id} className="flex flex-col gap-2 group hover:bg-slate-900/50 p-2 rounded border-b border-slate-800/50">
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                 <div className="flex items-start gap-2 mb-2">
                                    <div className="shrink-0 w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">P</div>
                                    <div className="text-sm text-slate-700 italic">"{log.probe}"</div>
                                 </div>
                                 <div className="flex items-start gap-2 mb-3">
                                    <div className="shrink-0 w-6 h-6 rounded bg-[#D13138] flex items-center justify-center text-[10px] font-bold text-white">R</div>
                                    <div className="text-sm md:text-base font-semibold text-slate-900 leading-relaxed bg-white p-2 rounded border border-slate-100 shadow-sm w-full">
                                       {log.response || <span className="text-slate-400 font-normal italic">Đang chờ phản hồi...</span>}
                                    </div>
                                 </div>

                                 {log.analysis && (
                                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-start gap-2">
                                       <div className="shrink-0 w-4 h-4 mt-0.5 rounded-full bg-amber-100 flex items-center justify-center">
                                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                       </div>
                                       <div className="text-[11px] md:text-xs text-slate-600">
                                          <span className="font-bold text-slate-700">Phân tích:</span> {log.analysis}
                                       </div>
                                    </div>
                                 )}

                                 <div className={cn(
                                    "mt-2 pl-6 font-bold flex items-center gap-2 text-xs",
                                    log.type === 'blocked' || log.result === 'Blocked' ? "text-green-600" : log.type === 'success' || log.result === 'SUCCESS' ? "text-red-600" : "text-amber-600"
                                 )}>
                                    <span>↳ STATUS:</span> {log.result} • {log.severity?.toUpperCase()}
                                 </div>
                              </div>
                           </div>
                        ))}
                        <div className="animate-pulse text-slate-500">_</div>
                     </div>
                  </ScrollArea>
               </Card>
            </div>

            {/* Column 3: Report */}
            <div className="col-span-1 md:col-span-3 h-fit md:h-full">
               <Card className="h-full flex flex-col border shadow-sm">
                  <CardHeader className="bg-slate-50 border-b py-4">
                     <CardTitle className="text-lg font-semibold text-slate-800">Báo Cáo Trực Tiếp</CardTitle>
                     <CardDescription>Phân tích lỗ hổng</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1 p-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                           <div className="text-3xl font-bold text-[#D13138]">{report?.critical ?? '-'}</div>
                           <div className="text-xs text-red-800 font-medium uppercase mt-1">Lỗi Nghiêm Trọng</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-center">
                           <div className="text-3xl font-bold text-orange-600">{report?.successRate ?? '-'}%</div>
                           <div className="text-xs text-orange-800 font-medium uppercase mt-1">Tỷ Lệ Thành Công</div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-slate-900 uppercase tracking-wider">Chi Tiết Theo Mức Độ</h4>
                        <div className="space-y-3">
                           {[
                              { label: 'Nghiêm trọng (Critical)', value: report?.critical ?? report?.critical_count ?? 0, color: 'bg-red-600', desc: 'AI hoàn toàn bị kiểm soát, rò rỉ dữ liệu nhạy cảm hoặc vi phạm nghiêm trọng.' },
                              { label: 'Cao (High)', value: report?.high ?? report?.high_count ?? 0, color: 'bg-orange-500', desc: 'AI trả lời các nội dung độc hại hoặc có định kiến rõ rệt.' },
                              { label: 'Trung bình (Medium)', value: report?.medium ?? report?.medium_count ?? 0, color: 'bg-yellow-500', desc: 'AI bộc lộ một số sai lệch nhẹ hoặc nội dung không phù hợp.' },
                              { label: 'Thấp (Low)', value: report?.low ?? report?.low_count ?? 0, color: 'bg-blue-400', desc: 'Hệ thống an toàn, AI từ chối các yêu cầu vi phạm.' },
                           ].map((item) => (
                              <div key={item.label} className="space-y-1 group relative">
                                 <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 cursor-help border-b border-dotted border-slate-300">{item.label}</span>
                                    <span className="font-medium text-slate-900">{item.value}</span>
                                 </div>
                                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                       className={cn("h-full rounded-full transition-all duration-500", item.color)}
                                       style={{ width: `${Math.min(100, (item.value as number) * 20)}%` }}
                                    ></div>
                                 </div>
                                 <div className="hidden group-hover:block absolute left-0 top-6 z-10 w-full bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg">
                                    {item.desc}
                                 </div>
                              </div>
                           ))}
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                           <div className="flex justify-between text-xs text-slate-500">
                              <span>Tổng số Probe:</span>
                              <span className="font-medium">{report?.total_probes ?? 0}</span>
                           </div>
                           <div className="flex justify-between text-xs text-slate-500">
                              <span>Tấn công bị chặn:</span>
                              <span className="font-medium text-green-600">{report?.blocked_attacks ?? 0}</span>
                           </div>
                        </div>
                     </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 border-t p-3 flex gap-2 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                     <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5 border-slate-300 text-slate-700 hover:bg-white hover:text-[#D13138] hover:border-[#D13138] text-xs"
                        onClick={handleExportCSV}
                     >
                        <FileDown className="h-3.5 w-3.5" /> CSV
                     </Button>
                     <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-1.5 text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200 text-xs"
                        onClick={handleExportPDF}
                     >
                        <Shield className="h-3.5 w-3.5" /> PDF
                     </Button>
                  </CardFooter>
               </Card>
            </div>
         </div>
      </div>
   );
}
