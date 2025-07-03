import { router } from '@/lib/trpc/core/server';
import { pricesRouter } from './prices/router';
import { defiMetricsRouter } from './defi-metrics/router';

/**
 * Market Data Router
 * Aggregates all market data related routers
 */
export const marketDataRouter = router({
  prices: pricesRouter,
  defiMetrics: defiMetricsRouter,
});
