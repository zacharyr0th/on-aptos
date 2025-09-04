import { NextRequest } from "next/server";

import {
  successResponse,
  errorResponse,
  CACHE_DURATIONS,
} from "@/lib/utils/api/common";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { logger } from "@/lib/utils/core/logger";
import { DEFI_LLAMA_BASE, FETCH_HEADERS, OPTIONS } from "../shared";

// Cache volume data for 15 minutes
export const revalidate = 900;

interface DefiLlamaProtocol {
  name: string;
  chains?: string[];
  volume24h?: number;
  volume7d?: number;
  volume30d?: number;
  volume?: number;
}

interface VolumeData {
  protocols?: DefiLlamaProtocol[];
  totalVolume24h?: number;
  totalVolume7d?: number;
  [key: string]: unknown;
}

interface VolumeSummary {
  source: string;
  timeframe: string;
  protocol: string | null;
  timestamp: string;
  protocolCount?: number;
  totalVolume?: number;
}

async function fetchDefiLlamaData(endpoint: string): Promise<VolumeData> {
  const response = await fetch(endpoint, { headers: FETCH_HEADERS });

  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status}`);
  }

  return response.json();
}

async function getAptosVolumeData(): Promise<VolumeData> {
  try {
    // Try Aptos-specific endpoint first
    const endpoint = `${DEFI_LLAMA_BASE}/overview/dexs/Aptos`;
    return await fetchDefiLlamaData(endpoint);
  } catch {
    // Fallback to protocol-based approach
    const protocolsEndpoint = `${DEFI_LLAMA_BASE}/dexs`;
    const dexData = await fetchDefiLlamaData(protocolsEndpoint);

    const aptosProtocols = (dexData.protocols || []).filter(
      (p: DefiLlamaProtocol) => p.chains && p.chains.includes("Aptos"),
    );

    let totalVolume24h = 0;
    let totalVolume7d = 0;

    aptosProtocols.forEach((p: DefiLlamaProtocol) => {
      if (p.volume24h) totalVolume24h += p.volume24h;
      if (p.volume7d) totalVolume7d += p.volume7d;
    });

    return {
      protocols: aptosProtocols,
      totalVolume24h,
      totalVolume7d,
    };
  }
}

function filterProtocolsByTimeframe(
  protocols: DefiLlamaProtocol[],
  timeframe: string,
): DefiLlamaProtocol[] {
  return protocols.map((p: DefiLlamaProtocol) => {
    const filtered = { ...p };

    switch (timeframe) {
      case "24h":
        filtered.volume = p.volume24h || 0;
        break;
      case "7d":
        filtered.volume = p.volume7d || 0;
        break;
      case "30d":
        filtered.volume = p.volume30d || 0;
        break;
      default:
        filtered.volume = p.volume24h || 0;
    }

    return filtered;
  });
}

async function unifiedVolumeHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "aptos";
  const protocol = searchParams.get("protocol");
  const timeframe = searchParams.get("timeframe") || "24h";

  try {
    let data: VolumeData;
    let endpoint: string;

    switch (source) {
      case "aptos":
        data = await getAptosVolumeData();
        break;

      case "global":
        endpoint = `${DEFI_LLAMA_BASE}/overview/dexs`;
        data = await fetchDefiLlamaData(endpoint);
        break;

      case "dex":
        if (protocol) {
          endpoint = `${DEFI_LLAMA_BASE}/summary/dexs/${protocol}`;
        } else {
          endpoint = `${DEFI_LLAMA_BASE}/dexs`;
        }

        data = await fetchDefiLlamaData(endpoint);

        // Filter by timeframe if applicable
        if (data.protocols && timeframe) {
          data.protocols = filterProtocolsByTimeframe(
            data.protocols,
            timeframe,
          );
        }
        break;

      default:
        return errorResponse(`Invalid source: ${source}`, 400);
    }

    // Add summary statistics
    const summary: VolumeSummary = {
      source,
      timeframe,
      protocol,
      timestamp: new Date().toISOString(),
    };

    if (data.protocols && Array.isArray(data.protocols)) {
      summary.protocolCount = data.protocols.length;
      summary.totalVolume = data.protocols.reduce(
        (sum: number, p: DefiLlamaProtocol) => {
          const vol = p.volume || p.volume24h || 0;
          return sum + vol;
        },
        0,
      );
    }

    return successResponse(
      {
        ...summary,
        data,
      },
      CACHE_DURATIONS.MEDIUM,
      {
        "X-Data-Source": "defi-llama",
        "X-Volume-Source": source,
        "X-Timeframe": timeframe,
      },
    );
  } catch (error) {
    logger.error("Unified volume API error", {
      error: error instanceof Error ? error.message : String(error),
      source,
      protocol,
      timeframe,
    });

    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch volume data",
      500,
    );
  }
}

export const GET = withRateLimit(unifiedVolumeHandler, {
  name: "unified-volume",
  ...RATE_LIMIT_TIERS.STANDARD,
});

export { OPTIONS };
