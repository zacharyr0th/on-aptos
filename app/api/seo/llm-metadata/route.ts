import { NextResponse, NextRequest } from "next/server";

import { DEVELOPER_CONFIG } from "@/lib/config/app";

// Structured data for LLMs and search engines
const generateStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "WebAPI",
  "@id": "https://onaptos.com/api",
  name: "On Aptos API",
  description:
    "Comprehensive API service providing real-time information about token supplies, prices, and analytics on the Aptos blockchain",
  url: "https://onaptos.com",
  documentation: "https://onaptos.com/llms.txt",
  provider: {
    "@type": "Person",
    name: DEVELOPER_CONFIG.name,
    url: DEVELOPER_CONFIG.website,
    sameAs: [DEVELOPER_CONFIG.twitter, DEVELOPER_CONFIG.github],
    jobTitle: "Ecosystem Builder & Full Stack Developer",
    description:
      "Ecosystem builder, market analyst, and full stack developer with experience across Bitcoin, Ethereum, Solana, and Aptos",
  },
  potentialAction: [
    {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://onaptos.com/api/aptos/{category}",
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
      serviceUrl: "https://onaptos.com/api",
      serviceType: "REST API",
      availableLanguage: "en",
    },
    {
      "@type": "ServiceChannel",
      serviceUrl: "https://onaptos.com/api/trpc",
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
    description:
      "Real-time token supply and pricing data for the Aptos blockchain",
    dataset: [
      {
        "@type": "Dataset",
        name: "Bitcoin Tokens on Aptos",
        description:
          "Supply data for wrapped Bitcoin tokens (xBTC, SBTC, aBTC)",
        distribution: {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: "https://onaptos.com/api/aptos/btc",
        },
      },
      {
        "@type": "Dataset",
        name: "Stablecoins on Aptos",
        description: "Supply data for stablecoins (USDT, USDC, USDe, sUSDe)",
        distribution: {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: "https://onaptos.com/api/aptos/stables",
        },
      },
      {
        "@type": "Dataset",
        name: "Real World Assets on Aptos",
        description:
          "Supply data for tokenized real world assets on Aptos blockchain",
        distribution: {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: "https://onaptos.com/api/aptos/rwas",
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
      "@id": "https://onaptos.com/bitcoin",
      name: "Bitcoin Dashboard",
      description: "Real-time tracking of Bitcoin tokens on Aptos",
    },
    {
      "@type": "WebPage",
      "@id": "https://onaptos.com/stablecoins",
      name: "Stablecoins Dashboard",
      description: "Real-time tracking of stablecoins on Aptos",
    },
    {
      "@type": "WebPage",
      "@id": "https://onaptos.com/defi",
      name: "DeFi Dashboard",
      description: "DeFi protocol analytics on Aptos",
    },
    {
      "@type": "WebPage",
      "@id": "https://onaptos.com/rwas",
      name: "RWA Dashboard",
      description: "Real-time tracking of tokenized real world assets on Aptos",
    },
  ],
});

export async function GET(request: NextRequest) {
  // Input validation and security
  const userAgent = request.headers.get("user-agent") || "";
  if (userAgent.length > 300) {
    return new NextResponse("Invalid request", { status: 400 });
  }

  const structuredData = generateStructuredData();

  // Ensure identifier and language are explicitly set at the top level
  // (generateStructuredData already sets inLanguage but we ensure identifier here)
  if (!("identifier" in structuredData)) {
    (structuredData as any).identifier = "https://onaptos.com";
  }
  if (!("inLanguage" in structuredData)) {
    (structuredData as any).inLanguage = "en";
  }

  return NextResponse.json(structuredData, {
    headers: {
      "Content-Type": "application/ld+json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "index, follow",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Provide a lightweight HEAD implementation for quicker crawler validation
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": "application/ld+json",
      "X-Document-Available": "true",
    },
  });
}
