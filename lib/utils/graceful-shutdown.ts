import { logger } from './logger';

// Check if we're in Node.js runtime
const isNodeRuntime = typeof process !== 'undefined' && process.versions?.node;

interface ShutdownHandler {
  name: string;
  handler: () => Promise<void> | void;
  timeout?: number;
}

class GracefulShutdown {
  private handlers: ShutdownHandler[] = [];
  private isShuttingDown = false;
  private shutdownTimeout = 30000; // 30 seconds default

  /**
   * Register a shutdown handler
   */
  register(handler: ShutdownHandler): void {
    if (this.isShuttingDown) {
      logger.warn(
        '[GracefulShutdown] Cannot register handler during shutdown',
        {
          handler: handler.name,
        }
      );
      return;
    }

    this.handlers.push(handler);
    logger.info('[GracefulShutdown] Registered shutdown handler', {
      handler: handler.name,
      totalHandlers: this.handlers.length,
    });
  }

  /**
   * Execute all shutdown handlers
   */
  private async executeHandlers(): Promise<void> {
    logger.info('[GracefulShutdown] Executing shutdown handlers', {
      count: this.handlers.length,
    });

    // Execute handlers in parallel with individual timeouts
    const results = await Promise.allSettled(
      this.handlers.map(async ({ name, handler, timeout = 5000 }) => {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Handler timeout: ${name}`)),
            timeout
          )
        );

        try {
          await Promise.race([handler(), timeoutPromise]);
          logger.info('[GracefulShutdown] Handler completed', {
            handler: name,
          });
        } catch (error) {
          logger.error('[GracefulShutdown] Handler failed', {
            handler: name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      })
    );

    // Log results
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      logger.warn('[GracefulShutdown] Some handlers failed', {
        failed,
        total: this.handlers.length,
      });
    }
  }

  /**
   * Start graceful shutdown process
   */
  async shutdown(signal?: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('[GracefulShutdown] Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info('[GracefulShutdown] Starting graceful shutdown', { signal });

    const shutdownPromise = this.executeHandlers();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Graceful shutdown timeout')),
        this.shutdownTimeout
      )
    );

    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
      logger.info('[GracefulShutdown] Graceful shutdown completed');
      if (isNodeRuntime) {
        process.exit(0);
      }
    } catch (error) {
      logger.error('[GracefulShutdown] Graceful shutdown failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      if (isNodeRuntime) {
        process.exit(1);
      }
    }
  }

  /**
   * Setup signal handlers
   */
  setupSignalHandlers(): void {
    // Only setup signal handlers in Node.js runtime
    if (!isNodeRuntime) {
      logger.warn(
        '[GracefulShutdown] Skipping signal handlers - not in Node.js runtime'
      );
      return;
    }

    // Handle various termination signals
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info('[GracefulShutdown] Signal received', { signal });
        await this.shutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      logger.error('[GracefulShutdown] Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      this.shutdown('uncaughtException').catch(() => {
        if (isNodeRuntime) {
          process.exit(1);
        }
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('[GracefulShutdown] Unhandled rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: String(promise),
      });
      this.shutdown('unhandledRejection').catch(() => {
        if (isNodeRuntime) {
          process.exit(1);
        }
      });
    });

    logger.info('[GracefulShutdown] Signal handlers configured');
  }
}

// Export singleton instance
export const gracefulShutdown = new GracefulShutdown();

// Helper function to setup graceful shutdown
export function setupGracefulShutdown(): void {
  gracefulShutdown.setupSignalHandlers();

  // Register default handlers
  gracefulShutdown.register({
    name: 'logger',
    handler: async () => {
      // Flush any pending logs
      await new Promise(resolve => setTimeout(resolve, 100));
    },
    timeout: 1000,
  });

  // Add server close handler if in Node.js server context
  if ((global as any).server) {
    gracefulShutdown.register({
      name: 'http-server',
      handler: () => {
        return new Promise<void>((resolve, reject) => {
          if (!(global as any).server) {
            resolve();
            return;
          }

          (global as any).server.close((error: any) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      },
      timeout: 25000,
    });
  }
}
