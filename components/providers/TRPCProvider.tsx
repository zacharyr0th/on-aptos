'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import superjson from 'superjson';

import { trpc } from '@/lib/trpc/client';
import { APP_CONFIG } from '@/lib/config/app';
import { dedupeFetch } from '@/lib/utils/request-deduplication';

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''; // browser should use relative url

  // For Vercel deployments
  if (process.env.VERCEL_URL) {
    // VERCEL_URL doesn't include protocol, so we add it
    const url = `https://${process.env.VERCEL_URL}`;
    console.log('[TRPCProvider] Using VERCEL_URL:', url);
    return url;
  }

  // Use NEXT_PUBLIC_SITE_URL if available (works in all environments)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    console.log(
      '[TRPCProvider] Using NEXT_PUBLIC_SITE_URL:',
      process.env.NEXT_PUBLIC_SITE_URL
    );
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // For development, use the same port as the Next.js app since tRPC API routes are served by the same server
  const devUrl = `http://localhost:${APP_CONFIG.port}`;
  console.log('[TRPCProvider] Using development URL:', devUrl);
  return devUrl;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Optimized cache settings for better performance
            staleTime: 5 * 60 * 1000, // 5 minutes - balance between freshness and performance
            gcTime: 15 * 60 * 1000, // 15 minutes - keep data longer in memory
            retry: (failureCount, error: Error & { status?: number }) => {
              // Don't retry on 4xx errors
              if (error?.status && error.status >= 400 && error.status < 500) {
                return false;
              }
              // Don't retry on circuit breaker
              if (error?.message?.includes('Circuit breaker')) {
                return false;
              }
              // Retry up to 2 times for other errors (reduced from 3)
              return failureCount < 2;
            },
            retryDelay: attemptIndex =>
              Math.min(1000 * 2 ** attemptIndex, 15000), // Faster retry timing
            // Performance optimizations
            refetchOnWindowFocus: false, // Prevent unnecessary refetches
            refetchOnReconnect: true, // Refetch when connection restored
            refetchInterval: false, // Manual refresh only for most queries
          },
          mutations: {
            retry: 1, // Only retry mutations once
            retryDelay: 1000, // Quick retry for mutations
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          // Enhanced batching configuration
          maxURLLength: 2083, // Standard browser URL limit
          // Batch requests together for better performance
          async headers() {
            return {
              'Content-Type': 'application/json',
              // Add compression hint for better performance
              'Accept-Encoding': 'gzip, deflate, br',
            };
          },
          // Enhanced fetch configuration with request deduplication
          fetch: async (input, init) => {
            return dedupeFetch(input.toString(), {
              ...init,
              // Add performance optimizations
              keepalive: true, // Keep connection alive
              signal: AbortSignal.timeout(15000), // 15s timeout (reduced from 30s)
            });
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
