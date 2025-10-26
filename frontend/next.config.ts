import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: false,
  },

  // Environment variables - these will be available at runtime
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://34.124.186.128',
    NEXT_PUBLIC_API_USER_URL: process.env.NEXT_PUBLIC_API_USER_URL || 'http://34.124.186.128/api/users',
    NEXT_PUBLIC_API_QUESTION_URL: process.env.NEXT_PUBLIC_API_QUESTION_URL || 'http://34.124.186.128/api/questions',
    NEXT_PUBLIC_API_MATCHING_URL: process.env.NEXT_PUBLIC_API_MATCHING_URL || 'http://34.124.186.128/api/matching',
    NEXT_PUBLIC_WS_COLLAB_URL: process.env.NEXT_PUBLIC_WS_COLLAB_URL || 'ws://34.124.186.128/api/collaboration',
    NEXT_PUBLIC_MATCHING_WS_URL: process.env.NEXT_PUBLIC_MATCHING_WS_URL || 'ws://34.124.186.128/api/matching/ws',
  },

  async rewrites() {
    // Disabled rewrites - frontend calls Kong Gateway API directly
    // All API calls should go through NEXT_PUBLIC_API_URL which points to Kong
    return [];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
