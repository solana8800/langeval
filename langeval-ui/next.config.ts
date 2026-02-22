import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/docs/**/*': ['./docs/**/*'],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  async rewrites() {
    const remoteIp = process.env.REMOTE_IP;

    // Helper to get base URL: either remote IP gateway or localhost with port
    const getUrl = (service: string, localPort: number) => {
      if (remoteIp) {
        // Remote calls go through Nginx Gateway
        return `http://${remoteIp}`;
      }
      // Local calls hit 127.0.0.1 directly to avoid IPv6 issues on Mac
      return `http://127.0.0.1:${localPort}`;
    };

    const identityUrl = getUrl('identity', 8002);
    const orchestratorUrl = getUrl('orchestrator', 8001);
    const genAiUrl = getUrl('gen-ai', 8006);
    const billingUrl = getUrl('billing', 8009);

    return [
      // Identity Service
      {
        source: '/api/v1/identity/:path*',
        destination: `${identityUrl}/identity/:path*`,
      },
      // Identity Service - Direct mappings
      {
        source: '/api/v1/auth/:path*',
        destination: `${identityUrl}/api/v1/auth/:path*`,
      },
      {
        source: '/api/v1/workspaces',
        destination: `${identityUrl}/api/v1/workspaces`,
      },
      {
        source: '/api/v1/workspaces/:path*',
        destination: `${identityUrl}/api/v1/workspaces/:path*`,
      },
      {
        source: '/api/v1/invites',
        destination: `${identityUrl}/api/v1/invites`,
      },
      {
        source: '/api/v1/invites/:path*',
        destination: `${identityUrl}/api/v1/invites/:path*`,
      },
      // Orchestrator Service
      {
        source: '/api/v1/orchestrator/:path*',
        destination: `${orchestratorUrl}/orchestrator/:path*`,
      },
      // Resource Service - Handled by App Router Proxy at app/api/v1/resource/route.ts
      // {
      //   source: '/api/v1/resource/:path*',
      //   destination: `${resourceUrl}/:path*`,
      // },
      // Gen AI Service
      {
        source: '/api/v1/gen-ai/:path*',
        destination: `${genAiUrl}/gen-ai/:path*`,
      },
      // Billing Service
      {
        source: '/api/v1/billing/:path*',
        destination: `${billingUrl}/api/v1/billing/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
