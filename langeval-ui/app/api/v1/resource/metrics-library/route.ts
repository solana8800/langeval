import { NextResponse } from 'next/server';
import { mockMetrics } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const resourceServiceUrl = process.env.RESOURCE_SERVICE_URL || 'http://127.0.0.1:8003';

        // Forward headers safely
        const headers = new Headers();
        request.headers.forEach((value, key) => {
            if (!['host', 'connection'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${resourceServiceUrl}/api/v1/resource/metrics-library`, {
            cache: 'no-store',
            headers: headers,
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
