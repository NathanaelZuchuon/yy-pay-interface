import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || undefined;

const nextConfig: NextConfig = {
  /* config options here */
  ...(basePath ? { basePath } : {}),
  reactCompiler: true,
};

export default nextConfig;


