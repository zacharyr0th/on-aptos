import { type NextRequest, NextResponse } from "next/server";

import {
  createSEOErrorResponse,
  createSEOHeadResponse,
  processLlmsContent,
  SEO_HEADERS,
  validateSEORequest,
} from "@/lib/utils/seo";

export async function GET(request: NextRequest) {
  try {
    // Validate request security
    if (!validateSEORequest(request)) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    const enhancedContent = await processLlmsContent();

    return new NextResponse(enhancedContent, {
      status: 200,
      headers: {
        ...SEO_HEADERS.TEXT_PLAIN,
        "Last-Modified": new Date().toUTCString(),
      },
    });
  } catch (error) {
    // Fallback content for error cases
    const fallbackContent = `# On Aptos - API Documentation

On Aptos is an open analytics project that surfaces real-time token supplies, prices, and DeFi metrics for the Aptos blockchain.

Visit https://onaptos.com for the full documentation.

Error: Unable to load complete documentation.
Timestamp: ${new Date().toISOString()}
`;

    return createSEOErrorResponse(fallbackContent, "TEXT_PLAIN");
  }
}

// Handle HEAD requests for efficient crawling
export async function HEAD() {
  return createSEOHeadResponse("TEXT_PLAIN");
}
