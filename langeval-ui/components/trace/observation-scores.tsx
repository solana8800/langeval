import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

interface ObservationScoresProps {
    observation: any;
}

export function ObservationScores({ observation }: ObservationScoresProps) {
    // Handle both formats:
    // 1. observation.scores = array of score objects
    // 2. observation.output.metrics = object with score/error
    const scoresArray = observation?.scores || [];
    const metricsData = observation?.output?.metrics;

    // Convert metrics object to score format if exists
    const metricsAsScores = metricsData ? [{
        id: `metric-${observation.id}`,
        name: "Evaluation Metrics",
        value: metricsData.score !== undefined ? metricsData.score : 0,
        dataType: "NUMERIC",
        source: "EVAL",
        timestamp: observation.endTime || new Date().toISOString(),
        comment: metricsData.error || undefined,
        observationId: observation.id,
        hasError: !!metricsData.error,
        status: observation.output?.status
    }] : [];

    // Combine both sources
    const scores = [...scoresArray, ...metricsAsScores];

    if (!scores || scores.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500">Chưa có evaluation scores</p>
                    <p className="text-xs text-slate-400 mt-1">Scores sẽ hiển thị khi có đánh giá từ Langfuse</p>
                </div>
            </div>
        );
    }

    const getScoreIcon = (value: number, dataType: string, hasError?: boolean) => {
        if (hasError) {
            return <AlertCircle className="h-4 w-4 text-red-600" />;
        }

        if (dataType === "BOOLEAN") {
            return value === 1 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
                <XCircle className="h-4 w-4 text-red-600" />
            );
        }

        if (dataType === "NUMERIC") {
            return value >= 0.7 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
            ) : value >= 0.4 ? (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
            ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
            );
        }

        return null;
    };

    const getScoreColor = (value: number, dataType: string, hasError?: boolean) => {
        if (hasError) {
            return "bg-red-100 text-red-700 border-red-300";
        }

        if (dataType === "BOOLEAN") {
            return value === 1 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200";
        }

        if (dataType === "NUMERIC") {
            if (value >= 0.7) return "bg-green-50 text-green-700 border-green-200";
            if (value >= 0.4) return "bg-yellow-50 text-yellow-700 border-yellow-200";
            return "bg-red-50 text-red-700 border-red-200";
        }

        return "bg-slate-50 text-slate-700 border-slate-200";
    };

    const formatScoreValue = (score: any) => {
        if (score.hasError) {
            return "Error";
        }

        if (score.dataType === "BOOLEAN") {
            return score.value === 1 ? "Pass" : "Fail";
        }

        if (score.dataType === "NUMERIC") {
            return typeof score.value === 'number' ? score.value.toFixed(3) : score.value;
        }

        return score.value?.toString() || "N/A";
    };

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-700">
                        Evaluation Scores ({scores.length})
                    </h3>
                    <Badge variant="outline" className="text-xs">
                        {observation.type}
                    </Badge>
                </div>

                {scores.map((score: any, index: number) => (
                    <div
                        key={score.id || index}
                        className={`border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow ${score.hasError ? 'border-red-300 bg-red-50/30' : ''
                            }`}
                    >
                        {/* Score Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {getScoreIcon(score.value, score.dataType, score.hasError)}
                                <div>
                                    <h4 className="font-semibold text-sm text-slate-900">{score.name}</h4>
                                    {score.source && (
                                        <p className="text-xs text-slate-500">Source: {score.source}</p>
                                    )}
                                    {score.status && (
                                        <p className="text-xs text-slate-500">Status: {score.status}</p>
                                    )}
                                </div>
                            </div>

                            <div className={`px-3 py-1 rounded-full border font-mono text-sm font-semibold ${getScoreColor(score.value, score.dataType, score.hasError)
                                }`}>
                                {formatScoreValue(score)}
                            </div>
                        </div>

                        {/* Score Details */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-xs">
                            <div>
                                <span className="text-slate-500">Data Type:</span>
                                <span className="ml-2 font-mono text-slate-900">{score.dataType}</span>
                            </div>

                            {score.timestamp && (
                                <div>
                                    <span className="text-slate-500">Timestamp:</span>
                                    <span className="ml-2 font-mono text-slate-900">
                                        {new Date(score.timestamp).toLocaleString('vi-VN')}
                                    </span>
                                </div>
                            )}

                            {score.observationId && (
                                <div className="col-span-2">
                                    <span className="text-slate-500">Observation ID:</span>
                                    <span className="ml-2 font-mono text-xs text-slate-700 break-all">
                                        {score.observationId}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Comment / Error Message */}
                        {score.comment && (
                            <div className={`mt-3 pt-3 border-t ${score.hasError ? 'bg-red-50 -mx-3 -mb-3 px-3 pb-3 rounded-b-lg' : ''}`}>
                                <div className="flex items-start gap-2">
                                    {score.hasError && <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />}
                                    <div>
                                        {score.hasError && (
                                            <p className="text-xs font-semibold text-red-700 mb-1">Error Message:</p>
                                        )}
                                        <p className={`text-xs ${score.hasError ? 'text-red-700 font-mono' : 'text-slate-600 italic'}`}>
                                            {score.hasError ? score.comment : `"${score.comment}"`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* String Value (for categorical scores) */}
                        {score.stringValue && (
                            <div className="mt-2">
                                <Badge variant="secondary" className="text-xs">
                                    {score.stringValue}
                                </Badge>
                            </div>
                        )}
                    </div>
                ))}

                {/* Summary Stats */}
                {scores.length > 1 && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2">Summary</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                                <span className="text-slate-500">Total:</span>
                                <span className="ml-2 font-semibold text-slate-900">{scores.length}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Passed:</span>
                                <span className="ml-2 font-semibold text-green-700">
                                    {scores.filter((s: any) => s.dataType === "BOOLEAN" && s.value === 1).length}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500">Failed:</span>
                                <span className="ml-2 font-semibold text-red-700">
                                    {scores.filter((s: any) => (s.dataType === "BOOLEAN" && s.value === 0) || s.hasError).length}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}
