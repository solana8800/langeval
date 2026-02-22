import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    // In a real DB we would delete by ID.
    // Since we are using in-memory variable in another file, keeping state is hard across hot-reloads.
    // For this mock, we just return 204.
    return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
    // Check connection mock
    if (params.id.endsWith('check')) {
        return NextResponse.json({ status: 'connected', latency: '45ms' });
    }
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
