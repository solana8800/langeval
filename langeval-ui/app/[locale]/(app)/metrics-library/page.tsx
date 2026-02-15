"use client";

import { useState, useEffect } from "react";
import { Metric, MetricCard } from "@/components/metrics/metric-card";
import { CreateMetricDialog } from "@/components/metrics/create-metric-dialog";
import { MetricConfigDialog } from "@/components/metrics/metric-config-dialog";
import { SystemSettingsDialog } from "@/components/metrics/system-settings-dialog";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, Info, Lightbulb, Settings2, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { INITIAL_METRICS } from "@/lib/data/mock-metrics";
import { fetchMetrics, updateMetric, createMetric, seedMetrics } from "@/lib/api/metrics";
import { toast } from "sonner";

export default function MetricsLibraryPage() {
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
    const [configOpen, setConfigOpen] = useState(false);
    const [systemSettingsOpen, setSystemSettingsOpen] = useState(false);
    const [showInfo, setShowInfo] = useState(true);
    const [showUsageGuide, setShowUsageGuide] = useState(true);

    const categories = ["Custom Metrics", "RAG", "Agentic", "Multi-Turn", "MCP", "Safety", "Non-LLM", "Images", "Others"];

    // Load Metrics
    const loadMetrics = async () => {
        setIsLoading(true);
        try {
            const data = await fetchMetrics();
            if (data.length === 0) {
                // Auto seed for demo if empty (Optional, or leave button to do it)
                // setMetrics([]); 
            }
            setMetrics(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load metrics");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();
    }, []);

    const handleSeed = async () => {
        setIsLoading(true);
        try {
            const seeded = await seedMetrics(INITIAL_METRICS);
            setMetrics(seeded);
            toast.success("Metrics seeded successfully");
        } catch (error) {
            toast.error("Failed to seed metrics");
        } finally {
            setIsLoading(false);
        }
    }

    const handleToggle = async (id: string, enabled: boolean) => {
        // Optimistic update
        setMetrics(prev => prev.map(m => m.id === id ? { ...m, enabled } : m));
        try {
            await updateMetric(id, { enabled });
        } catch (error) {
            // Revert on failure
            setMetrics(prev => prev.map(m => m.id === id ? { ...m, enabled: !enabled } : m));
            toast.error("Failed to update metric status");
        }
    };

    const handleThresholdChange = async (id: string, value: number) => {
        // Optimistic update (debounce recommended for real app, direct for now)
        setMetrics(prev => prev.map(m => m.id === id ? { ...m, threshold: value } : m));
        // Need debounce here ideally, or simple save on interaction end. For now, we update.
        try {
            await updateMetric(id, { threshold: value });
        } catch (error) {
            toast.error("Failed to update threshold");
        }
    };

    const handleOpenConfig = (metric: Metric) => {
        setSelectedMetric(metric);
        setConfigOpen(true);
    };

    const handleSaveConfig = async (id: string, config: any) => {
        setMetrics(prev => prev.map(m => m.id === id ? { ...m, config } : m));
        try {
            await updateMetric(id, { config });
            toast.success("Configuration saved.");
        } catch (error) {
            toast.error("Failed to save configuration");
        }
    };

    const handleAddMetric = async (newMetric: Metric) => {
        try {
            const created = await createMetric(newMetric);
            setMetrics(prev => [created, ...prev]);
            toast.success("New metric created");
        } catch (error) {
            toast.error("Failed to create metric");
        }
    };

    const filteredMetrics = metrics.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === "all" || m.category === activeTab;
        return matchesSearch && matchesTab;
    });

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Header */}
            <header className="flex flex-col border-b bg-white shrink-0">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-4 md:px-6">
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-slate-900">Metrics Library</h1>
                        <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1 md:line-clamp-none">Quản lý và cấu hình các tiêu chuẩn đánh giá cho AI Agent.</p>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none gap-2 text-slate-600 text-xs md:text-sm h-9"
                            title="Cấu hình Model chấm điểm & API Keys"
                            onClick={() => setSystemSettingsOpen(true)}
                        >
                            <Settings2 className="h-3.5 w-3.5" /> <span className="inline">System Settings</span>
                        </Button>
                        <CreateMetricDialog onSave={handleAddMetric} />
                    </div>
                </div>

                {/* Intro Alert */}
                <div className="px-4 md:px-6 pb-4 space-y-3">
                    {/* Usage Guide Alert */}
                    <div className="bg-amber-50 border border-amber-100 rounded-md p-3 transition-all duration-200 mb-0.5">
                        <div
                            className="flex gap-3 cursor-pointer items-start"
                            onClick={() => setShowUsageGuide(!showUsageGuide)}
                        >
                            <div className="shrink-0 pt-0.5">
                                <Lightbulb className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-amber-800 uppercase select-none">Hướng dẫn Chọn Metric (Best Practices)</h4>
                                    {showUsageGuide ? <ChevronUp className="h-4 w-4 text-amber-500" /> : <ChevronDown className="h-4 w-4 text-amber-500" />}
                                </div>

                                {showUsageGuide && (
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                        <div>
                                            <h5 className="text-[11px] font-bold text-amber-800 mb-1">🔴 Global (Toàn bộ hội thoại)</h5>
                                            <ul className="text-[11px] text-amber-700 space-y-1 list-disc pl-3">
                                                <li><strong>Faithfulness:</strong> Chống ảo giác (Hallucination), sai sự thật.</li>
                                                <li><strong>Answer Relevance:</strong> Đảm bảo trả lời đúng trọng tâm.</li>
                                                <li><strong>Safety:</strong> Kiểm duyệt nội dung độc hại.</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 className="text-[11px] font-bold text-amber-800 mb-1">🟠 Expectation (Theo từng Task)</h5>
                                            <ul className="text-[11px] text-amber-700 space-y-1 list-disc pl-3">
                                                <li><strong>Summarization:</strong> Dùng cho task tóm tắt văn bản.</li>
                                                <li><strong>Contextual Precision:</strong> Dùng cho task RAG (Tra cứu dữ liệu).</li>
                                                <li><strong>Custom G-Eval:</strong> Kiểm tra format JSON, tone giọng,...</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-md p-3 transition-all duration-200 mt-3">
                        <div
                            className="flex gap-3 cursor-pointer items-start"
                            onClick={() => setShowInfo(!showInfo)}
                        >
                            <div className="shrink-0 pt-0.5">
                                <Info className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-blue-800 uppercase select-none">Cơ chế hoạt động (Architecture)</h4>
                                    {showInfo ? <ChevronUp className="h-4 w-4 text-blue-500" /> : <ChevronDown className="h-4 w-4 text-blue-500" />}
                                </div>

                                {showInfo && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-600 leading-relaxed text-justify">
                                        <span className="font-semibold text-[#D13138]">Insights:</span> Hầu hết các metrics định sẵn đều sử dụng phương pháp <strong>LLM-as-a-judge</strong> (QAG, DAG, G-Eval) để chấm điểm câu trả lời.
                                        Tất cả metrics đều trả về kết quả thang điểm từ <strong>0-1</strong>. Một test case được coi là "Pass" nếu điểm số &ge; ngưỡng (mặc định là <strong>0.5</strong>).
                                    </div>
                                )}

                                {showInfo && (
                                    <ul className="text-[11px] text-blue-700 space-y-1 list-disc pl-3 leading-relaxed mt-2 animate-in fade-in slide-in-from-top-1">
                                        <li><strong>Metrics Library:</strong> Hoạt động như một thư viện Python chạy ngầm bên trong <code>Evaluation Worker</code> (Local Container).</li>
                                        <li><strong>Data Privacy:</strong> Tuyệt đối <strong>không gửi dữ liệu</strong> lên Cloud của bên thứ ba (trừ khi được cấu hình explicit).</li>
                                        <li><strong>Observability:</strong> Kết quả chấm điểm (Score) sẽ được đẩy trực tiếp về <strong>Langfuse (Self-hosted)</strong> và Database nội bộ để lưu trữ và phân tích.</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="px-4 md:px-6 py-4 flex flex-col gap-4 shrink-0">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            className="pl-9 bg-white"
                            placeholder="Tìm kiếm metrics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-auto overflow-x-auto">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="bg-white border w-full md:w-auto justify-start">
                                <TabsTrigger value="all">Tất cả</TabsTrigger>
                                {categories.map(cat => (
                                    <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
                {filteredMetrics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredMetrics.map(metric => (
                            <MetricCard
                                key={metric.id}
                                metric={metric}
                                onToggle={handleToggle}
                                onThresholdChange={handleThresholdChange}
                                onConfigure={handleOpenConfig}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        {isLoading ? (
                            <div className="flex flex-col items-center">
                                <RefreshCw className="h-8 w-8 animate-spin mb-2 opacity-50" />
                                <p>Đang tải metrics...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <Search className="h-12 w-12 mb-2 opacity-20" />
                                <p>Không tìm thấy metric nào.</p>
                                {metrics.length === 0 && (
                                    <Button variant="outline" onClick={handleSeed}>
                                        <RefreshCw className="mr-2 h-4 w-4" /> Khôi phục Mặc định (Seed)
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <MetricConfigDialog
                metric={selectedMetric}
                open={configOpen}
                onOpenChange={setConfigOpen}
                onSave={handleSaveConfig}
            />

            <SystemSettingsDialog
                open={systemSettingsOpen}
                onOpenChange={setSystemSettingsOpen}
            />
        </div>
    );
}