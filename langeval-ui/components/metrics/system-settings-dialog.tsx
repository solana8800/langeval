"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Save, Key } from "lucide-react";

interface SystemSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SystemSettingsDialog({ open, onOpenChange }: SystemSettingsDialogProps) {
    const [activeTab, setActiveTab] = useState("llm");
    const [showApiKey, setShowApiKey] = useState(false);
    const [settings, setSettings] = useState({
        openaiKey: "sk-...",
        anthropicKey: "",
        defaultModel: "gpt-4o",
        temperature: "0.0",
        timeout: "60"
    });

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        console.log("Saving System Settings:", settings);
        // Trong thực tế sẽ gọi API lưu xuống server/localStorage
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>System Evaluation Settings</DialogTitle>
                    <DialogDescription>
                        Cấu hình "Giám Khảo AI" (Judge Model) và kết nối API.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="llm">LLM Provider</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>

                    <TabsContent value="llm" className="space-y-4 py-4">
                        <div className="space-y-3">
                            <Label>Default Judge Model</Label>
                            <Select
                                value={settings.defaultModel}
                                onValueChange={(val) => handleChange("defaultModel", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gpt-4o">OpenAI GPT-4o (Recommended)</SelectItem>
                                    <SelectItem value="gpt-4-turbo">OpenAI GPT-4 Turbo</SelectItem>
                                    <SelectItem value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</SelectItem>
                                    <SelectItem value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</SelectItem>
                                    <SelectItem value="vertex-gemini-1.5">Google Vertex Gemini 1.5</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="bg-slate-50 p-3 rounded-md text-[11px] text-slate-600 space-y-2 border border-slate-100">
                                <p>Hệ thống sử dụng cơ chế <strong>LLM-as-a-judge</strong> (Dùng AI chấm điểm AI):</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><strong>Judge Model (GPT-4...):</strong> Đóng vai trò là <em>"Giám Khảo"</em> có trí tuệ để đọc hiểu và đánh giá câu trả lời.</li>
                                    <li><strong>Metrics Library:</strong> Đóng vai trò là <em>"Bộ luật"</em> cung cấp tiêu chí và quy trình để Giám Khảo chấm điểm.</li>
                                </ul>
                                <p className="italic text-slate-500">Khuyên dùng <strong>GPT-4o</strong> để đảm bảo Giám Khảo đủ thông minh để bắt lỗi Agent.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                OpenAI API Key <Key className="h-3 w-3 text-slate-400" />
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showApiKey ? "text" : "password"}
                                    value={settings.openaiKey}
                                    onChange={(e) => handleChange("openaiKey", e.target.value)}
                                    placeholder="sk-..."
                                    className="pr-8"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                Anthropic API Key
                            </Label>
                            <Input
                                type="password"
                                value={settings.anthropicKey}
                                onChange={(e) => handleChange("anthropicKey", e.target.value)}
                                placeholder="sk-ant-..."
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4 py-4">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label>Temperature</Label>
                                <span className="text-xs text-muted-foreground font-mono">{settings.temperature}</span>
                            </div>
                            <Input
                                type="range"
                                min="0" max="1" step="0.1"
                                value={settings.temperature}
                                onChange={(e) => handleChange("temperature", e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                0.0 = Nhất quán nhất (Khuyên dùng cho Evaluation).
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label>Request Timeout (Seconds)</Label>
                            <Input
                                type="number"
                                value={settings.timeout}
                                onChange={(e) => handleChange("timeout", e.target.value)}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)} variant="outline">Cancel</Button>
                    <Button onClick={handleSave} className="bg-[#D13138] hover:bg-[#b71c1c] gap-2">
                        <Save className="h-4 w-4" /> Save Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
