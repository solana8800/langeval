"use client";

import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  NodeMouseHandler,
  Panel,
  MarkerType,
  EdgeMouseHandler,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, RefreshCcw, Upload, Settings, Info, Save, Play, Loader2, Bug, PanelLeftOpen, Sparkles, Send, Wand2, Undo2, RotateCcw } from 'lucide-react';
import { NodeConfigPanel } from './node-config-panel';
import { EdgeConfigPanel } from './edge-config-panel';
import { API_BASE_URL } from '@/lib/api-utils';
import { apiClient } from '@/lib/api-client';
import { CustomNode } from './custom-node';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PolicySelector } from "@/components/metrics/policy-selector";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface ScenarioBuilderProps {
  scenarioId: string;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}
import { MOCK_AGENTS, aiAgents, MOCK_SCENARIO_DETAILS } from "@/lib/mock-data";

export function ScenarioBuilder({ scenarioId, isSidebarOpen, setSidebarOpen }: ScenarioBuilderProps) {
  const t = useTranslations("ScenarioBuilderEditor");
  const commonT = useTranslations("Common");

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nodes, setNodes, onNodesChangeReactFlow] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeReactFlow] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [globalMetrics, setGlobalMetrics] = useState<string[]>([]);
  const [scenarioMeta, setScenarioMeta] = useState<{
    name: string;
    description: string;
    agentId: string;
    agentName?: string;
    modelId?: string;
    difficulty?: string;
    language?: string;
  } | null>(null);

  // Update meta in state
  const updateScenarioMeta = (updates: Partial<{ name: string, description: string, agentId: string, modelId: string, difficulty: string, language: string }>) => {
    setScenarioMeta(prev => prev ? { ...prev, ...updates } : null);
  };

  const [isGlobalConfigOpen, setIsGlobalConfigOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
  const [isReloadDialogOpen, setIsReloadDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Define custom node types
  const nodeTypes = useMemo(() => ({
    customNode: CustomNode,
  }), []);

  // Fetch models
  useEffect(() => {
    apiClient('/resource/models')
      .then(data => {
        const items = Array.isArray(data) ? data : (data.items || []);
        setModels(items);
      })
      .catch(err => console.error("Failed to load models", err));
  }, []);

  const loadScenario = useCallback(() => {
    setLoading(true);
    apiClient(`/resource/scenarios/${scenarioId}`, { cache: 'no-store' })
      .catch(async (err) => {
        console.warn(`Backend/API unreachable. Checking for local demo data...`, err);
        if (scenarioId.startsWith('sc_')) {
          return MOCK_SCENARIO_DETAILS['sc_1']; // Fallback to local const
        }
        throw err;
      })
      .then(data => {
        if (data) {
          console.log("Loaded Scenario Data:", data);

          let loadedNodes = data.nodes || [];
          let loadedEdges = data.edges || [];

          // Robust parsing
          if (typeof loadedNodes === 'string') {
            try { loadedNodes = JSON.parse(loadedNodes); } catch (e) { console.error("Error parsing nodes", e); loadedNodes = []; }
          }
          if (typeof loadedEdges === 'string') {
            try { loadedEdges = JSON.parse(loadedEdges); } catch (e) { console.error("Error parsing edges", e); loadedEdges = []; }
          }

          setNodes(loadedNodes.map((n: any) => ({
            ...n,
            type: 'customNode', // Force node type to ensure rendering
          })));
          setEdges(loadedEdges);

          // Map nodes to use customNode type and preserve original type info
          if (Array.isArray(loadedNodes)) {
            const mappedNodes = loadedNodes.map((node: any) => ({
              ...node,
              type: 'customNode', // Use our custom component
              // Safety: ReactFlow CRASHES if position is missing. Ensure it exists.
              position: node.position || { x: 0, y: 0 },
              data: {
                ...node.data,
                // Ensure category exists, defaulting to 'default' if missing
                category: node.data?.category || 'default',
                // Preserve original type if it's not customNode, else keep it
                type: (node.type !== 'customNode' ? node.type : node.data?.type) || 'default'
              },
              style: undefined // Remove inline styles to let component handle it
            }));
            setNodes(mappedNodes);
          }

          if (Array.isArray(loadedEdges)) {
            setEdges(loadedEdges);
          }
          // Load other metadata if needed
          if (data.name || data.agent_id) {
            let agentName = data.agent_name;
            if (!agentName && data.agent_id) {
              // Try to find in MOCK_AGENTS / aiAgents
              const found = MOCK_AGENTS.find(a => a.id === data.agent_id) || aiAgents.find(a => a.id === data.agent_id);
              if (found) {
                agentName = found.name;
              } else {
                // If not in mock, try to fetch from API
                try {
                  apiClient(`/resource/agents/${data.agent_id}`)
                    .then(agentData => {
                      if (agentData && agentData.name) {
                        setScenarioMeta(prev => prev ? { ...prev, agentName: agentData.name } : null);
                      }
                    }).catch(e => console.warn("Agent fetch failed", e));
                } catch (e) { }
              }
            }

            setScenarioMeta({
              name: data.name,
              description: data.description,
              agentId: data.agent_id,
              agentName: agentName,
              modelId: data.meta_data?.model_id,
              difficulty: data.meta_data?.difficulty,
              language: data.meta_data?.language
            });
          }

          // Reset dirty flag and history after successful load
          setIsDirty(false);
          setHistory([]);
        }
      })
      .catch(err => console.error("Failed to fetch scenario", err))
      .finally(() => setLoading(false));
  }, [scenarioId, setNodes, setEdges]);

  useEffect(() => {
    loadScenario();
  }, [loadScenario]);

  const takeSnapshot = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev, { nodes: nodes, edges: edges }];
      // Limit history to 20 steps
      if (newHistory.length > 20) return newHistory.slice(newHistory.length - 20);
      return newHistory;
    });
  }, [nodes, edges]);

  const handleUndo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const lastState = prev[prev.length - 1];
      const newHistory = prev.slice(0, prev.length - 1);

      setNodes(lastState.nodes);
      setEdges(lastState.edges);

      // If history becomes empty, we assume we are still potentially dirty.
      return newHistory;
    });
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      takeSnapshot(); // Snap before connect
      setEdges((eds) => addEdge({
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed }
      }, eds));
      setIsDirty(true);
    },
    [setEdges, takeSnapshot],
  );

  const onNodeDragStart = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onNodesChange = useCallback((changes: any) => {
    onNodesChangeReactFlow(changes);
    if (changes.some((change: any) => change.type !== 'dimensions' && change.type !== 'position' && change.type !== 'select')) {
      if (changes.some((c: any) => c.type === 'remove')) {
        takeSnapshot();
      }
      setIsDirty(true);
    }
  }, [onNodesChangeReactFlow, takeSnapshot]);

  const onEdgesChange = useCallback((changes: any) => {
    onEdgesChangeReactFlow(changes);
    if (changes.some((change: any) => change.type !== 'dimensions' && change.type !== 'position')) {
      setIsDirty(true);
    }
  }, [onEdgesChangeReactFlow]);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const category = event.dataTransfer.getData('application/reactflow');
      if (!category || !reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      takeSnapshot();
      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: 'customNode',
        position,
        data: {
          label: `New ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          category: category
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setIsDirty(true);
    },
    [reactFlowInstance, setNodes, takeSnapshot]
  );

  const handleNodeUpdate = (id: string, newData: any) => {
    takeSnapshot();
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: newData };
        }
        return node;
      })
    );
    setSelectedNode((prev) => prev ? { ...prev, data: newData } : null);
    setIsDirty(true);
  };

  const handleEdgeUpdate = (id: string, data: { label: string, animated: boolean }) => {
    takeSnapshot();
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === id) {
          return { ...edge, label: data.label, animated: data.animated };
        }
        return edge;
      })
    );
    setSelectedEdge((prev) => prev ? { ...prev, label: data.label, animated: data.animated } : null);
    setIsDirty(true);
  };

  const handleEdgeDelete = (id: string) => {
    takeSnapshot();
    setEdges((eds) => eds.filter(e => e.id !== id));
    setSelectedEdge(null);
    setIsDirty(true);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    try {
      const data = await apiClient('/resource/scenarios/generate-ai', {
        method: 'POST',
        body: JSON.stringify({
          prompt: aiPrompt,
          current_nodes: nodes,
          current_edges: edges,
          model_id: scenarioMeta?.modelId,
          agent_id: scenarioMeta?.agentId
        })
      });

      if (data.nodes) {
        const newNodes = data.nodes.map((n: any) => ({
          ...n,
          type: 'customNode',
          position: n.position || { x: 0, y: 0 },
        }));
        setNodes(newNodes);

        if (data.edges) {
          setEdges(data.edges);
        }

        if (data.name) setScenarioMeta(prev => prev ? { ...prev, name: data.name } : { name: data.name, description: data.description || "", agentId: "" });

        takeSnapshot();
        setIsDirty(true);
        toast.success(t('toasts.aiSuccess'));
        setAiPrompt("");
        setShowAIPrompt(false);
      } else {
        toast.error(t('toasts.aiInvalid'));
      }
    } catch (e: any) {
      console.error("AI Assistant Error:", e);
      toast.error(t('toasts.aiError') + e.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: scenarioMeta?.name,
        description: scenarioMeta?.description,
        agent_id: scenarioMeta?.agentId,
        meta_data: {
          model_id: scenarioMeta?.modelId,
          difficulty: scenarioMeta?.difficulty,
          language: scenarioMeta?.language
        },
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data
        })),
        edges: edges
      };

      await apiClient(`/resource/scenarios/${scenarioId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setIsDirty(false);
      setHistory([]);

      toast.success(t('toasts.saveSuccess'));

    } catch (e) {
      console.error("Save failed", e);
      toast.error(t('toasts.saveError') + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    // Auto save before run
    await handleSave();

    setRunning(true);
    toast.info(t('toasts.starting'));
    try {
      const data = await apiClient(`/orchestrator/campaigns`, {
        method: 'POST',
        body: JSON.stringify({
          scenario_id: scenarioId,
          scenario_name: scenarioMeta?.name,
          agent_id: scenarioMeta?.agentId,
          metadata: {
            model_id: scenarioMeta?.modelId,
            global_metrics: globalMetrics
          }
        })
      });
      const campaignId = data.campaign_id;
      toast.success(`Execution started: ${campaignId}`);

      // Poll for result
      const pollInterval = setInterval(async () => {
        try {
          const stateData = await apiClient(`/orchestrator/campaigns/${campaignId}/state`).catch(() => null);
          if (!stateData) return;
          const status = stateData.values?.status || "unknown";

          if (status === 'completed' || status === 'failed') {
            clearInterval(pollInterval);
            setRunning(false);

            const result = {
              result: {
                passed: stateData.values?.current_score >= 0.5,
                score: stateData.values?.current_score,
                metrics: stateData.values?.metrics
              },
              logs: stateData.values?.messages?.map((m: any) => ({
                time: new Date().toISOString(),
                message: `${m.role}: ${m.content}`
              })) || []
            };

            setExecutionResult(result);
            setIsResultOpen(true);

            if (status === 'completed') {
              toast.success(t('toasts.runSuccess'));
            } else {
              toast.error(t('toasts.runError'));
            }
          }
        } catch (e) {
          console.error("Poll error", e);
        }
      }, 2000);

    } catch (e) {
      console.error("Run failed", e);
      setRunning(false);
      toast.error(t('toasts.runStartError') + (e as Error).message);
    }
  };

  const handleExport = () => {
    const data = {
      ...(scenarioMeta || {}),
      nodes,
      edges,
      globalMetrics
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scenario_${scenarioMeta?.name ? scenarioMeta.name.replace(/\s+/g, '_') : scenarioId}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const confirmClear = () => {
    takeSnapshot();
    setNodes([]);
    setEdges([]);
    setIsClearDialogOpen(false);
    setIsDirty(true);
    toast.info(t('toasts.canvasCleared'));
  };

  const handleClear = () => {
    setIsClearDialogOpen(true);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.nodes && json.edges) {
          setNodes(json.nodes);
          setEdges(json.edges);
          if (json.globalMetrics) {
            setGlobalMetrics(json.globalMetrics);
          }
          if (json.name || json.agentId || json.agent_id) {
            setScenarioMeta({
              name: json.name || "Imported Scenario",
              description: json.description || "",
              agentId: json.agentId || json.agent_id,
              modelId: json.modelId || json.metadata?.model_id
            });
            toast.info("Imported content and metadata. Save to persist changes.");
          } else {
            toast.success("Imported content successfully.");
          }
          takeSnapshot();
          setIsDirty(true);
        } else {
          toast.error("Invalid JSON file! Missing nodes or edges.");
        }
      } catch (err) {
        toast.error("JSON Error: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if (loading) {
    return <div className="flex items-center justify-center w-full h-full bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D13138]"></div><span className="ml-3 text-slate-500 text-sm">{t('loading')}</span></div>;
  }

  return (
    <div className="flex flex-col w-full h-full relative">
      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-transparent pointer-events-none h-[80px]">
        <div className="flex items-center gap-4 pointer-events-auto">
          {!isSidebarOpen && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-9 w-9 border-slate-200 bg-white hover:bg-slate-50 shadow-sm shrink-0"
              title={t('toolbar.openLibrary')}
            >
              <PanelLeftOpen className="h-5 w-5 text-slate-700" />
            </Button>
          )}
          <div className="drop-shadow-sm">
            <h2 className="font-semibold text-base sm:text-lg text-slate-800">{scenarioMeta?.name || 'Scenario Editor'}</h2>
            <div className="text-[9px] sm:text-xs text-slate-500 flex items-center gap-2">
              {scenarioMeta?.agentName ? <span>Agent: {scenarioMeta.agentName}</span> : <span>{t('toolbar.unassignedAgent')}</span>}
              {scenarioMeta?.modelId && (
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Bug className="w-3 h-3" />
                  {models.find(m => m.id === scenarioMeta.modelId)?.name || 'Custom Model'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileChange}
          />

          {/* Primary Actions */}
          <Button variant="default" size="sm" onClick={handleRun} disabled={running} className="bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-sm shrink-0">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
            <span className="hidden sm:inline">{running ? t('toolbar.debugging') : t('toolbar.debug')}</span>
          </Button>

          <Button
            variant={isDirty ? "default" : "outline"}
            size="sm"
            onClick={() => setIsSaveDialogOpen(true)}
            disabled={saving}
            className={`gap-2 shrink-0 ${isDirty ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse-subtle' : 'bg-white hover:bg-slate-50 border-slate-200 text-blue-600'}`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">{saving ? t('toolbar.saving') : t('toolbar.save')}{isDirty ? "*" : ""}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="bg-white hover:bg-orange-50 border-slate-200 text-slate-700 gap-2 shrink-0 hidden md:flex"
            title={t('toolbar.undoTooltip')}
          >
            <Undo2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('toolbar.undo')}</span>
          </Button>

          {/* Secondary Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="h-8 w-px bg-slate-200 mx-1" />
            <Button variant="outline" size="sm" onClick={() => setIsGlobalConfigOpen(true)} className="bg-white hover:bg-slate-50 border-slate-200 gap-2">
              <Settings className="h-4 w-4" /> {t('toolbar.settings')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsClearDialogOpen(true)} title={t('toolbar.clear')} className="bg-white hover:bg-red-50 hover:text-red-600 border-slate-200">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsReloadDialogOpen(true)} title={t('toolbar.reload')} className="bg-white hover:bg-slate-50 border-slate-200">
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportClick} className="bg-white hover:bg-slate-50 border-slate-200 gap-2">
              <Upload className="h-4 w-4" /> {t('toolbar.import')}
            </Button>
            <Button onClick={handleExport} size="sm" className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm gap-2">
              <Download className="h-4 w-4" /> {t('toolbar.export')}
            </Button>
          </div>

          {/* Mobile/Tablet Dropdown */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white border-slate-200">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsGlobalConfigOpen(true)} className="gap-2">
                  <Settings className="h-4 w-4" /> {t('toolbar.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleImportClick} className="gap-2">
                  <Upload className="h-4 w-4" /> {t('toolbar.import')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" /> {t('toolbar.export')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleUndo} disabled={history.length === 0} className="gap-2 text-slate-700">
                  <Undo2 className="h-4 w-4" /> {t('toolbar.undo')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsReloadDialogOpen(true)} className="gap-2">
                  <RefreshCcw className="h-4 w-4" /> {t('toolbar.reload')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsClearDialogOpen(true)} className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                  <Trash2 className="h-4 w-4" /> {t('toolbar.clear')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content Wrapper */}
      <div className="flex-1 flex w-full h-full relative overflow-hidden">
        <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={onNodeDragStart}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-50"
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

            {/* AI Floating Assistant */}
            <Panel position="bottom-right" className="mb-0 mr-0">
              <div className={`transition-all duration-300 ease-in-out ${showAIPrompt ? 'w-[500px] mb-2 mr-2' : 'w-auto'}`}>
                {!showAIPrompt ? (
                  <Button
                    onClick={() => setShowAIPrompt(true)}
                    className="rounded-full h-14 w-14 bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-xl hover:shadow-2xl hover:scale-110 transition-all text-white p-0 border-4 border-white/20"
                  >
                    <Sparkles className="h-7 w-7" />
                  </Button>
                ) : (
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-3 flex flex-col gap-3 overflow-hidden ring-4 ring-purple-100/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <div className="bg-purple-100 p-2 rounded-xl">
                        <Wand2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{t('ai.title')}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAIPrompt(false)}
                        className="text-slate-400 hover:text-slate-600 p-2 ml-auto"
                      >
                        ✕
                      </Button>
                    </div>

                    <textarea
                      autoFocus
                      className="w-full min-h-[100px] max-h-[300px] bg-slate-50 rounded-xl border border-slate-100 outline-none text-sm p-3 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                      placeholder={t('ai.placeholder')}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isGeneratingAI) {
                          e.preventDefault();
                          handleAIGenerate();
                        }
                        if (e.key === 'Escape') setShowAIPrompt(false);
                      }}
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 italic">{t('ai.hint')}</span>
                      <Button
                        size="sm"
                        onClick={handleAIGenerate}
                        disabled={isGeneratingAI || !aiPrompt.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 px-6 shadow-md"
                      >
                        {isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span>{t('ai.send')}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {(selectedNode || selectedEdge) && (
          <div className="absolute inset-0 bg-black/20 z-10 lg:static lg:bg-transparent lg:border-l lg:border-slate-200 lg:w-80 lg:shrink-0 lg:h-full" onClick={onPaneClick}>
            <div className="h-full w-[300px] bg-white shadow-xl lg:shadow-none lg:w-full ml-auto" onClick={(e) => e.stopPropagation()}>
              {selectedNode && (
                <NodeConfigPanel
                  node={selectedNode}
                  onClose={() => setSelectedNode(null)}
                  onUpdate={handleNodeUpdate}
                />
              )}
              {selectedEdge && (
                <EdgeConfigPanel
                  edge={selectedEdge}
                  onClose={() => setSelectedEdge(null)}
                  onUpdate={handleEdgeUpdate}
                  onDelete={handleEdgeDelete}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isGlobalConfigOpen} onOpenChange={setIsGlobalConfigOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dialogs.settings.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>{t('dialogs.settings.modelLabel')}</Label>
              <Select
                value={scenarioMeta?.modelId || "default_model"}
                onValueChange={(val) => updateScenarioMeta({ modelId: val === "default_model" ? "" : val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('dialogs.settings.modelPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default_model">{t('dialogs.settings.modelDefault')}</SelectItem>
                  {models.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Độ khó (Difficulty)</Label>
                <Select
                  value={scenarioMeta?.difficulty || "Medium"}
                  onValueChange={(val) => updateScenarioMeta({ difficulty: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn độ khó" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ngôn ngữ (Language)</Label>
                <Select
                  value={scenarioMeta?.language || "vi"}
                  onValueChange={(val) => updateScenarioMeta({ language: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ngôn ngữ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt (vi)</SelectItem>
                    <SelectItem value="en">English (en)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-1">
              <Label>{t('dialogs.settings.metricsTitle')}</Label>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 my-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-1">
                  {t('dialogs.settings.metricsGuideTitle')}
                </h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  {t('dialogs.settings.metricsGuideDesc')}
                </p>
              </div>
              <PolicySelector
                selectedMetrics={globalMetrics}
                onSelectionChange={setGlobalMetrics}
                className="border rounded-md p-4"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsGlobalConfigOpen(false)}>{t('dialogs.settings.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution Result Dialog */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t('dialogs.result.title')}
              <span className={executionResult?.result?.passed ? "text-green-600" : "text-red-600"}>
                {executionResult?.result?.passed ? "(PASSED)" : "(FAILED)"}
              </span>
            </DialogTitle>
            <DialogDescription>
              {t('dialogs.result.desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {executionResult?.result && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-sm mb-2">{t('dialogs.result.summary')}</h4>
                <pre className="text-xs">{JSON.stringify(executionResult.result, null, 2)}</pre>
              </div>
            )}

            <div className="bg-black/90 text-green-400 p-4 rounded-lg font-mono text-xs h-64 overflow-y-auto">
              {executionResult?.logs && executionResult.logs.map((log: any, idx: number) => (
                <div key={idx} className="mb-1">
                  <span className="text-green-600 mr-2">[{new Date(log.time).toLocaleTimeString()}]</span>
                  {log.message}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsResultOpen(false)}>{t('dialogs.result.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Confirmation */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.clear.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.clear.desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.clear.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear} className="bg-red-600 hover:bg-red-700 text-white">
              {t('dialogs.clear.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reload Confirmation */}
      <AlertDialog open={isReloadDialogOpen} onOpenChange={setIsReloadDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.reload.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.reload.desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.reload.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { loadScenario(); setIsReloadDialogOpen(false); }} className="bg-orange-600 hover:bg-orange-700 text-white">
              {t('dialogs.reload.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Save Confirmation */}
      <AlertDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.save.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.save.desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.save.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { handleSave(); setIsSaveDialogOpen(false); }} className="bg-blue-600 hover:bg-blue-700 text-white">
              {t('dialogs.save.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
