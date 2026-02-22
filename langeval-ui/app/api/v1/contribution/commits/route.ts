
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json([
        { id: 1, message: "Thêm thông số sạc VF9", time: "2p trước", author: "Nguyen Van A" },
        { id: 2, message: "Cập nhật chính sách bảo hành Pin", time: "1h trước", author: "Tran Thi B" }
    ]);
}
