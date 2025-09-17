import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone build configuration
  output: 'standalone',
  
  // Minimal config to avoid permission issues
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  // Server external packages for database
  serverExternalPackages: ['prisma', '@prisma/client'],
  
  // Environment variables for production (only custom vars)
  env: {
    CUSTOM_DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
