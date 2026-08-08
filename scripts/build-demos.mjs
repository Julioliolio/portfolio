/**
 * Builds every demo app in apps/demos/* and copies its dist/ into
 * apps/web/public/demos/<name>/ so the portfolio serves them same-origin.
 * Runs before `next dev` (predev) and `next build`.
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demosDir = path.join(root, "apps/demos");
const outRoot = path.join(root, "apps/web/public/demos");

rmSync(outRoot, { recursive: true, force: true });

if (!existsSync(demosDir)) {
  console.log("no apps/demos directory — nothing to build");
  process.exit(0);
}

for (const name of readdirSync(demosDir)) {
  const dir = path.join(demosDir, name);
  if (!existsSync(path.join(dir, "package.json"))) continue;

  console.log(`\n▸ building demo: ${name}`);
  execSync("pnpm build", { cwd: dir, stdio: "inherit" });

  const dist = path.join(dir, "dist");
  if (!existsSync(dist)) {
    throw new Error(`demo "${name}" built but produced no dist/ directory`);
  }
  cpSync(dist, path.join(outRoot, name), { recursive: true });
  console.log(`▸ copied ${name} → apps/web/public/demos/${name}/`);
}

console.log("\ndemos ready");
