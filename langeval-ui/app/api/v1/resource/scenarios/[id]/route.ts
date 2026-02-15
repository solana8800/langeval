import { NextResponse } from "next/server";
import { MOCK_SCENARIO_DETAILS } from "@/lib/mock-data";

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8003";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Try backend first
        try {
            const res = await fetch(`${BACKEND_URL}/resource/scenarios/${id}`, {
                next: { revalidate: 0 } // Disable cache for development
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
            console.warn(`[ScenarioAPI] Backend unavailable, using mock data:`, backendError);
        }

        // Fallback to mock data
        const mockScenario = MOCK_SCENARIO_DETAILS[id];
        if (mockScenario) {
            return NextResponse.json(mockScenario);
        }

        // If no mock data exists, return 404
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

        // Try backend
        try {
            const fetchRes = await fetch(`${BACKEND_URL}/resource/scenarios/${id}`);
            if (!fetchRes.ok) {
                return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
            }
            const existing = await fetchRes.json();

            const payload = {
                id: id,
                name: body.name ?? existing.name,
                description: body.description ?? existing.description,
                agent_id: body.agentId ?? body.agent_id ?? existing.agent_id,
                nodes: body.nodes ?? existing.nodes ?? [],
                edges: body.edges ?? existing.edges ?? [],
                // Gửi meta_data từ frontend hoặc giữ nguyên từ existing
                meta_data: body.meta_data ?? existing.meta_data ?? {},
                // Fallback: nếu không có meta_data nhưng có difficulty/tags riêng lẻ
                ...((!body.meta_data && (body.difficulty || body.tags)) && {
                    meta_data: {
                        ...(existing.meta_data || {}),
                        ...(body.difficulty && { difficulty: body.difficulty }),
                        ...(body.tags && { tags: body.tags })
                    }
                })
            };

            const res = await fetch(`${BACKEND_URL}/resource/scenarios/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                // console.error(`[ScenarioAPI] PUT Backend Error (${res.status}):`, errorText);
                try {
                    return NextResponse.json(JSON.parse(errorText), { status: res.status });
                } catch {
                    return NextResponse.json({ error: errorText }, { status: res.status });
                }
            }

            const updated = await res.json();
            return NextResponse.json(updated);
        } catch (backendError) {
            console.warn(`[ScenarioAPI] Backend unavailable for PUT, returning mock success:`, backendError);
            // Return success with the updated data (mock)
            return NextResponse.json({
                ...body,
                id,
                updatedAt: new Date().toISOString()
            });
        }

    } catch (error) {
        // console.error(`[ScenarioAPI] PUT Error:`, error);
        return NextResponse.json({ error: "Failed to update scenario" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        try {
            const res = await fetch(`${BACKEND_URL}/resource/scenarios/${id}`, {
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
