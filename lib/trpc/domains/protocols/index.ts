import { router } from '@/lib/trpc/core/server';
import { echelonRouter } from './echelon/router';
import { thalaRouter } from './thala/router';
import { panoraRouter } from './panora/router';
import { moarRouter } from './moar/router';
import { echoRouter } from './echo/router';

/**
 * Protocols Router
 * Aggregates all external protocol integrations
 */
export const protocolsRouter = router({
  echelon: echelonRouter,
  thala: thalaRouter,
  panora: panoraRouter,
  moar: moarRouter,
  echo: echoRouter,
});
