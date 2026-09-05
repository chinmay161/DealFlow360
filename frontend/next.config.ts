import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";

// Explicitly load root repository environment configuration (.env.local, .env, etc.)
const rootDir = path.resolve(__dirname, "..");
loadEnvConfig(rootDir);

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
