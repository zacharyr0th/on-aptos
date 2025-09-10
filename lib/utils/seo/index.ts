/**
 * SEO utilities for consistent SEO-related API responses
 * Consolidates header configurations, validation, and error handling
 */

import { readFile } from "fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { DEVELOPER_CONFIG } from "@/lib/config/app";
import { apiLogger } from "../core/logger";

// Common SEO headers for different content types
export const SEO_HEADERS = {
  TEXT_PLAIN: {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    "X-Robots-Tag": "index, follow",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Language": "en",
  },
  JSON_LD: {
    "Content-Type": "application/ld+json",
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    "X-Robots-Tag": "index, follow",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  },
  XML: {
    "Content-Type": "application/xml",
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Robots-Tag": "index, follow",
  },
} as const;

// HEAD response headers for document availability checking
export const HEAD_HEADERS = {
  TEXT_PLAIN: {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Document-Available": "true",
  },
  JSON_LD: {
    "Content-Type": "application/ld+json",
    "X-Document-Available": "true",
  },
  XML: {
    "Content-Type": "application/xml",
    "X-Document-Available": "true",
  },
} as const;

// Error response headers
export const ERROR_HEADERS = {
  "Cache-Control": "no-cache",
  "Retry-After": "60",
} as const;

/**
 * Validates request security (user-agent length check)
 */
export function validateSEORequest(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") || "";
  return userAgent.length <= 300;
}

/**
 * Creates a standardized error response for SEO endpoints
 */
export function createSEOErrorResponse(
  content: string,
  contentType: keyof typeof SEO_HEADERS,
  status: number = 503
): NextResponse {
  const headers = {
    "Content-Type": SEO_HEADERS[contentType]["Content-Type"],
    ...ERROR_HEADERS,
  };

  return new NextResponse(content, { status, headers });
}

/**
 * Creates a HEAD response for SEO endpoints
 */
export function createSEOHeadResponse(contentType: keyof typeof HEAD_HEADERS): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: HEAD_HEADERS[contentType],
  });
}

/**
 * Gets environment configuration for SEO endpoints
 */
export function getSEOConfig() {
  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://onaptos.com",
    developerName: process.env.DEVELOPER_NAME || DEVELOPER_CONFIG.name,
    developerEmail: process.env.DEVELOPER_EMAIL || DEVELOPER_CONFIG.email,
    developerWebsite: process.env.DEVELOPER_WEBSITE || DEVELOPER_CONFIG.website,
    developerTwitter: process.env.DEVELOPER_TWITTER || DEVELOPER_CONFIG.twitter,
    githubRepo: process.env.DEVELOPER_GITHUB || DEVELOPER_CONFIG.github,
  };
}

/**
 * Reads and processes the llms.txt file with dynamic replacements
 * Includes performance monitoring and error handling
 */
export async function processLlmsContent(): Promise<string> {
  const startTime = performance.now();

  try {
    const config = getSEOConfig();
    const filePath = join(process.cwd(), "public", "llms.txt");
    let content = await readFile(filePath, "utf-8");

    // Replace dynamic content
    content = content
      .replace(/Built by — [^(]*/g, `Built by — ${config.developerName} `)
      .replace(/zacharyroth@pm\.me/g, config.developerEmail)
      .replace(/https:\/\/github\.com\/zacharytylerroth\/on-aptos/g, config.githubRepo)
      .replace(/https:\/\/www\.zacharyr0th\.com\//g, config.developerWebsite)
      .replace(/https:\/\/x\.com\/zacharyr0th/g, config.developerTwitter);

    // Add minimal dynamic metadata
    const result = `${content}

---
Generated: ${new Date().toISOString()}
Source: ${config.siteUrl}/llms.txt
`;

    const duration = performance.now() - startTime;
    apiLogger.info("SEO llms.txt processed", {
      duration: `${duration.toFixed(2)}ms`,
      contentLength: result.length,
      replacements: 5,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    apiLogger.error("Failed to process llms.txt", {
      error: error instanceof Error ? error.message : "Unknown error",
      duration: `${duration.toFixed(2)}ms`,
    });
    throw error;
  }
}

/**
 * Gets README summary for LLM consumption
 * Includes performance monitoring and error handling
 */
export async function getReadmeSummary(): Promise<string> {
  const startTime = performance.now();

  try {
    const fullPath = join(process.cwd(), "README.md");
    const md = await readFile(fullPath, "utf-8");
    const words = md.split(/\s+/).slice(0, 300).join(" ");

    const duration = performance.now() - startTime;
    apiLogger.info("SEO README summary generated", {
      duration: `${duration.toFixed(2)}ms`,
      originalLength: md.length,
      summaryLength: words.length,
      wordsExtracted: 300,
    });

    return words;
  } catch (error) {
    const duration = performance.now() - startTime;
    apiLogger.warn("Failed to read README, using fallback", {
      error: error instanceof Error ? error.message : "Unknown error",
      duration: `${duration.toFixed(2)}ms`,
    });

    return "On Aptos – real-time blockchain analytics for the Aptos ecosystem.";
  }
}

/**
 * Generates structured data for SEO metadata
 * Includes performance monitoring
 */
export function generateSEOStructuredData() {
  const startTime = performance.now();
  const config = getSEOConfig();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebAPI",
    "@id": `${config.siteUrl}/api`,
    name: "On Aptos API",
    description:
      "Comprehensive API service providing real-time information about token supplies, prices, and analytics on the Aptos blockchain",
    url: config.siteUrl,
    documentation: `${config.siteUrl}/llms.txt`,
    provider: {
      "@type": "Person",
      name: config.developerName,
      url: config.developerWebsite,
      sameAs: [config.developerTwitter, config.githubRepo],
      jobTitle: "Ecosystem Builder & Full Stack Developer",
      description:
        "Ecosystem builder, market analyst, and full stack developer with experience across Bitcoin, Ethereum, Solana, and Aptos",
    },
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${config.siteUrl}/api/data/aptos/{category}`,
          description: "Search for token data by category (btc, stables, rwas)",
        },
      },
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free API access with rate limiting",
    },
    serviceType: "Blockchain Analytics API",
    areaServed: "Global",
    availableChannel: [
      {
        "@type": "ServiceChannel",
        serviceUrl: `${config.siteUrl}/api`,
        serviceType: "REST API",
        availableLanguage: "en",
      },
      {
        "@type": "ServiceChannel",
        serviceUrl: `${config.siteUrl}/api/trpc`,
        serviceType: "tRPC API",
        availableLanguage: "en",
      },
    ],
    category: [
      "Blockchain",
      "Cryptocurrency",
      "DeFi",
      "Analytics",
      "Aptos",
      "Bitcoin",
      "Stablecoins",
      "Real World Assets",
    ],
    keywords: [
      "Aptos blockchain",
      "cryptocurrency API",
      "DeFi analytics",
      "Bitcoin on Aptos",
      "stablecoin tracking",
      "blockchain data",
      "real-time prices",
      "token supplies",
      "xBTC",
      "SBTC",
      "aBTC",
      "USDT",
      "USDC",
      "USDe",
      "sUSDe",
      "amAPT",
      "stAPT",
      "thAPT",
      "sthAPT",
      "kAPT",
      "stkAPT",
      "real world assets",
      "RWA",
      "tokenized assets",
      "asset tokenization",
    ],
    mainEntity: {
      "@type": "DataCatalog",
      name: "On Aptos Token Database",
      description: "Real-time token supply and pricing data for the Aptos blockchain",
      dataset: [
        {
          "@type": "Dataset",
          name: "Bitcoin Tokens on Aptos",
          description: "Supply data for wrapped Bitcoin tokens (xBTC, SBTC, aBTC)",
          distribution: {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `${config.siteUrl}/api/data/aptos/btc`,
          },
        },
        {
          "@type": "Dataset",
          name: "Stablecoins on Aptos",
          description: "Supply data for stablecoins (USDT, USDC, USDe, sUSDe)",
          distribution: {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `${config.siteUrl}/api/data/aptos/stables`,
          },
        },
        {
          "@type": "Dataset",
          name: "Real World Assets on Aptos",
          description: "Supply data for tokenized real world assets on Aptos blockchain",
          distribution: {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: `${config.siteUrl}/api/data/aptos/rwas`,
          },
        },
      ],
    },
    dateCreated: "2024-01-01",
    dateModified: new Date().toISOString(),
    version: "2.0.0",
    license: "https://opensource.org/licenses/MIT",
    inLanguage: "en",
    isAccessibleForFree: true,
    hasPart: [
      {
        "@type": "WebPage",
        "@id": `${config.siteUrl}/markets/bitcoin`,
        name: "Bitcoin Dashboard",
        description: "Real-time tracking of Bitcoin tokens on Aptos",
      },
      {
        "@type": "WebPage",
        "@id": `${config.siteUrl}/markets/stables`,
        name: "Stablecoins Dashboard",
        description: "Real-time tracking of stablecoins on Aptos",
      },
      {
        "@type": "WebPage",
        "@id": `${config.siteUrl}/protocols/defi`,
        name: "DeFi Dashboard",
        description: "DeFi protocol analytics on Aptos",
      },
      {
        "@type": "WebPage",
        "@id": `${config.siteUrl}/markets/rwas`,
        name: "RWA Dashboard",
        description: "Real-time tracking of tokenized real world assets on Aptos",
      },
    ],
  };

  const duration = performance.now() - startTime;
  apiLogger.info("SEO structured data generated", {
    duration: `${duration.toFixed(2)}ms`,
    datasets: structuredData.mainEntity.dataset.length,
    categories: structuredData.category.length,
    keywords: structuredData.keywords.length,
  });

  return structuredData;
}

/**
 * Creates API sitemap XML content
 * Includes performance monitoring
 */
export function generateAPISitemap(): string {
  const startTime = performance.now();
  const config = getSEOConfig();
  const currentDate = new Date().toISOString();

  const apiEndpoints = [
    {
      url: "/api/data/aptos/btc",
      lastmod: currentDate,
      changefreq: "hourly",
      priority: 0.8,
    },
    {
      url: "/api/data/aptos/stables",
      lastmod: currentDate,
      changefreq: "hourly",
      priority: 0.8,
    },
    {
      url: "/api/data/aptos/rwas",
      lastmod: currentDate,
      changefreq: "hourly",
      priority: 0.8,
    },
    {
      url: "/api/data/prices/panora",
      lastmod: currentDate,
      changefreq: "hourly",
      priority: 0.7,
    },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${apiEndpoints
  .map(
    (endpoint) => `  <url>
    <loc>${config.siteUrl}${endpoint.url}</loc>
    <lastmod>${endpoint.lastmod}</lastmod>
    <changefreq>${endpoint.changefreq}</changefreq>
    <priority>${endpoint.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  const duration = performance.now() - startTime;
  apiLogger.info("SEO API sitemap generated", {
    duration: `${duration.toFixed(2)}ms`,
    endpoints: apiEndpoints.length,
    sitemapLength: sitemap.length,
  });

  return sitemap;
}
