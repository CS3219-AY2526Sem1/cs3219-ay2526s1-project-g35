import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: false,
  },

  async rewrites() {
    return [
      // User Service routes - Authentication and user management
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : 'http://user-service:8000/:path*',
      },
      {
        source: '/auth/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/auth/:path*`
          : 'http://user-service:8000/auth/:path*',
      },
      {
        source: '/users/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/users/:path*`
          : 'http://user-service:8000/users/:path*',
      },
      // Question Service routes - Question management
      {
        source: '/api/questions/:path*',
        destination: process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL
          ? `${process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL}/api/questions/:path*`
          : 'http://question-service:8001/api/questions/:path*',
      },
    ];
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
