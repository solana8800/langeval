import { NextResponse } from 'next/server';
import { mockKnowledgeBases } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const resourceServiceUrl = process.env.RESOURCE_SERVICE_URL || 'http://localhost:8003';
        console.log(`[KB_API] Fetching KBs from ${resourceServiceUrl}/knowledge-bases`);

        // Timeout 3s
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${resourceServiceUrl}/resource/knowledge-bases`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
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
        console.log(`[KB_API] Received ${kbs.length} KBs`);

        // Map Backend to Frontend
        const mappedKBs = kbs.map((kb: any) => ({
            id: kb.id,
            name: kb.name,
            doc_count: 0, // Backend might not have this yet
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
