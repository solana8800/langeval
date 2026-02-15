import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8003";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        console.log("[AI API Proxy] Sending request to backend:", `${BACKEND_URL}/resource/scenarios/generate-ai`);

        const res = await fetch(`${BACKEND_URL}/resource/scenarios/generate-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[AI API Proxy] Backend Error (${res.status}):`, errorText);
            return NextResponse.json({ error: errorText || "AI Generation failed on backend" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error(`[AI API Proxy] Error:`, error);
        return NextResponse.json({ error: error.message || "Failed to proxy AI request" }, { status: 500 });
    }
}
