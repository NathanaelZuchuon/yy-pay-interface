import type { NextConfig } from "next";
import { readFileSync } from "node:fs";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || undefined;

// Version affichée dans le pied de page : celle du package.json, sauf surcharge
// explicite (ex. numéro de build CI) via NEXT_PUBLIC_APP_VERSION.
if (!process.env.NEXT_PUBLIC_APP_VERSION) {
  const pkg = JSON.parse(readFileSync("./package.json", "utf8")) as { version?: string };
  process.env.NEXT_PUBLIC_APP_VERSION = pkg.version ?? "";
}

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  reactCompiler: true,
};

export default nextConfig;
