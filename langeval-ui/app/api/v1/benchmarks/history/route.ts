import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get("page") || "1";
        const size = searchParams.get("size") || "20";

        const orchestratorUrl = process.env.ORCHESTRATOR_URL || "http://127.0.0.1:8001";

        // Forward headers safely
        const headers = new Headers();
        request.headers.forEach((value, key) => {
            if (!['host', 'connection'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        const res = await fetch(`${orchestratorUrl}/api/v1/benchmarks/history?page=${page}&size=${size}`, {
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
