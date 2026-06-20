import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lmdlqcewtxsnrnpbaabk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google avatars
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
