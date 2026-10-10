import type { NextConfig } from 'next';

// HSTS is already sent by Vercel. No camera/mic/location APIs are used — photo capture goes
// through the native file picker, which these policies don't affect.
const SECURITY_HEADER_LIST = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  headers: async () => [{ source: '/:path*', headers: SECURITY_HEADER_LIST }],
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
