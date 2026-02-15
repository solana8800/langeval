import { Metric } from "@/components/metrics/metric-card";

const API_BASE_URL = process.env.NEXT_PUBLIC_RESOURCE_SERVICE_URL || "http://localhost:8003";

export async function fetchMetrics(): Promise<Metric[]> {
    const res = await fetch(`${API_BASE_URL}/resource/metrics-library`);
    if (!res.ok) throw new Error("Failed to fetch metrics");
    return res.json();
}

export async function createMetric(metric: Metric): Promise<Metric> {
    const res = await fetch(`${API_BASE_URL}/resource/metrics-library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metric),
    });
    if (!res.ok) throw new Error("Failed to create metric");
    return res.json();
}

export async function updateMetric(id: string, updates: Partial<Metric>): Promise<Metric> {
    const res = await fetch(`${API_BASE_URL}/resource/metrics-library/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update metric");
    return res.json();
}

export async function deleteMetric(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/resource/metrics-library/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete metric");
}

export async function seedMetrics(metrics: Metric[]): Promise<Metric[]> {
    const res = await fetch(`${API_BASE_URL}/resource/metrics-library/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
    });
    if (!res.ok) throw new Error("Failed to seed metrics");
    return res.json();
}
