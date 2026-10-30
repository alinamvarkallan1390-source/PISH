import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@electric-sql/pglite"],
  eslint: { ignoreDuringBuilds: true },
  // ship the Python SDK files inside the serverless bundle for /sdk/[file]
  outputFileTracingIncludes: {
    "/sdk/[file]": ["./python/**"],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": __dirname,
    };
    return config;
  },
  turbopack: {
    resolveAlias: { "@/*": "./*" },
  },
};

export default nextConfig;
