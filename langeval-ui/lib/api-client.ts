import { getSession } from "next-auth/react";

// Priority: Absolute URL from Vercel > Committed Base URL > Fallback
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const API_BASE_URL = (rawApiUrl?.startsWith('http') ? rawApiUrl : rawBaseUrl) || rawApiUrl || "/api/v1";

// Disable demo mode by default if an absolute production API is configured
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (!rawApiUrl || rawApiUrl.includes('localhost'));


interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

export async function apiClient(endpoint: string, options: FetchOptions = {}) {
    const session = await getSession();
    const workspaceId = localStorage.getItem("langeval_current_workspace_id");

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    if (workspaceId) {
        headers["X-Workspace-ID"] = workspaceId;
    }

    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.statusText}`);
    }

    return response.json();
}

// --- Billing APIs ---

export async function getBillingPlans() {
    return apiClient("/billing/plans");
}

export async function getWorkspaceSubscription(workspaceId: string) {
    // Note: workspaceId is passed explicitly or taken from header if not provided
    return apiClient(`/billing/subscription?workspace_id=${workspaceId}`);
}

export async function createCheckoutSession(workspaceId: string, planId: string, isYearly: boolean = false) {
    return apiClient("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ workspace_id: workspaceId, plan_id: planId, is_yearly: isYearly })
    });
}

export async function confirmCheckoutSession(workspaceId: string, subscriptionId: string, planId?: string, isYearly: boolean = false) {
    return apiClient("/billing/checkout/success", {
        method: "POST",
        body: JSON.stringify({
            workspace_id: workspaceId,
            subscription_id: subscriptionId,
            plan_id: planId,
            is_yearly: isYearly
        })
    });
}

export async function getTransactions(workspaceId: string) {
    return apiClient(`/billing/transactions?workspace_id=${workspaceId}`);
}
