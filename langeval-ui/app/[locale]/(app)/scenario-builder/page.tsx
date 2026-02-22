"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, FileText, Clock, MoreHorizontal, Play, Edit, Trash2, Bot, ChevronDown, ChevronUp, BookOpen, BarChart3, Layers, MessageSquare, GitFork, Database, Workflow, PlayCircle, StopCircle, Zap, UserCircle, Type, Target, HelpCircle, Hammer, Code, Braces, Cpu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAgents } from "@/lib/use-agents";
import { cn } from "@/lib/utils";

import { MOCK_SCENARIOS } from "@/lib/mock-data";
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient(url);

export default function ScenarioListPage() {
   const t = useTranslations('ScenarioBuilder');
   const commonT = useTranslations('Common');

   const [selectedAgent, setSelectedAgent] = useState<string>("all");
   const [searchQuery, setSearchQuery] = useState("");
   const [showGuide, setShowGuide] = useState(true);
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [isCreating, setIsCreating] = useState(false);

   // New Scenario Form State
   const [newScenarioName, setNewScenarioName] = useState("");
   const [newScenarioAgent, setNewScenarioAgent] = useState("");
   const [newScenarioDesc, setNewScenarioDesc] = useState("");
   const [newScenarioDiff, setNewScenarioDiff] = useState("Medium");
   const [newScenarioModel, setNewScenarioModel] = useState(""); // Model ID
   const [newScenarioLanguage, setNewScenarioLanguage] = useState("en");

   // Edit Scenario State
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isEditing, setIsEditing] = useState(false);
   const [editingScenarioId, setEditingScenarioId] = useState("");
   const [editScenarioName, setEditScenarioName] = useState("");
   const [editScenarioAgent, setEditScenarioAgent] = useState("");
   const [editScenarioDesc, setEditScenarioDesc] = useState("");
   const [editScenarioDiff, setEditScenarioDiff] = useState("Medium");
   const [editScenarioModel, setEditScenarioModel] = useState(""); // Model ID
   const [editScenarioLanguage, setEditScenarioLanguage] = useState("en");

   // Delete Scenario State
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [itemToDelete, setItemToDelete] = useState<string | null>(null);

   // Models State
   const [models, setModels] = useState<any[]>([]);

   const { agents } = useAgents();
   const router = useRouter();

   // Fetch models
   useEffect(() => {
      apiClient('/resource/models?page_size=100')
         .then(data => {
            const items = Array.isArray(data) ? data : (data.items || []);
            setModels(items);
         })
         .catch(err => console.error("Failed to load models", err));
   }, []);

   // Fetch scenarios from API
   const { data: apiResponse, error, isLoading, mutate } = useSWR(
      `/resource/scenarios?agent_id=${selectedAgent}&search=${searchQuery}&page_size=100`,
      fetcher
   );

   const rawList = apiResponse?.items || apiResponse?.data || apiResponse;
   const rawScenarios = (Array.isArray(rawList) && rawList.length > 0)
      ? rawList
      : MOCK_SCENARIOS;

   const scenarios = rawScenarios.map((s: any) => {
      const nodeCount = typeof s.nodes === 'number' ? s.nodes : (Array.isArray(s.nodes) ? s.nodes.length : 0);
      const autoStatus = nodeCount > 0 ? 'Ready' : 'Draft';

      return {
         ...s,
         status: s.status || autoStatus,
         difficulty: s.difficulty || s.meta_data?.difficulty || 'Medium',
         tags: s.tags || [],
         agentId: s.agentId || s.agent_id || 'unknown',
         nodeCount: nodeCount,
         modelId: s.meta_data?.model_id || null,
         language: s.language || s.meta_data?.language || 'en'
      };
   });

   const getModelName = (modelId: string | null) => {
      if (!modelId) return null;
      const model = models.find(m => m.id === modelId);
      return model ? `${model.name}` : null;
   };

   const handleCreateScenario = async () => {
      if (!newScenarioName || !newScenarioAgent) return;

      setIsCreating(true);
      try {
         const payload = {
            name: newScenarioName,
            agent_id: newScenarioAgent,
            description: newScenarioDesc,
            nodes: [],
            edges: [],
            meta_data: {
               model_id: newScenarioModel,
               difficulty: newScenarioDiff,
               language: newScenarioLanguage
            }
         };

         const newScenario = await apiClient('/resource/scenarios', {
            method: 'POST',
            body: JSON.stringify(payload)
         });

         setIsCreateOpen(false);
         setNewScenarioName("");
         setNewScenarioAgent("");
         setNewScenarioDesc("");
         setNewScenarioModel("");
         mutate();
         router.push(`/scenario-builder/${newScenario.id}`);
      } catch (e) {
         console.error("Failed to create scenario", e);
         toast.error(t('toast.createError'));
      } finally {
         setIsCreating(false);
      }
   };

   const confirmDelete = async () => {
      if (!itemToDelete) return;
      try {
         await apiClient(`/resource/scenarios/${itemToDelete}`, { method: 'DELETE' });
         mutate();
      } catch (e) {
         console.error("Failed to delete", e);
      } finally {
         setIsDeleteOpen(false);
         setItemToDelete(null);
      }
   };

   const handleDeleteClick = (id: string) => {
      setItemToDelete(id);
      setIsDeleteOpen(true);
   };

   const handleEditClick = (scenario: any) => {
      setEditingScenarioId(scenario.id);
      setEditScenarioName(scenario.name);
      setEditScenarioAgent(scenario.agentId);
      setEditScenarioDesc(scenario.description || "");
      setEditScenarioDiff(scenario.difficulty || scenario.meta_data?.difficulty || "Medium");
      setEditScenarioModel(scenario.meta_data?.model_id || "");
      setEditScenarioLanguage(scenario.meta_data?.language || "en");
      setIsEditOpen(true);
   };

   const handleUpdateScenario = async () => {
      setIsEditing(true);
      try {
         await apiClient(`/resource/scenarios/${editingScenarioId}`, {
            method: 'PUT',
            body: JSON.stringify({
               name: editScenarioName,
               agent_id: editScenarioAgent,
               description: editScenarioDesc,
               meta_data: {
                  model_id: editScenarioModel,
                  difficulty: editScenarioDiff,
                  language: editScenarioLanguage
               }
            })
         });

         mutate();
         setIsEditOpen(false);
      } catch (e) {
         console.error("Update failed", e);
         toast.error(t('toast.updateError'));
      } finally {
         setIsEditing(false);
      }
   };

   const handleRunEvaluation = async (scenario: any) => {
      try {
         toast.info(t('toast.startingEvaluation', { name: scenario.name }));
         const data = await apiClient(`/orchestrator/campaigns`, {
            method: 'POST',
            body: JSON.stringify({
               scenario_id: scenario.id,
               scenario_name: scenario.name,
               agent_id: scenario.agentId,
               metadata: {
                  scenario_name: scenario.name,
                  agent_id: scenario.agentId,
                  model_id: scenario.meta_data?.model_id || scenario.metadata?.model_id,
                  global_metrics: ["faithfulness", "answer_relevancy"],
                  created_by: {
                     name: "Admin User",
                     avatar: "https://github.com/shadcn.png"
                  }
               }
            })
         });

         toast.success(t('toast.evaluationStarted', { id: data.campaign_id }));
      } catch (e) {
         console.error("Run failed", e);
         toast.error(t('toast.evaluationError') + (e as Error).message);
      }
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'Ready': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
         case 'Draft': return 'bg-amber-100 text-amber-700 border-amber-300';
         case 'Archived': return 'bg-slate-100 text-slate-600 border-slate-200';
         default: return 'bg-slate-100 text-slate-700';
      }
   };

   return (
      <div className="space-y-6">
         {/* Header & Controls */}
         <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
               <div>
                  <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                  <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">{t('subtitle')}</p>
               </div>
               <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                     <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                     <Input
                        placeholder={t('searchPlaceholder')}
                        className="pl-9 bg-white text-xs md:text-sm h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                     />
                  </div>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                     <SelectTrigger className="w-full md:w-[180px] bg-white text-xs md:text-sm h-9">
                        <SelectValue placeholder={t('filterAgent')} />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">{t('allAgents')}</SelectItem>
                        {agents.map(agent => (
                           <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>

                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                     <DialogTrigger asChild>
                        <Button className="w-full md:w-auto gap-2 bg-[#D13138] hover:bg-[#b71c1c] shadow-sm text-xs md:text-sm h-9">
                           <Plus className="h-3.5 w-3.5" /> {t('createNew')}
                        </Button>
                     </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                           <DialogTitle>{t('dialog.createTitle')}</DialogTitle>
                           <DialogDescription>{t('dialog.createDesc')}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                           <div className="space-y-2">
                              <Label>{t('dialog.name')}</Label>
                              <Input value={newScenarioName} onChange={e => setNewScenarioName(e.target.value)} placeholder={t('dialog.namePlaceholder')} />
                           </div>
                           <div className="space-y-2">
                              <Label>{t('dialog.agent')}</Label>
                              <Select value={newScenarioAgent} onValueChange={setNewScenarioAgent}>
                                 <SelectTrigger>
                                    <SelectValue placeholder={t('dialog.agentPlaceholder')} />
                                 </SelectTrigger>
                                 <SelectContent>
                                    {agents.map(agent => (
                                       <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label>{t('dialog.model')}</Label>
                              <Select
                                 value={newScenarioModel || "default_model"}
                                 onValueChange={(val) => {
                                    const selected = val === "default_model" ? "" : val;
                                    setNewScenarioModel(selected);
                                 }}
                              >
                                 <SelectTrigger>
                                    <SelectValue placeholder={t('dialog.modelPlaceholder')} />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="default_model">{t('dialog.modelPlaceholder')}</SelectItem>
                                    {models.map(m => (
                                       <SelectItem key={m.id} value={String(m.id)}>{m.name} ({m.provider})</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                              <p className="text-[10px] text-slate-500">{t('dialog.modelDesc')}</p>
                           </div>
                           <div className="space-y-2">
                              <Label>{t('dialog.difficulty')}</Label>
                              <Select value={newScenarioDiff} onValueChange={setNewScenarioDiff}>
                                 <SelectTrigger>
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="Easy">Easy</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Hard">Hard</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label>{t('dialog.language')}</Label>
                              <Select value={newScenarioLanguage} onValueChange={setNewScenarioLanguage}>
                                 <SelectTrigger>
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label>{t('dialog.description')}</Label>
                              <Textarea value={newScenarioDesc} onChange={e => setNewScenarioDesc(e.target.value)} placeholder={t('dialog.descriptionPlaceholder')} />
                           </div>
                        </div>
                        <DialogFooter>
                           <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{commonT('cancel')}</Button>
                           <Button onClick={handleCreateScenario} disabled={isCreating || !newScenarioName || !newScenarioAgent}>
                              {isCreating ? t('dialog.creating') : t('dialog.create')}
                           </Button>
                        </DialogFooter>
                     </DialogContent>
                  </Dialog>

                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                     <DialogContent>
                        <DialogHeader>
                           <DialogTitle>{t('dialog.editTitle')}</DialogTitle>
                           <DialogDescription>{t('dialog.editDesc')}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                           <div className="space-y-2">
                              <Label>{t('dialog.name')}</Label>
                              <Input value={editScenarioName} onChange={e => setEditScenarioName(e.target.value)} />
                           </div>
                           <div className="space-y-2">
                              <Label>{t('dialog.agent')}</Label>
                              <Select value={editScenarioAgent} onValueChange={setEditScenarioAgent}>
                                 <SelectTrigger>
                                    <SelectValue placeholder={t('dialog.agentPlaceholder')} />
                                 </SelectTrigger>
                                 <SelectContent>
                                    {agents.map(agent => (
                                       <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label>{t('dialog.difficulty')}</Label>
                              <Select value={editScenarioDiff} onValueChange={setEditScenarioDiff}>
                                 <SelectTrigger>
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="Easy">Easy</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Hard">Hard</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label>{t('dialog.model')}</Label>
                              <Select value={editScenarioModel || "default_model"} onValueChange={(val) => setEditScenarioModel(val === "default_model" ? "" : val)}>
                                 <SelectTrigger>
                                    <SelectValue placeholder={t('dialog.modelPlaceholder')} />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="default_model">{t('dialog.modelPlaceholder')}</SelectItem>
                                    {models.map(m => (
                                       <SelectItem key={m.id} value={m.id}>{m.name} ({m.provider})</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label>{t('dialog.language')}</Label>
                              <Select value={editScenarioLanguage} onValueChange={setEditScenarioLanguage}>
                                 <SelectTrigger>
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label>{t('dialog.description')}</Label>
                              <Textarea value={editScenarioDesc} onChange={e => setEditScenarioDesc(e.target.value)} />
                           </div>
                        </div>
                        <DialogFooter>
                           <Button variant="outline" onClick={() => setIsEditOpen(false)}>{commonT('cancel')}</Button>
                           <Button onClick={handleUpdateScenario} disabled={isEditing || !editScenarioName}>
                              {isEditing ? t('dialog.saving') : t('dialog.save')}
                           </Button>
                        </DialogFooter>
                     </DialogContent>
                  </Dialog>

                  <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                           <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
                           <AlertDialogDescription>{t('deleteDialog.desc')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                           <AlertDialogCancel>{commonT('cancel')}</AlertDialogCancel>
                           <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">{t('deleteDialog.delete')}</AlertDialogAction>
                        </AlertDialogFooter>
                     </AlertDialogContent>
                  </AlertDialog>
               </div>
            </div>

            {/* Guide Section */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
               <div
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setShowGuide(!showGuide)}
               >
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                     <BookOpen className="h-4 w-4 text-blue-500" />
                     {t('guide.title')}
                  </div>
                  {showGuide ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
               </div>

               {showGuide && (
                  <div className="px-6 pb-6 border-t border-slate-100 bg-slate-50/30">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                        <div className="space-y-3">
                           <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-200 pb-2">
                              <Layers className="h-3 w-3" /> {t('guide.flowControl')}
                           </h4>
                           <div className="space-y-2">
                              <div className="flex gap-2 items-start">
                                 <PlayCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{t('guide.startNode')}</p>
                                    <p className="text-[10px] text-slate-500">{t('guide.startNodeDesc')}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2 items-start">
                                 <StopCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{t('guide.endNode')}</p>
                                    <p className="text-[10px] text-slate-500">{t('guide.endNodeDesc')}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2 items-start">
                                 <Zap className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{t('guide.triggerNode')}</p>
                                    <p className="text-[10px] text-slate-500">{t('guide.triggerNodeDesc')}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-200 pb-2">
                              <UserCircle className="h-3 w-3" /> {t('guide.interaction')}
                           </h4>
                           <div className="space-y-2">
                              <div className="flex gap-2 items-start">
                                 <UserCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{t('guide.personaNode')}</p>
                                    <p className="text-[10px] text-slate-500">{t('guide.personaNodeDesc')}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2 items-start">
                                 <MessageSquare className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{t('guide.taskNode')}</p>
                                    <p className="text-[10px] text-slate-500">{t('guide.taskNodeDesc')}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2 items-start">
                                 <GitFork className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{t('guide.conditionNode')}</p>
                                    <p className="text-[10px] text-slate-500">{t('guide.conditionNodeDesc')}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-200 pb-2">
                              <Target className="h-3 w-3" /> {t('guide.assertions')}
                           </h4>
                           <div className="space-y-2">
                              <div className="flex gap-2 items-start">
                                 <Target className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{t('guide.expectationNode')}</p>
                                    <p className="text-[10px] text-slate-500">{t('guide.expectationNodeDesc')}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2 items-start">
                                 <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{t('guide.waitNode')}</p>
                                    <p className="text-[10px] text-slate-500">{t('guide.waitNodeDesc')}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-200 pb-2">
                              <Hammer className="h-3 w-3" /> {t('guide.tools')}
                           </h4>
                           <div className="space-y-2">
                              <div className="flex gap-2 items-start">
                                 <Hammer className="h-4 w-4 text-cyan-600 mt-0.5 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{t('guide.toolCallNode')}</p>
                                    <p className="text-[10px] text-slate-500">{t('guide.toolCallNodeDesc')}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2 items-start">
                                 <Code className="h-4 w-4 text-gray-700 mt-0.5 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{t('guide.codeExec')}</p>
                                    <p className="text-[10px] text-slate-500">{t('guide.codeExecDesc')}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2 items-start">
                                 <Workflow className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
                                 <div>
                                    <p className="text-xs font-bold text-slate-800">{t('guide.transformNode')}</p>
                                    <p className="text-[10px] text-slate-500">{t('guide.transformNodeDesc')}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                     </div>

                     {/* Tips Footer */}
                     <div className="mt-6 bg-blue-50/50 p-3 rounded border border-blue-100 flex items-start gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 mt-0.5">
                           <Workflow className="h-4 w-4" />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-blue-900">{t('guide.tipsTitle')}</p>
                           <div className="text-[11px] text-blue-800 mt-1 space-y-1.5">
                              <p dangerouslySetInnerHTML={{ __html: t('guide.tip1') }}></p>
                              <p dangerouslySetInnerHTML={{ __html: t('guide.tip2') }}></p>
                              <p dangerouslySetInnerHTML={{ __html: t('guide.tip3') }}></p>
                              <p dangerouslySetInnerHTML={{ __html: t('guide.tip4') }}></p>
                              <p dangerouslySetInnerHTML={{ __html: t('guide.tip5') }}></p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* Scenario Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
               <p className="text-slate-500 col-span-full">{t('loading')}</p>
            ) : scenarios.map((scenario: any) => (
               <Card key={scenario.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden flex flex-col aspect-[4/5] md:aspect-auto">
                  <div className={cn("h-1.5 w-full",
                     scenario.status === 'Ready' ? 'bg-emerald-500' :
                        scenario.status === 'Draft' ? 'bg-amber-500' : 'bg-slate-300'
                  )} />
                  <CardHeader className="pb-3 pt-4">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                           <Badge variant="outline" className={cn("text-[10px] font-medium border px-2 py-0.5 rounded-full", getStatusColor(scenario.status))}>
                              {scenario.status === 'Ready' ? t('status.ready') : scenario.status === 'Draft' ? t('status.draft') : t('status.archived')}
                           </Badge>
                           <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1" title={scenario.name}>
                              <Link href={`/scenario-builder/${scenario.id}`}>{scenario.name}</Link>
                           </CardTitle>
                           <CardDescription className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                              <Bot className="h-3.5 w-3.5" /> {agents.find(a => a.id === scenario.agentId)?.name || scenario.agentName || 'Unknown Agent'}
                           </CardDescription>
                           {scenario.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                 {scenario.description}
                              </p>
                           )}
                        </div>
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-700">
                                 <MoreHorizontal className="h-4 w-4" />
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                 className="bg-emerald-50 text-emerald-700 focus:bg-emerald-100 focus:text-emerald-800 mb-1"
                                 onClick={() => handleRunEvaluation(scenario)}>
                                 <Play className="h-4 w-4 mr-2" />{t('actions.evaluation')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                 className="text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50"
                                 onClick={() => handleEditClick(scenario)}>
                                 <Edit className="h-4 w-4 mr-2" /> {t('actions.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => handleDeleteClick(scenario.id)}>
                                 <Trash2 className="h-4 w-4 mr-2" /> {t('actions.delete')}
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                  </CardHeader>

                  <CardContent className="pb-3 flex-1">
                     <div className="flex flex-wrap gap-2 mb-4">
                        {(() => {
                           let tags: string[] = [];
                           try {
                              if (Array.isArray(scenario.tags)) tags = scenario.tags;
                              else if (typeof scenario.tags === 'string' && scenario.tags.trim().startsWith('[')) tags = JSON.parse(scenario.tags);
                           } catch (e) {
                              // Ignore parse errors
                           }
                           return tags.map((tag: string) => (
                              <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 font-medium">
                                 #{tag}
                              </span>
                           ));
                        })()}
                     </div>
                     <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex flex-col gap-1">
                           <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">{t('card.nodes')}</span>
                           <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <FileText className="h-3.5 w-3.5 text-blue-500" /> {scenario.nodeCount || 0}
                           </div>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">{t('card.language')}</span>
                           <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <Type className="h-3.5 w-3.5 text-blue-500" /> {scenario.language === 'en' ? 'English' : 'Tiếng Việt'}
                           </div>
                        </div>
                        <div className="flex flex-col gap-1 col-span-1">
                           <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">{t('card.model')}</span>
                           <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px]">
                              <Cpu className="h-3.5 w-3.5 text-purple-500" />
                              <span className="truncate" title={getModelName(scenario.modelId) || t('card.defaultModel')}>
                                 {getModelName(scenario.modelId) || t('card.defaultModel')}
                              </span>
                           </div>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">{t('card.difficulty')}</span>
                           <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <BarChart3 className="h-3.5 w-3.5 text-orange-500" /> {scenario.difficulty}
                           </div>
                        </div>
                     </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t bg-slate-50/30 flex justify-between items-center text-xs text-slate-400 mt-auto">
                     <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(scenario.updatedAt || Date.now()).toLocaleDateString()}
                     </div>
                     <Button size="sm" variant="ghost" className="h-7 text-xs hover:text-blue-600 hover:bg-blue-50 px-2 font-medium" asChild>
                        <Link href={`/scenario-builder/${scenario.id}`}>{t('card.openEditor')}</Link>
                     </Button>
                  </CardFooter>
               </Card>
            ))}

            {/* New Scenario Card (Empty State) - Trigger Dialog */}
            <div onClick={() => setIsCreateOpen(true)} className="block h-full min-h-[280px] cursor-pointer">
               <Card className="h-full border-dashed border-2 border-slate-200 bg-slate-50/30 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center justify-center group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/0 group-hover:to-blue-50/50 transition-all" />
                  <div className="h-14 w-14 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm group-hover:border-blue-200 group-hover:scale-110 transition-all z-10">
                     <Plus className="h-7 w-7 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <span className="font-semibold text-slate-500 group-hover:text-blue-600 z-10">{t('emptyCreate')}</span>
                  <p className="text-xs text-slate-400 mt-1 z-10">{t('emptySub')}</p>
               </Card>
            </div>
         </div>
      </div>
   );
}
