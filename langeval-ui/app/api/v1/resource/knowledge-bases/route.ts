import { NextResponse } from 'next/server';
import { mockKnowledgeBases } from '@/lib/mock-data';
import { getServerServiceUrl } from "@/lib/server-api";


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const resourceServiceUrl = getServerServiceUrl('resource');

        // Forward headers safely
        const headers = new Headers();
        request.headers.forEach((value, key) => {
            if (!['host', 'connection'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${resourceServiceUrl}/api/v1/resource/knowledge-bases`, {
            cache: 'no-store',
            headers: headers,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            console.warn(`[KB_API] Backend unreachable (${res.status}). Using Mock.`);
            return NextResponse.json({
                data: mockKnowledgeBases,
                meta: { source: "mock", reason: `Backend ${res.status}` }
            });
        }

        const data = await res.json();
        const kbs = data.items || [];

        // Map Backend to Frontend
        const mappedKBs = kbs.map((kb: any) => ({
            id: kb.id,
            name: kb.name,
            doc_count: 0,
            status: "synced",
            type: kb.chunking_strategy || "file"
        }));

        return NextResponse.json({ data: mappedKBs, meta: { source: "backend" } });

    } catch (error) {
        console.warn(`[KB_API] Error: ${error}. Using Mock.`);
        return NextResponse.json({
            data: mockKnowledgeBases,
            meta: { source: "mock", reason: String(error) }
        });
    }
}
