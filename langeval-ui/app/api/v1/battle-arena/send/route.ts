import { NextResponse } from 'next/server';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:8001';
const RESOURCE_SERVICE_URL = process.env.RESOURCE_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, agentA, agentB, targetAgent, simulator, maxTurns = 10, language = 'en', scenarioId, instructionInjection, responseOverride } = body;

    // 1. Tạo Battle Campaign trong Resource Service
    const campaignResp = await fetch(`${RESOURCE_SERVICE_URL}/resource/battle/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const orchestratorResp = await fetch(`${ORCHESTRATOR_URL}/orchestrator/battle/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
