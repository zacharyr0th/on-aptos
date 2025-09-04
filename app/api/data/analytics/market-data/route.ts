import { withApiEnhancements } from "@/lib/utils/api/server-api";
import { apiLogger } from "@/lib/utils/core/logger";

interface PanoraTokenPrice {
  chainId: number;
  tokenAddress: string | null;
  faAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  usdPrice: string;
  nativePrice: string;
}

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

const PANORA_API_KEY =
  "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi";

/**
 * Fetch comprehensive token prices from Panora
 */
async function fetchPanoraTokenPrices(): Promise<PanoraTokenPrice[]> {
  const response = await fetch("https://api.panora.exchange/prices?chainId=1", {
    headers: {
      "x-api-key": PANORA_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Panora API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetch token list with metadata
 */
async function fetchPanoraTokenList() {
  const response = await fetch(
    "https://api.panora.exchange/tokenlist?chainId=1&panoraUI=false",
    {
      headers: {
        "x-api-key": PANORA_API_KEY,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Panora token list API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetch APT market data from CoinGecko
 */
async function fetchAPTMarketData(): Promise<CoinGeckoMarketData | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=aptos&order=market_cap_desc&per_page=1&page=1&sparkline=false&locale=en",
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    apiLogger.warn("Failed to fetch APT market data from CoinGecko:", error);
    return null;
  }
}

/**
 * Calculate market metrics from price data
 */
function calculateMarketMetrics(
  prices: PanoraTokenPrice[],
  tokenList: any[],
  aptMarketData: CoinGeckoMarketData | null,
) {
  // Filter out tokens with valid USD prices
  const tokensWithPrices = prices.filter(
    (token) => parseFloat(token.usdPrice) > 0,
  );

  // Calculate market cap estimations (simplified - using circulating supply when available)
  const tokenMetrics = tokensWithPrices
    .map((priceData) => {
      const tokenArray = Array.isArray(tokenList) ? tokenList : [];
      const tokenInfo = tokenArray.find(
        (token) =>
          token.faAddress === priceData.faAddress ||
          token.tokenAddress === priceData.tokenAddress,
      );

      const price = parseFloat(priceData.usdPrice);

      return {
        symbol: priceData.symbol,
        name: priceData.name,
        price: price,
        faAddress: priceData.faAddress,
        tokenAddress: priceData.tokenAddress,
        panoraTags: tokenInfo?.panoraTags || [],
        verified: tokenInfo?.panoraTags?.includes("Verified") || false,
        category:
          tokenInfo?.panoraTags?.find((tag: string) =>
            ["Native", "Meme", "Bridged"].includes(tag),
          ) || "Unknown",
      };
    })
    .sort((a, b) => b.price - a.price);

  // Market categories analysis
  const categoryCounts = tokenMetrics.reduce(
    (acc: Record<string, number>, token) => {
      acc[token.category] = (acc[token.category] || 0) + 1;
      return acc;
    },
    {},
  );

  const verifiedTokens = tokenMetrics.filter((token) => token.verified);

  // Price distribution analysis
  const priceRanges = {
    under_001: tokenMetrics.filter((t) => t.price < 0.01).length,
    between_001_1: tokenMetrics.filter((t) => t.price >= 0.01 && t.price < 1)
      .length,
    between_1_10: tokenMetrics.filter((t) => t.price >= 1 && t.price < 10)
      .length,
    between_10_100: tokenMetrics.filter((t) => t.price >= 10 && t.price < 100)
      .length,
    above_100: tokenMetrics.filter((t) => t.price >= 100).length,
  };

  // Top tokens by price
  const topTokensByPrice = tokenMetrics.slice(0, 20);

  return {
    totalTokens: tokensWithPrices.length,
    verifiedTokens: verifiedTokens.length,
    verificationRate:
      tokensWithPrices.length > 0
        ? parseFloat(
            ((verifiedTokens.length / tokensWithPrices.length) * 100).toFixed(
              2,
            ),
          )
        : 0,

    // Category breakdown
    categories: Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: parseFloat(
        (((count as number) / tokensWithPrices.length) * 100).toFixed(2),
      ),
    })),

    // Price analysis
    priceRanges,

    // APT specific data (from CoinGecko)
    aptMarketData: aptMarketData
      ? {
          price: aptMarketData.current_price,
          marketCap: aptMarketData.market_cap,
          marketCapRank: aptMarketData.market_cap_rank,
          volume24h: aptMarketData.total_volume,
          priceChange24h: aptMarketData.price_change_percentage_24h,
          high24h: aptMarketData.high_24h,
          low24h: aptMarketData.low_24h,
          ath: aptMarketData.ath,
          athChangePercentage: aptMarketData.ath_change_percentage,
          athDate: aptMarketData.ath_date,
          circulatingSupply: aptMarketData.circulating_supply,
          totalSupply: aptMarketData.total_supply,
          maxSupply: aptMarketData.max_supply,
        }
      : null,

    // Top tokens
    topTokensByPrice: topTokensByPrice.slice(0, 10),

    // Market statistics
    averagePrice:
      tokensWithPrices.length > 0
        ? parseFloat(
            (
              tokensWithPrices.reduce(
                (sum, token) => sum + parseFloat(token.usdPrice),
                0,
              ) / tokensWithPrices.length
            ).toFixed(6),
          )
        : 0,

    medianPrice:
      tokensWithPrices.length > 0
        ? parseFloat(
            tokensWithPrices.sort(
              (a, b) => parseFloat(a.usdPrice) - parseFloat(b.usdPrice),
            )[Math.floor(tokensWithPrices.length / 2)]?.usdPrice || "0",
          )
        : 0,
  };
}

export async function GET() {
  return withApiEnhancements(
    async () => {
      apiLogger.info("Fetching comprehensive Aptos market data");

      try {
        // Fetch all data concurrently
        const [prices, tokenList, aptMarketData] = await Promise.allSettled([
          fetchPanoraTokenPrices(),
          fetchPanoraTokenList(),
          fetchAPTMarketData(),
        ]);

        // Process results
        const priceData = prices.status === "fulfilled" ? prices.value : [];
        const tokenListData =
          tokenList.status === "fulfilled" ? tokenList.value : [];
        const aptData =
          aptMarketData.status === "fulfilled" ? aptMarketData.value : null;

        // Calculate comprehensive metrics
        const marketMetrics = calculateMarketMetrics(
          priceData,
          tokenListData,
          aptData,
        );

        // Additional bridge and cross-chain analysis
        const tokenArray = Array.isArray(tokenListData) ? tokenListData : [];
        const bridgedTokens = tokenArray.filter((token: any) =>
          token.panoraTags?.includes("Bridged"),
        );

        const nativeTokens = tokenArray.filter((token: any) =>
          token.panoraTags?.includes("Native"),
        );

        const memeTokens = tokenArray.filter((token: any) =>
          token.panoraTags?.includes("Meme"),
        );

        // Bridge analysis
        const bridgeAnalysis = {
          totalBridgedTokens: bridgedTokens.length,
          bridgeProtocols: bridgedTokens.reduce(
            (acc: Record<string, number>, token: any) => {
              if (token.bridge) {
                acc[token.bridge] = (acc[token.bridge] || 0) + 1;
              }
              return acc;
            },
            {},
          ),

          // Bridge symbols analysis (wh, lz, ce prefixes)
          bridgeSymbolAnalysis: bridgedTokens.reduce(
            (acc: Record<string, number>, token: any) => {
              if (token.panoraSymbol?.startsWith("wh"))
                acc["Wormhole"] = (acc["Wormhole"] || 0) + 1;
              else if (token.panoraSymbol?.startsWith("lz"))
                acc["LayerZero"] = (acc["LayerZero"] || 0) + 1;
              else if (token.panoraSymbol?.startsWith("ce"))
                acc["Celer"] = (acc["Celer"] || 0) + 1;
              return acc;
            },
            {},
          ),
        };

        const response = {
          // Overall market metrics
          market: marketMetrics,

          // Token ecosystem breakdown
          ecosystem: {
            totalTokensInList: tokenArray.length,
            nativeTokens: nativeTokens.length,
            bridgedTokens: bridgedTokens.length,
            memeTokens: memeTokens.length,
            verifiedTokens: tokenArray.filter((t: any) =>
              t.panoraTags?.includes("Verified"),
            ).length,
            bannedTokens: tokenArray.filter((t: any) =>
              t.panoraTags?.includes("Banned"),
            ).length,
          },

          // Bridge and cross-chain metrics
          bridges: bridgeAnalysis,

          // Data freshness indicators
          dataStatus: {
            prices: prices.status,
            tokenList: tokenList.status,
            aptMarketData: aptMarketData.status,
            priceDataCount: priceData.length,
            tokenListCount: tokenArray.length,
          },

          timestamp: new Date().toISOString(),
          sources: {
            prices: "Panora Exchange API",
            tokenMetadata: "Panora Token List",
            marketData: "CoinGecko API",
          },
        };

        apiLogger.info("Successfully processed market data", {
          totalPrices: priceData.length,
          totalTokens: tokenArray.length,
          aptDataAvailable: !!aptData,
        });

        return response;
      } catch (error) {
        apiLogger.error("Error in market data API:", error);
        throw new Error(
          `Market data fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    {
      customHeaders: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "X-Content-Type": "application/json",
        "X-Service": "aptos-market-data",
      },
    },
  );
}
