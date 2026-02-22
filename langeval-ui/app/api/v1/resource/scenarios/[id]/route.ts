import { NextResponse } from "next/server";
import { MOCK_SCENARIO_DETAILS } from "@/lib/mock-data";
import { getServerServiceUrl } from "@/lib/server-api";


export const dynamic = 'force-dynamic';

const apiUrl = getServerServiceUrl('resource');

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Forward headers safely
        const headers = new Headers();
        req.headers.forEach((value, key) => {
            if (!['host', 'connection'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        // Try backend first
        try {
            const res = await fetch(`${apiUrl}/api/v1/resource/scenarios/${id}`, {
                headers,
                next: { revalidate: 0 }
            });

            if (res.ok) {
                const scenario = await res.json();
                const formatted = {
                    ...scenario,
                    agentId: scenario.agent_id,
                    nodes: scenario.nodes || [],
                    edges: scenario.edges || [],
                    updatedAt: scenario.updated_at
                };
                return NextResponse.json(formatted);
            }
        } catch (backendError) {
            console.warn(`[ScenarioAPI] Backend unavailable for GET:`, backendError);
        }

        const mockScenario = MOCK_SCENARIO_DETAILS[id];
        if (mockScenario) {
            return NextResponse.json(mockScenario);
        }

        return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

    } catch (error) {
        console.error(`[ScenarioAPI] GET Single Error:`, error);
        return NextResponse.json({ error: "Failed to fetch scenario" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        // Forward headers safely
        const headers = new Headers();
        req.headers.forEach((value, key) => {
            if (!['host', 'connection', 'content-length', 'content-type'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });
        headers.set("Content-Type", "application/json");

        // Try backend
        try {
            // First GET existing to merge metadata
            const fetchRes = await fetch(`${apiUrl}/api/v1/resource/scenarios/${id}`, { headers });
            if (!fetchRes.ok) {
                return NextResponse.json({ error: "Scenario not found in backend" }, { status: 404 });
            }
            const existing = await fetchRes.json();

            // Merge metadata: body.meta_data takes precedence, then fallback fields, then existing
            const mergedMetaData = {
                ...(existing.meta_data || {}),
                ...(body.meta_data || {}),
                ...(body.difficulty && { difficulty: body.difficulty }),
                ...(body.language && { language: body.language }),
                ...(body.modelId && { model_id: body.modelId }),
                ...(body.model_id && { model_id: body.model_id }),
            };

            const payload = {
                id: id,
                name: body.name ?? existing.name,
                description: body.description ?? existing.description,
                agent_id: body.agentId ?? body.agent_id ?? existing.agent_id,
                nodes: body.nodes ?? existing.nodes ?? [],
                edges: body.edges ?? existing.edges ?? [],
                meta_data: mergedMetaData
            };

            const res = await fetch(`${apiUrl}/api/v1/resource/scenarios/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                try {
                    return NextResponse.json(JSON.parse(errorText), { status: res.status });
                } catch {
                    return NextResponse.json({ error: errorText }, { status: res.status });
                }
            }

            const updated = await res.json();
            return NextResponse.json(updated);
        } catch (backendError) {
            console.warn(`[ScenarioAPI] Backend error for PUT:`, backendError);
            return NextResponse.json({
                error: "Backend update failed",
                detail: backendError instanceof Error ? backendError.message : String(backendError)
            }, { status: 500 });
        }

    } catch (error) {
        console.error(`[ScenarioAPI] PUT Proxy Error:`, error);
        return NextResponse.json({ error: "Failed to update scenario" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        try {
            const res = await fetch(`${apiUrl}/api/v1/resource/scenarios/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                return NextResponse.json({ error: "Failed delete" }, { status: res.status });
            }

            return NextResponse.json({ success: true });
        } catch (backendError) {
            console.warn(`[ScenarioAPI] Backend unavailable for DELETE, returning mock success:`, backendError);
            return NextResponse.json({ success: true });
        }
    } catch (error) {
        console.error(`[ScenarioAPI] DELETE Error:`, error);
        return NextResponse.json({ error: "Failed to delete scenario" }, { status: 500 });
    }
}
