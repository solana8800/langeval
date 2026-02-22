import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Simulate processing
    return NextResponse.json({ message: "Generation started", jobId: "job_123" }, { status: 202 });
}
