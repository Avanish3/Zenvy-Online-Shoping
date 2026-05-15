import type { NextConfig } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    webpackBuildWorker: false,
  },
  assetPrefix: process.env.NODE_ENV === "development" ? siteUrl : undefined,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
