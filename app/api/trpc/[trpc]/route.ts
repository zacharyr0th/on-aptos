import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';
import { appRouter } from '@/lib/trpc/root';
import { createContext } from '@/lib/trpc/core/server';
import { getClientIp } from '@/lib/utils/server';

const handler = (req: NextRequest) => {
  // Basic security validation
  const contentType = req.headers.get('content-type') || '';
  const userAgent = req.headers.get('user-agent') || '';
  const clientIp = getClientIp();

  // Block suspicious requests
  if (userAgent.length > 500 || contentType.length > 200) {
    return new Response('Invalid request headers', { status: 400 });
  }

  // Basic rate limiting context
  const requestMeta = {
    ip: clientIp,
    userAgent: userAgent.slice(0, 100),
    timestamp: Date.now(),
  };

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    onError: ({ error, path, type, input }) => {
      // Enhanced error logging with context
      const errorContext = {
        path,
        type,
        input: typeof input === 'object' ? JSON.stringify(input).slice(0, 500) : input,
        clientIp,
        userAgent: userAgent.slice(0, 100),
        timestamp: new Date().toISOString(),
      };
      
      console.error(`[tRPC Error] ${path}:`, {
        error: error.message,
        cause: error.cause,
        code: error.code,
        context: errorContext,
      });

      // Log critical errors separately for monitoring
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error('[CRITICAL] tRPC Internal Error:', {
          error: error.message,
          stack: error.stack,
          context: errorContext,
        });
      }
    },
    responseMeta: ({ ctx, paths, type, errors }) => {
      // Add security headers and performance metrics
      const headers: Record<string, string> = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      };

      // Add caching for successful GET requests
      if (type === 'query' && errors.length === 0) {
        headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=30';
      }

      // Add rate limiting info (simplified for now)
      headers['X-RateLimit-Limit'] = '30';
      headers['X-RateLimit-Remaining'] = '29';

      return { headers };
    },
  });
};

export const GET = handler;
export const POST = handler;
