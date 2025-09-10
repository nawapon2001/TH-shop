<<<<<<< Updated upstream
module.exports = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
=======
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // temporarily ignore ESLint during `next build` so we can iterate on fixes incrementally
    ignoreDuringBuilds: true,
  },
>>>>>>> Stashed changes
};
