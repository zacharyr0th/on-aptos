import { logger } from './lib/utils/logger';

export async function register() {
  // Only run in Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logger.info('[Instrumentation] Setting up Node.js runtime features');

    // Dynamically import graceful shutdown only in Node.js runtime
    try {
      const { setupGracefulShutdown } = await import(
        './lib/utils/graceful-shutdown'
      );
      setupGracefulShutdown();
    } catch (error) {
      logger.warn('[Instrumentation] Failed to setup graceful shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Validate environment in production
    if (process.env.NODE_ENV === 'production') {
      try {
        const { validateEnv } = await import('./lib/config/validate-env');
        validateEnv();
        logger.info('[Instrumentation] Environment validation passed');
      } catch (error) {
        logger.error('[Instrumentation] Environment validation failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Don't exit in production, just log the error
      }
    }
  }
}
