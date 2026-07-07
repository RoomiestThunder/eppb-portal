import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Minimal self-contained server bundle for the Docker image (see Dockerfile) — traces only the
  // dependencies actually imported instead of shipping all of node_modules.
  output: "standalone",
};

export default nextConfig;
