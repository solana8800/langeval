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
    return [
      // Identity Service (Port 8002)
      // Usage: /api/v1/identity/me -> http://localhost:8002/me
      {
        source: '/api/v1/identity/:path*',
        destination: 'http://localhost:8002/:path*',
      },
      // Orchestrator Service (Port 8001)
      // Usage: /api/v1/orchestrator/:path* -> http://localhost:8001/orchestrator/:path*
      {
        source: '/api/v1/orchestrator/:path*',
        destination: 'http://localhost:8001/orchestrator/:path*',
      },
      // Resource Service (Port 8003)
      // Usage: /api/v1/resource/:path* -> http://localhost:8003/resource/:path*
      {
        source: '/api/v1/resource/:path*',
        destination: 'http://localhost:8003/resource/:path*',
      },
      // Fallback or legacy (Optional, can keep or remove if we are sure everything is moved)
      // {
      //   source: '/api/v1/:path*',
      //   destination: 'http://localhost:8003/:path*',
      // },
    ];
  },
};

export default withNextIntl(nextConfig);
