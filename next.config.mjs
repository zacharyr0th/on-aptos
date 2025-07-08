// import withPWA from '@ducanh2912/next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default port is 3000, we need to change it to 3001
  transpilePackages: ["geist"],
  // Optimize for Vercel deployment
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  // Enable compression for API routes
  compress: true,
  // Allow images from RWA CDN, S3 bucket, and DefiLlama icons
  images: {
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