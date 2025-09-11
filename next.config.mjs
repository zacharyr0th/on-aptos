import withBundleAnalyzer from "@next/bundle-analyzer";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

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
        source: "/stablecoins",
        destination: "/markets/stables",
        permanent: true,
      },
      {
        source: "/stables",
        destination: "/markets/stables",
        permanent: true,
      },
      {
        source: "/btc",
        destination: "/markets/bitcoin",
        permanent: true,
      },
      {
        source: "/bitcoin",
        destination: "/markets/bitcoin",
        permanent: true,
      },
      {
        source: "/rwa",
        destination: "/markets/rwas",
        permanent: true,
      },
      {
        source: "/rwas",
        destination: "/markets/rwas",
        permanent: true,
      },
      {
        source: "/tokens",
        destination: "/markets/tokens",
        permanent: true,
      },
      {
        source: "/defi",
        destination: "/protocols/defi",
        permanent: true,
      },
      {
        source: "/lst",
        destination: "/protocols/lst",
        permanent: true,
      },
      {
        source: "/yields",
        destination: "/protocols/yields",
        permanent: true,
      },
      {
        source: "/portfolio",
        destination: "/tools/portfolio",
        permanent: true,
      },
      {
        source: "/metrics",
        destination: "/tools/metrics",
        permanent: true,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // Disable image optimization
  images: {
    unoptimized: true,
  },

  // Enhanced webpack config for optimization with Bun compatibility
  webpack: (config, { isServer, dev, nextRuntime }) => {
    // Fix global reference issues for both server and edge runtimes
    config.output = config.output || {};
    
    if (isServer) {
      // Node.js runtime
      config.output.globalObject = 'global';
    } else {
      // Client-side builds
      config.output.globalObject = 'self';
    }
    
    // Handle edge runtime global references
    if (nextRuntime === 'edge') {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        'global': 'globalThis',
      };
      
      config.plugins = config.plugins || [];
      config.plugins.push(
        new config.webpack.DefinePlugin({
          global: 'globalThis',
        })
      );
    }
    
    // Exclude service worker from webpack processing to avoid SSR issues
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'sw-transaction-prefetch.js': 'commonjs sw-transaction-prefetch.js'
      });
    }

    // Handle Node.js modules in browser for wallet adapters
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        util: false,
      };
    }

    // Bun compatibility optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      // Ensure proper resolution for Bun runtime
      "@": resolve(process.cwd()),
    };

    // Optimize for Bun's faster module resolution
    config.resolve.symlinks = false;
    config.resolve.cacheWithContext = false;

    // Optimize bundle size in production
    if (!dev) {
      // Enhanced chunk splitting strategy
      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          // Core React and Next.js
          framework: {
            chunks: "all",
            name: "framework",
            test: /(?:react|react-dom|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Radix UI components (large in your bundle)
          radixUI: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: "radix-ui",
            chunks: "all",
            priority: 30,
          },
          // TanStack Query
          tanstackQuery: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            name: "tanstack-query",
            chunks: "all",
            priority: 25,
          },
          // Charts and visualization libraries
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3|@nivo)[\\/]/,
            name: "charts",
            chunks: "all",
            priority: 20,
          },
          // Wallet adapters and crypto libraries
          walletLibs: {
            test: /[\\/]node_modules[\\/](@aptos-labs|@wallet-adapter|@solana)[\\/]/,
            name: "wallet-libs",
            chunks: "all",
            priority: 20,
          },
          // Large individual libraries
          largeDeps: {
            test: /[\\/]node_modules[\\/](framer-motion|ua-parser-js|moment|lodash)[\\/]/,
            name: "large-deps",
            chunks: "all",
            priority: 15,
          },
          // Icons and UI utilities
          icons: {
            test: /[\\/]node_modules[\\/](lucide-react|react-icons|@heroicons)[\\/]/,
            name: "icons",
            chunks: "all",
            priority: 10,
          },
          // Other vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 5,
            minChunks: 2,
          },
          // Common modules shared between pages
          common: {
            name: "common",
            minChunks: 2,
            priority: 0,
            chunks: "all",
            reuseExistingChunk: true,
          },
        },
      };

      // Tree shake unused code
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },
};

// Configure bundle analyzer
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(nextConfig);
