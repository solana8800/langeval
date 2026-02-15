import { NextResponse } from 'next/server';
import { failureDetail } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ data: failureDetail }, { headers: { 'x-source': 'mock' } });
}
