import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // Allow the sandbox preview gateway (and any space-z.ai preview host) to load
  // Next.js dev static resources. Without this, Turbopack blocks cross-origin
  // requests to /_next/static/chunks/* with a warning and the preview panel
  // shows a blank/broken page.
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "*.space-z.ai",
    "space-z.ai",
  ],
};

export default nextConfig;
