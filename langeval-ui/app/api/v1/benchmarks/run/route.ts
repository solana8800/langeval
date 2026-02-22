import { NextResponse } from "next/server";

// Using env variable but falling back to localhost for dev
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orchestratorUrl = process.env.ORCHESTRATOR_URL || "http://127.0.0.1:8001";

    // Forward headers safely
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length', 'content-type'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    headers.set("Content-Type", "application/json");

    // Construct payload for Orchestrator
    const payload = {
      benchmark_id: body.benchmark_id,
      model_id: body.model_id,
      agent_id: body.agent_id,
      openai_key: body.openai_key || ""
    };

    const res = await fetch(`${orchestratorUrl}/api/v1/benchmarks/run`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Orchestrator failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Benchmark run error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
