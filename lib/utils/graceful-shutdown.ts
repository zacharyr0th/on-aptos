import { logger } from "@/lib/utils/core/logger";

// Check if we're in Node.js runtime
const isNodeRuntime = typeof process !== "undefined" && process.versions?.node;

interface ShutdownHandler {
  name: string;
  handler: () => Promise<void> | void;
  timeout?: number;
}

class GracefulShutdown {
  private handlers: ShutdownHandler[] = [];
  private isShuttingDown = false;
  private shutdownTimeout = 30000; // 30 seconds default
  private signalHandlersSetup = false;

  /**
   * Register a shutdown handler
   */
  register(handler: ShutdownHandler): void {
    if (this.isShuttingDown) {
      logger.warn(
        `[GracefulShutdown] Cannot register handler during shutdown: ${handler.name}`,
      );
      return;
    }

    this.handlers.push(handler);
    logger.info(
      `[GracefulShutdown] Registered shutdown handler: ${handler.name} (${this.handlers.length} total handlers)`,
    );
  }

  /**
   * Execute all shutdown handlers
   */
  private async executeHandlers(): Promise<void> {
    logger.info(
      { count: this.handlers.length },
      "[GracefulShutdown] Executing shutdown handlers",
    );

    // Execute handlers in parallel with individual timeouts
    const results = await Promise.allSettled(
      this.handlers.map(async ({ name, handler, timeout = 5000 }) => {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Handler timeout: ${name}`)),
            timeout,
          ),
        );

        try {
          await Promise.race([handler(), timeoutPromise]);
          logger.info(
            { handler: name },
            "[GracefulShutdown] Handler completed",
          );
        } catch (error) {
          logger.error(
            {
              handler: name,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            "[GracefulShutdown] Handler failed",
          );
          throw error;
        }
      }),
    );

    // Log results
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      logger.warn(
        {
          failed,
          total: this.handlers.length,
        },
        "[GracefulShutdown] Some handlers failed",
      );
    }
  }

  /**
   * Start graceful shutdown process
   */
  async shutdown(signal?: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn("[GracefulShutdown] Shutdown already in progress");
      return;
    }

    this.isShuttingDown = true;
    logger.info({ signal }, "[GracefulShutdown] Starting graceful shutdown");

    const shutdownPromise = this.executeHandlers();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Graceful shutdown timeout")),
        this.shutdownTimeout,
      ),
    );

    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
      logger.info("[GracefulShutdown] Graceful shutdown completed");
      if (isNodeRuntime) {
        process.exit(0);
      }
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "[GracefulShutdown] Graceful shutdown failed",
      );
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
        "[GracefulShutdown] Skipping signal handlers - not in Node.js runtime",
      );
      return;
    }

    // Prevent duplicate signal handlers
    if (this.signalHandlersSetup) {
      logger.info("[GracefulShutdown] Signal handlers already configured");
      return;
    }

    // Increase the max listeners to prevent memory leak warnings
    process.setMaxListeners(15);

    // Handle various termination signals
    const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT", "SIGUSR2"];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info({ signal }, "[GracefulShutdown] Signal received");
        await this.shutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error(
        {
          error: error.message,
          stack: error.stack,
        },
        "[GracefulShutdown] Uncaught exception",
      );
      this.shutdown("uncaughtException").catch(() => {
        if (isNodeRuntime) {
          process.exit(1);
        }
      });
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error(
        {
          reason: reason instanceof Error ? reason.message : String(reason),
          promise: String(promise),
        },
        "[GracefulShutdown] Unhandled rejection",
      );
      this.shutdown("unhandledRejection").catch(() => {
        if (isNodeRuntime) {
          process.exit(1);
        }
      });
    });

    this.signalHandlersSetup = true;
    logger.info("[GracefulShutdown] Signal handlers configured");
  }
}

// Export singleton instance
export const gracefulShutdown = new GracefulShutdown();

// Helper function to setup graceful shutdown
export function setupGracefulShutdown(): void {
  gracefulShutdown.setupSignalHandlers();

  // Register default handlers
  gracefulShutdown.register({
    name: "logger",
    handler: async () => {
      // Flush any pending logs
      await new Promise((resolve) => setTimeout(resolve, 100));
    },
    timeout: 1000,
  });

  // Add server close handler if in Node.js server context
  if ((global as { server?: unknown }).server) {
    gracefulShutdown.register({
      name: "http-server",
      handler: () => {
        return new Promise<void>((resolve, reject) => {
          if (
            !(
              global as {
                server?: { close: (callback: (error?: Error) => void) => void };
              }
            ).server
          ) {
            resolve();
            return;
          }

          (
            global as unknown as {
              server: { close: (callback: (error?: Error) => void) => void };
            }
          ).server.close((error?: Error) => {
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
