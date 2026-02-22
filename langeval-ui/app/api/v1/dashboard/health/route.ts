import { NextResponse } from 'next/server';
import { delay } from '@/lib/api-utils';

const healthRadarData = [
  { subject: 'Accuracy', A: 120, fullMark: 150 },
  { subject: 'Safety', A: 98, fullMark: 150 },
  { subject: 'Tone', A: 86, fullMark: 150 },
  { subject: 'Speed', A: 99, fullMark: 150 },
  { subject: 'Cost', A: 85, fullMark: 150 },
];

export async function GET() {
  await delay(300);
  return NextResponse.json({ data: healthRadarData });
}
