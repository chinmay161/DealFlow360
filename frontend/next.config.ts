import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";

// Explicitly load root repository environment configuration (.env.local, .env, etc.)
const rootDir = path.resolve(__dirname, "..");
loadEnvConfig(rootDir);

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
