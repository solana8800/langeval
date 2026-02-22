
import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    Handle,
    Position,
    BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Database, Brain, MessageSquare, Terminal, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
interface TraceFlowGraphProps {
    observations: any[];
    selectedSpanId?: string;
    onSelectSpan: (span: any) => void;
}

// --- Custom Node ---
const CustomNode = ({ data, selected }: any) => {
    const getIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'chain': return <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />;
            case 'tool': return <Database className="h-3.5 w-3.5 text-amber-500" />;
            case 'model': return <Brain className="h-3.5 w-3.5 text-purple-500" />;
            case 'generation': return <Brain className="h-3.5 w-3.5 text-sky-500" />;
            default: return <Terminal className="h-3.5 w-3.5 text-slate-400" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'chain': return 'bg-indigo-50 border-indigo-200';
            case 'tool': return 'bg-amber-50 border-amber-200';
            case 'model': return 'bg-purple-50 border-purple-200';
            case 'generation': return 'bg-sky-50 border-sky-200';
            default: return 'bg-slate-50 border-slate-200';
        }
    }

    return (
        <div className={cn(
            "flex flex-col shadow-sm rounded-xl bg-white border min-w-[200px] overflow-hidden transition-all duration-300",
            selected ? "ring-2 ring-indigo-500 ring-offset-2 border-indigo-500 shadow-md transform scale-105 z-10" : "border-slate-200 hover:border-indigo-300 hover:shadow-md",
        )}>
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-300 !border-2 !border-white" />

            {/* Header Strip */}
            <div className={cn("px-3 py-1.5 flex items-center gap-2 border-b", getTypeColor(data.type))}>
                {getIcon(data.type)}
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 opacity-80">{data.type}</span>
            </div>

            {/* Body */}
            <div className="px-3 py-2">
                <div className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1.5" title={data.label}>
                    {data.label}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="font-mono pt-0.5">{data.duration}s</span>
                    </div>
                    {data.cost > 0 && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 px-1.5 py-0.5 rounded-full text-emerald-700 font-medium">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-mono pt-0.5">{data.cost.toFixed(5)}</span>
                        </div>
                    )}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-300 !border-2 !border-white" />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

// --- Layout Algorithm (Simple Tree) ---
// Since we don't have dagre, we implemented a basic Reingold-Tilford inspired layout
// or just a simple level-based layout.
const getLayoutedElements = (observations: any[]) => {
    if (!observations || observations.length === 0) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 1. Build Tree
    const map = new Map();
    const roots: any[] = [];

    // Sort by startTime to ensure order
    const sorted = [...observations].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    sorted.forEach(obs => {
        obs._children = [];
        obs._width = 200; // Estimates
        obs._x = 0;
        obs._y = 0;
        map.set(obs.id, obs);
    });

    sorted.forEach(obs => {
        if (obs.parentObservationId && map.has(obs.parentObservationId)) {
            map.get(obs.parentObservationId)._children.push(obs);
        } else {
            roots.push(obs);
        }
    });

    // 2. Compute Layout (DFS)
    const NODE_WIDTH = 240; // Increased spacing
    const NODE_HEIGHT = 120;

    // Simple approach: Assign abstract X coordinates based on leaf counting
    let traversalX = 0;

    const assignCoords = (node: any, level: number) => {
        const children = node._children;

        if (children.length === 0) {
            node._x = traversalX;
            traversalX += NODE_WIDTH;
        } else {
            children.forEach((child: any) => assignCoords(child, level + 1));
            // Parent X is average of first and last child
            const firstChild = children[0];
            const lastChild = children[children.length - 1];
            node._x = (firstChild._x + lastChild._x) / 2;
        }

        node._y = level * NODE_HEIGHT * 1.5; // Level spacing
    };

    // Process each root
    roots.forEach(root => {
        assignCoords(root, 0);
        traversalX += NODE_WIDTH; // Spacing between trees
    });

    // 3. Create Nodes & Edges
    sorted.forEach(obs => {
        const traceStart = new Date(roots[0]?.startTime).getTime() || 0;
        const obsStart = new Date(obs.startTime).getTime();
        const obsEnd = obs.endTime ? new Date(obs.endTime).getTime() : obsStart;
        const duration = (obsEnd - obsStart) / 1000;

        nodes.push({
            id: obs.id,
            type: 'custom',
            position: { x: obs._x, y: obs._y },
            data: {
                label: obs.name || obs.type,
                type: obs.type,
                duration: duration.toFixed(2),
                cost: obs.calculatedTotalCost || 0,
                original: obs
            },
        });

        if (obs.parentObservationId) {
            edges.push({
                id: `e-${obs.parentObservationId}-${obs.id}`,
                source: obs.parentObservationId,
                target: obs.id,
                type: 'default', // Smooth bezier is default for 'default' type if configured
                style: { stroke: '#cbd5e1', strokeWidth: 2 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#cbd5e1',
                },
            });
        }
    });

    return { nodes, edges };
};

export default function TraceFlowGraph({ observations, selectedSpanId, onSelectSpan }: TraceFlowGraphProps) {
    // Memoize layout calculation
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() =>
        getLayoutedElements(observations),
        [observations]);

    // Sync selection state
    const nodesWithSelection = useMemo(() => {
        return initialNodes.map(node => ({
            ...node,
            selected: node.id === selectedSpanId
        }));
    }, [initialNodes, selectedSpanId]);

    const onNodeClick = useCallback((_: any, node: Node) => {
        if (node.data.original) {
            onSelectSpan(node.data.original);
        }
    }, [onSelectSpan]);

    return (
        <div className="w-full h-full bg-slate-50/50">
            <ReactFlow
                nodes={nodesWithSelection}
                edges={initialEdges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                fitView
                attributionPosition="bottom-right"
                minZoom={0.1}
            >
                <Controls className="bg-white shadow-lg border border-slate-100 rounded-lg p-1" />
                <Background color="#94a3b8" gap={20} size={1} variant={BackgroundVariant.Dots} className="opacity-20" />
            </ReactFlow>
        </div>
    );
}
