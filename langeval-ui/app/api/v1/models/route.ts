
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json([
        { id: 1, name: "GPT-4 Turbo", provider: "OpenAI", type: "API", status: "active", usage: "High" },
        { id: 2, name: "Llama 3 Local", provider: "VLLM", type: "Local", status: "active", usage: "Medium" },
        { id: 3, name: "DeepSeek-V3", provider: "DeepSeek", type: "API", status: "active", usage: "Low" }
    ]);
}
