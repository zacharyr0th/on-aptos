import { type NextRequest, NextResponse } from "next/server";

import {
  createSEOErrorResponse,
  createSEOHeadResponse,
  generateSEOStructuredData,
  getSEOConfig,
  SEO_HEADERS,
  validateSEORequest,
} from "@/lib/utils/seo";

export async function GET(request: NextRequest) {
  try {
    // Validate request security
    if (!validateSEORequest(request)) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    const structuredData = generateSEOStructuredData();

    return NextResponse.json(structuredData, {
      headers: SEO_HEADERS.JSON_LD,
    });
  } catch (error) {
    // Fallback structured data for error cases
    const config = getSEOConfig();
    const fallbackData = {
      "@context": "https://schema.org",
      "@type": "WebAPI",
      name: "On Aptos API",
      description: "API service for Aptos blockchain analytics",
      url: config.siteUrl,
      error: "Unable to generate complete metadata",
    };

    return createSEOErrorResponse(JSON.stringify(fallbackData), "JSON_LD");
  }
}

export async function HEAD() {
  return createSEOHeadResponse("JSON_LD");
}
