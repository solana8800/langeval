
import { NextResponse } from 'next/server';
import { pipelineLogs } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ data: pipelineLogs }, { headers: { 'x-source': 'mock' } });
}
