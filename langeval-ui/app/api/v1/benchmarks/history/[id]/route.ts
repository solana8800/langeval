import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const orchestratorUrl = process.env.ORCHESTRATOR_URL || "http://127.0.0.1:8001";

        // Forward headers safely
        const headers = new Headers();
        request.headers.forEach((value, key) => {
            if (!['host', 'connection'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        const res = await fetch(`${orchestratorUrl}/api/v1/benchmarks/history/${id}`, {
            method: "GET",
            headers: headers,
        });

        if (!res.ok) {
            const errorText = await res.text();
            return NextResponse.json({ error: errorText }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
