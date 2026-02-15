"use client";

import React from 'react';
import { Label } from "@/components/ui/label";
import { INITIAL_METRICS } from "@/lib/data/mock-metrics";
import { Metric } from '@/components/metrics/metric-card';

interface PolicySelectorProps {
    selectedMetrics: string[];
    onSelectionChange: (metrics: string[]) => void;
    className?: string;
}

export function PolicySelector({ selectedMetrics = [], onSelectionChange, className }: PolicySelectorProps) {
    // Group metrics by category
    const groupedMetrics = INITIAL_METRICS.reduce((acc, metric) => {
        if (!acc[metric.category]) acc[metric.category] = [];
        acc[metric.category].push(metric);
        return acc;
    }, {} as Record<string, Metric[]>);

    const handleToggle = (metricId: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedMetrics, metricId]);
        } else {
            onSelectionChange(selectedMetrics.filter(id => id !== metricId));
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {Object.entries(groupedMetrics).map(([category, metrics]) => (
                    <div key={category} className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-700">{category}</Label>
                        <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                            {metrics.map(metric => (
                                <div key={metric.id} className="flex items-start space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`metric-${metric.id}`}
                                        className="mt-1 h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={selectedMetrics.includes(metric.id)}
                                        onChange={(e) => handleToggle(metric.id, e.target.checked)}
                                    />
                                    <div className="flex flex-col">
                                        <label
                                            htmlFor={`metric-${metric.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700"
                                        >
                                            {metric.name}
                                        </label>
                                        <p className="text-[10px] text-muted-foreground line-clamp-2" title={metric.description}>
                                            {metric.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
