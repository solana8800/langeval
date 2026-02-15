import { NextResponse } from 'next/server';
import { delay } from '@/lib/api-utils';

export async function POST(request: Request) {
  await delay(1000);
  const body = await request.json();
  return NextResponse.json({ 
    success: true, 
    message: "Agent created successfully",
    data: {
      id: `agent-${Math.floor(Math.random() * 1000)}`,
      ...body,
      status: 'active',
      version: 'v0.0.1'
    }
  });
}
