import { NextResponse } from "next/server";
import { getServerServiceUrl } from "@/lib/server-api";


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const backendUrl = getServerServiceUrl('resource');

        // Forward headers safely
        const headers = new Headers();
        req.headers.forEach((value, key) => {
            if (!['host', 'connection', 'content-length', 'content-type'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });
        headers.set("Content-Type", "application/json");

        const res = await fetch(`${backendUrl}/api/v1/resource/scenarios/generate-ai`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errorText = await res.text();
            return NextResponse.json({ error: errorText || "AI Generation failed on backend" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error(`[AI API Proxy] Error:`, error);
        return NextResponse.json({ error: error.message || "Failed to proxy AI request" }, { status: 500 });
    }
}
