import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TRACES } from '@/lib/mock-data';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8003';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId') || '';
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    const cursor = searchParams.get('cursor'); // Thêm cursor parameter

    try {
        const params = new URLSearchParams({
            limit,
            offset,
            ...(agentId && { agent_id: agentId }),
            ...(cursor && { cursor }) // Forward cursor to backend
        });

        const backendUrl = `${BACKEND_URL}/resource/traces?${params.toString()}`;
        console.log('[TRACES API] Fetching from:', backendUrl);
        console.log('[TRACES API] Params:', { agentId, limit, offset, cursor });

        const res = await fetch(
            backendUrl,
            {
                next: { revalidate: 10 },
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log('[TRACES API] Response status:', res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[TRACES API] Error response:', errorText);
            throw new Error(`Backend returned ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        console.log('[TRACES API] Success! Got', data.data?.length || 0, 'traces');
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
