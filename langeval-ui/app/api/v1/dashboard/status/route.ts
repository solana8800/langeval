import { NextResponse } from 'next/server';
import { releaseStatus } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    stage: "Beta Testing",
    progress: 75,
    blockers: 2,
    target_date: "2024-12-25",
    details: releaseStatus
  }, { headers: { 'x-source': 'mock' } });
}
