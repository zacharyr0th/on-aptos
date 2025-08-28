import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-side environment variables - removed client exposure for security
  
  // Basic settings
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  
  // Temporarily disable ESLint during builds for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable TypeScript error checking
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/stablecoins',
        destination: '/stables',
        permanent: true,
      },
      {
        source: '/btc',
        destination: '/bitcoin',
        permanent: true,
      },
      {
        source: '/rwa',
        destination: '/rwas',
        permanent: true,
      },
    ];
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  
  // Disable image optimization
  images: {
    unoptimized: true,
  },
  
  // Simplified webpack config
  webpack: (config, { isServer }) => {
    // Handle Node.js modules in browser for wallet adapters
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

// Configure bundle analyzer
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig);