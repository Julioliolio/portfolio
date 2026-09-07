/**
 * Prefixes a public/ URL with the site's base path. The site is served
 * under /portfolio/ on GitHub Pages (scripts/base-path.mjs), and Next only
 * rewrites its own chunks and <Link> hrefs — a literal "/cursor/arrow-1.webp"
 * in an <img> or <iframe> src, or a route in a plain <a>, would 404. Route
 * every hardcoded public path through here.
 *
 * NEXT_PUBLIC_BASE_PATH is inlined at build time by next.config.ts, so this
 * costs nothing at runtime. The expression has to stay literally
 * `process.env.NEXT_PUBLIC_BASE_PATH` for the inlining to see it; the
 * declaration below is only so this package typechecks without Node types.
 */
declare const process: { env: { NEXT_PUBLIC_BASE_PATH?: string } };

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: `/${string}`): string {
  return `${BASE}${path}`;
}
