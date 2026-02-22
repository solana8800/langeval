import { NextResponse } from 'next/server';
import { getServerServiceUrl } from "@/lib/server-api";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, agentA, agentB, targetAgent, simulator, maxTurns = 10, language = 'en', scenarioId, instructionInjection, responseOverride } = body;

    const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:8001';
    const resourceServiceUrl = getServerServiceUrl('resource');

    // Forward headers safely
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length', 'content-type'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    headers.set("Content-Type", "application/json");

    // 1. Tạo Battle Campaign trong Resource Service
    const campaignResp = await fetch(`${resourceServiceUrl}/resource/battle/campaigns`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        mode,
        agent_a_id: agentA,
        agent_b_id: agentB,
        target_agent_id: targetAgent,
        simulator_id: simulator,
        scenario_id: scenarioId,
        max_turns: maxTurns,
        language,
        status: 'pending',
        name: `Battle Arena - ${mode} - ${new Date().toLocaleString('vi-VN')}`,
        metadata: {
          source: 'ui',
          instruction_injection: instructionInjection,
          response_override: responseOverride
        }
      })
    });

    if (!campaignResp.ok) {
      throw new Error(`Failed to create campaign: ${campaignResp.statusText}`);
    }

    const campaign = await campaignResp.json();
    const campaignId = campaign.id;

    // 2. Khởi chạy Workflow trong Orchestrator
    const orchestratorResp = await fetch(`${orchestratorUrl}/orchestrator/battle/start`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        campaign_id: campaignId,
        mode,
        agent_a_id: agentA,
        agent_b_id: agentB,
        target_agent_id: targetAgent,
        simulator_id: simulator,
        scenario_id: scenarioId,
        max_turns: maxTurns,
        language,
        metadata: {
          instruction_injection: instructionInjection,
          response_override: responseOverride
        }
      })
    });

    if (!orchestratorResp.ok) {
      throw new Error(`Failed to start battle in orchestrator: ${orchestratorResp.statusText}`);
    }

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      message: 'Battle started successfully'
    });

  } catch (error: any) {
    console.error('Error starting battle:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
