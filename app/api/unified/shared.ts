/**
 * Unified API shared utilities
 * Main barrel export file for unified API common functionality
 * Maintains backward compatibility while organizing code into focused modules
 */

import { NextResponse } from "next/server";

// Re-export constants and utilities from split modules
export * from "./constants";
export * from "./utils";

// Import CORS headers for the OPTIONS handler
import { CORS_HEADERS } from "./constants";

// Standard OPTIONS handler for all unified endpoints
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
};
