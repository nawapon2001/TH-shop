import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // Production optimizations
  poweredByHeader: false,
  compress: true,

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  // Server external packages for database
  serverExternalPackages: ['prisma', '@prisma/client'],
  
  // Environment variables for production (only custom vars)
  env: {
    CUSTOM_DATABASE_URL: process.env.DATABASE_URL,
  },

  webpack: (config, { dev }) => {
    // ❌ ไม่ต้องไปปิด fs/path ทั้งระบบ
    // ถ้าจำเป็นจริง ๆ ค่อยตั้งเป็นราย-loader/ราย-plugin จะปลอดภัยกว่า

    if (dev) {
      // เฉพาะโหมด dev เท่านั้นที่มีการ watch
      // (production build ไม่ได้ watch อยู่แล้ว)
      config.watchOptions = {
        ignored: [
          "**/node_modules",
          "**/.git",
          "**/.next",
          "**/out",
          "**/Application Data",
          "**/Cookies",
          "**/AppData",
          "**/WindowsApps/**",
          "**/Microsoft/**",
        ],
        aggregateTimeout: 300,
        poll: false,
      };
    }

    // จำกัด path ของ module resolution ให้ใช้ค่า default ก็พอ
    // (การบังคับเป็น ["node_modules"] อาจทำให้ alias/turbopack เสีย)
    // ลบบรรทัดนี้ทิ้ง:
    // config.resolve.modules = ["node_modules"];

    return config;
  },
};

export default nextConfig;
