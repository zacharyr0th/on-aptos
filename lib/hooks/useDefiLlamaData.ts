import { useState, useEffect } from "react";

interface DefiLlamaProtocol {
  name: string;
  tvl: number;
  chainTvls?: {
    Aptos?: number;
  };
  change_1d?: number;
  change_7d?: number;
}

interface DefiLlamaData {
  tvl: string;
  change7d?: string;
  volume24h?: string;
  volumeChange24h?: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const cache = new Map<string, { data: DefiLlamaData; timestamp: number }>();

// Global cache for all protocols data
let allProtocolsCache: { data: DefiLlamaProtocol[]; timestamp: number } | null = null;

// Map protocol names to their DefiLlama slugs
const PROTOCOL_SLUG_MAP: Record<string, string> = {
  Thala: "thala",
  Panora: "panora-exchange",
  Echelon: "echelon-market",
  "Merkle Trade": "merkle-trade",
  Amnis: "amnis-finance",
  "Aries Markets": "aries-markets",
  // Add more mappings as needed
};

export function useDefiLlamaData(protocolName: string) {
  const [data, setData] = useState<DefiLlamaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Exclude certain protocols from showing data
        const excludedProtocols = ["PancakeSwap", "SushiSwap"];
        if (excludedProtocols.includes(protocolName)) {
          setData(null);
          setLoading(false);
          return;
        }

        // Check cache first
        const cached = cache.get(protocolName);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLoading(false);
          return;
        }

        // Get the slug for this protocol
        const slug =
          PROTOCOL_SLUG_MAP[protocolName] || protocolName.toLowerCase().replace(/\s+/g, "-");

        // Fetch all protocols with global caching to reduce API calls
        let protocols: DefiLlamaProtocol[];
        if (allProtocolsCache && Date.now() - allProtocolsCache.timestamp < CACHE_DURATION) {
          protocols = allProtocolsCache.data;
        } else {
          const response = await fetch("https://api.llama.fi/protocols");
          if (!response.ok) throw new Error("Failed to fetch data");
          protocols = await response.json();
          allProtocolsCache = { data: protocols, timestamp: Date.now() };
        }

        // Find the protocol (case-insensitive match on name)
        const protocol = protocols.find(
          (p) =>
            p.name.toLowerCase() === protocolName.toLowerCase() ||
            p.name.toLowerCase().includes(slug)
        );

        if (!protocol) {
          setData(null);
          setLoading(false);
          return;
        }

        // Get Aptos-specific TVL if available, otherwise use total TVL
        const aptosTvl = protocol.chainTvls?.Aptos || protocol.tvl;

        const result: DefiLlamaData = {
          tvl: formatNumber(aptosTvl),
          change7d: protocol.change_7d
            ? `${protocol.change_7d > 0 ? "+" : ""}${protocol.change_7d.toFixed(2)}%`
            : undefined,
        };

        // Try to fetch volume data from the dexs endpoint if it's a trading protocol
        try {
          const volumeResponse = await fetch(`https://api.llama.fi/summary/dexs/${slug}`);
          if (volumeResponse.ok) {
            const volumeData = await volumeResponse.json();
            if (volumeData.total24h) {
              result.volume24h = formatNumber(volumeData.total24h);
              result.volumeChange24h = volumeData.change_1d
                ? `${volumeData.change_1d > 0 ? "+" : ""}${volumeData.change_1d.toFixed(2)}%`
                : undefined;
            }
          }
        } catch {
          // Volume data not available for this protocol
        }

        // Cache the result
        cache.set(protocolName, { data: result, timestamp: Date.now() });

        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [protocolName]);

  return { data, loading, error };
}

function formatNumber(num: number): string {
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  }
  if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  }
  if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}
