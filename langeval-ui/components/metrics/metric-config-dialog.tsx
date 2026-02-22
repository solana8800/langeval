"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Metric } from "./metric-card";
import { ImageIcon, Code, UploadCloud } from "lucide-react";

interface MetricConfigDialogProps {
    metric: Metric | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (id: string, config: any) => void;
}

export function MetricConfigDialog({ metric, open, onOpenChange, onSave }: MetricConfigDialogProps) {
    const [configValue, setConfigValue] = useState(metric?.config?.reference || "");

    if (!metric) return null;

    const handleSave = () => {
        onSave(metric.id, { reference: configValue });
        onOpenChange(false);
    };

    const renderContent = () => {
        if (metric.category === 'Images') {
            return (
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> Reference Image / Prompt
                        </Label>
                        <Input
                            placeholder="Enter image URL or description..."
                            value={configValue}
                            onChange={(e) => setConfigValue(e.target.value)}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            DeepEval will use this as the ground truth to compare the generated image against.
                        </p>
                    </div>
                    <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center text-slate-400 bg-slate-50 gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                        <UploadCloud className="h-8 w-8" />
                        <span className="text-xs">Drag & drop reference image here</span>
                    </div>
                </div>
            );
        }

        if (metric.category === 'MCP') {
            return (
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Code className="h-4 w-4" /> Expected Schema / Protocol
                        </Label>
                        <Input
                            placeholder="Enter expected tool name or JSON schema..."
                            value={configValue}
                            onChange={(e) => setConfigValue(e.target.value)}
                        />
                    </div>
                </div>
            );
        }

        return <div className="py-4 text-sm text-slate-500">No advanced configuration available for this metric type.</div>;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configure {metric.name}</DialogTitle>
                    <DialogDescription>
                        {metric.description}
                    </DialogDescription>
                </DialogHeader>

                {renderContent()}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-[#D13138] hover:bg-[#b71c1c]">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
