import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { BASE_PATH } from "../../scripts/base-path.mjs";

// The site is fully static (every route is prerendered; lab slugs come from
// generateStaticParams) and deploys to GitHub Pages from apps/web/out via
// .github/workflows/pages.yml. Static export has no server, so there is no
// headers() hook — caching for the content-hashed demo assets is left to
// Pages' defaults. trailingSlash emits lab/clay-cursor/index.html instead of
// lab/clay-cursor.html so directory URLs resolve on any static host.
//
// Pages serves a project repo under /<repo>/, hence basePath. It covers
// Next's own output; hardcoded public/ URLs go through @portfolio/lab/asset,
// which reads the same value from NEXT_PUBLIC_BASE_PATH (inlined here).
const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  trailingSlash: true,
  reactStrictMode: true,
  typedRoutes: true,
  reactCompiler: true,
  transpilePackages: ["@portfolio/lab", "@portfolio/demo-protocol"],
};

// Under a basePath the bare origin is a 404, which is where every
// "open localhost:3000" lands. Dev only: a static export has no server to
// redirect with, and on Pages the root belongs to another site anyway.
const devConfig: NextConfig = {
  ...nextConfig,
  redirects: async () => [
    {
      source: "/",
      destination: `${BASE_PATH}/`,
      basePath: false,
      permanent: false,
    },
  ],
};

export default (phase: string): NextConfig =>
  phase === PHASE_DEVELOPMENT_SERVER && BASE_PATH ? devConfig : nextConfig;
