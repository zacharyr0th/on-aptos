import { useEffect, useRef, useCallback } from "react";


interface PrefetchOptions {
  enabled?: boolean;
  maxConcurrentRequests?: number;
  prefetchDelay?: number;
  networkAware?: boolean;
}

interface ScrollMetrics {
  direction: "up" | "down" | "unknown";
  velocity: number;
  currentWindow: number;
}

/**
 * Hook for managing service worker-based transaction prefetching
 *
 * Features:
 * - Automatic service worker registration and management
 * - Scroll-based prefetch triggering with intelligent window calculation
 * - Network-aware prefetching (respects connection quality)
 * - Performance monitoring and cache statistics
 */
export function useServiceWorkerPrefetch(
  walletAddress: string | undefined,
  options: PrefetchOptions = {},
) {
  const {
    enabled = true,
    maxConcurrentRequests = 3,
    prefetchDelay = 200,
    networkAware = true,
  } = options;

  const serviceWorker = useRef<ServiceWorker | null>(null);
  const scrollMetrics = useRef<ScrollMetrics>({
    direction: "unknown",
    velocity: 0,
    currentWindow: 0,
  });
  const lastScrollPosition = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const prefetchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  /**
   * Register service worker
   */
  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !enabled) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        "/sw-transaction-prefetch.js",
        { scope: "/" },
      );

      if (registration.active) {
        serviceWorker.current = registration.active;
      } else if (registration.installing) {
        serviceWorker.current = registration.installing;
      } else if (registration.waiting) {
        serviceWorker.current = registration.waiting;
      }

      logger.debug("Service worker registered for transaction prefetching");

      // Listen for service worker state changes
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated") {
              serviceWorker.current = newWorker;
              logger.debug("Service worker activated");
            }
          });
        }
      });
    } catch (error) {
      logger.error(`Failed to register service worker: ${error}`);
    }
  }, [enabled]);

  /**
   * Send message to service worker
   */
  const sendMessage = useCallback((message: unknown) => {
    if (serviceWorker.current && serviceWorker.current.state === "activated") {
      serviceWorker.current.postMessage(message);
    }
  }, []);

  /**
   * Update connection quality information
   */
  const updateConnectionQuality = useCallback(() => {
    if (!networkAware) return;

    let quality = "good";

    // Use Network Information API if available
    if ("connection" in navigator) {
      const connection = (navigator as string).connection;

      if (connection) {
        const { effectiveType, downlink, rtt } = connection;

        if (
          effectiveType === "slow-2g" ||
          effectiveType === "2g" ||
          downlink < 0.5
        ) {
          quality = "slow";
        } else if (rtt > 300 || downlink < 1) {
          quality = "slow";
        }
      }
    }

    // Check if user has data saver enabled
    if (
      "connection" in navigator &&
      (navigator as string).connection?.saveData
    ) {
      quality = "slow";
    }

    sendMessage({
      type: "CONNECTION_CHANGE",
      data: { quality },
    });
  }, [networkAware, sendMessage]);

  /**
   * Calculate current window based on scroll position
   */
  const calculateCurrentWindow = useCallback(
    (scrollTop: number, itemHeight: number = 60): number => {
      return Math.floor(scrollTop / (itemHeight * 50)); // Assuming 50 items per window
    },
    [],
  );

  /**
   * Trigger prefetch based on current scroll metrics
   */
  const triggerPrefetch = useCallback(() => {
    if (!walletAddress || !serviceWorker.current) return;

    const { direction, velocity, currentWindow } = scrollMetrics.current;

    // Only prefetch if user is actively scrolling
    if (velocity < 0.1) return;

    sendMessage({
      type: "PREFETCH_TRANSACTION_WINDOWS",
      data: {
        walletAddress,
        currentWindow,
        scrollDirection: direction,
        scrollVelocity: velocity,
        maxConcurrentRequests,
      },
    });

    logger.debug(
      `Triggered prefetch: window=${currentWindow}, direction=${direction}, velocity=${velocity.toFixed(2)}`,
    );
  }, [walletAddress, maxConcurrentRequests, sendMessage]);

  /**
   * Handle scroll events for intelligent prefetching
   */
  const handleScroll = useCallback(
    (event: Event) => {
      if (!walletAddress || !enabled) return;

      const target = event.target as Element;
      const scrollTop = target.scrollTop;
      const now = Date.now();

      // Calculate scroll metrics
      const deltaY = scrollTop - lastScrollPosition.current;
      const deltaTime = now - lastScrollTime.current;
      const velocity = deltaTime > 0 ? Math.abs(deltaY / deltaTime) : 0;

      const direction = deltaY > 0 ? "down" : deltaY < 0 ? "up" : "unknown";
      const currentWindow = calculateCurrentWindow(scrollTop);

      scrollMetrics.current = {
        direction,
        velocity,
        currentWindow,
      };

      lastScrollPosition.current = scrollTop;
      lastScrollTime.current = now;

      // Debounce prefetch requests
      if (prefetchTimeout.current) {
        clearTimeout(prefetchTimeout.current);
      }

      prefetchTimeout.current = setTimeout(() => {
        triggerPrefetch();
      }, prefetchDelay);
    },
    [walletAddress, enabled, prefetchDelay, calculateCurrentWindow, triggerPrefetch],
  );

  /**
   * Manually trigger prefetch for specific windows
   */
  const prefetchWindows = useCallback(
    (windowIndexes: number[]) => {
      if (!walletAddress || !serviceWorker.current) return;

      windowIndexes.forEach((windowIndex) => {
        sendMessage({
          type: "PREFETCH_TRANSACTION_WINDOWS",
          data: {
            walletAddress,
            currentWindow: windowIndex,
            scrollDirection: "unknown",
            manualTrigger: true,
          },
        });
      });
    },
    [walletAddress, sendMessage],
  );

  /**
   * Get cache statistics from service worker
   */
  const getCacheStats = useCallback(: Promise<Record<string, unknown> | null> => {
    return new Promise((resolve) => {
      if (!serviceWorker.current) {
        resolve(null);
        return;
      }

      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        if (event.data.type === "CACHE_STATS") {
          resolve(event.data.data);
        }
      };

      serviceWorker.current.postMessage({ type: "GET_CACHE_STATS" }, [)
        channel.port2,
      ]);

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }, []);

  /**
   * Clean up cache
   */
  const cleanupCache = useCallback(() => {
    sendMessage({ type: "CACHE_CLEANUP" });
  }, [sendMessage]);

  /**
   * Attach scroll listener to container
   */
  const attachScrollListener = useCallback(
    (container: HTMLElement) => {
      if (!container) return;

      container.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    },
    [handleScroll],
  );

  /**
   * Initialize service worker and connection monitoring
   */
  useEffect(() => {
    registerServiceWorker();

    // Monitor connection changes
    if (networkAware && "connection" in navigator) {
      const connection = (navigator as string).connection;
      if (connection) {
        connection.addEventListener("change", updateConnectionQuality);
        updateConnectionQuality(); // Initial check

        return () => {
          connection.removeEventListener("change", updateConnectionQuality);
        };
      }
    }
  }, [registerServiceWorker, updateConnectionQuality, networkAware]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (prefetchTimeout.current) {
        clearTimeout(prefetchTimeout.current);
      }
    };
  }, []);

  return {
    // Core functionality
    attachScrollListener,
    prefetchWindows,

    // Monitoring and debugging
    getCacheStats,
    cleanupCache,
    getScrollMetrics: () => scrollMetrics.current,

    // Status
    isEnabled: enabled && !!serviceWorker.current,
    isServiceWorkerReady: !!serviceWorker.current,
  };
}
