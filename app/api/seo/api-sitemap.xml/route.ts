import { type NextRequest, NextResponse } from "next/server";

import {
  createSEOErrorResponse,
  createSEOHeadResponse,
  generateAPISitemap,
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

    const sitemap = generateAPISitemap();

    return new NextResponse(sitemap, {
      headers: SEO_HEADERS.XML,
    });
  } catch (error) {
    // Fallback sitemap for error cases
    const config = getSEOConfig();
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.siteUrl}/api</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

    return createSEOErrorResponse(fallbackSitemap, "XML");
  }
}

export async function HEAD() {
  return createSEOHeadResponse("XML");
}
