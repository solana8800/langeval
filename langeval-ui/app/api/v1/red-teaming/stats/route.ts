import { NextResponse } from 'next/server';

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
    const resourceUrl = process.env.RESOURCE_SERVICE_URL || "http://localhost:8003";
    // Lấy stats từ endpoint chuyên biệt
    const statsResp = await fetch(`${resourceUrl}/resource/red-teaming/campaigns/${campaignId}/stats`, {
      cache: 'no-store'
    });
    // Lấy thêm status/progress từ campaign detail
    const detailResp = await fetch(`${resourceUrl}/resource/red-teaming/campaigns/${campaignId}`, {
      cache: 'no-store'
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
