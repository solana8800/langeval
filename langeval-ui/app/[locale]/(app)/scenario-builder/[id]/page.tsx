"use client";

import { useEffect, useState, useRef } from 'react';
import {
   User,
   MessageSquare,
   GitBranch,
   Settings,
   Terminal,
   ShieldAlert,
   Clock,
   Zap,
   Flag,
   Code2,
   Workflow,
   ChevronLeft,
   PanelLeftOpen,
   PlayCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScenarioBuilder } from '@/components/scenario-builder/builder';
import { cn } from "@/lib/utils";

const nodeCategories = [
   {
      title: "Cơ Bản",
      items: [
         { type: 'start', label: 'Start', icon: PlayCircle, desc: 'Bắt đầu kịch bản', bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
         { type: 'persona', label: 'Persona', icon: User, desc: 'Người dùng giả lập', bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
         { type: 'task', label: 'Task', icon: MessageSquare, desc: 'Nhiệm vụ cụ thể', bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
      ]
   },
   {
      title: "Luồng & Logic",
      items: [
         { type: 'condition', label: 'Condition', icon: GitBranch, desc: 'Rẽ nhánh điều kiện', bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
         { type: 'wait', label: 'Wait', icon: Clock, desc: 'Chờ đợi', bg: "bg-stone-50", border: "border-stone-200", text: "text-stone-600" },
         { type: 'expectation', label: 'Expectation', icon: ShieldAlert, desc: 'Kiểm tra kết quả', bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
      ]
   },
   {
      title: "Nâng Cao",
      items: [
         { type: 'trigger', label: 'Trigger', icon: Zap, desc: 'Kích hoạt workflow', bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
         { type: 'end', label: 'End', icon: Flag, desc: 'Kết thúc & Trả về', bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-900" },
         { type: 'code', label: 'Code Exec', icon: Code2, desc: 'Chạy mã Python/JS', bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
         { type: 'transform', label: 'Transform', icon: Workflow, desc: 'Chuyển đổi dữ liệu', bg: "bg-fuchsia-50", border: "border-fuchsia-200", text: "text-fuchsia-700" },
         { type: 'tool', label: 'Tool Call', icon: Terminal, desc: 'Gọi API bên ngoài', bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700" },
      ]
   }
];
import { useParams } from 'next/navigation';

export default function ScenarioBuilderPage() {
   const params = useParams();
   const scenarioId = params.id as string;
   const [isSidebarOpen, setSidebarOpen] = useState(true);

   // Mock loading scenario name based on ID
   const scenarioName = scenarioId === 'new' ? 'Kịch Bản Mới' : `Kịch Bản #${scenarioId}`;

   const onDragStart = (event: React.DragEvent, nodeType: string) => {
      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.effectAllowed = 'move';
   };

   return (
      <div className="flex h-screen bg-slate-50 overflow-hidden relative">
         {/* Sidebar - Node Library */}
         <div
            className={cn(
               "bg-white border-r border-slate-200 flex flex-col shadow-sm z-20 transition-all duration-300 ease-in-out overflow-hidden relative",
               isSidebarOpen ? "w-80 translate-x-0 opacity-100" : "w-0 -translate-x-full opacity-0 border-none"
            )}
         >
            <div className="w-80 flex flex-col h-full">
               <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                     <h2 className="font-semibold text-lg text-slate-800">Thư Viện Node</h2>
                     <p className="text-xs text-slate-500 mt-1">Kéo thả node vào màn hình</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8 text-slate-400 hover:text-slate-700">
                     <ChevronLeft className="h-4 w-4" />
                  </Button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {nodeCategories.map((category, idx) => (
                     <div key={idx} className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{category.title}</h3>
                        <div className="grid gap-3">
                           {category.items.map((item) => (
                              <div
                                 key={item.type}
                                 onDragStart={(event) => onDragStart(event, item.type)}
                                 draggable
                                 className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border shadow-sm transition-all cursor-move group hover:shadow-md hover:scale-[1.02]",
                                    item.bg,
                                    item.border
                                 )}
                              >
                                 <div className={cn("p-2 rounded-md bg-white/80 shadow-sm", item.text)}>
                                    <item.icon className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <div className={cn("font-medium text-sm", item.text)}>{item.label}</div>
                                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>

               <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <div className="text-xs text-center text-slate-400">
                     Evaluation Scenario Builder v2.0
                  </div>
               </div>
            </div>
         </div>

         {!isSidebarOpen && (
            <div className="hidden">
               {/* Moved to builder.tsx toolbar */}
            </div>
         )}

         {/* Main Canvas Area */}
         <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <ScenarioBuilder
               scenarioId={scenarioId}
               isSidebarOpen={isSidebarOpen}
               setSidebarOpen={setSidebarOpen}
            />
         </div>
      </div>
   );
}
