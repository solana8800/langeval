import { NextResponse } from 'next/server';
import { delay } from '@/lib/api-utils';

const initialNodes = [
  // 1. Entry Point
  {
    id: 'start',
    position: { x: 400, y: 0 },
    data: {
      label: 'Start: Refund Test',
      category: 'start',
      description: 'Kịch bản kiểm thử luồng hoàn tiền đơn hàng E-commerce.'
    },
    type: 'input',
  },

  // 2. Event Trigger (Advanced)
  {
    id: 'trigger',
    position: { x: 400, y: 200 },
    data: {
      label: 'Trigger: GitHub PR',
      category: 'trigger',
      triggerType: 'webhook',
      webhookSlug: '/webhooks/refund-pr-merge'
    },
  },

  // 3. Simulated User (Basic)
  {
    id: 'persona',
    position: { x: 400, y: 450 },
    data: {
      label: 'Persona: Angry Customer',
      category: 'persona',
      role: 'Khách hàng khó tính',
      prompt: 'Bạn là khách hàng vừa nhận được hàng bị vỡ. Bạn rất tức giận và muốn hoàn tiền ngay lập tức.',
      modelProvider: 'gpt-4o'
    },
  },

  // 4. Task Definition (Basic)
  {
    id: 'task_refund',
    position: { x: 400, y: 700 },
    data: {
      label: 'Task: Request Refund',
      category: 'task',
      instruction: 'Yêu cầu hoàn tiền cho đơn hàng #ORD-2024. Nếu bot từ chối, hãy đe dọa rời bỏ dịch vụ.',
      difficulty: 'hard'
    },
  },

  // 5. Tool Call (Advanced)
  {
    id: 'tool_check_order',
    position: { x: 400, y: 950 },
    data: {
      label: 'Tool: Check Order Status',
      category: 'tool',
      functionName: 'get_order_status',
      endpointUrl: 'https://api.shop.com/v1/orders/ORD-2024',
      method: 'GET',
      outputVar: 'order_data'
    },
  },

  // 6. Data Transformation (Advanced)
  {
    id: 'transform_status',
    position: { x: 400, y: 1200 },
    data: {
      label: 'Transform: Parse JSON',
      category: 'transform',
      transformSpec: 'order_data.status' // Extract status
    },
  },

  // 7. Logic Branching (Logic)
  {
    id: 'condition_delivered',
    position: { x: 400, y: 1450 },
    data: {
      label: 'Check: Is Delivered?',
      category: 'condition',
      logicType: 'keyword',
      conditionValue: 'delivered'
    },
  },

  // Branch A: Delivered -> Process Refund
  // 8. Wait (Logic)
  {
    id: 'wait_process',
    position: { x: 100, y: 1700 },
    data: {
      label: 'Wait: Processing',
      category: 'wait',
      duration: '5'
    },
  },

  // 9. Expectation (Logic + DeepEval)
  {
    id: 'expect_faithfulness',
    position: { x: 100, y: 1950 },
    data: {
      label: 'Expect: Faithful Answer',
      category: 'expectation',
      evalProvider: 'deepeval',
      metrics: ['faithfulness', 'answer_relevancy', 'toxicity'],
      threshold: 0.8,
      severity: 'critical'
    },
  },

  // 10. Code Execution (Advanced)
  {
    id: 'code_validate',
    position: { x: 100, y: 2200 },
    data: {
      label: 'Code: Validate Policy',
      category: 'code',
      language: 'python',
      code: 'def validate(amount):\n  return amount < 1000\n\nresult = validate(refund_amount)',
      inputVars: 'refund_amount',
      outputVars: 'is_valid'
    },
  },

  // 11. End (Advanced)
  {
    id: 'end_success',
    position: { x: 100, y: 2500 },
    data: {
      label: 'End: Test Passed',
      category: 'end',
      outputTemplate: '{"result": "PASS", "score": {{score}}}'
    },
    type: 'output',
  },

  // Branch B: Not Delivered -> Fail
  {
    id: 'end_fail',
    position: { x: 700, y: 1700 },
    data: {
      label: 'End: Invalid Status',
      category: 'end',
      outputTemplate: '{"result": "FAIL", "reason": "Order not delivered"}'
    },
    type: 'output',
  }
];

const initialEdges = [
  { id: 'e1', source: 'start', target: 'trigger', animated: true },
  { id: 'e2', source: 'trigger', target: 'persona', animated: true },
  { id: 'e3', source: 'persona', target: 'task_refund', animated: true },
  { id: 'e4', source: 'task_refund', target: 'tool_check_order', animated: true },
  { id: 'e5', source: 'tool_check_order', target: 'transform_status', animated: true },
  { id: 'e6', source: 'transform_status', target: 'condition_delivered', animated: true },

  // Branch A (True)
  { id: 'e7a', source: 'condition_delivered', target: 'wait_process', label: 'True (Delivered)' },
  { id: 'e8', source: 'wait_process', target: 'expect_faithfulness', animated: true },
  { id: 'e9', source: 'expect_faithfulness', target: 'code_validate', animated: true },
  { id: 'e10', source: 'code_validate', target: 'end_success', animated: true },

  // Branch B (False)
  { id: 'e7b', source: 'condition_delivered', target: 'end_fail', label: 'False (Pending)', style: { stroke: '#ef4444' } },
];

export async function GET() {
  await delay(800);
  return NextResponse.json({
    data: {
      nodes: initialNodes,
      edges: initialEdges
    }
  });
}
