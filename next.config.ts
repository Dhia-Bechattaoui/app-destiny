import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '150mb',
    },
    // Required to allow large direct POSTs when middleware is present
    proxyClientMaxBodySize: '150mb',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
