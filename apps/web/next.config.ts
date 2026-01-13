import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Output standalone server to bypass Next.js 16 static pre-rendering bug
  output: 'standalone',

  // Explicitly define env vars to ensure Next.js inlines them into client bundle
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ENABLE_TURNSTILE: process.env.NEXT_PUBLIC_ENABLE_TURNSTILE,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_TURNSTILE_PROTECTED_ACTIONS: process.env.NEXT_PUBLIC_TURNSTILE_PROTECTED_ACTIONS,
  },

  // Transpile workspace packages and CommonJS dependencies
  transpilePackages: ['@atlasp2p/config', '@atlasp2p/types', 'bitcoinjs-message'],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
