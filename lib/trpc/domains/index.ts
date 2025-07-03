import { router } from '@/lib/trpc/core/server';
import { marketDataRouter } from './market-data';
import { assetsRouter } from './assets';
import { blockchainRouter } from './blockchain';
import { protocolsRouter } from './protocols';

/**
 * Domains Router
 * Aggregates all domain-specific routers
 */
export const domainsRouter = router({
  marketData: marketDataRouter,
  assets: assetsRouter,
  blockchain: blockchainRouter,
  protocols: protocolsRouter,
});
