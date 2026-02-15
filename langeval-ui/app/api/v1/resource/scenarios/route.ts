import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8003";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        // Forward query params
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => params.append(key, value));

        const res = await fetch(`${BACKEND_URL}/resource/scenarios?${params.toString()}`, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return NextResponse.json(errorData, { status: res.status });
        }

        const data = await res.json();

        // Ensure data is array from paginated response
        const scenarios = data.items || [];
        const formattedScenarios = scenarios.map((s: any) => ({
            ...s,
            // Map backend snake_case to frontend camelCase if needed, or rely on JS flexibility
            // OpenAPI shows: id, name, nodes, edges, agent_id (snake_case)
            // Frontend expects: agentId (camelCase)
            agentId: s.agent_id,
            updatedAt: s.updated_at || s.updatedAt || new Date().toISOString(),
            // Giữ nguyên nodes array để có thể dùng cho các mục đích khác
            nodes: s.nodes || [],
            // Thêm field riêng để đếm số nodes
            nodesCount: Array.isArray(s.nodes) ? s.nodes.length : 0
        }));

        return NextResponse.json({ data: formattedScenarios, meta: { source: "backend-service" } });

    } catch (error) {
        console.error(`[ScenarioAPI] Proxy Error:`, error);
        return NextResponse.json({ error: "Failed to fetch scenarios from backend" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Transform frontend camelCase to backend snake_case matches OpenAPI
        const payload = {
            id: body.id || crypto.randomUUID(), // Generate ID if missing (Backend requirement fallback)
            name: body.name,
            description: body.description,
            agent_id: body.agentId || body.agent_id,
            nodes: body.nodes || [],
            edges: body.edges || [],
            // Gửi meta_data từ frontend (chứa model_id, difficulty, etc.)
            meta_data: body.meta_data || {},
            // Fallback: nếu không có meta_data nhưng có difficulty/tags riêng lẻ
            ...((!body.meta_data && (body.difficulty || body.tags)) && {
                meta_data: {
                    ...(body.difficulty && { difficulty: body.difficulty }),
                    ...(body.tags && { tags: body.tags })
                }
            })
        };

        const res = await fetch(`${BACKEND_URL}/resource/scenarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text(); // Read text first to avoid JSON parse error
            console.error(`[ScenarioAPI] Backend Error (${res.status}):`, errorText);
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(errorJson, { status: res.status });
            } catch {
                return NextResponse.json({ error: errorText || "Unknown Backend Error" }, { status: res.status });
            }
        }

        const newScenario = await res.json();
        return NextResponse.json(newScenario, { status: 201 });

    } catch (error) {
        console.error(`[ScenarioAPI] POST Proxy Error:`, error);
        return NextResponse.json({ error: "Failed to create scenario" }, { status: 500 });
    }
}
