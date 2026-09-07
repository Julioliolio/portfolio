/**
 * The path the site is served under. GitHub Pages hosts a project repo at
 * https://<user>.github.io/<repo>/, so every URL the site emits — Next's
 * own chunks (via basePath), the hardcoded public/ assets (via
 * NEXT_PUBLIC_BASE_PATH and @portfolio/lab/asset), and the demo builds
 * (via PORTFOLIO_BASE_PATH in their Vite configs) — has to carry it.
 * One constant, read by next.config.ts and scripts/build-demos.mjs.
 *
 * Set to "" if the site ever moves to a root-served host (a custom domain
 * or a <user>.github.io repo).
 */
export const BASE_PATH = "/portfolio";
