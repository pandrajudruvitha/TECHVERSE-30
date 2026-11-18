import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  distDir:
    process.env.TECHVERSE_AUTOMATED_BUILD === "1" ? ".next-automation" : ".next",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
