import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TRACE_DETAIL } from '@/lib/mock-data';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8003';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const traceId = params.id;

    try {
        const res = await fetch(
            `${BACKEND_URL}/resource/traces/${traceId}`,
            {
                next: { revalidate: 10 },
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!res.ok) {
            throw new Error(`Backend returned ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error(`Error fetching trace ${traceId}:`, error);

        // Fallback to mock data từ lib
        return NextResponse.json({
            data: {
                ...MOCK_TRACE_DETAIL,
                id: traceId  // Override với trace ID thực tế
            },
            source: "mock",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
