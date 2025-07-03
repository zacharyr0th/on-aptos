import { withApiEnhancements } from '@/lib/utils/server';
import { appRouter } from '@/lib/trpc/root';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import {
  ApiError,
  formatApiError,
  withErrorHandling,
  type ErrorContext,
} from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const errorContext: ErrorContext = {
    operation: 'BTC API route',
    service: 'BTC-API',
    details: {
      endpoint: '/api/aptos/btc',
      userAgent: request.headers.get('user-agent') || 'unknown',
    },
  };

  return withApiEnhancements(
    () =>
      withErrorHandling(async () => {
        try {
          const caller = appRouter.createCaller({});
          const result =
            await caller.domains.assets.bitcoin.getComprehensiveSupplies({
              forceRefresh: false,
            });

          // Return the data from the tRPC response
          return result.data;
        } catch (error) {
          console.error('BTC API route error:', formatApiError(error));

          if (error instanceof Error) {
            throw new ApiError(
              `BTC supplies fetch failed: ${error.message}`,
              undefined,
              'BTC-Route'
            );
          }
          throw new ApiError(
            'BTC supplies fetch failed: Unknown error',
            undefined,
            'BTC-Route'
          );
        }
      }, errorContext),
    {
      cacheKey: 'btc-supplies-api',
      cacheName: 'btc',
      customHeaders: {
        'Cache-Control': `public, max-age=${Math.floor(SERVICE_CONFIG.btc.ttl / 1000)}, stale-while-revalidate=${Math.floor(SERVICE_CONFIG.btc.ttl / 2000)}`,
        'X-Content-Type': 'application/json',
        'X-Service': 'btc-supplies',
        'X-API-Version': '1.0',
        Vary: 'Accept-Encoding',
      },
    }
  );
}
