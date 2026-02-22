import { NextResponse } from "next/server";

// Mock Execution History
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Return empty list or mock data
    return NextResponse.json([]);
}
