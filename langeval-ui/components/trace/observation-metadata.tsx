import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ObservationMetadataProps {
    observation: any;
}

export function ObservationMetadata({ observation }: ObservationMetadataProps) {
    // Calculate duration
    const duration = observation.endTime && observation.startTime
        ? ((new Date(observation.endTime).getTime() - new Date(observation.startTime).getTime()) / 1000).toFixed(2)
        : observation.duration || '0.00';

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-3 text-sm">
                {/* Type and Duration */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Type</span>
                        <span className="font-mono text-slate-900 font-semibold">{observation.type}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Duration</span>
                        <span className="font-mono text-slate-900 font-semibold">{duration}s</span>
                    </div>
                </div>

                <Separator />

                {/* Token Usage */}
                {observation.usage && (
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Token Usage</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {observation.usage.promptTokens && (
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-xs">Prompt</span>
                                    <span className="font-mono text-slate-900">{observation.usage.promptTokens}</span>
                                </div>
                            )}
                            {observation.usage.completionTokens && (
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-xs">Completion</span>
                                    <span className="font-mono text-slate-900">{observation.usage.completionTokens}</span>
                                </div>
                            )}
                            {observation.usage.totalTokens && (
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-xs">Total</span>
                                    <span className="font-mono text-slate-900 font-semibold">{observation.usage.totalTokens}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Cost */}
                {observation.calculatedTotalCost && (
                    <>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-slate-600">Cost</span>
                            <span className="font-mono text-slate-900 font-semibold">${observation.calculatedTotalCost.toFixed(6)}</span>
                        </div>
                    </>
                )}

                {/* Model */}
                {observation.model && (
                    <>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-slate-600">Model</span>
                            <span className="font-mono text-slate-900">{observation.model}</span>
                        </div>
                    </>
                )}

                <Separator />

                {/* Timestamps */}
                <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Timestamps</h4>
                    <div className="space-y-2">
                        {observation.startTime && (
                            <div className="flex justify-between">
                                <span className="text-slate-600">Start</span>
                                <span className="font-mono text-xs text-slate-900">
                                    {new Date(observation.startTime).toLocaleString('vi-VN')}
                                </span>
                            </div>
                        )}
                        {observation.endTime && (
                            <div className="flex justify-between">
                                <span className="text-slate-600">End</span>
                                <span className="font-mono text-xs text-slate-900">
                                    {new Date(observation.endTime).toLocaleString('vi-VN')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Level */}
                {observation.level && (
                    <>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-slate-600">Level</span>
                            <span className="font-mono text-slate-900">{observation.level}</span>
                        </div>
                    </>
                )}

                {/* Status */}
                {observation.statusMessage && (
                    <>
                        <Separator />
                        <div>
                            <span className="text-slate-600">Status</span>
                            <p className="font-mono text-xs text-slate-900 mt-1">{observation.statusMessage}</p>
                        </div>
                    </>
                )}
            </div>
        </ScrollArea>
    );
}
