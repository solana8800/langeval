
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
    User,
    MessageSquare,
    GitBranch,
    CheckCircle2,
    XCircle,
    Play,
    Settings,
    Clock,
    Terminal,
    ShieldAlert,
    Brain,
    Zap,
    Flag,
    Code2,
    Workflow,
    PlayCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categoryConfig: Record<string, { icon: any; color: string; borderColor: string; bg: string }> = {
    start: {
        icon: PlayCircle,
        color: "text-emerald-700",
        borderColor: "border-emerald-200",
        bg: "bg-emerald-50"
    },
    end: {
        icon: Flag,
        color: "text-slate-900",
        borderColor: "border-slate-300",
        bg: "bg-slate-100"
    },
    trigger: {
        icon: Zap,
        color: "text-orange-700",
        borderColor: "border-orange-200",
        bg: "bg-orange-50"
    },
    persona: {
        icon: User,
        color: "text-rose-700",
        borderColor: "border-rose-200",
        bg: "bg-rose-50"
    },
    task: {
        icon: MessageSquare,
        color: "text-blue-700",
        borderColor: "border-blue-200",
        bg: "bg-blue-50"
    },
    condition: {
        icon: GitBranch,
        color: "text-amber-700",
        borderColor: "border-amber-200",
        bg: "bg-amber-50"
    },
    wait: {
        icon: Clock,
        color: "text-stone-600",
        borderColor: "border-stone-200",
        bg: "bg-stone-50"
    },
    expectation: {
        icon: ShieldAlert,
        color: "text-purple-700",
        borderColor: "border-purple-200",
        bg: "bg-purple-50"
    },
    tool: {
        icon: Terminal,
        color: "text-cyan-700",
        borderColor: "border-cyan-200",
        bg: "bg-cyan-50"
    },
    code: {
        icon: Code2,
        color: "text-indigo-700",
        borderColor: "border-indigo-200",
        bg: "bg-indigo-50"
    },
    transform: {
        icon: Workflow,
        color: "text-fuchsia-700",
        borderColor: "border-fuchsia-200",
        bg: "bg-fuchsia-50"
    },

    default: {
        icon: Settings,
        color: "text-slate-700",
        borderColor: "border-slate-200",
        bg: "bg-white"
    }
};

export const CustomNode = memo(({ data, selected }: NodeProps) => {
    const category = data.category || 'default';
    const config = categoryConfig[category] || categoryConfig.default;
    const Icon = config.icon;

    return (
        <div className="relative group">
            {/* Input Handle */}
            {data.type !== 'input' && (
                <Handle
                    type="target"
                    position={Position.Top}
                    className="w-5 h-5 !bg-white !border-[4px] !border-slate-400 z-50 transition-all hover:!border-[#D13138] hover:scale-125 shadow-sm"
                />
            )}

            <Card
                className={cn(
                    "w-[280px] shadow-sm transition-all duration-200 overflow-hidden",
                    config.borderColor,
                    config.bg,
                    selected ? "ring-2 ring-[#D13138] ring-offset-2 shadow-md" : "hover:border-[#D13138]/50 hover:shadow-md"
                )}
            >
                <CardHeader className="p-2.5 border-b border-black/5 bg-white/50 backdrop-blur-sm rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-md bg-white shadow-sm ring-1 ring-black/5", config.color)}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className={cn("text-xs font-bold uppercase tracking-wider opacity-70", config.color)}>
                                {category}
                            </span>
                            <span className="text-base font-semibold text-slate-900 leading-tight">
                                {data.label}
                            </span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-2.5">
                    {/* Node Specific Content */}
                    <div className="space-y-2 text-sm text-slate-600">
                        {data.instruction && (
                            <div className="bg-white/80 p-2 rounded border border-black/5 line-clamp-2 italic">
                                "{data.instruction}"
                            </div>
                        )}

                        {data.prompt && (
                            <div className="bg-white/80 p-2 rounded border border-black/5 line-clamp-2 italic">
                                "{data.prompt}"
                            </div>
                        )}

                        {data.conditionValue && (
                            <div className="flex items-center gap-1.5 bg-yellow-100/50 p-1.5 rounded text-yellow-800 font-medium">
                                <Brain className="w-3 h-3" />
                                Logic: {data.conditionValue}
                            </div>
                        )}

                        {/* Badges for Metadata */}
                        <div className="flex flex-wrap gap-1 mt-2">
                            {data.modelProvider && (
                                <Badge variant="outline" className="text-xs h-5 bg-white/50">
                                    {data.modelProvider}
                                </Badge>
                            )}

                            {data.temperature !== undefined && (
                                <Badge variant="outline" className="text-xs h-5 bg-white/50">
                                    Temp: {data.temperature}
                                </Badge>
                            )}

                            {data.timeout && (
                                <Badge variant="outline" className="text-xs h-5 bg-white/50 border-orange-200 text-orange-700">
                                    ⏱ {data.timeout}s
                                </Badge>
                            )}

                            {data.method && (
                                <Badge variant="outline" className="text-xs h-5 bg-white/50 font-mono">
                                    {data.method}
                                </Badge>
                            )}

                            {data.functionName && (
                                <Badge variant="outline" className="text-xs h-5 bg-white/50 font-mono border-cyan-200 text-cyan-700">
                                    fn: {data.functionName}
                                </Badge>
                            )}

                            {data.difficulty && (
                                <Badge variant="outline" className={cn(
                                    "text-xs h-5 capitalize bg-white/50",
                                    data.difficulty === 'hard' ? 'text-red-600 border-red-200' :
                                        data.difficulty === 'medium' ? 'text-yellow-600 border-yellow-200' : 'text-green-600 border-green-200'
                                )}>
                                    {data.difficulty}
                                </Badge>
                            )}

                            {/* I/O Badges */}
                            {data.inputKeys && (
                                <Badge variant="secondary" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-100">
                                    IN: {data.inputKeys}
                                </Badge>
                            )}
                            {data.outputKeys && (
                                <Badge variant="secondary" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-100">
                                    OUT: {data.outputKeys}
                                </Badge>
                            )}

                            {/* DeepEval Metrics Badges */}
                            {data.evalProvider === 'deepeval' && data.metrics?.length > 0 && (
                                <>
                                    {data.metrics.slice(0, 2).map((metric: string) => (
                                        <Badge key={metric} variant="secondary" className="text-[10px] h-5 bg-purple-100 text-purple-700 border-purple-200">
                                            {metric.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} &gt; {data.threshold || 0.7}
                                        </Badge>
                                    ))}
                                    {data.metrics.length > 2 && (
                                        <Badge variant="secondary" className="text-[10px] h-5 bg-purple-50 text-purple-600 border-purple-100">
                                            +{data.metrics.length - 2} metrics
                                        </Badge>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Output Handle */}
            {data.type !== 'output' && (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="w-5 h-5 !bg-white !border-[4px] !border-slate-400 z-50 transition-all hover:!border-[#D13138] hover:scale-125 shadow-sm"
                />
            )}
        </div>
    );
});

CustomNode.displayName = "CustomNode";
