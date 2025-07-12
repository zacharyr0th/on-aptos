import { router } from '@/lib/trpc/core/server';
import { bitcoinRouter } from './bitcoin/router';
import { liquidStakingRouter } from './liquid-staking/router';
import { rwaRouter } from '../../routers/rwa';

/**
 * Assets Router
 * Aggregates all asset-related routers
 */
export const assetsRouter = router({
  bitcoin: bitcoinRouter,
  liquidStaking: liquidStakingRouter,
  rwa: rwaRouter,
});
