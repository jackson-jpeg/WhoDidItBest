import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/api/featured",
      headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" }],
    },
    {
      source: "/api/hot-takes",
      headers: [{ key: "Cache-Control", value: "public, s-maxage=30, stale-while-revalidate=120" }],
    },
    {
      source: "/api/pulse",
      headers: [{ key: "Cache-Control", value: "public, s-maxage=30, stale-while-revalidate=120" }],
    },
    {
      source: "/api/explore/trending",
      headers: [{ key: "Cache-Control", value: "public, s-maxage=30, stale-while-revalidate=120" }],
    },
    {
      source: "/api/explore/categories",
      headers: [{ key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" }],
    },
    {
      source: "/api/leaderboard",
      headers: [{ key: "Cache-Control", value: "public, s-maxage=30, stale-while-revalidate=120" }],
    },
  ],
};

export default nextConfig;
