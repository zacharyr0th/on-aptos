import { router } from '../../../core/server';

/**
 * Aptos Blockchain Router
 * Handles Aptos-specific blockchain functionality
 */
export const aptosRouter = router({
  // Add Aptos-specific procedures here as needed
  // Examples: indexer queries, transaction parsing, account data, etc.
});

export type AptosRouter = typeof aptosRouter;
