/**
 * Backward compatibility exports
 * Re-exports from core/server for legacy imports
 * All router imports have been migrated to use core/server directly
 */

export {
  router,
  publicProcedure,
  rateLimitedProcedure,
  createContext,
  type Context,
} from './core/server';
