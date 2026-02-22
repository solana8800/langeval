"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Webhook, Copy, Check, GitBranch, Terminal, ExternalLink, Settings, Plug, Trash2, Edit, Database } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ... imports ...

interface Agent {
   id: string;
   name: string;
   description?: string;
   type: string;
   status: string;
   endpoint_url: string;
   api_key?: string;
   repo_url?: string;
   langfuse_project_id?: string;
   langfuse_project_name?: string;
   langfuse_org_id?: string;
   langfuse_org_name?: string;
   langfuse_public_key?: string;
   langfuse_secret_key?: string;
   langfuse_host?: string;
   api_key_encrypted?: string;
   meta_data?: {
      model?: string;
      [key: string]: any;
   };
}

export default function AgentsPage() {
   const [agents, setAgents] = useState<Agent[]>([]);
   const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
   const [isCopied, setIsCopied] = useState(false);
   const [loading, setLoading] = useState(true);
   const t = useTranslations("Agents");
   const commonT = useTranslations("Common");

   // New Agent State
   const [newAgentOpen, setNewAgentOpen] = useState(false);
   const [newAgentData, setNewAgentData] = useState({
      name: "",
      description: "",
      type: "RAG Chatbot",
      endpoint_url: "",
      api_key: "",
      repo_url: "",
      langfuse_project_id: "",
      langfuse_project_name: "",
      langfuse_org_id: "",
      langfuse_org_name: "",
      langfuse_public_key: "",
      langfuse_secret_key: "",
      langfuse_host: "",
      model: ""
   });

   useEffect(() => {
      fetchAgents();
   }, []);

   const fetchAgents = () => {
      apiClient("/resource/agents?page_size=100")
         .then(data => {
            console.log("Fetched Agents Data:", data); // Debug Log
            if (Array.isArray(data)) {
               setAgents(data);
            } else if (data && data.items) {
               // Sort by created_at desc to show newest first
               const sorted = [...data.items].sort((a: any, b: any) =>
                  new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
               );
               setAgents(sorted);
            } else if (data && data.data) {
               setAgents(data.data);
            }
         })
         .catch(err => {
            console.error(err);
            toast.error(t("toast.loadError"));
         })
         .finally(() => setLoading(false));
   };

   const handleAddAgent = () => {
      if (!newAgentData.name || !newAgentData.endpoint_url) {
         toast.error(t("toast.fillRequired"));
         return;
      }

      apiClient("/resource/agents", {
         method: 'POST',
         body: JSON.stringify({
            ...newAgentData,
            meta_data: { model: newAgentData.model }
         })
      })
         .then(agent => {
            if (agent && agent.id) {
               fetchAgents(); // Refresh list
               setNewAgentOpen(false);
               setNewAgentData({
                  name: "",
                  description: "",
                  type: "RAG Chatbot",
                  endpoint_url: "",
                  api_key: "",
                  repo_url: "",
                  langfuse_project_id: "",
                  langfuse_project_name: "",
                  langfuse_org_id: "",
                  langfuse_org_name: "",
                  langfuse_public_key: "",
                  langfuse_secret_key: "",
                  langfuse_host: "",
                  model: ""
               });
               toast.success(t("toast.createSuccess"));
            }
         })
         .catch(err => {
            console.error(err);
            toast.error(t("toast.createError"));
         });
   };

   const handleDeleteAgent = (id: string) => {
      apiClient(`/resource/agents/${id}`, { method: 'DELETE' })
         .then(() => {
            fetchAgents();
            toast.success(t("toast.deleteSuccess"));
         })
         .catch(err => {
            console.error(err);
            toast.error(t("toast.deleteError"));
         });
   };

   const handleUpdateAgent = () => {
      if (!selectedAgent) return;

      apiClient(`/resource/agents/${selectedAgent.id}`, {
         method: 'PUT',
         body: JSON.stringify({
            name: selectedAgent.name,
            description: selectedAgent.description,
            endpoint_url: selectedAgent.endpoint_url,
            api_key: selectedAgent.api_key, // Send if updated
            repo_url: selectedAgent.repo_url,
            type: selectedAgent.type,
            langfuse_project_id: selectedAgent.langfuse_project_id,
            langfuse_project_name: selectedAgent.langfuse_project_name,
            langfuse_org_id: selectedAgent.langfuse_org_id,
            langfuse_org_name: selectedAgent.langfuse_org_name,
            langfuse_public_key: selectedAgent.langfuse_public_key,
            langfuse_secret_key: selectedAgent.langfuse_secret_key,
            langfuse_host: selectedAgent.langfuse_host,
            meta_data: selectedAgent.meta_data
         })
      })
         .then(() => {
            fetchAgents();
            toast.success(t("toast.updateSuccess"));
            setSelectedAgent(null);
         })
         .catch(err => {
            console.error(err);
            toast.error(t("toast.updateError"));
         });
   };

   const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text || "");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
   };

   return (
      <div className="space-y-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm shrink-0">
            <div>
               <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
               <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">{t("subtitle")}</p>
            </div>

            <Dialog open={newAgentOpen} onOpenChange={setNewAgentOpen}>
               <DialogTrigger asChild>
                  <Button className="w-full md:w-auto gap-2 bg-[#D13138] hover:bg-[#b71c1c] shadow-sm text-xs md:text-sm h-9">
                     <Plus className="h-3.5 w-3.5" /> {t("addNew")}
                  </Button>
               </DialogTrigger>
               <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                     <DialogTitle>{t("dialog.createTitle")}</DialogTitle>
                     <DialogDescription>{t("dialog.createDescription")}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                     {/* Basic Info */}
                     <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                        <h3 className="font-semibold text-sm">{t("form.basicInfo")}</h3>
                        <div className="space-y-2">
                           <Label>{t("form.name")} <span className="text-red-500">*</span></Label>
                           <Input
                              placeholder={t("form.namePlaceholder")}
                              value={newAgentData.name}
                              onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label>{t("form.description")}</Label>
                           <Textarea
                              placeholder={t("form.descriptionPlaceholder")}
                              value={newAgentData.description}
                              onChange={(e) => setNewAgentData({ ...newAgentData, description: e.target.value })}
                              rows={2}
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <Label>{t("form.type")}</Label>
                              <Select
                                 value={newAgentData.type}
                                 onValueChange={(val) => setNewAgentData({ ...newAgentData, type: val })}
                              >
                                 <SelectTrigger>
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="RAG Chatbot">RAG Chatbot</SelectItem>
                                    <SelectItem value="Task Agent">Task Agent</SelectItem>
                                    <SelectItem value="Sales Bot">Sales Bot</SelectItem>
                                    <SelectItem value="Coding Assistant">Coding Assistant</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label>{t("form.model")}</Label>
                              <Input
                                 placeholder="e.g. gpt-4o, deepseek-chat"
                                 value={newAgentData.model}
                                 onChange={(e) => setNewAgentData({ ...newAgentData, model: e.target.value })}
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <Label>{t("form.endpoint")} <span className="text-red-500">*</span></Label>
                           <Input
                              placeholder="http://localhost:8000/chat"
                              value={newAgentData.endpoint_url}
                              onChange={(e) => setNewAgentData({ ...newAgentData, endpoint_url: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label>{t("form.apiKey")}</Label>
                           <Input
                              type="password"
                              placeholder={t("form.apiKeyPlaceholder")}
                              value={newAgentData.api_key}
                              onChange={(e) => setNewAgentData({ ...newAgentData, api_key: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label>{t("form.repoUrl")}</Label>
                           <Input
                              placeholder="https://gitlab.com/..."
                              value={newAgentData.repo_url}
                              onChange={(e) => setNewAgentData({ ...newAgentData, repo_url: e.target.value })}
                           />
                        </div>
                     </div>

                     <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                           <Database className="h-4 w-4 text-blue-600" />
                           <h3 className="font-semibold text-sm text-blue-900">{t("form.langfuse.title")}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <Label>{t("form.langfuse.projectId")}</Label>
                              <Input
                                 placeholder="langfuse project id"
                                 value={newAgentData.langfuse_project_id}
                                 onChange={(e) => setNewAgentData({ ...newAgentData, langfuse_project_id: e.target.value })}
                                 className="font-mono text-xs"
                              />
                           </div>
                           <div className="space-y-2">
                              <Label>{t("form.langfuse.projectName")}</Label>
                              <Input
                                 placeholder="V-App"
                                 value={newAgentData.langfuse_project_name}
                                 onChange={(e) => setNewAgentData({ ...newAgentData, langfuse_project_name: e.target.value })}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label>{t("form.langfuse.orgId")}</Label>
                              <Input
                                 placeholder="langfuse organization id"
                                 value={newAgentData.langfuse_org_id}
                                 onChange={(e) => setNewAgentData({ ...newAgentData, langfuse_org_id: e.target.value })}
                                 className="font-mono text-xs"
                              />
                           </div>
                           <div className="space-y-2">
                              <Label>{t("form.langfuse.orgName")}</Label>
                              <Input
                                 placeholder="VSF"
                                 value={newAgentData.langfuse_org_name}
                                 onChange={(e) => setNewAgentData({ ...newAgentData, langfuse_org_name: e.target.value })}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label>Host (Override)</Label>
                              <Input
                                 placeholder="https://cloud.langfuse.com"
                                 value={newAgentData.langfuse_host}
                                 onChange={(e) => setNewAgentData({ ...newAgentData, langfuse_host: e.target.value })}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label>Public Key</Label>
                              <Input
                                 placeholder="pk-lf-..."
                                 value={newAgentData.langfuse_public_key}
                                 onChange={(e) => setNewAgentData({ ...newAgentData, langfuse_public_key: e.target.value })}
                              />
                           </div>
                           <div className="space-y-2 col-span-2">
                              <Label>Secret Key</Label>
                              <Input
                                 type="password"
                                 placeholder="sk-lf-..."
                                 value={newAgentData.langfuse_secret_key}
                                 onChange={(e) => setNewAgentData({ ...newAgentData, langfuse_secret_key: e.target.value })}
                              />
                           </div>
                        </div>
                     </div>
                  </div>
                  <DialogFooter>
                     <Button variant="outline" onClick={() => setNewAgentOpen(false)}>{t("dialog.cancel")}</Button>
                     <Button className="bg-[#D13138] hover:bg-[#b71c1c]" onClick={handleAddAgent}>{t("dialog.create")}</Button>
                  </DialogFooter>
               </DialogContent>
            </Dialog>
         </div>

         <div className="grid gap-6">
            {/* Agents List */}
            <Card className="shadow-sm border-slate-200">
               <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-slate-800">{t("table.title")}</CardTitle>
                  <CardDescription>{t("table.description")}</CardDescription>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead>{t("table.name")}</TableHead>
                              <TableHead>{t("table.endpoint")}</TableHead>
                              <TableHead>{t("table.apiKey")}</TableHead>
                              <TableHead>{t("table.type")}</TableHead>
                              <TableHead>{t("table.langfuseProject")}</TableHead>
                              <TableHead>{t("table.status")}</TableHead>
                              <TableHead className="text-right">{t("table.actions")}</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {loading ? (
                              <TableRow>
                                 <TableCell colSpan={6} className="text-center py-10 text-slate-500">{t("table.loading")}</TableCell>
                              </TableRow>
                           ) : agents.length === 0 ? (
                              <TableRow>
                                 <TableCell colSpan={6} className="text-center py-10 text-slate-500">{t("table.empty")}</TableCell>
                              </TableRow>
                           ) : agents.map((agent) => (
                              <TableRow key={agent.id}>
                                 <TableCell>
                                    <div>
                                       <div className="font-medium text-slate-900">{agent.name}</div>
                                       {agent.description && (
                                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{agent.description}</div>
                                       )}
                                    </div>
                                 </TableCell>
                                 <TableCell className="max-w-[150px] truncate" title={agent.endpoint_url}>
                                    <span className="text-xs font-mono text-slate-600 block truncate">{agent.endpoint_url}</span>
                                 </TableCell>
                                 <TableCell>
                                    {agent.api_key_encrypted ? (
                                       <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-mono text-[10px]">
                                          Encrypted
                                       </Badge>
                                    ) : (
                                       <span className="text-slate-400 text-xs italic">Empty</span>
                                    )}
                                 </TableCell>
                                 <TableCell>
                                    <Badge variant="outline" className="bg-slate-50">
                                       {agent.type}
                                    </Badge>
                                 </TableCell>
                                 <TableCell>
                                    {agent.langfuse_project_name ? (
                                       <div className="flex items-center gap-1.5">
                                          <Database className="h-3.5 w-3.5 text-blue-500" />
                                          <span className="text-sm font-medium">{agent.langfuse_project_name}</span>
                                       </div>
                                    ) : (
                                       <span className="text-slate-400 text-sm italic">{t("table.notConfigured")}</span>
                                    )}
                                 </TableCell>

                                 <TableCell>
                                    {agent.status === 'active' ? (
                                       <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none">Active</Badge>
                                    ) : (
                                       <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 shadow-none">Inactive</Badge>
                                    )}
                                 </TableCell>
                                 <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                       <Dialog>
                                          <DialogTrigger asChild>
                                             <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-500 hover:text-blue-600"
                                                onClick={() => setSelectedAgent(agent)}
                                             >
                                                <Edit className="h-4 w-4" />
                                             </Button>
                                          </DialogTrigger>
                                          {selectedAgent && selectedAgent.id === agent.id && (
                                             <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                   <DialogTitle>{t("dialog.editTitle")}: {selectedAgent.name}</DialogTitle>
                                                   <DialogDescription>
                                                      {t("dialog.editDescription")}
                                                   </DialogDescription>
                                                </DialogHeader>

                                                <div className="space-y-4 py-4">
                                                   {/* Basic Info */}
                                                   <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                                                      <h3 className="font-semibold text-sm">{t("form.basicInfo")}</h3>
                                                      <div className="space-y-2">
                                                         <Label>{t("form.name")}</Label>
                                                         <Input
                                                            value={selectedAgent.name}
                                                            onChange={(e) => setSelectedAgent({ ...selectedAgent, name: e.target.value })}
                                                         />
                                                      </div>
                                                      <div className="space-y-2">
                                                         <Label>{t("form.description")}</Label>
                                                         <Textarea
                                                            value={selectedAgent.description || ''}
                                                            onChange={(e) => setSelectedAgent({ ...selectedAgent, description: e.target.value })}
                                                            rows={2}
                                                         />
                                                      </div>
                                                      <div className="grid grid-cols-2 gap-4">
                                                         <div className="space-y-2">
                                                            <Label>{t("form.type")}</Label>
                                                            <Select
                                                               value={selectedAgent.type}
                                                               onValueChange={(val) => setSelectedAgent({ ...selectedAgent, type: val })}
                                                            >
                                                               <SelectTrigger>
                                                                  <SelectValue />
                                                               </SelectTrigger>
                                                               <SelectContent>
                                                                  <SelectItem value="RAG Chatbot">RAG Chatbot</SelectItem>
                                                                  <SelectItem value="Task Agent">Task Agent</SelectItem>
                                                                  <SelectItem value="Sales Bot">Sales Bot</SelectItem>
                                                                  <SelectItem value="Coding Assistant">Coding Assistant</SelectItem>
                                                                  {/* Ensure current type is shown if not in list */}
                                                                  {selectedAgent.type &&
                                                                     !["RAG Chatbot", "Task Agent", "Sales Bot", "Coding Assistant"].includes(selectedAgent.type) && (
                                                                        <SelectItem value={selectedAgent.type}>{selectedAgent.type}</SelectItem>
                                                                     )}
                                                               </SelectContent>
                                                            </Select>
                                                         </div>
                                                         <div className="space-y-2">
                                                            <Label>{t("form.model")}</Label>
                                                            <Input
                                                               placeholder="e.g. gpt-4o"
                                                               value={selectedAgent.meta_data?.model || ''}
                                                               onChange={(e) => setSelectedAgent({
                                                                  ...selectedAgent,
                                                                  meta_data: { ...selectedAgent.meta_data, model: e.target.value }
                                                               })}
                                                            />
                                                         </div>
                                                      </div>
                                                      <div className="space-y-2">
                                                         <Label>{t("form.endpoint")}</Label>
                                                         <Input
                                                            value={selectedAgent.endpoint_url}
                                                            onChange={(e) => setSelectedAgent({ ...selectedAgent, endpoint_url: e.target.value })}
                                                         />
                                                      </div>
                                                      <div className="space-y-2">
                                                         <Label>{t("form.apiKey")} ({t("form.apiKeyEmpty")})</Label>
                                                         <Input
                                                            type="password"
                                                            placeholder="********"
                                                            value={selectedAgent.api_key || ''}
                                                            onChange={(e) => setSelectedAgent({ ...selectedAgent, api_key: e.target.value })}
                                                         />
                                                      </div>
                                                      <div className="space-y-2">
                                                         <Label>{t("form.repoUrl")}</Label>
                                                         <Input
                                                            value={selectedAgent.repo_url || ''}
                                                            onChange={(e) => setSelectedAgent({ ...selectedAgent, repo_url: e.target.value })}
                                                         />
                                                      </div>
                                                   </div>

                                                   {/* Langfuse Config */}
                                                   <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                      <div className="flex items-center gap-2">
                                                         <Database className="h-4 w-4 text-blue-600" />
                                                         <h3 className="font-semibold text-sm text-blue-900">{t("form.langfuse.title")}</h3>
                                                      </div>
                                                      <div className="grid grid-cols-2 gap-4">
                                                         <div className="space-y-2">
                                                            <Label>{t("form.langfuse.projectId")}</Label>
                                                            <Input
                                                               value={selectedAgent.langfuse_project_id || ''}
                                                               onChange={(e) => setSelectedAgent({ ...selectedAgent, langfuse_project_id: e.target.value })}
                                                               className="font-mono text-xs"
                                                            />
                                                         </div>
                                                         <div className="space-y-2">
                                                            <Label>{t("form.langfuse.projectName")}</Label>
                                                            <Input
                                                               value={selectedAgent.langfuse_project_name || ''}
                                                               onChange={(e) => setSelectedAgent({ ...selectedAgent, langfuse_project_name: e.target.value })}
                                                            />
                                                         </div>
                                                         <div className="space-y-2">
                                                            <Label>{t("form.langfuse.orgId")}</Label>
                                                            <Input
                                                               value={selectedAgent.langfuse_org_id || ''}
                                                               onChange={(e) => setSelectedAgent({ ...selectedAgent, langfuse_org_id: e.target.value })}
                                                               className="font-mono text-xs"
                                                            />
                                                         </div>
                                                         <div className="space-y-2">
                                                            <Label>{t("form.langfuse.orgName")}</Label>
                                                            <Input
                                                               value={selectedAgent.langfuse_org_name || ''}
                                                               onChange={(e) => setSelectedAgent({ ...selectedAgent, langfuse_org_name: e.target.value })}
                                                            />
                                                         </div>
                                                      </div>
                                                   </div>
                                                </div>

                                                <DialogFooter>
                                                   <Button variant="outline" onClick={() => setSelectedAgent(null)}>{commonT("cancel")}</Button>
                                                   <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdateAgent}>
                                                      {t("dialog.save")}
                                                   </Button>
                                                </DialogFooter>
                                             </DialogContent>
                                          )}
                                       </Dialog>

                                       <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                             <Button variant="ghost" size="icon" className="text-slate-500 hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                             </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                             <AlertDialogHeader>
                                                <AlertDialogTitle>{t("dialog.deleteTitle")}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   {t("dialog.deleteDescription")}
                                                </AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <AlertDialogFooter>
                                                <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
                                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteAgent(agent.id)}>
                                                   {t("dialog.delete")}
                                                </AlertDialogAction>
                                             </AlertDialogFooter>
                                          </AlertDialogContent>
                                       </AlertDialog>
                                    </div>
                                 </TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}
