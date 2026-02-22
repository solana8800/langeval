import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TRACE_DETAIL } from '@/lib/mock-data';
import { getServerServiceUrl } from "@/lib/server-api";


const apiUrl = getServerServiceUrl('resource');

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const traceId = params.id;

    try {
        // Forward headers safely
        const headers = new Headers();
        request.headers.forEach((value, key) => {
            if (!['host', 'connection'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        const res = await fetch(
            `${apiUrl}/api/v1/resource/traces/${traceId}`,
            {
                next: { revalidate: 10 },
                headers: headers
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
