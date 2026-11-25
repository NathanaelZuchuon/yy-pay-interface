#!/usr/bin/env node
/**
 * Garde-fou Tailwind v4 : le préfixe `yypay:` doit précéder les variantes.
 *   ✅ yypay:sm:px-6   yypay:hover:bg-muted   yypay:data-[state=open]:opacity-100
 *   ❌ sm:yypay:px-6   hover:yypay:bg-muted   (classe ignorée silencieusement)
 *
 * Usage : node scripts/check-tailwind-prefix.mjs [--fix]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = new URL("../src/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const EXTENSIONS = new Set([".ts", ".tsx", ".css", ".mdx"]);
// Une ou plusieurs variantes (ex. `sm:`, `group-hover/item:`, `data-[state=active]:`)
// placées juste avant `yypay:`, sans être elles-mêmes la suite d'une classe.
const MISPLACED = /(?<![\w:\-\][/])((?:[\w-]+(?:\[[^\]\s"'`]*\])?(?:\/[\w-]+)?:)+)yypay:/g;

const fix = process.argv.includes("--fix");

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else if (EXTENSIONS.has(extname(path)) && !path.endsWith(".d.ts")) {
      yield path;
    }
  }
}

let total = 0;
for (const file of walk(ROOT)) {
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");
  let fileHits = 0;
  lines.forEach((line, index) => {
    for (const match of line.matchAll(MISPLACED)) {
      fileHits += 1;
      const wrong = `${match[1]}yypay:`;
      console.log(
        `${relative(process.cwd(), file)}:${index + 1}:${match.index + 1}  ${wrong} → yypay:${match[1]}`,
      );
    }
  });
  if (fileHits && fix) {
    writeFileSync(file, source.replace(MISPLACED, (_, variants) => `yypay:${variants}`));
  }
  total += fileHits;
}

if (total === 0) {
  console.log("✓ Préfixe Tailwind `yypay:` correctement placé partout.");
} else if (fix) {
  console.log(`\n✓ ${total} classe(s) corrigée(s).`);
} else {
  console.error(
    `\n✗ ${total} classe(s) avec le préfixe mal placé (Tailwind les ignore). ` +
      "Lancez `npm run lint:classes -- --fix`.",
  );
  process.exit(1);
}
