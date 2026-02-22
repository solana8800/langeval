import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Simulate upload
    return NextResponse.json({ message: "File uploaded", fileId: "file_abc" }, { status: 201 });
}
