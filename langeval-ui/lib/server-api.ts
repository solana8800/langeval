import { API_BASE_URL } from "./api-client";

/**
 * Gets the correct upstream URL for a specific microservice when called from Next.js Server (Route Handlers / Server Components).
 * 
 * Logic:
 * 1. If we are in Production (API_BASE_URL starts with http), we route EVERYTHING through the Nginx API Gateway.
 *    Example: https://api.langeval.space/api/v1
 * 
 * 2. If we are in Local Dev (API_BASE_URL is a relative path like /api/v1), 
 *    Next.js Server cannot use relative paths to fetch itself. 
 *    Instead, we route directly to the specific local Docker containers/ports.
 * 
 * @param service The internal name of the service (e.g., 'identity', 'resource', 'orchestrator')
 * @returns The absolute base URL to use for the server-side fetch.
 */
export function getServerServiceUrl(service: 'identity' | 'resource' | 'orchestrator' | 'gen-ai'): string {
    // Production / Absolute URL fallback (e.g., Vercel)
    if (API_BASE_URL.startsWith('http')) {
        return API_BASE_URL;
    }

    // Local Development fallback (Bypassing Next.js Gateway directly to local services)
    // These ports must match docker-compose.yml host mappings
    switch (service) {
        case 'identity':
            return "http://127.0.0.1:8002/api/v1"; // Identity service runs on 8002 locally
        case 'resource':
            return "http://127.0.0.1:8003"; // Resource service runs on 8003 locally
        case 'orchestrator':
            return "http://127.0.0.1:8001"; // Orchestrator runs on 8001 locally
        case 'gen-ai':
            return "http://127.0.0.1:8006"; // Gen-AI runs on 8006 locally
        default:
            return "http://127.0.0.1:8003"; // Default to resource if unknown
    }
}
