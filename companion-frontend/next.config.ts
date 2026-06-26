import type { NextConfig } from "next";

// Proxy all /api/* calls through this app's own origin to the Spring backend.
// Because the browser only ever talks to the Vercel domain, the JWT cookie the
// backend sets is FIRST-PARTY (not a cross-site cookie), so it survives Safari/
// iOS third-party-cookie blocking. The real backend URL stays server-side.
const BACKEND =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
