import { router } from '@/lib/trpc/core/server';
import { aptosRouter } from './aptos/router';
import { portfolioRouter } from './portfolio/router';

/**
 * Blockchain Router
 * Aggregates all blockchain-specific routers
 */
export const blockchainRouter = router({
  aptos: aptosRouter,
  portfolio: portfolioRouter,
});
