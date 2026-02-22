import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TRACES } from '@/lib/mock-data';
import { getServerServiceUrl } from "@/lib/server-api";


const apiUrl = getServerServiceUrl('resource');

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId') || '';
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    const cursor = searchParams.get('cursor');

    try {
        const params = new URLSearchParams({
            limit,
            offset,
            ...(agentId && { agent_id: agentId }),
            ...(cursor && { cursor })
        });

        const backendUrl = `${apiUrl}/api/v1/resource/traces?${params.toString()}`;

        // Forward headers safely
        const headers = new Headers();
        request.headers.forEach((value, key) => {
            if (!['host', 'connection'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        const res = await fetch(
            backendUrl,
            {
                next: { revalidate: 10 },
                headers: headers
            }
        );

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[TRACES API] Error response:', errorText);
            throw new Error(`Backend returned ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('[TRACES API] Error fetching traces:', error);

        // Fallback to mock data
        return NextResponse.json({
            data: MOCK_TRACES,
            total: 2,
            source: "mock",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
