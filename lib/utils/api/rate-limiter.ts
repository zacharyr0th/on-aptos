import { LRUCache } from "lru-cache";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/utils/core/logger";

import { errorResponse } from "./common";

interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const rateLimiters = new Map<string, LRUCache<string, number[]>>();

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(
  name: string,
  options: RateLimitOptions = {},
): LRUCache<string, number[]> {
  const { uniqueTokenPerInterval = 500, interval = 60000 } = options;

  const limiter = new LRUCache<string, number[]>({
    max: uniqueTokenPerInterval,
    ttl: interval,
  });

  rateLimiters.set(name, limiter);
  return limiter;
}

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get IP from various headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown";

  // Combine with user agent for better uniqueness
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `${ip}:${userAgent}`;
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: NextRequest,
  limiterName: string,
  maxRequests: number = 10,
  windowMs: number = 60000,
): RateLimitResult {
  let limiter = rateLimiters.get(limiterName);

  if (!limiter) {
    limiter = createRateLimiter(limiterName, {
      uniqueTokenPerInterval: 500,
      interval: windowMs,
    });
  }

  const clientId = getClientId(request);
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or initialize request timestamps for this client
  let timestamps = limiter.get(clientId) || [];

  // Filter out old timestamps outside the current window
  timestamps = timestamps.filter((t) => t > windowStart);

  // Check if limit exceeded
  if (timestamps.length >= maxRequests) {
    const oldestTimestamp = timestamps[0];
    const resetTime = oldestTimestamp + windowMs;

    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: resetTime,
    };
  }

  // Add current timestamp and update cache
  timestamps.push(now);
  limiter.set(clientId, timestamps);

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - timestamps.length,
    reset: now + windowMs,
  };
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    name: string;
    maxRequests?: number;
    windowMs?: number;
  },
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { name, maxRequests = 10, windowMs = 60000 } = options;

    const result = checkRateLimit(request, name, maxRequests, windowMs);

    if (!result.success) {
      logger.warn("Rate limit exceeded", {
        clientId: getClientId(request),
        limiter: name,
        limit: result.limit,
      });

      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

      return errorResponse("Too many requests", 429, {
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset).toISOString(),
        retryAfter,
      });
    }

    // Add rate limit headers to response
    const response = await handler(request);

    response.headers.set("X-RateLimit-Limit", result.limit.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(result.reset).toISOString(),
    );

    return response;
  };
}

/**
 * Different rate limit tiers
 */
export const RATE_LIMIT_TIERS = {
  // Very restrictive for expensive operations
  STRICT: { maxRequests: 5, windowMs: 60000 },

  // Standard rate limiting
  STANDARD: { maxRequests: 30, windowMs: 60000 },

  // Relaxed for lightweight operations
  RELAXED: { maxRequests: 100, windowMs: 60000 },

  // For public APIs with caching
  PUBLIC: { maxRequests: 60, windowMs: 60000 },
} as const;
