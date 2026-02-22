
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json([
        { id: 1, name: "Nguyen Van A", email: "a@example.com", role: "ADMIN", avatar: "/avatars/01.png" },
        { id: 2, name: "Tran Thi B", email: "b@example.com", role: "EDITOR", avatar: "/avatars/02.png" }
    ]);
}
