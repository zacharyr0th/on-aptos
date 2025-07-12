import { router } from './core/server';
import { domainsRouter } from './domains';

/**
 * Main tRPC router that combines all sub-routers
 *
 * Migration completed:
 * - ✅ domains.marketData.prices (migrated from legacy prices router)
 * - ✅ domains.marketData.defiMetrics (migrated from legacy defi router)
 * - ✅ domains.assets.bitcoin (migrated from legacy btc router)
 * - ❌ domains.assets.stablecoins (removed - using REST API instead)
 * - ✅ domains.assets.liquidStaking (migrated from legacy lst router)
 * - ✅ domains.assets.rwa (migrated from legacy rwa router)
 * - ✅ domains.blockchain.aptos (migrated from legacy aptos router)
 * - ✅ domains.protocols.* (migrated from legacy protocols router)
 *
 * Domain structure:
 * - domains.marketData: Market data and analytics (prices, defi metrics)
 * - domains.assets: Asset tracking (bitcoin, LST, RWA)
 * - domains.blockchain: Blockchain-specific functionality (aptos)
 * - domains.protocols: External protocol integrations
 */
export const appRouter = router({
  // Domain-based structure - all migrations complete
  domains: domainsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
