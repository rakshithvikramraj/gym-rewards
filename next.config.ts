import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media4.giphy.com',
        // port: '', // Optional: Add if specific port needed
        // pathname: '/media/**', // Optional: Add if specific path pattern needed
      },
    ],
  },
};

export default nextConfig;
