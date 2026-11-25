// Permet à `node --test` de résoudre l'alias `@/…` (tsconfig) et les imports
// TypeScript sans extension. Node exécute le .ts nativement (type stripping).
import { register } from "node:module";

register("./alias-hooks.mjs", import.meta.url);
