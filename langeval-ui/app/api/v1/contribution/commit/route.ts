import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Simulate commit
    return NextResponse.json({ message: "Committed successfully" }, { status: 201 });
}
