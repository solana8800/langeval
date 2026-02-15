import { NextResponse } from "next/server";

// Using env variable but falling back to localhost for dev
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || "http://localhost:8001";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Construct payload for Orchestrator
    const payload = {
      benchmark_id: body.benchmark_id,
      model_id: body.model_id,
      agent_id: body.agent_id,
      openai_key: body.openai_key || ""
    };

    console.log("Calling Orchestrator:", `${ORCHESTRATOR_URL}/api/v1/benchmarks/run`, payload);

    const res = await fetch(`${ORCHESTRATOR_URL}/api/v1/benchmarks/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Orchestrator Error:", res.status, errorText);
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
