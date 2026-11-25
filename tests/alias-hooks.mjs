import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = new URL("../src/", import.meta.url);
const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function resolveFile(baseUrl) {
  const basePath = fileURLToPath(baseUrl);
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = basePath + suffix;
    if (suffix === "" ? /\.(m?js|tsx?)$/.test(candidate) && existsSync(candidate) : existsSync(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const url = resolveFile(new URL(specifier.slice(2), SRC));
    if (url) return { url, shortCircuit: true };
  } else if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL?.startsWith("file:")
  ) {
    const url = resolveFile(new URL(specifier, context.parentURL));
    if (url) return { url, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
