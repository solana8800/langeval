import { NextResponse } from 'next/server';
import { getServerServiceUrl } from "@/lib/server-api";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaign_id');

  if (!campaignId) {
    return NextResponse.json({ success: false, error: 'campaign_id is required' }, { status: 400 });
  }

  try {
    const resourceServiceUrl = getServerServiceUrl('resource');

    // Forward headers safely
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // 1. Lấy thông tin Campaign để biết stats
    const campaignResp = await fetch(`${resourceServiceUrl}/resource/battle/campaigns/${campaignId}`, {
      headers: headers
    });
    if (!campaignResp.ok) throw new Error('Campaign not found');
    const campaign = await campaignResp.json();

    // 2. Lấy danh sách Turns
    const turnsResp = await fetch(`${resourceServiceUrl}/resource/battle/campaigns/${campaignId}/turns`, {
      headers: headers
    });
    if (!turnsResp.ok) throw new Error('Failed to fetch turns');
    const turns = await turnsResp.json();

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        turns: turns.sort((a: any, b: any) => a.turn_number - b.turn_number)
      }
    });

  } catch (error: any) {
    console.error('Error fetching battle history:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
