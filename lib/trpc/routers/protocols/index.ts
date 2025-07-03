import { router } from '../../core/server';
import { echelonRouter } from './echelon';
import { thalaRouter } from './thala';
import { panoraRouter } from './panora';
import { moarRouter } from './moar';
import { echoRouter } from './echo';

/**
 * Protocols router
 * Consolidates all external protocol integrations (DeFi protocols, bridges, etc.)
 * Each protocol is isolated and follows consistent patterns for easy extension
 */
export const protocolsRouter = router({
  echelon: echelonRouter,
  thala: thalaRouter,
  panora: panoraRouter,
  moar: moarRouter,
  echo: echoRouter,
});
