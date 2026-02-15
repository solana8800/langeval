
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("attackId");

  if (!campaignId) {
    return NextResponse.json([]);
  }

  try {
    const resourceUrl = process.env.RESOURCE_SERVICE_URL || "http://localhost:8003";
    const resp = await fetch(`${resourceUrl}/resource/red-teaming/campaigns/${campaignId}/logs`, {
      cache: 'no-store'
    });
    if (!resp.ok) throw new Error("Failed to fetch logs");
    const data = await resp.json();
    return NextResponse.json(data.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
