import { NextResponse } from "next/server";
import { getServerServiceUrl } from "@/lib/server-api";


const apiUrl = getServerServiceUrl('resource');

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        // Forward query params
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => params.append(key, value));

        // Forward headers (especially X-Workspace-ID)
        const headers = new Headers(req.headers);
        headers.delete("host");
        headers.delete("connection");

        const targetUrl = `${apiUrl}/api/v1/resource/scenarios?${params.toString()}`;
        const res = await fetch(targetUrl, {
            headers: headers
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
            agentId: s.agent_id,
            updatedAt: s.updated_at || s.updatedAt || new Date().toISOString(),
            nodes: s.nodes || [],
            nodesCount: Array.isArray(s.nodes) ? s.nodes.length : 0
        }));

        return NextResponse.json({ data: formattedScenarios, meta: { source: "backend-service" } });

    } catch (error) {
        console.error(`[ScenarioAPI] Proxy GET Error:`, error);
        return NextResponse.json({ error: "Failed to fetch scenarios" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Transform frontend camelCase to backend snake_case matches OpenAPI
        const payload = {
            id: body.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
            name: body.name,
            description: body.description,
            agent_id: body.agentId || body.agent_id,
            nodes: body.nodes || [],
            edges: body.edges || [],
            meta_data: body.meta_data || {},
            ...((!body.meta_data && (body.difficulty || body.tags)) && {
                meta_data: {
                    ...(body.difficulty && { difficulty: body.difficulty }),
                    ...(body.tags && { tags: body.tags })
                }
            })
        };

        // Forward headers safely
        const headers = new Headers();
        // Copy only allowed headers or handle known dangerous ones
        req.headers.forEach((value, key) => {
            if (!['host', 'connection', 'content-length', 'content-type'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });
        headers.set("Content-Type", "application/json");

        const targetUrl = `${apiUrl}/api/v1/resource/scenarios`;

        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
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
        return NextResponse.json({
            error: "Failed to create scenario",
            detail: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
