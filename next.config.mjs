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
  // Skip ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
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
  // Allow images from essential CDNs (consolidated to stay under 50 limit)
  images: {
    // Enable image optimization for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    formats: ['image/webp'],
    // Safely enable SVG support for NFTs and icons
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; object-src 'none';",
    remotePatterns: [
      // Essential core domains
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.panora.exchange',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.panora.exchange',
        port: '',
        pathname: '/**',
      },
      // Major crypto data providers
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's2.coinmarketcap.com',
        port: '',
        pathname: '/**',
      },
      // Core Aptos ecosystem
      {
        protocol: 'https',
        hostname: 'aptos.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.aptoslabs.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.aptosnames.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'aptos-names-api-u6smh7xtla-uw.a.run.app',
        port: '',
        pathname: '/**',
      },
      // Major IPFS gateways (consolidated)
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.pinata.cloud',
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
        hostname: '**.nftstorage.link',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.w3s.link',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        port: '',
        pathname: '/**',
      },
      // Arweave
      {
        protocol: 'https',
        hostname: '**.arweave.net',
        port: '',
        pathname: '/**',
      },
      // Major cloud storage
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.s3-*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      },
      // Common CDNs
      {
        protocol: 'https',
        hostname: '**.imagedelivery.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
      // NFT marketplaces
      {
        protocol: 'https',
        hostname: '**.magiceden.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.bluemove.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.topaz.so',
        port: '',
        pathname: '/**',
      },
      // Common app deployment platforms
      {
        protocol: 'https',
        hostname: '**.vercel.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.netlify.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/**',
      },
      // Additional important domains
      {
        protocol: 'https',
        hostname: 'icons.llama.fi',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.rwa.xyz',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cryptologos.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tether.to',
        port: '',
        pathname: '/images/**',
      },
      // Specific protocol domains that we know are needed
      {
        protocol: 'https',
        hostname: 'app.kofi.finance',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.thala.fi',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.pancakeswap.finance',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.sushiswap.com',
        port: '',
        pathname: '/**',
      },
      // Catch-all for common finance/defi domains
      {
        protocol: 'https',
        hostname: '**.finance',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.exchange',
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