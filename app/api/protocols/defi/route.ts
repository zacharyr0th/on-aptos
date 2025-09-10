import type { NextRequest } from "next/server";

import { CACHE_DURATIONS, errorResponse, successResponse } from "@/lib/utils/api/common";
import { RATE_LIMIT_TIERS, withRateLimit } from "@/lib/utils/api/rate-limiter";
import { apiLogger } from "@/lib/utils/core/logger";

// DeFi protocol detection patterns
const DEFI_PATTERNS = {
  LP_TOKENS: ["MKLP", "THALA-LP"],
  STAKING_TOKENS: ["vstAPT", "stAPT"],
  DEFI_CONTRACTS: [
    "0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06", // Merkle Finance
    "0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af", // Thala protocol
  ],
};

function isDeFiAsset(asset: any): boolean {
  const symbol = asset.metadata?.symbol || "";
  const name = asset.metadata?.name || "";
  const assetType = asset.asset_type || "";

  // Check for LP tokens
  if (DEFI_PATTERNS.LP_TOKENS.some((token) => symbol.includes(token))) {
    return true;
  }

  // Check for staking tokens (exclude tAPT)
  if (
    DEFI_PATTERNS.STAKING_TOKENS.some((token) => symbol.includes(token)) &&
    !symbol.includes("tAPT")
  ) {
    return true;
  }

  // Check for known DeFi contracts
  if (DEFI_PATTERNS.DEFI_CONTRACTS.some((contract) => assetType.includes(contract))) {
    return true;
  }

  // Check for staking-related tokens in name (exclude tAPT)
  if (
    (symbol.toLowerCase().includes("staked") || name.toLowerCase().includes("staked")) &&
    !symbol.includes("tAPT")
  ) {
    return true;
  }

  return false;
}

function getProtocolInfo(asset: any): {
  protocol: string;
  defiType: string;
  logoUrl: string;
} {
  const symbol = asset.metadata?.symbol || "";
  const assetType = asset.asset_type || "";

  // Merkle Finance
  if (
    symbol.includes("MKLP") ||
    assetType.includes("5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06")
  ) {
    return {
      protocol: "Merkle Finance",
      defiType: "lp",
      logoUrl: "/icons/protocols/merkle.png",
    };
  }

  // Thala
  if (
    symbol.includes("THALA") ||
    assetType.includes("48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af")
  ) {
    return {
      protocol: "Thala",
      defiType: "lp",
      logoUrl: "/icons/protocols/thala.png",
    };
  }

  // Generic staking (exclude tAPT)
  if (
    (symbol.toLowerCase().includes("staked") || symbol.includes("vstAPT")) &&
    !symbol.includes("tAPT")
  ) {
    return {
      protocol: "Aptos Staking",
      defiType: "staking",
      logoUrl: "/icons/protocols/aptos.png",
    };
  }

  // Default unknown protocol
  return {
    protocol: "Unknown DeFi",
    defiType: "derivatives",
    logoUrl: "/icons/protocols/unknown.png",
  };
}

async function handler(request: NextRequest) {
  const startTime = Date.now();

  try {
    const walletAddress = request.nextUrl.searchParams.get("walletAddress");

    if (!walletAddress) {
      return errorResponse("walletAddress parameter is required", 400);
    }

    apiLogger.info("DeFi API request", {
      walletAddress,
      endpoint: "/api/data/aptos/defi",
    });

    // Fetch portfolio assets directly from the portfolio API
    const portfolioResponse = await fetch(
      `${request.nextUrl.origin}/api/portfolio/assets?walletAddress=${walletAddress}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!portfolioResponse.ok) {
      throw new Error(`Failed to fetch portfolio assets: ${portfolioResponse.status}`);
    }

    const portfolioData = await portfolioResponse.json();

    if (!portfolioData.success || !portfolioData.data?.assets) {
      throw new Error("No portfolio assets found");
    }

    const allAssets = portfolioData.data.assets;

    // Filter for DeFi assets only
    const defiAssets = allAssets
      .filter((asset: any) => isDeFiAsset(asset))
      .map((asset: any) => {
        const protocolInfo = getProtocolInfo(asset);
        return {
          ...asset,
          ...protocolInfo,
        };
      });

    // Group by protocol
    const protocolGroups = defiAssets.reduce((acc: any, asset: any) => {
      const protocolName = asset.protocol || "Unknown";
      if (!acc[protocolName]) {
        acc[protocolName] = {
          name: protocolName,
          assets: [],
          totalValue: 0,
          logoUrl: asset.logoUrl || "/icons/protocols/unknown.png",
          description: `${protocolName} positions`,
        };
      }
      acc[protocolName].assets.push(asset);
      acc[protocolName].totalValue += asset.value || 0;
      return acc;
    }, {});

    const protocols = Object.values(protocolGroups).sort(
      (a: any, b: any) => b.totalValue - a.totalValue
    );
    const totalValue = defiAssets.reduce((sum: number, asset: any) => sum + (asset.value || 0), 0);

    const responseData = {
      success: true,
      walletAddress,
      totalValue,
      totalValueFormatted: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(totalValue),
      assetCount: defiAssets.length,
      protocolCount: protocols.length,
      protocols,
      positions: defiAssets,
      timestamp: new Date().toISOString(),
      dataSource: "Portfolio Asset Filter",
    };

    const headers = {
      "X-Content-Type": "application/json",
      "X-Service": "defi-positions",
      "X-API-Version": "2.0",
      "X-Data-Source": "Portfolio Asset Filter",
      "X-Response-Time": `${Date.now() - startTime}ms`,
      Vary: "Accept-Encoding",
    };

    apiLogger.info("DeFi API response", {
      walletAddress,
      totalValue,
      assetCount: defiAssets.length,
      protocolCount: protocols.length,
      responseTime: Date.now() - startTime,
    });

    return successResponse(responseData, CACHE_DURATIONS.SHORT, headers);
  } catch (error) {
    apiLogger.error("DeFi API error", {
      error: error instanceof Error ? error.message : String(error),
      endpoint: "/api/data/aptos/defi",
      responseTime: Date.now() - startTime,
    });

    return errorResponse(
      "Failed to fetch DeFi positions",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

export const GET = withRateLimit(handler, {
  name: "defi-positions",
  ...RATE_LIMIT_TIERS.PUBLIC,
});
