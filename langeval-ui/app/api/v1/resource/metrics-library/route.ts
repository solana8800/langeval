import { NextResponse } from 'next/server';
import { mockMetrics } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const resourceServiceUrl = process.env.RESOURCE_SERVICE_URL || 'http://localhost:8003';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${resourceServiceUrl}/resource/metrics-library`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            console.warn(`[MetricsAPI] Backend unreachable (${res.status}). Using Mock.`);
            return NextResponse.json(mockMetrics, { headers: { 'x-source': 'mock' } });
        }

        const data = await res.json();
        return NextResponse.json(data, { headers: { 'x-source': 'backend' } });

    } catch (error) {
        console.warn(`[MetricsAPI] Error: ${error}. Using Mock.`);
        return NextResponse.json(mockMetrics, { headers: { 'x-source': 'mock' } });
    }
}
