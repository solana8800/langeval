import { NextResponse } from 'next/server';
import { getServerServiceUrl } from "@/lib/server-api";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("attackId");

  if (!campaignId) {
    return NextResponse.json({
      critical: 0, high: 0, medium: 0, low: 0,
      successRate: 0, status: "idle", progress: 0
    });
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

    // Lấy stats từ endpoint chuyên biệt
    const statsResp = await fetch(`${resourceUrl}/resource/red-teaming/campaigns/${campaignId}/stats`, {
      cache: 'no-store',
      headers: headers
    });
    // Lấy thêm status/progress từ campaign detail
    const detailResp = await fetch(`${resourceUrl}/resource/red-teaming/campaigns/${campaignId}`, {
      cache: 'no-store',
      headers: headers
    });

    if (!statsResp.ok || !detailResp.ok) throw new Error("Failed to fetch statistics");

    const stats = await statsResp.json();
    const detail = await detailResp.json();

    return NextResponse.json({
      ...stats,
      status: detail.status,
      progress: detail.progress
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
