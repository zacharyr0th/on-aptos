import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/core/logger";

// Configuration
const MAX_URL_LENGTH = 2048;
const MAX_QUERY_PARAMS = 50;
const MAX_HEADER_SIZE = 16384; // Match NODE_OPTIONS max-http-header-size

/**
 * Security middleware for API routes
 */
export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  try {
    // 1. Check URL length
    if (request.url.length > MAX_URL_LENGTH) {
      logger.warn("Request URL too long", {
        url: request.url.substring(0, 100),
        length: request.url.length,
      });
      return NextResponse.json({ error: "Request URL too long" }, { status: 414 });
    }

    // 2. Check query parameters count
    const paramCount = Array.from(request.nextUrl.searchParams.keys()).length;
    if (paramCount > MAX_QUERY_PARAMS) {
      logger.warn("Too many query parameters", {
        count: paramCount,
        path: request.nextUrl.pathname,
      });
      return NextResponse.json({ error: "Too many query parameters" }, { status: 400 });
    }

    // 3. Check header size
    let totalHeaderSize = 0;
    request.headers.forEach((value, key) => {
      totalHeaderSize += key.length + value.length;
    });

    if (totalHeaderSize > MAX_HEADER_SIZE) {
      logger.warn("Request headers too large", {
        size: totalHeaderSize,
        path: request.nextUrl.pathname,
      });
      return NextResponse.json({ error: "Request headers too large" }, { status: 431 });
    }

    // 4. Add security headers to response
    const response = NextResponse.next();

    // Security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // CORS headers for API routes
    if (request.nextUrl.pathname.startsWith("/api/")) {
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      response.headers.set("Access-Control-Max-Age", "3600");
    }

    return response;
  } catch (error) {
    logger.error("Middleware error", {
      error: error instanceof Error ? error.message : String(error),
      path: request.nextUrl.pathname,
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    "/api/:path*",
    // Exclude static files and images
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
