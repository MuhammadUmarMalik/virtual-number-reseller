import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  transpilePackages: ["@number-reseller/ui", "@number-reseller/types", "@number-reseller/validation"]
};

export default nextConfig;
