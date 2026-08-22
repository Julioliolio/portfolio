import type { NextConfig } from "next";

// The site is fully static (every route is prerendered; lab slugs come from
// generateStaticParams) and deploys to GitHub Pages from apps/web/out via
// .github/workflows/pages.yml. Static export has no server, so there is no
// headers() hook — caching for the content-hashed demo assets is left to
// Pages' defaults. trailingSlash emits lab/clay-cursor/index.html instead of
// lab/clay-cursor.html so directory URLs resolve on any static host.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  typedRoutes: true,
  reactCompiler: true,
  transpilePackages: ["@portfolio/lab", "@portfolio/demo-protocol"],
};

export default nextConfig;
