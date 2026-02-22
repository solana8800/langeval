
import { NextResponse } from 'next/server';
import { getServerServiceUrl } from "@/lib/server-api";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("attackId");

  if (!campaignId) {
    return NextResponse.json([]);
  }

  try {
    const resourceUrl = getServerServiceUrl('resource');

    // Forward headers safely
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const resp = await fetch(`${resourceUrl}/resource/red-teaming/campaigns/${campaignId}/logs`, {
      cache: 'no-store',
      headers: headers
    });
    if (!resp.ok) throw new Error("Failed to fetch logs");
    const data = await resp.json();
    return NextResponse.json(data.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
