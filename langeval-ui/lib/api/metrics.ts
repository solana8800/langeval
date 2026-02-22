import { Metric } from "@/components/metrics/metric-card";
import { apiClient } from "@/lib/api-client";

export async function fetchMetrics(): Promise<Metric[]> {
    return apiClient("/resource/metrics-library");
}

export async function createMetric(metric: Metric): Promise<Metric> {
    return apiClient("/resource/metrics-library", {
        method: "POST",
        body: JSON.stringify(metric),
    });
}

export async function updateMetric(id: string, updates: Partial<Metric>): Promise<Metric> {
    return apiClient(`/resource/metrics-library/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
    });
}

export async function deleteMetric(id: string): Promise<void> {
    return apiClient(`/resource/metrics-library/${id}`, {
        method: "DELETE",
    });
}

export async function seedMetrics(metrics: Metric[]): Promise<Metric[]> {
    return apiClient("/resource/metrics-library/seed", {
        method: "POST",
        body: JSON.stringify(metrics),
    });
}
