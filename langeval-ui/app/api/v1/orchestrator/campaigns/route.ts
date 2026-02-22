import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:8001';

    // Forward headers safely
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const res = await fetch(`${orchestratorUrl}/orchestrator/campaigns?${queryString}`, {
      cache: 'no-store',
      headers: headers
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Orchestrator failed" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("[CampaignsAPI] Fetch failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:8001';

    // Forward headers safely
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length', 'content-type'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    headers.set("Content-Type", "application/json");

    const res = await fetch(`${orchestratorUrl}/orchestrator/campaigns`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.text();
      return NextResponse.json({ error: "Orchestrator failed", details: errorData }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error("[CampaignsAPI] Create failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
