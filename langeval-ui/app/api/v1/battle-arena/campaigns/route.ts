import { NextResponse } from 'next/server';
import { getServerServiceUrl } from "@/lib/server-api";


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const size = searchParams.get('size') || '10';

    try {
        const resourceServiceUrl = getServerServiceUrl('resource');

        // Forward headers safely
        const headers = new Headers();
        request.headers.forEach((value, key) => {
            if (!['host', 'connection'].includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        const res = await fetch(`${resourceServiceUrl}/resource/battle/campaigns?page=${page}&size=${size}`, {
            cache: 'no-store',
            headers: headers
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
