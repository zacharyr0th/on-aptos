/**
 * tRPC Public Exports
 */

// Client
export { trpc } from './client';

// Types
export type { AppRouter } from './root';

// Server (for API route)
export { appRouter } from './root';
export { createContext } from './core/server';
