import type { NextConfig } from "next";

// Extract Supabase hostname from environment variable
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
}
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = new URL(supabaseUrl).hostname;

const nextConfig: NextConfig = {
  // Allow dev origins for Server Actions
  allowedDevOrigins: [
    'project-reviser.preview.emergentagent.com',
    'project-reviser.cluster-5.preview.emergentcf.cloud',
  ],

  // Server Actions configuration
  experimental: {
    serverActions: {
      allowedOrigins: [
        'project-reviser.preview.emergentagent.com',
        'project-reviser.cluster-5.preview.emergentcf.cloud',
        'localhost:3000',
      ],
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'recharts',
    ],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Production optimizations
  poweredByHeader: false,
  compress: true,

  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `connect-src 'self' ${supabaseUrl} https://*.supabase.co`,
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: blob: https: ${supabaseUrl}`,
              `media-src 'self' blob: ${supabaseUrl} https://*.supabase.co`,
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
        ],
      },
      {
        source: '/img/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// Bundle analyzer (only when ANALYZE=true and package is installed)
let finalConfig = nextConfig;

try {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
  finalConfig = withBundleAnalyzer(nextConfig);
} catch (error) {
  // Bundle analyzer not installed yet, use config without it
  console.log('Note: @next/bundle-analyzer not installed. Run "npm install" to enable bundle analysis.');
}

export default finalConfig;
