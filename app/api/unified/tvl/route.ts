import { NextRequest } from "next/server";

import {
  successResponse,
  errorResponse,
  CACHE_DURATIONS,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";
import { DEFI_LLAMA_BASE, fetchFromDeFiLlama, OPTIONS } from "../shared";

// Cache TVL data for 15 minutes
export const revalidate = 900;

// Type definitions
interface DeFiLlamaProtocol {
  id?: string;
  name: string;
  chains: string[];
  tvl: number;
  chainTvls?: Record<string, number>;
}

interface DeFiLlamaChainTvl {
  date: string;
  totalLiquidityUSD: number;
}

interface DeFiLlamaStablecoin {
  id: string;
  name: string;
  symbol: string;
  chainCirculating: Record<string, number>;
}

interface DeFiLlamaYieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
}

interface DeFiLlamaDexProtocol {
  name: string;
  chains: string[];
  totalVolume24h: number;
}

type TVLCategory = "aptos" | "protocols" | "stablecoins" | "volume" | "yields";

interface TVLApiResponse {
  category: TVLCategory;
  chain: string;
  protocol?: string;
  data: unknown;
  timestamp: string;
}

async function unifiedTVLHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") || "aptos") as TVLCategory;
  const protocol = searchParams.get("protocol");
  const chain = searchParams.get("chain") || "Aptos";

  // Validate category
  const validCategories: TVLCategory[] = [
    "aptos",
    "protocols",
    "stablecoins",
    "volume",
    "yields",
  ];
  if (!validCategories.includes(category)) {
    return errorResponse(
      `Invalid category: ${category}. Must be one of: ${validCategories.join(", ")}`,
      400,
    );
  }

  try {
    let data: unknown;
    let endpoint: string;

    switch (category) {
      case "aptos":
        // Get Aptos chain TVL
        endpoint = `${DEFI_LLAMA_BASE}/v2/historicalChainTvl/Aptos`;
        data = (await fetchFromDeFiLlama(endpoint)) as DeFiLlamaChainTvl[];
        break;

      case "protocols":
        // Get protocols TVL
        if (protocol) {
          endpoint = `${DEFI_LLAMA_BASE}/protocol/${protocol}`;
        } else {
          endpoint = `${DEFI_LLAMA_BASE}/protocols`;
        }

        const allProtocols = (await fetchFromDeFiLlama(
          endpoint,
        )) as DeFiLlamaProtocol[];

        // Filter for Aptos protocols if getting all
        if (!protocol && Array.isArray(allProtocols)) {
          data = allProtocols.filter(
            (p: DeFiLlamaProtocol) => p.chains && p.chains.includes(chain),
          );
        } else {
          data = allProtocols;
        }
        break;

      case "stablecoins":
        // Get stablecoins TVL
        endpoint = `${DEFI_LLAMA_BASE}/stablecoins`;
        const stablesData = (await fetchFromDeFiLlama(endpoint)) as {
          peggedAssets?: DeFiLlamaStablecoin[];
        };

        // Filter for chain if specified
        if (chain === "Aptos" && stablesData.peggedAssets) {
          data = stablesData.peggedAssets.filter(
            (asset: DeFiLlamaStablecoin) =>
              asset.chainCirculating &&
              Object.keys(asset.chainCirculating).some((c) =>
                c.toLowerCase().includes("aptos"),
              ),
          );
        } else {
          data = stablesData;
        }
        break;

      case "volume":
        // Get DEX volumes
        endpoint = `${DEFI_LLAMA_BASE}/overview/dexs/${chain}`;
        try {
          data = await fetchFromDeFiLlama(endpoint);
        } catch (error) {
          // Try alternative endpoint if the first one fails
          logger.warn("Primary volume endpoint failed, trying alternative", {
            endpoint,
            error,
          });
          const altEndpoint = `${DEFI_LLAMA_BASE}/dexs`;
          const dexData = (await fetchFromDeFiLlama(altEndpoint)) as {
            protocols?: DeFiLlamaDexProtocol[];
          };
          data =
            dexData.protocols?.filter(
              (p: DeFiLlamaDexProtocol) => p.chains && p.chains.includes(chain),
            ) || [];
        }
        break;

      case "yields":
        // Get yield pools
        endpoint = `${DEFI_LLAMA_BASE}/pools`;
        const yieldsData = (await fetchFromDeFiLlama(endpoint)) as {
          data?: DeFiLlamaYieldPool[];
        };

        // Filter for Aptos yields
        if (chain === "Aptos" && yieldsData.data) {
          data = yieldsData.data.filter(
            (pool: DeFiLlamaYieldPool) => pool.chain === chain,
          );
        } else {
          data = yieldsData;
        }
        break;
    }

    const response: TVLApiResponse = {
      category,
      chain,
      protocol: protocol || undefined,
      data,
      timestamp: new Date().toISOString(),
    };

    return successResponse(response, CACHE_DURATIONS.LONG, {
      "X-Data-Source": "defi-llama",
      "X-Category": category,
    });
  } catch (error) {
    logger.error("Unified TVL API error", {
      error: error instanceof Error ? error.message : String(error),
      category,
      protocol,
      chain,
    });

    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch TVL data",
      500,
    );
  }
}

export const GET = withRateLimit(unifiedTVLHandler, {
  name: "unified-tvl",
  ...RATE_LIMIT_TIERS.STANDARD,
});
export { OPTIONS };
