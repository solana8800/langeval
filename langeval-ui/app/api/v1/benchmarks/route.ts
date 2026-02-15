
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    data: [
      { name: "MMLU", category: "General Knowledge", score: 86.5, sota: 89.8, progress: 96 },
      { name: "GSM8K", category: "Reasoning", score: 92.0, sota: 95.1, progress: 97 },
      { name: "HumanEval", category: "Coding", score: 76.5, sota: 88.0, progress: 85 }
    ]
  });
}
