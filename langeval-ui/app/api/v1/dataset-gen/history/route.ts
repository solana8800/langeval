
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json([
        { id: 1, date: "2023-10-25", topic: "Chính sách bảo hành", quantity: 50, status: "completed" },
        { id: 2, date: "2023-10-26", topic: "Hướng dẫn sử dụng Tesla", quantity: 120, status: "processing" }
    ]);
}
