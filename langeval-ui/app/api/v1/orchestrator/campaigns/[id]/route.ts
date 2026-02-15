import { NextResponse } from 'next/server';

// Force dynamic route
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://localhost:8001';
    
    // Call Orchestrator State API
    const res = await fetch(`${orchestratorUrl}/orchestrator/campaigns/${params.id}/state`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
        if (res.status === 404) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        return NextResponse.json({ error: "Orchestrator error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("[CampaignDetailAPI] Fetch failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
