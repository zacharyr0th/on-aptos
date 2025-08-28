import { readFile } from "fs/promises";
import { join } from "path";

import { NextResponse, NextRequest } from "next/server";

// Optimized headers for LLM and SEO visibility
const HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  "X-Robots-Tag": "index, follow",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Language": "en",
};

export async function GET(request: NextRequest) {
  try {
    // Basic input validation
    const userAgent = request.headers.get("user-agent") || "";
    if (userAgent.length > 300) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    // Get environment variables with fallbacks
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://onaptos.com";
    const developerName = process.env.DEVELOPER_NAME || "On Aptos Team";
    const developerEmail = process.env.DEVELOPER_EMAIL || "hello@onaptos.com";
    const developerWebsite =
      process.env.DEVELOPER_WEBSITE || "https://onaptos.com";
    const developerTwitter =
      process.env.DEVELOPER_TWITTER || "https://x.com/onaptos";
    const githubRepo =
      process.env.DEVELOPER_GITHUB || "https://github.com/onaptos/on-aptos";

    // Read the llms.txt file from the public directory and replace placeholders
    const filePath = join(process.cwd(), "public", "llms.txt");
    let content = await readFile(filePath, "utf-8");

    // Replace dynamic content
    content = content
      .replace(/Built by — [^(]*/g, `Built by — ${developerName} `)
      .replace(/zacharyroth@pm\.me/g, developerEmail)
      .replace(/https:\/\/github\.com\/zacharytylerroth\/on-aptos/g, githubRepo)
      .replace(/https:\/\/www\.zacharyr0th\.com\//g, developerWebsite)
      .replace(/https:\/\/x\.com\/zacharyr0th/g, developerTwitter);

    // Add minimal dynamic metadata
    const enhancedContent = `${content}

---
Generated: ${new Date().toISOString()}
Source: ${siteUrl}/llms.txt
`;

    return new NextResponse(enhancedContent, {
      status: 200,
      headers: {
        ...HEADERS,
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

    return new NextResponse(fallbackContent, {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Retry-After": "60",
      },
    });
  }
}

// Handle HEAD requests for efficient crawling
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Document-Available": "true",
    },
  });
}
