import { withApiEnhancements } from "@/lib/utils/api/server-api";
import { apiLogger } from "@/lib/utils/core/logger";

interface YieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number;
  rewardTokens: string[] | null;
  pool: string;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  predictions: {
    predictedClass: string | null;
    predictedProbability: number | null;
    binnedConfidence: number | null;
  } | null;
  poolMeta: string | null;
  mu: number;
  sigma: number;
  count: number;
  outlier: boolean;
  underlyingTokens: string[] | null;
  volumeUsd1d: number | null;
  volumeUsd7d: number | null;
  apyMean30d: number | null;
}

interface ProtocolData {
  id: string;
  name: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  category: string;
  chains: string[];
  tvl: number;
  chainTvls: Record<string, number>;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  slug: string;
}

export async function GET() {
  return withApiEnhancements(
    async () => {
      apiLogger.info("Fetching comprehensive Aptos DeFi data from DeFiLlama");

      try {
        // Fetch yield pools data
        const yieldsResponse = await fetch("https://yields.llama.fi/pools");
        if (!yieldsResponse.ok) throw new Error("Failed to fetch yields data");

        const yieldsData = await yieldsResponse.json();
        const aptosYields = yieldsData.data.filter(
          (pool: YieldPool) => pool.chain === "Aptos",
        );

        // Fetch protocols data
        const protocolsResponse = await fetch("https://api.llama.fi/protocols");
        if (!protocolsResponse.ok) throw new Error("Failed to fetch protocols");

        const allProtocols: ProtocolData[] = await protocolsResponse.json();

        // Filter for APTOS-ONLY protocols (not multi-chain protocols)
        const aptosProtocols = allProtocols.filter((protocol: ProtocolData) => {
          const hasAptos = protocol.chains?.includes("Aptos");
          const isAptosOnly =
            protocol.chains?.length === 1 && protocol.chains[0] === "Aptos";
          const hasSignificantAptosActivity =
            protocol.chainTvls?.Aptos > 1000000; // $1M+ on Aptos

          // Include if it's Aptos-only OR has significant Aptos activity
          return hasAptos && (isAptosOnly || hasSignificantAptosActivity);
        });

        // Calculate comprehensive metrics
        const totalYieldTVL = aptosYields.reduce(
          (sum: number, pool: YieldPool) => sum + (pool.tvlUsd || 0),
          0,
        );

        const highYieldPools = aptosYields.filter(
          (pool: YieldPool) => pool.apy > 10,
        );

        const stablecoinPools = aptosYields.filter(
          (pool: YieldPool) => pool.stablecoin,
        );

        // Group protocols by category - only Aptos protocols
        const protocolsByCategory = aptosProtocols.reduce(
          (acc: Record<string, ProtocolData[]>, protocol) => {
            const category = protocol.category || "Other";
            if (!acc[category]) acc[category] = [];
            acc[category].push(protocol);
            return acc;
          },
          {},
        );

        // Calculate average APYs
        const allApy = aptosYields.filter((pool: YieldPool) => pool.apy > 0);
        const averageApy =
          allApy.length > 0
            ? allApy.reduce(
                (sum: number, pool: YieldPool) => sum + pool.apy,
                0,
              ) / allApy.length
            : 0;

        const stablecoinApy = stablecoinPools.filter(
          (pool: YieldPool) => pool.apy > 0,
        );
        const averageStablecoinApy =
          stablecoinApy.length > 0
            ? stablecoinApy.reduce(
                (sum: number, pool: YieldPool) => sum + pool.apy,
                0,
              ) / stablecoinApy.length
            : 0;

        // Protocol TVL analysis - ONLY APTOS TVL
        const totalProtocolTVL = aptosProtocols.reduce(
          (sum: number, protocol: ProtocolData) =>
            sum + (protocol.chainTvls?.Aptos || 0),
          0,
        );

        const topProtocols = aptosProtocols
          .filter((p) => p.chainTvls?.Aptos > 0)
          .sort((a, b) => (b.chainTvls?.Aptos || 0) - (a.chainTvls?.Aptos || 0))
          .slice(0, 20)
          .map((protocol) => ({
            name: protocol.name,
            category: protocol.category,
            tvl: protocol.chainTvls?.Aptos || 0, // ONLY Aptos TVL
            change1d: protocol.change_1d,
            change7d: protocol.change_7d,
            url: protocol.url,
            logo: protocol.logo,
            isAptosOnly:
              protocol.chains?.length === 1 && protocol.chains[0] === "Aptos",
          }));

        // Volume and growth analysis
        const protocolsWithGrowth = aptosProtocols.filter(
          (p) => p.change_1d !== undefined && p.change_7d !== undefined,
        );

        const positiveGrowth1d = protocolsWithGrowth.filter(
          (p) => p.change_1d > 0,
        ).length;
        const positiveGrowth7d = protocolsWithGrowth.filter(
          (p) => p.change_7d > 0,
        ).length;

        const response = {
          // Yield Farming Metrics
          yieldFarming: {
            totalPools: aptosYields.length,
            totalTVL: totalYieldTVL,
            averageApy: averageApy,
            highYieldPools: highYieldPools.length,
            highYieldTVL: highYieldPools.reduce(
              (sum: number, pool: YieldPool) => sum + pool.tvlUsd,
              0,
            ),
            stablecoinPools: stablecoinPools.length,
            stablecoinTVL: stablecoinPools.reduce(
              (sum: number, pool: YieldPool) => sum + pool.tvlUsd,
              0,
            ),
            averageStablecoinApy: averageStablecoinApy,
            topYieldPools: aptosYields
              .sort((a: YieldPool, b: YieldPool) => b.apy - a.apy)
              .slice(0, 10)
              .map((pool: YieldPool) => ({
                project: pool.project,
                symbol: pool.symbol,
                apy: pool.apy,
                tvl: pool.tvlUsd,
                risk: pool.ilRisk,
                type: pool.stablecoin ? "Stablecoin" : "Crypto",
              })),
          },

          // Protocol Analytics
          protocols: {
            totalProtocols: aptosProtocols.length,
            totalTVL: totalProtocolTVL,
            categoriesCount: Object.keys(protocolsByCategory).length,
            categories: Object.entries(protocolsByCategory).map(
              ([category, protocols]) => ({
                category,
                count: protocols.length,
                tvl: protocols.reduce(
                  (sum, p) => sum + (p.chainTvls?.Aptos || 0),
                  0,
                ),
              }),
            ),
            topProtocols: topProtocols,
            growthMetrics: {
              totalTracked: protocolsWithGrowth.length,
              positiveGrowth1d: positiveGrowth1d,
              positiveGrowth7d: positiveGrowth7d,
              growth1dPercent:
                protocolsWithGrowth.length > 0
                  ? (positiveGrowth1d / protocolsWithGrowth.length) * 100
                  : 0,
              growth7dPercent:
                protocolsWithGrowth.length > 0
                  ? (positiveGrowth7d / protocolsWithGrowth.length) * 100
                  : 0,
            },
          },

          // Risk Analysis
          riskMetrics: {
            highRiskPools: aptosYields.filter(
              (pool: YieldPool) => pool.ilRisk === "yes",
            ).length,
            noRiskPools: aptosYields.filter(
              (pool: YieldPool) => pool.ilRisk === "no",
            ).length,
            singleExposurePools: aptosYields.filter(
              (pool: YieldPool) => pool.exposure === "single",
            ).length,
            multiExposurePools: aptosYields.filter(
              (pool: YieldPool) => pool.exposure === "multi",
            ).length,
            predictedUpTrend: aptosYields.filter(
              (pool: YieldPool) =>
                pool.predictions?.predictedClass === "Stable/Up",
            ).length,
          },

          // Raw data for detailed analysis
          rawData: {
            yieldPools: aptosYields,
            protocols: aptosProtocols,
          },

          timestamp: new Date().toISOString(),
          source: "DeFiLlama API",
        };

        apiLogger.info("Successfully fetched Aptos DeFi comprehensive data", {
          yieldPools: aptosYields.length,
          protocols: aptosProtocols.length,
          totalTVL: totalProtocolTVL,
        });

        return response;
      } catch (error) {
        apiLogger.error("Error fetching Aptos DeFi data:", error);
        throw new Error(
          `Failed to fetch DeFi data: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    {
      customHeaders: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "X-Content-Type": "application/json",
        "X-Service": "defi-llama-aptos-pools",
      },
    },
  );
}
