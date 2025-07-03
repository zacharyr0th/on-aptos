import { inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';

/**
 * Creates the context for each request
 * @see https://trpc.io/docs/context
 */
export async function createContext(opts: CreateNextContextOptions) {
  const { req, res } = opts;

  // Add any request-specific context here
  // For example: user authentication, database connections, etc.
  return {
    req,
    res,
    // Add more context properties as needed
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
