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

  // Simplified webpack config to resolve build issues
  webpack: (config, { isServer, dev }) => {
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

    return config;
  },
};

// Configure bundle analyzer
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(nextConfig);
