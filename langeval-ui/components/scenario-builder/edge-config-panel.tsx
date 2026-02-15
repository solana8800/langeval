"use client";

import { useEffect, useState } from "react";
import { Edge } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface EdgeConfigPanelProps {
    edge: Edge | null;
    onClose: () => void;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
}

export function EdgeConfigPanel({ edge, onClose, onUpdate, onDelete }: EdgeConfigPanelProps) {
    const t = useTranslations("ScenarioBuilderPanels.edge");
    const [label, setLabel] = useState("");
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        if (edge) {
            setLabel(typeof edge.label === 'string' ? edge.label : '');
            setAnimated(edge.animated || false);
        }
    }, [edge]);

    if (!edge) return null;

    const handleSave = () => {
        onUpdate(edge.id, { label, animated });
    };

    return (
        <Card className="w-full h-full border-none shadow-none flex flex-col rounded-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-4 border-b">
                <CardTitle className="text-base font-semibold">{t('title')}</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 p-4 space-y-6">
                <div className="space-y-2">
                    <Label>{t('id')}</Label>
                    <Input value={edge.id} disabled className="bg-slate-50 font-mono text-xs" />
                </div>

                <div className="space-y-2">
                    <Label>{t('label')}</Label>
                    <Input
                        placeholder={t('labelPlaceholder')}
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground">{t('labelDesc')}</p>
                </div>

                <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                    <Label htmlFor="animated-mode">{t('animated')}</Label>
                    <Switch
                        id="animated-mode"
                        checked={animated}
                        onCheckedChange={setAnimated}
                    />
                </div>
            </CardContent>

            <div className="p-4 border-t bg-slate-50 space-y-2">
                <Button className="w-full bg-[#D13138] hover:bg-[#b71c1c] text-white" onClick={handleSave}>
                    {t('save')}
                </Button>
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => onDelete(edge.id)}>
                    <Trash2 className="h-4 w-4 mr-2" /> {t('delete')}
                </Button>
            </div>
        </Card>
    );
}
