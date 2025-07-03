import { initTRPC } from '@trpc/server';
import { type NextRequest } from 'next/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

/**
 * Context interface for tRPC procedures
 * This will be extended as we add authentication, user sessions, etc.
 */
export interface Context {
  req?: NextRequest;
  // Add future context properties here:
  // user?: User;
  // session?: Session;
  // aptosAccount?: string;
}

/**
 * Create context for tRPC procedures
 * This function will be called for each request
 */
export const createContext = (opts?: { req?: NextRequest }): Context => {
  return {
    req: opts?.req,
  };
};

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
        httpStatus:
          error.code === 'UNAUTHORIZED'
            ? 401
            : error.code === 'FORBIDDEN'
              ? 403
              : error.code === 'NOT_FOUND'
                ? 404
                : error.code === 'BAD_REQUEST'
                  ? 400
                  : 500,
      },
    };
  },
});

/**
 * Rate limiting middleware
 * Add this to procedures that need rate limiting
 */
export const rateLimitMiddleware = t.middleware(async ({ next, ctx }) => {
  // Add rate limiting logic here in the future
  // For now, just pass through
  return next({ ctx });
});

/**
 * Logging middleware for debugging and monitoring
 */
export const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[tRPC] ${type} ${path} - ${durationMs}ms`);
  }

  return result;
});

/**
 * Enhanced public procedure with logging
 */
export const publicProcedure = t.procedure.use(loggingMiddleware);

/**
 * Enhanced procedure with rate limiting (for future use)
 */
export const rateLimitedProcedure = t.procedure
  .use(loggingMiddleware)
  .use(rateLimitMiddleware);

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
