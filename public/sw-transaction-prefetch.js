/**
 * Service Worker for Background Transaction Prefetching
 *
 * Features:
 * - Intelligent prefetching based on user scroll patterns
 * - Background cache warming for likely-to-be-accessed data
 * - Network-aware loading (respects connection quality)
 * - Efficient cache management with TTL and size limits
 */

const CACHE_NAME = "transaction-prefetch-v1";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum cached responses
const PREFETCH_DISTANCE = 3; // How many windows ahead to prefetch

// Network quality detection
let connectionQuality = "good"; // good, slow, offline

self.addEventListener("install", (event) => {
  console.log("Transaction prefetch service worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Transaction prefetch service worker activated");
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the main thread
self.addEventListener("message", (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "PREFETCH_TRANSACTION_WINDOWS":
      handlePrefetchRequest(data);
      break;
    case "CONNECTION_CHANGE":
      connectionQuality = data.quality;
      break;
    case "CACHE_CLEANUP":
      cleanupCache();
      break;
    case "GET_CACHE_STATS":
      getCacheStats().then((stats) => {
        event.ports[0].postMessage({ type: "CACHE_STATS", data: stats });
      });
      break;
  }
});

// Handle fetch requests with intelligent caching
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle transaction API requests
  if (url.pathname.includes("/api/portfolio/transactions")) {
    event.respondWith(handleTransactionRequest(event.request));
  }
});

/**
 * Handle transaction API requests with caching strategy
 */
async function handleTransactionRequest(request) {
  const url = new URL(request.url);
  const cacheKey = generateCacheKey(url);

  try {
    // Check cache first
    const cached = await getCachedResponse(cacheKey);
    if (cached && !isExpired(cached.timestamp)) {
      console.log("SW: Cache hit for", cacheKey);
      return new Response(cached.data, {
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "HIT",
          "X-Cached-At": new Date(cached.timestamp).toISOString(),
        },
      });
    }

    // Fetch from network
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const responseData = await response.text();
      await cacheResponse(cacheKey, responseData);

      return new Response(responseData, {
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          "X-Cache": "MISS",
        },
      });
    }

    return response;
  } catch (error) {
    console.error("SW: Error handling transaction request:", error);

    // Try to serve stale cache on network error
    const stale = await getCachedResponse(cacheKey);
    if (stale) {
      return new Response(stale.data, {
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "STALE",
        },
      });
    }

    throw error;
  }
}

/**
 * Handle prefetch requests from main thread
 */
async function handlePrefetchRequest(data) {
  const { walletAddress, currentWindow, scrollDirection, viewportSize } = data;

  // Don't prefetch on slow connections
  if (connectionQuality === "slow" || connectionQuality === "offline") {
    console.log(
      "SW: Skipping prefetch due to connection quality:",
      connectionQuality,
    );
    return;
  }

  // Determine prefetch strategy based on scroll direction
  const windowsToPreload = calculatePrefetchWindows(
    currentWindow,
    scrollDirection,
  );

  console.log(
    "SW: Prefetching windows:",
    windowsToPreload,
    "for wallet:",
    walletAddress,
  );

  // Prefetch in background with minimal impact
  for (const windowIndex of windowsToPreload) {
    try {
      await prefetchWindow(walletAddress, windowIndex);

      // Small delay between requests to avoid overwhelming the server
      await sleep(100);
    } catch (error) {
      console.warn("SW: Failed to prefetch window", windowIndex, error);
    }
  }
}

/**
 * Calculate which windows to prefetch based on user behavior
 */
function calculatePrefetchWindows(currentWindow, scrollDirection) {
  const windows = [];

  if (scrollDirection === "down" || scrollDirection === "unknown") {
    // Prefetch next windows
    for (let i = 1; i <= PREFETCH_DISTANCE; i++) {
      windows.push(currentWindow + i);
    }
  }

  if (scrollDirection === "up") {
    // Prefetch previous windows
    for (let i = 1; i <= Math.min(PREFETCH_DISTANCE, currentWindow); i++) {
      windows.push(currentWindow - i);
    }
  }

  return windows;
}

/**
 * Prefetch a specific transaction window
 */
async function prefetchWindow(walletAddress, windowIndex) {
  const offset = windowIndex * 50; // Assuming 50 transactions per window
  const url = new URL("/api/portfolio/transactions", self.location.origin);

  url.searchParams.set("address", walletAddress);
  url.searchParams.set("limit", "50");
  url.searchParams.set("offset", offset.toString());
  url.searchParams.set("lazy", "true"); // Use lightweight loading for prefetch
  url.searchParams.set("events", "false"); // Minimal data for prefetch

  const cacheKey = generateCacheKey(url);

  // Skip if already cached and not expired
  const existing = await getCachedResponse(cacheKey);
  if (existing && !isExpired(existing.timestamp)) {
    return;
  }

  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.text();
      await cacheResponse(cacheKey, data);
      console.log(
        "SW: Prefetched window",
        windowIndex,
        "for wallet",
        walletAddress,
      );
    }
  } catch (error) {
    console.warn("SW: Prefetch failed for window", windowIndex, error);
  }
}

/**
 * Generate cache key for request
 */
function generateCacheKey(url) {
  const params = new URLSearchParams(url.search);
  const key = `tx_${params.get("address")}_${params.get("offset")}_${params.get("limit")}`;
  return key;
}

/**
 * Cache response with timestamp
 */
async function cacheResponse(key, data) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cacheData = {
      data,
      timestamp: Date.now(),
    };

    await cache.put(key, new Response(JSON.stringify(cacheData)));

    // Cleanup old entries if cache is too large
    await maintainCacheSize();
  } catch (error) {
    console.warn("SW: Failed to cache response:", error);
  }
}

/**
 * Get cached response
 */
async function getCachedResponse(key) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(key);

    if (response) {
      const cacheData = await response.json();
      return cacheData;
    }

    return null;
  } catch (error) {
    console.warn("SW: Failed to get cached response:", error);
    return null;
  }
}

/**
 * Check if cached data is expired
 */
function isExpired(timestamp) {
  return Date.now() - timestamp > CACHE_TTL;
}

/**
 * Maintain cache size by removing oldest entries
 */
async function maintainCacheSize() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();

    if (keys.length > MAX_CACHE_SIZE) {
      // Get all entries with timestamps
      const entries = await Promise.all(
        keys.map(async (key) => {
          const response = await cache.match(key);
          const data = await response.json();
          return { key, timestamp: data.timestamp };
        }),
      );

      // Sort by timestamp and remove oldest
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toDelete = entries.slice(0, keys.length - MAX_CACHE_SIZE);

      await Promise.all(toDelete.map((entry) => cache.delete(entry.key)));

      console.log("SW: Cleaned up", toDelete.length, "old cache entries");
    }
  } catch (error) {
    console.warn("SW: Cache maintenance failed:", error);
  }
}

/**
 * Manual cache cleanup
 */
async function cleanupCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();

    let cleaned = 0;

    for (const key of keys) {
      try {
        const response = await cache.match(key);
        const data = await response.json();

        if (isExpired(data.timestamp)) {
          await cache.delete(key);
          cleaned++;
        }
      } catch {
        // Remove corrupted entries
        await cache.delete(key);
        cleaned++;
      }
    }

    console.log("SW: Manual cleanup removed", cleaned, "entries");
  } catch (error) {
    console.warn("SW: Manual cleanup failed:", error);
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();

    let totalSize = 0;
    let expiredCount = 0;

    for (const key of keys) {
      try {
        const response = await cache.match(key);
        const data = await response.json();

        totalSize += JSON.stringify(data).length;

        if (isExpired(data.timestamp)) {
          expiredCount++;
        }
      } catch {
        expiredCount++;
      }
    }

    return {
      totalEntries: keys.length,
      expiredEntries: expiredCount,
      totalSizeBytes: totalSize,
      cacheEfficiency:
        keys.length > 0 ? (keys.length - expiredCount) / keys.length : 0,
    };
  } catch (error) {
    console.warn("SW: Failed to get cache stats:", error);
    return null;
  }
}

/**
 * Utility function for delays
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
