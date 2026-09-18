import type { NextConfig } from "next";

function rewriteApiOrigin(): string | null {
  const origin = (process.env.API_ORIGIN ?? "http://127.0.0.1:4000").trim().replace(/\/$/, "");
  try {
    const host = new URL(origin).hostname;
    if (process.env.VERCEL && (host === "127.0.0.1" || host === "localhost")) {
      return null;
    }
  } catch {
    return process.env.VERCEL ? null : "http://127.0.0.1:4000";
  }
  return origin;
}

const API_ORIGIN = rewriteApiOrigin();

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  compress: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
  async rewrites() {
    if (!API_ORIGIN) return [];
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
