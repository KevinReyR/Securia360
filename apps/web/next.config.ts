import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Playwright uses the loopback address in isolated local and CI runs.
  // This opt-in is development-only and keeps Next.js assets available to
  // the browser without broadening production origins.
  allowedDevOrigins: ["127.0.0.1"],
  agentRules: false,
};

export default nextConfig;
