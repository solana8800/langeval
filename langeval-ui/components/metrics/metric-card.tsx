"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, Scale, Settings2 } from "lucide-react";
import { useState } from "react";

export interface Metric {
    id: string;
    name: string;
    description: string;
    category: string;
    enabled: boolean;
    threshold: number;
    isCustom?: boolean;
    hasConfig?: boolean;
    config?: any;
}

interface MetricCardProps {
    metric: Metric;
    onToggle: (id: string, enabled: boolean) => void;
    onThresholdChange: (id: string, value: number) => void;
    onConfigure?: (metric: Metric) => void;
}

export function MetricCard({ metric, onToggle, onThresholdChange, onConfigure }: MetricCardProps) {
    const [localThreshold, setLocalThreshold] = useState(metric.threshold);

    const handleSliderChange = (vals: number[]) => {
        setLocalThreshold(vals[0]);
        onThresholdChange(metric.id, vals[0]);
    };

    return (
        <Card className={`flex flex-col h-full border-slate-200 transition-all ${metric.enabled ? 'border-red-200 shadow-sm bg-white' : 'opacity-80 bg-slate-50'}`}>
            <CardHeader className="p-4 pb-2 space-y-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        {metric.isCustom && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50 px-1 py-0 h-4">Custom</Badge>}
                        <CardTitle className={`text-sm font-semibold leading-tight ${metric.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                            {metric.name}
                        </CardTitle>
                    </div>
                    <Switch
                        checked={metric.enabled}
                        onCheckedChange={(checked) => onToggle(metric.id, checked)}
                        className="scale-75 data-[state=checked]:bg-[#D13138]"
                    />
                </div>
                <CardDescription className="text-xs line-clamp-2 h-8">
                    {metric.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="p-4 py-2 flex-1">

            </CardContent>

            <CardFooter className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                <div className="w-full space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1">
                            <Scale className="h-3 w-3" /> Threshold
                        </Label>
                        <div className="flex items-center gap-2">
                            {onConfigure && (metric.category === 'Images' || metric.category === 'MCP') && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 hover:bg-slate-200"
                                    title="Advanced Configuration"
                                    onClick={() => onConfigure(metric)}
                                >
                                    <Settings2 className="h-3 w-3 text-slate-500" />
                                </Button>
                            )}
                            <span className="text-xs font-mono font-medium text-slate-700">{localThreshold}</span>
                        </div>
                    </div>
                    <Slider
                        disabled={!metric.enabled}
                        value={[localThreshold]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={handleSliderChange}
                        className="py-1 cursor-pointer"
                    />
                </div>
            </CardFooter>
        </Card>
    );
}
