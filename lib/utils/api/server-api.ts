import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { CACHE_CONFIG } from "@/lib/config/cache";

import { RateLimitError } from "../core/errors";
import { errorLogger, logger } from "../core/logger";
import type { ApiResponse, RateLimitInfo } from "../core/types";

// Configuration using centralized config
const RATE_LIMIT_WINDOW = CACHE_CONFIG.RATE_LIMIT.WINDOW;
const RATE_LIMIT_MAX_REQUESTS = CACHE_CONFIG.RATE_LIMIT.MAX_REQUESTS;
const BURST_LIMIT = CACHE_CONFIG.RATE_LIMIT.BURST_LIMIT;
const BURST_WINDOW = CACHE_CONFIG.RATE_LIMIT.BURST_WINDOW;

// Rate limiting state
const ipRequests = new Map<
  string,
  {
    count: number;
    resetTime: number;
    requestTimestamps: number[];
  }
>();

/**
 * Get client IP address from request headers (Server-side only)
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();

  const forwardedFor = headersList.get("x-forwarded-for") || "";
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headersList.get("x-real-ip") || "";
  return realIp ? realIp : "unknown-ip";
}

/**
 * Check rate limit for a given IP
 */
export function checkRateLimit(ip: string): RateLimitInfo {
  const now = Date.now();
  const record = ipRequests.get(ip);

  // If no record exists or window has expired, create new record
  if (!record || now >= record.resetTime) {
    ipRequests.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
      requestTimestamps: [now],
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      burstRemaining: BURST_LIMIT - 1,
    };
  }

  // Clean up old timestamps outside of burst window
  record.requestTimestamps = record.requestTimestamps.filter(
    (timestamp) => now - timestamp < BURST_WINDOW
  );

  // Add current timestamp
  record.requestTimestamps.push(now);

  // Check for burst limit (too many requests in a short period)
  if (record.requestTimestamps.length > BURST_LIMIT) {
    const resetInSeconds = Math.ceil(BURST_WINDOW / 1000);
    return {
      allowed: false,
      resetInSeconds,
      remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - record.count),
      burstRemaining: 0,
    };
  }

  // Increment request count for the longer window
  record.count++;

  // Check if over limit for the main window
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      resetInSeconds,
      remaining: 0,
      burstRemaining: Math.max(0, BURST_LIMIT - record.requestTimestamps.length),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - record.count),
    burstRemaining: Math.max(0, BURST_LIMIT - record.requestTimestamps.length),
  };
}

/**
 * Get security headers including rate limit info
 */
export function getSecurityHeaders(rateLimitInfo: RateLimitInfo): Record<string, string> {
  return {
    "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
    "X-RateLimit-Remaining": rateLimitInfo.remaining.toString(),
    "X-RateLimit-Reset": (rateLimitInfo.resetInSeconds || RATE_LIMIT_WINDOW / 1000).toString(),
    "X-RateLimit-Burst-Limit": BURST_LIMIT.toString(),
    "X-RateLimit-Burst-Remaining": rateLimitInfo.burstRemaining.toString(),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
  };
}

/**
 * Clean up expired rate limit entries
 */
function scheduleRateLimitCleanup(): void {
  setTimeout(() => {
    try {
      const now = Date.now();

      // Clean up rate limit entries
      for (const [ip, data] of ipRequests.entries()) {
        if (now >= data.resetTime) {
          ipRequests.delete(ip);
          continue;
        }

        data.requestTimestamps = data.requestTimestamps.filter(
          (timestamp) => now - timestamp < BURST_WINDOW
        );
      }
    } catch (error) {
      errorLogger.error(
        `Rate limit cleanup error occurred: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      scheduleRateLimitCleanup();
    }
  }, 60000);
}

// Start rate limit cleanup process
scheduleRateLimitCleanup();

/**
 * Main API wrapper function with rate limiting and error handling (Server-side only)
 */
export async function withApiEnhancements<T>(
  handler: () => Promise<T>,
  options: {
    customHeaders?: Record<string, string>;
    cacheMaxAge?: number; // Allow custom cache max age in seconds
  } = {}
): Promise<NextResponse> {
  const startTime = Date.now();
  const clientIp = await getClientIp();

  try {
    // Log API request
    logger.debug(
      {
        clientIp,
      },
      "API request started"
    );

    // Rate limiting
    const rateLimitResult = checkRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      logger.warn(
        {
          clientIp,
          resetInSeconds: rateLimitResult.resetInSeconds,
        },
        "Rate limit exceeded"
      );

      throw new RateLimitError(
        `Rate limit exceeded. Please try again in ${rateLimitResult.resetInSeconds} seconds.`,
        rateLimitResult.resetInSeconds || 60
      );
    }

    // Execute handler
    const data = await handler();

    const responseData: ApiResponse<T> = {
      data,
      cached: false,
    };

    const etag = generateETag(responseData as Record<string, unknown>);
    const duration = Date.now() - startTime;

    // Log successful request with performance metrics
    logger.debug(
      {
        clientIp,
        duration,
      },
      "API request completed successfully"
    );

    const cacheMaxAge = options.cacheMaxAge || 60;
    const staleWhileRevalidate = Math.floor(cacheMaxAge / 2);

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        "CDN-Cache-Control": `public, max-age=${cacheMaxAge}`,
        ETag: etag,
        "X-Response-Time": `${duration}ms`,
        ...getSecurityHeaders(rateLimitResult),
        ...options.customHeaders,
      },
    });
  } catch (error) {
    errorLogger.error(
      `API request failed: ${error instanceof Error ? error.message : String(error)}`
    );

    // Handle rate limit errors specially
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: error.message,
        },
        {
          status: 429,
          headers: {
            "Retry-After": error.resetInSeconds.toString(),
          },
        }
      );
    }

    // Log error for monitoring
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        clientIp,
        duration: Date.now() - startTime,
      },
      "API request failed"
    );

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}

/**
 * Specialized function for tRPC-based endpoints (Server-side only)
 */
export async function withTrpcApiEnhancements<T>(
  trpcCaller: () => Promise<T>,
  customHeaders?: Record<string, string>
): Promise<NextResponse> {
  return withApiEnhancements(trpcCaller, {
    customHeaders,
  });
}

/**
 * Generate ETag for response
 */
export function generateETag(data: Record<string, unknown>): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `"${hash.toString(16)}"`;
}
