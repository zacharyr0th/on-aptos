import { router } from '../../core/server';

/**
 * Aptos specific router for blockchain-related functionality
 * This router can be extended with Aptos-specific procedures
 */
export const aptosRouter = router({
  // Add Aptos-specific procedures here as needed
});

export type AptosRouter = typeof aptosRouter;
