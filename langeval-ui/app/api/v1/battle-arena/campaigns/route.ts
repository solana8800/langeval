import { NextResponse } from 'next/server';

const RESOURCE_SERVICE_URL = process.env.RESOURCE_SERVICE_URL || 'http://localhost:8003';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const size = searchParams.get('size') || '10';

    try {
        const res = await fetch(`${RESOURCE_SERVICE_URL}/resource/battle/campaigns?page=${page}&size=${size}`, {
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch campaigns: ${res.statusText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error proxying battle campaigns:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
