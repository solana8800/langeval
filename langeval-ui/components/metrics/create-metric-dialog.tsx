"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkles } from "lucide-react";
import { Metric } from "./metric-card";

interface CreateMetricDialogProps {
    onSave: (metric: Metric) => void;
}

export function CreateMetricDialog({ onSave }: CreateMetricDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [criteria, setCriteria] = useState("");

    const handleSave = () => {
        const newMetric: Metric = {
            id: `custom_${Date.now()}`,
            name,
            description,
            category: "Custom Metrics",
            enabled: true,
            threshold: 0.7,
            isCustom: true
        };
        onSave(newMetric);
        setOpen(false);
        // Reset form
        setName("");
        setDescription("");
        setCriteria("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#D13138] hover:bg-[#b71c1c] text-white gap-2 text-xs h-9">
                    <Plus className="h-3.5 w-3.5" /> Thêm Metric Mới
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Tạo Custom Metric (G-Eval)</DialogTitle>
                    <DialogDescription>
                        Định nghĩa tiêu chí đánh giá riêng bằng ngôn ngữ tự nhiên. AI sẽ dùng tiêu chí này để chấm điểm.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-xs uppercase text-slate-500">
                            Tên Metric
                        </Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="VD: Brand Tone, Politeness..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right text-xs uppercase text-slate-500">
                            Mô tả ngắn
                        </Label>
                        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Mô tả mục đích của metric này..." />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="criteria" className="text-right text-xs uppercase text-slate-500 mt-2">
                            Tiêu chí (Prompt)
                        </Label>
                        <div className="col-span-3">
                            <Textarea
                                id="criteria"
                                value={criteria}
                                onChange={(e) => setCriteria(e.target.value)}
                                className="min-h-[150px] font-mono text-xs"
                                placeholder="Hãy đóng vai giám khảo, chấm điểm câu trả lời dựa trên các tiêu chí sau..."
                            />
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-yellow-500" />
                                AI sẽ dùng prompt này để evaluation reasoning.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                    <Button onClick={handleSave} className="bg-[#D13138] hover:bg-[#b71c1c]">Lưu Metric</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
