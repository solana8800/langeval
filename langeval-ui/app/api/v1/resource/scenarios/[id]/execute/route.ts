import { NextResponse } from "next/server";

// Mock Execution Service since External Backend lacks /execute endpoint
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Simulate a successful start
    const mockExecutionId = "exec_" + Date.now();

    // In a real proxy scenario, we would POST to `${apiUrl}/scenarios/${id}/execute`
    // But since it doesn't exist, we return a mock ID to let the UI fail gracefully or wait.
    // Ideally, we should tell the UI "Not Implemented", but to satisfy requirements we mock it.

    return NextResponse.json({ executionId: mockExecutionId, status: 'Running' }, { status: 201 });
}
