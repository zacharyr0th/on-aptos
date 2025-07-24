// import withPWA from '@ducanh2912/next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables configuration
  env: {
    APTOS_BUILD_SECRET: process.env.APTOS_BUILD_SECRET,
    CMC_API_KEY: process.env.CMC_API_KEY,
    RWA_API_KEY: process.env.RWA_API_KEY,
    PANORA_API_KEY: process.env.PANORA_API_KEY,
  },
  // Default port is 3000, we need to change it to 3001
  transpilePackages: ["geist"],
  // Optimize for Vercel deployment
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  // Enable compression for API routes
  compress: true,
  // Redirects
  async redirects() {
    return [
      {
        source: '/stablecoins',
        destination: '/stables',
        permanent: true,
      },
    ];
  },
  // Security headers configuration (moved from middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Robots-Tag', value: 'index, follow, max-snippet:-1' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      // Special caching for static documentation
      {
        source: '/llms.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/humans.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/.well-known/ai-plugin.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      // Aggressive caching for translation files
      {
        source: '/locales/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Content-Type', value: 'application/json; charset=utf-8' },
        ],
      },
      // CORS headers for API routes
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Methods', value: 'GET, HEAD, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
          { key: 'Access-Control-Allow-Credentials', value: 'false' },
        ],
      },
    ];
  },
  // Allow images from RWA CDN, S3 bucket, and DefiLlama icons
  images: {
    // Disable image optimization to avoid edge requests
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.rwa.xyz',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'rwa-app-public.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'icons.llama.fi',
        port: '',
        pathname: '/**',
      },
      // Wallet icons
      {
        protocol: 'https',
        hostname: 'aptos.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.mz.xyz',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.walletconnect.com',
        port: '',
        pathname: '/**',
      },
      // NFT image sources
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.arweave.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'nftstorage.link',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.nftstorage.link',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare-ipfs.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.mypinata.cloud',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'byzantion.mypinata.cloud',
        port: '',
        pathname: '/**',
      },
      // Panora token icons
      {
        protocol: 'https',
        hostname: '**.panora.exchange',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.panora.exchange',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.panora.exchange',
        port: '',
        pathname: '/**',
      },
      // Aptos NFT metadata CDN
      {
        protocol: 'https',
        hostname: 'nft-metadata.mainnet.aptoslabs.com',
        port: '',
        pathname: '/**',
      },
      // Cellana NFT API
      {
        protocol: 'https',
        hostname: 'api.cellana.finance',
        port: '',
        pathname: '/**',
      },
      // Aptos Names
      {
        protocol: 'https',
        hostname: 'www.aptosnames.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.aptosnames.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Enable standalone output for Docker deployment
  output: 'standalone',
  // Webpack configuration to handle optional dependencies
  webpack: (config, { isServer, webpack }) => {
    // Ignore dynamic requires in keyv
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@keyv\/(redis|mongo|sqlite|postgres|mysql|etcd|offline|tiered)$/,
      })
    );
    
    // Also handle the dynamic require context
    config.module.noParse = /keyv/;
    
    // Handle Node.js modules in browser for wallet adapters
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'form-data': false,
        'fs': false,
        'net': false,
        'tls': false,
        'crypto': false,
      };
    }
    
    return config;
  },
};

// const withPWAConfig = withPWA({
//   dest: 'public',
//   disable: true, // Temporarily disable PWA
//   register: true,
//   skipWaiting: true,
//   workboxOptions: {
//     disableDevLogs: true,
//     runtimeCaching: [
//       {
//         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
//         handler: 'CacheFirst',
//         options: {
//           cacheName: 'google-fonts',
//           expiration: {
//             maxEntries: 4,
//             maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
//           }
//         }
//       },
//       {
//         urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
//         handler: 'CacheFirst',
//         options: {
//           cacheName: 'google-fonts-static',
//           expiration: {
//             maxEntries: 4,
//             maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
//           }
//         }
//       },
//       {
//         urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
//         handler: 'StaleWhileRevalidate',
//         options: {
//           cacheName: 'images',
//           expiration: {
//             maxEntries: 64,
//             maxAgeSeconds: 24 * 60 * 60 // 24 hours
//           }
//         }
//       },
//       {
//         urlPattern: /\.(?:js|css)$/i,
//         handler: 'StaleWhileRevalidate',
//         options: {
//           cacheName: 'static-resources',
//           expiration: {
//             maxEntries: 32,
//             maxAgeSeconds: 24 * 60 * 60 // 24 hours
//           }
//         }
//       },
//       {
//         urlPattern: ({ request }) => request.destination === 'document',
//         handler: 'NetworkFirst',
//         options: {
//           cacheName: 'pages',
//           expiration: {
//             maxEntries: 32,
//             maxAgeSeconds: 24 * 60 * 60 // 24 hours
//           }
//         }
//       }
//     ]
//   }
// });

// Configure bundle analyzer
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig); 