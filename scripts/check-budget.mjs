/**
 * Performance budget for the static export. Runs after `next build` (see
 * apps/web/package.json) and fails the build — locally and in the Pages
 * workflow — when a route's first load grows past the limits below.
 *
 * What is measured, per prerendered route in apps/web/out:
 *   js     every <script src> in the HTML — Next marks them async, but all
 *          of them run before the page is interactive, so all count
 *   css    every <link rel="stylesheet">
 *   fonts  every <link rel="preload" as="font"> — the cuts fetched before
 *          first paint (next/font emits one per preloaded cut)
 *   images every <link rel="preload" as="image">
 * Sizes are gzip (level 9) for text assets, which is what GitHub Pages
 * serves, and raw for fonts/images, which are already compressed.
 *
 * Also checked: the clay cursor frame set in public/cursor, which the
 * cursor warms in full on mount.
 *
 * Raising a budget is fine when a real feature needs it — edit the number
 * here in the same commit so the reason is in the history. The point is
 * that growth is a decision, not a drift.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { BASE_PATH } from "./base-path.mjs";

const KB = 1024;
// Per route, first load. Set from the post-optimization build plus ~15%
// headroom; the biggest line is the React + Next runtime floor.
const BUDGETS = {
  js: 165 * KB, // gzip
  css: 12 * KB, // gzip
  fonts: 115 * KB, // raw woff2 — Regular + SemiBold of the sans, nothing else
  images: 8 * KB, // raw — nothing should be image-preloaded today
  cursorFrames: 64 * KB, // raw — all 19 WebP boil frames together
};

const root = join(fileURLToPath(import.meta.url), "../..");
const out = join(root, "apps/web/out");

function walkHtml(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      // _next holds chunks; demos are the embedded Vite apps, measured by
      // their own builds, not by this check.
      if (!["_next", "demos", "_not-found"].includes(entry.name))
        walkHtml(p, acc);
    } else if (entry.name === "index.html") {
      acc.push(p);
    }
  }
  return acc;
}

/** Local file for a URL the HTML references, or null if it is external. */
function fileFor(url) {
  if (!url.startsWith(`${BASE_PATH}/`) && BASE_PATH !== "") return null;
  const path = url.slice(BASE_PATH.length).split("?")[0];
  return join(out, decodeURIComponent(path));
}

function bytes(file, { gzip }) {
  const data = readFileSync(file);
  return gzip ? gzipSync(data, { level: 9 }).length : data.length;
}

function measure(html) {
  const source = readFileSync(html, "utf8");
  const tags = source.match(/<(?:script|link)\b[^>]*>/g) ?? [];
  const totals = { js: 0, css: 0, fonts: 0, images: 0 };
  for (const tag of tags) {
    const attr = (name) =>
      tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
    let kind;
    // nomodule scripts are the legacy-browser polyfill; modern browsers
    // never fetch them.
    if (tag.startsWith("<script") && attr("src") && !/\snoModule\b/i.test(tag))
      kind = "js";
    else if (attr("rel") === "stylesheet") kind = "css";
    else if (attr("rel") === "preload" && attr("as") === "font") kind = "fonts";
    else if (attr("rel") === "preload" && attr("as") === "image")
      kind = "images";
    if (!kind) continue;
    const file = fileFor(attr("src") ?? attr("href"));
    if (!file) continue;
    totals[kind] += bytes(file, { gzip: kind === "js" || kind === "css" });
  }
  return totals;
}

const fmt = (n) => `${(n / KB).toFixed(1)} KB`;
const rows = [];
let failed = false;

function check(label, kind, value) {
  const budget = BUDGETS[kind];
  const over = value > budget;
  failed ||= over;
  rows.push({
    route: label,
    kind,
    size: fmt(value),
    budget: fmt(budget),
    status: over ? "OVER" : "ok",
  });
}

for (const html of walkHtml(out).sort()) {
  const route =
    "/" +
    relative(out, html)
      .replace(/\\/g, "/")
      .replace(/index\.html$/, "");
  if (route === "/404/") continue;
  const totals = measure(html);
  for (const kind of Object.keys(totals)) {
    // Lab pieces are photo-driven and preload their frame sets by design
    // (decode-before-reveal); the image budget is for the site proper.
    if (kind === "images" && route.startsWith("/lab/")) continue;
    check(route, kind, totals[kind]);
  }
}

const cursorDir = join(root, "apps/web/public/cursor");
const cursorBytes = readdirSync(cursorDir)
  .filter((f) => f.endsWith(".webp"))
  .reduce((sum, f) => sum + statSync(join(cursorDir, f)).size, 0);
check("public/cursor", "cursorFrames", cursorBytes);

console.table(
  rows.filter((r) => r.status === "OVER" || process.argv.includes("--all")),
);
const worst = {};
for (const r of rows) {
  const n = parseFloat(r.size);
  if (!(r.kind in worst) || n > worst[r.kind].n)
    worst[r.kind] = { n, route: r.route, budget: r.budget };
}
console.log("largest per kind:");
for (const [kind, w] of Object.entries(worst)) {
  console.log(
    `  ${kind.padEnd(13)} ${fmt(w.n * KB).padStart(9)} / ${w.budget.padStart(9)}  (${w.route})`,
  );
}

if (failed) {
  console.error(
    "\nbudget check failed — see OVER rows above (or raise the budget in scripts/check-budget.mjs with a reason)",
  );
  process.exit(1);
}
console.log("\nbudget check passed");
