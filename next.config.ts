import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "virtuosinstitute.com.mx",
      },
    ],
  },
};

export default nextConfig;
