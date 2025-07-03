import { router } from '@/lib/trpc/core/server';
import { bitcoinRouter } from './bitcoin/router';
import { stablecoinsRouter } from './stablecoins/router';
import { liquidStakingRouter } from './liquid-staking/router';
import { rwaRouter } from '../../routers/rwa';

/**
 * Assets Router
 * Aggregates all asset-related routers
 */
export const assetsRouter = router({
  bitcoin: bitcoinRouter,
  stablecoins: stablecoinsRouter,
  liquidStaking: liquidStakingRouter,
  rwa: rwaRouter,
});
