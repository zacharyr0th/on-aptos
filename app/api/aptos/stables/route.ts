import { withApiEnhancements } from '@/lib/utils/server';
import { appRouter } from '@/lib/trpc/root';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import { ApiError } from '@/lib/utils/types';

export async function GET() {
  return withApiEnhancements(
    async () => {
      try {
        const caller = appRouter.createCaller({});
        return await caller.domains.assets.stablecoins.getSupplies({
          forceRefresh: false,
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new ApiError(
            `Stables supplies fetch failed: ${error.message}`,
            undefined,
            'Stables-Route'
          );
        }
        throw new ApiError(
          'Stables supplies fetch failed: Unknown error',
          undefined,
          'Stables-Route'
        );
      }
    },
    {
      cacheKey: 'stables-supplies',
      cacheName: 'stables',
      customHeaders: {
        'Cache-Control': `public, max-age=${Math.floor(SERVICE_CONFIG.stables.ttl / 1000)}, stale-while-revalidate=${Math.floor(SERVICE_CONFIG.stables.ttl / 2000)}`,
        'X-Content-Type': 'application/json',
        'X-Service': 'stables-supplies',
      },
    }
  );
}
