import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Each workbench tab is its own route; the bare path opens Find trials.
  redirects: async () => [{ source: "/workbench", destination: "/workbench/search", permanent: false }],
};

export default nextConfig;
