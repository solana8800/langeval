import { NextRequest, NextResponse } from "next/server";
import { getServerServiceUrl } from "@/lib/server-api";

export const dynamic = "force-dynamic";

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const resolvedParams = await params;
    const path = resolvedParams.path.join("/");
    const searchParams = request.nextUrl.search;

    const apiUrl = getServerServiceUrl('resource');
    const url = `${apiUrl}/api/v1/resource/${path}${searchParams}`;

    // Forward headers safely
    const headers = new Headers();
    request.headers.forEach((value, key) => {
        if (!['host', 'connection'].includes(key.toLowerCase())) {
            headers.set(key, value);
        }
    });

    try {
        const response = await fetch(url, {
            method: request.method,
            headers: headers,
            body: request.body,
            // @ts-ignore - duplex is needed for streaming bodies in some node versions/nextjs
            duplex: "half",
        });

        console.log(`[Proxy] Response status: ${response.status}`);

        const responseHeaders = new Headers(response.headers);
        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error("[Proxy] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest, ctx: any) {
    return proxy(request, ctx);
}

export async function POST(request: NextRequest, ctx: any) {
    return proxy(request, ctx);
}

export async function PUT(request: NextRequest, ctx: any) {
    return proxy(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: any) {
    return proxy(request, ctx);
}

export async function PATCH(request: NextRequest, ctx: any) {
    return proxy(request, ctx);
}
