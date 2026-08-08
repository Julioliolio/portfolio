import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  reactCompiler: true,
  transpilePackages: ["@portfolio/lab", "@portfolio/demo-protocol"],
  async headers() {
    return [
      {
        // Vite emits content-hashed files under assets/ — safe to cache forever
        source: "/demos/:name/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
