import { NextResponse } from 'next/server';
import { aiAgents } from '@/lib/mock-data'; // Fallback Data
import { getServerServiceUrl } from "@/lib/server-api";


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const resourceServiceUrl = getServerServiceUrl('resource');

    // Timeout-bound fetch 
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased Timeout to 5s

    // Forward headers
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");

    const res = await fetch(`${resourceServiceUrl}/api/v1/resource/agents?${queryString}`, {
      cache: 'no-store',
      headers: headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[AgentsAPI] Backend unreachable/error (${res.status}). Using Mock Data.`);
      // Return Mock Data on HTTP Error
      return NextResponse.json({
        data: aiAgents,
        meta: { source: "mock", reason: `Backend ${res.status}` }
      });
    }

    const data = await res.json();
    const agents = data.items || [];

    // Pass through all fields from backend, including Langfuse config
    const mappedAgents = agents.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: agent.type || "RAG Chatbot",
      version: agent.version || "v1.0.0",
      status: agent.status || "active",
      endpoint_url: agent.endpoint_url || "",
      repo_url: agent.repo_url || "",
      // Langfuse fields
      langfuse_project_id: agent.langfuse_project_id,
      langfuse_project_name: agent.langfuse_project_name,
      langfuse_org_id: agent.langfuse_org_id,
      langfuse_org_name: agent.langfuse_org_name,
      // Legacy fields for backward compatibility
      repoUrl: agent.repo_url || "",
      webhookUrl: agent.endpoint_url || "",
      secretKey: agent.api_key_encrypted || "**********",
      // Pass-through for new UI
      api_key_encrypted: agent.api_key_encrypted,
      meta_data: agent.meta_data
    }));

    return NextResponse.json({ data: mappedAgents, meta: { source: "backend" } });

  } catch (error) {
    console.warn("[AgentsAPI] Fetch failed. Using Mock Data. Error:", error);
    // Return Mock Data on Network Error / Timeout
    return NextResponse.json({
      data: aiAgents,
      meta: { source: "mock", reason: String(error) }
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resourceServiceUrl = getServerServiceUrl('resource');

    // Forward headers
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");
    headers.set("Content-Type", "application/json");

    const res = await fetch(`${resourceServiceUrl}/api/v1/resource/agents`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.text();
      return NextResponse.json({ error: "Backend failed", details: errorData }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error("[AgentsAPI] Create failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
