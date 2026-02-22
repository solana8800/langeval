import { NextResponse } from 'next/server';
import { getServerServiceUrl } from "@/lib/server-api";


export async function POST(request: Request) {
  const body = await request.json();
  const { agentId, strategy, intensity, language } = body;

  try {
    const resourceUrl = getServerServiceUrl('resource');
    const orchestratorUrl = process.env.ORCHESTRATOR_URL || process.env.ORCHESTRATOR_SERVICE_URL || "http://127.0.0.1:8001";

    // Forward headers safely
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length', 'content-type'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    headers.set("Content-Type", "application/json");

    // 1. Tạo Red Teaming Campaign trong Resource Service
    const resourceResp = await fetch(`${resourceUrl}/resource/red-teaming/campaigns`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        name: `Attack on ${agentId} - ${strategy}`,
        agent_id: agentId,
        strategy: strategy,
        intensity: intensity,
        language: language || "en"
      })
    });

    if (!resourceResp.ok) {
      const errText = await resourceResp.text();
      throw new Error(`Failed to create campaign in Resource Service: ${errText.substring(0, 100)}`);
    }
    const campaign = await resourceResp.json();
    const campaignId = campaign.id;

    // 2. Trigger Orchestrator workflow
    const orchestratorResp = await fetch(`${orchestratorUrl}/orchestrator/red-teaming`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        scenario_id: "red-teaming-generic",
        agent_id: agentId,
        language: language || "en",
        metadata: {
          campaign_id: campaignId,
          strategy: strategy,
          intensity: intensity,
          language: language || "en"
        }
      })
    });

    if (!orchestratorResp.ok) {
      const errText = await orchestratorResp.text();
      throw new Error(`Failed to start orchestrator workflow: ${errText.substring(0, 100)}`);
    }

    return NextResponse.json({
      success: true,
      message: "Red Teaming attack started",
      attackId: campaignId
    });
  } catch (error: any) {
    console.error("Red Teaming Start Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
