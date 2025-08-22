import { NextRequest, NextResponse } from "next/server";

import { TETHER_RESERVES } from "@/lib/constants/tokens/addresses";
import { STABLECOINS } from "@/lib/constants/tokens/stablecoins";
import { createErrorResponse } from "@/lib/utils/api/response-builder";

// Environment variables for API keys
const PANORA_API_KEY = process.env.PANORA_API_KEY;

if (!PANORA_API_KEY) {
  throw new Error(
    "PANORA_API_KEY environment variable is required. Please check your .env file.",
  );
}

// Cache for 5 minutes
export const revalidate = 300;

interface PanoraToken {
  chainId: number;
  panoraId: string;
  tokenAddress: string | null;
  faAddress: string | null;
  name: string;
  symbol: string;
  decimals: number;
  bridge: string | null;
  panoraSymbol: string;
  usdPrice: string;
  logoUrl?: string;
  websiteUrl?: string;
  panoraUI: boolean;
  panoraTags: string[];
  panoraIndex: number;
  coinGeckoId?: string;
  coinMarketCapId?: number;
  marketCap?: number;
  volume24h?: number;
  holders?: number;
  panoraTags?: string[];
  isVerified?: boolean;
}

// Cache for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
let cache: { data: unknown; timestamp: number } | null = null;

// Clear cache to force fresh data with verified tokens only
cache = null;

async function fetchPanoraPrices(): Promise<PanoraToken[]> {
  try {
    // Fetch both verified tokens (panoraUI=true) and all tokens (panoraUI=false)
    const [verifiedResponse, allResponse] = await Promise.all([
      fetch(
        "https://api.panora.exchange/tokenlist?panoraUI=true&chainId=1",
        {
          headers: {
            "x-api-key": PANORA_API_KEY,
            Accept: "application/json",
            "User-Agent": "OnAptos-Token-Fetcher/1.0",
          },
          next: { revalidate: 300 },
        },
      ),
      fetch("https://api.panora.exchange/tokenlist?panoraUI=false&chainId=1", {
        headers: {
          "x-api-key": PANORA_API_KEY,
          Accept: "application/json",
          "User-Agent": "OnAptos-Token-Fetcher/1.0",
        },
        next: { revalidate: 300 },
      }),
    ]);

    if (!verifiedResponse.ok || !allResponse.ok) {
      throw new Error("Failed to fetch from Panora API");
    }

    const [verifiedData, allData] = await Promise.all([
      verifiedResponse.json(),
      allResponse.json(),
    ]);

    // Combine and deduplicate tokens by panoraId
    const tokenMap = new Map<string, PanoraToken>();
    
    // Add verified tokens first (they take priority)
    if (Array.isArray(verifiedData)) {
      verifiedData.forEach((token: unknown) => {
        if (token && typeof token === 'object' && 'panoraId' in token) {
          tokenMap.set(token.panoraId as string, token as PanoraToken);
        }
      });
    }

    // Add other tokens if not already present
    if (Array.isArray(allData)) {
      allData.forEach((token: unknown) => {
        if (token && typeof token === 'object' && 'panoraId' in token && !tokenMap.has(token.panoraId as string)) {
          tokenMap.set(token.panoraId as string, token as PanoraToken);
        }
      });
    }

    const allAvailableTokens = Array.from(tokenMap.values());

    // Keep tokens with prices for market cap calculation
    let tokensWithPrices = allAvailableTokens.filter(
      (token: unknown) => token.usdPrice && parseFloat(token.usdPrice) > 0,
    );

    // Also include tokens without prices but set price to 0 for display
    const tokensWithoutPrices = allAvailableTokens
      .filter(
        (token: unknown) => !token.usdPrice || parseFloat(token.usdPrice) <= 0,
      )
      .map((token: unknown) => ({
        ...token,
        usdPrice: "0",
      }));

    // Combine both arrays
    tokensWithPrices = [...tokensWithPrices, ...tokensWithoutPrices];

    // Ensure APT is included even if it's not in the Verified tag response
    const hasApt = tokensWithPrices.some(
      (t) =>
        t.symbol === "APT" || t.tokenAddress === "0x1::aptos_coin::AptosCoin",
    );

    if (!hasApt) {
      try {
        const aptResponse = await fetch(
          "https://api.panora.exchange/tokenlist?tokenAddress=0x1::aptos_coin::AptosCoin",
          {
            headers: {
              "x-api-key": PANORA_API_KEY,
              Accept: "application/json",
              "User-Agent": "OnAptos-APT-Fetcher/1.0",
            },
          },
        );

        if (aptResponse.ok) {
          const aptResult = await aptResponse.json();
          const aptTokens = aptResult.data || aptResult;
          const aptToken = (Array.isArray(aptTokens) ? aptTokens : []).find(
            (token: unknown) => token.symbol === "APT",
          );

          if (
            aptToken &&
            aptToken.usdPrice &&
            parseFloat(aptToken.usdPrice) > 0
          ) {
            tokensWithPrices.push(aptToken);
          }
        }
      } catch {
        // Failed to fetch APT specifically - continue without it
      }
    }

    return tokensWithPrices;
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sortBy") || "marketCap";
    const order = searchParams.get("order") || "desc";
    const search = searchParams.get("search") || "";
    const maxTokens = parseInt(searchParams.get("maxTokens") || "0");
    const includeUnverified = searchParams.get("includeUnverified") === "true";

    // Check cache first
    const now = Date.now();
    if (cache && now - cache.timestamp < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    // Fetch token data
    const allTokens = await fetchPanoraPrices();

    if (!allTokens || allTokens.length === 0) {
      return NextResponse.json(
        { error: "No token data available" },
        { status: 503 },
      );
    }

    // Apply filters
    let filteredTokens = allTokens;

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTokens = filteredTokens.filter(
        (token) =>
          token.name?.toLowerCase().includes(searchLower) ||
          token.symbol?.toLowerCase().includes(searchLower) ||
          token.tokenAddress?.toLowerCase().includes(searchLower) ||
          token.faAddress?.toLowerCase().includes(searchLower),
      );
    }

    // Filter by verification status
    if (!includeUnverified) {
      filteredTokens = filteredTokens.filter((token) => {
        const tags = token.panoraTags || [];
        return (
          tags.includes("Verified") ||
          tags.includes("Recognized") ||
          token.symbol === "APT"
        );
      });
    }

    // Apply category filter
    if (category) {
      if (category === "stablecoins") {
        const stablecoinAddresses = STABLECOINS.map((s) =>
          s.address.toLowerCase(),
        );
        const tetherAddresses = TETHER_RESERVES.map((t) =>
          t.address.toLowerCase(),
        );
        const allStableAddresses = [
          ...stablecoinAddresses,
          ...tetherAddresses,
        ];

        filteredTokens = filteredTokens.filter(
          (token) =>
            allStableAddresses.includes(
              token.tokenAddress?.toLowerCase() || "",
            ) ||
            allStableAddresses.includes(token.faAddress?.toLowerCase() || "") ||
            token.symbol?.toUpperCase().includes("USD") ||
            token.name?.toLowerCase().includes("usd") ||
            token.name?.toLowerCase().includes("dollar"),
        );
      }
    }

    // Validate all tokens to ensure we only return valid ones
    const allValidTokens = filteredTokens.filter(
      (token) =>
        token &&
        typeof token === "object" &&
        token.symbol &&
        token.name &&
        (token.tokenAddress || token.faAddress),
    );

    // Separate APT from other tokens for consistent ordering
    const aptTokens = allValidTokens.filter(
      (t) =>
        t.symbol === "APT" ||
        t.tokenAddress === "0x1::aptos_coin::AptosCoin" ||
        t.name?.toLowerCase().includes("aptos coin"),
    );

    // Get non-APT tokens
    let nonAptTokens = allValidTokens.filter(
      (t) =>
        t.symbol !== "APT" &&
        t.tokenAddress !== "0x1::aptos_coin::AptosCoin" &&
        !t.name?.toLowerCase().includes("aptos coin"),
    );

    // Store remaining tokens for later processing
    let remainingTokens: unknown[] = [];

    // Apply max tokens limit - use reasonable default for supply lookups
    if (maxTokens > 0) {
      nonAptTokens = nonAptTokens.slice(0, maxTokens);
    } else {
      // Default limit for supply lookups to prevent timeouts (prioritize verified tokens)
      const verifiedTokens = nonAptTokens.filter((t) =>
        t.panoraTags?.includes("Verified"),
      );
      const recognizedTokens = nonAptTokens.filter((t) =>
        t.panoraTags?.includes("Recognized"),
      );
      const otherTokens = nonAptTokens.filter(
        (t) =>
          !t.panoraTags?.includes("Verified") &&
          !t.panoraTags?.includes("Recognized"),
      );

      // Take verified first, then recognized, then others, up to reasonable limit
      const maxForSupplyLookup = 50;
      nonAptTokens = [
        ...verifiedTokens.slice(0, Math.min(25, maxForSupplyLookup)),
        ...recognizedTokens.slice(0, Math.min(15, maxForSupplyLookup - 25)),
        ...otherTokens.slice(0, Math.min(10, maxForSupplyLookup - 40)),
      ];

      // Store remaining tokens
      remainingTokens = [
        ...verifiedTokens.slice(25),
        ...recognizedTokens.slice(15),
        ...otherTokens.slice(10),
      ];
    }

    // Combine APT and other tokens
    const finalTokens = [...aptTokens, ...nonAptTokens];

    // Sort tokens
    finalTokens.sort((a, b) => {
      let aValue: unknown;
      let bValue: unknown;

      switch (sortBy) {
        case "marketCap":
          aValue = a.marketCap || 0;
          bValue = b.marketCap || 0;
          break;
        case "volume24h":
          aValue = a.volume24h || 0;
          bValue = b.volume24h || 0;
          break;
        case "holders":
          aValue = a.holders || 0;
          bValue = b.holders || 0;
          break;
        case "price":
          aValue = parseFloat(a.usdPrice || "0");
          bValue = parseFloat(b.usdPrice || "0");
          break;
        case "name":
          aValue = a.name || "";
          bValue = b.name || "";
          break;
        case "symbol":
          aValue = a.symbol || "";
          bValue = b.symbol || "";
          break;
        default:
          aValue = a.panoraIndex || 0;
          bValue = b.panoraIndex || 0;
      }

      if (order === "desc") {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedTokens = finalTokens.slice(startIndex, endIndex);

    const response = {
      tokens: paginatedTokens,
      total: finalTokens.length,
      totalAvailable: allValidTokens.length,
      remainingTokens: remainingTokens.length,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(finalTokens.length / limit),
      hasMore: endIndex < finalTokens.length,
      filters: {
        category,
        search,
        includeUnverified,
        sortBy,
        order,
      },
    };

    // Update cache
    cache = {
      data: response,
      timestamp: now,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return createErrorResponse(
      "Failed to fetch token data",
      500,
      "FETCH_ERROR",
    );
  }
}
