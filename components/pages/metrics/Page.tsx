"use client";

import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logger } from "@/lib/utils/core/logger";

interface MetricRow {
  category: string;
  metric: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeType?: "increase" | "decrease" | "stable";
  status?: "good" | "warning" | "danger" | "neutral";
  source: string;
  description?: string;
}

const MetricsPage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all comprehensive data sources
  const { data: indexerData, isLoading: indexerLoading } = useQuery({
    queryKey: ["indexer-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/aptos/indexer-metrics");
      if (!response.ok) throw new Error("Failed to fetch indexer metrics");
      return await response.json();
    },
    refetchInterval: 300000,
    retry: 3,
  });

  const { data: defiLlamaData, isLoading: defiLlamaLoading } = useQuery({
    queryKey: ["defi-llama-data"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/defi-llama/aptos-pools");
      if (!response.ok) throw new Error("Failed to fetch DeFi Llama data");
      return await response.json();
    },
    refetchInterval: 300000,
    retry: 3,
  });

  const { data: globalStablecoins, isLoading: globalStablesLoading } = useQuery(
    {
      queryKey: ["global-stablecoins"],
      queryFn: async () => {
        const response = await fetch("/api/analytics/stablecoins/global");
        if (!response.ok) throw new Error("Failed to fetch global stablecoins");
        return await response.json();
      },
      refetchInterval: 600000,
      retry: 3,
    },
  );

  const { data: aptosStablecoins, isLoading: aptosStablesLoading } = useQuery({
    queryKey: ["aptos-stablecoins"],
    queryFn: async () => {
      const response = await fetch("/api/aptos/stables");
      if (!response.ok) throw new Error("Failed to fetch Aptos stablecoins");
      return await response.json();
    },
    refetchInterval: 300000,
    retry: 3,
  });

  const { data: aptosRWAs, isLoading: aptosRWAsLoading } = useQuery({
    queryKey: ["aptos-rwas"],
    queryFn: async () => {
      const response = await fetch("/api/aptos/rwa");
      if (!response.ok) throw new Error("Failed to fetch Aptos RWAs");
      return await response.json();
    },
    refetchInterval: 300000,
    retry: 3,
  });

  const { data: aptosBTC, isLoading: aptosBTCLoading } = useQuery({
    queryKey: ["aptos-btc"],
    queryFn: async () => {
      const response = await fetch("/api/aptos/btc");
      if (!response.ok) throw new Error("Failed to fetch Aptos BTC");
      return await response.json();
    },
    refetchInterval: 300000,
    retry: 3,
  });

  const { data: aptosTokens, isLoading: aptosTokensLoading } = useQuery({
    queryKey: ["aptos-tokens"],
    queryFn: async () => {
      const response = await fetch("/api/aptos/tokens");
      if (!response.ok) throw new Error("Failed to fetch Aptos tokens");
      return await response.json();
    },
    refetchInterval: 300000,
    retry: 3,
  });

  const isLoading =
    indexerLoading ||
    defiLlamaLoading ||
    globalStablesLoading ||
    aptosStablesLoading ||
    aptosRWAsLoading ||
    aptosBTCLoading ||
    aptosTokensLoading;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        // Refetch all data sources
        indexerData && (await fetch("/api/aptos/indexer-metrics")),
        defiLlamaData && (await fetch("/api/analytics/defi-llama/aptos-pools")),
        globalStablecoins && (await fetch("/api/analytics/stablecoins/global")),
        aptosStablecoins && (await fetch("/api/aptos/stables")),
        aptosRWAs && (await fetch("/api/aptos/rwa")),
        aptosBTC && (await fetch("/api/aptos/btc")),
        aptosTokens && (await fetch("/api/aptos/tokens")),
      ]);
    } catch (error) {
      logger.error("Error refreshing comprehensive metrics:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toLocaleString();
  };

  const formatUSD = (amount: number): string => {
    return "$" + formatNumber(amount);
  };

  const formatAPT = (amount: number): string => {
    return (amount / 1e8).toFixed(2) + " APT"; // Convert from octas
  };

  const formatPercent = (percent: number): string => {
    return percent.toFixed(2) + "%";
  };

  const getChangeIcon = (changeType?: "increase" | "decrease" | "stable") => {
    switch (changeType) {
      case "increase":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "decrease":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "stable":
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (
    status?: "good" | "warning" | "danger" | "neutral",
  ) => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "danger":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Build comprehensive metrics table data
  const buildMetricsData = (): MetricRow[] => {
    const metrics: MetricRow[] = [];

    // Network & Infrastructure Metrics
    if (indexerData?.network) {
      metrics.push(
        {
          category: "Network",
          metric: "Total Transactions",
          value: formatNumber(indexerData.network.totalTransactions || 0),
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "Network",
          metric: "Total Blocks",
          value: formatNumber(indexerData.network.totalBlocks || 0),
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "Network",
          metric: "Current Epoch",
          value: indexerData.network.currentEpoch || "N/A",
          source: "Aptos Indexer",
          status: "neutral",
        },
        {
          category: "Network",
          metric: "Latest Block Height",
          value: formatNumber(indexerData.network.latestBlockHeight || 0),
          source: "Aptos Indexer",
          status: "neutral",
        },
        {
          category: "Network",
          metric: "Latest Version",
          value: formatNumber(indexerData.network.latestVersion || 0),
          source: "Aptos Indexer",
          status: "neutral",
        },
        {
          category: "Network",
          metric: "Active Processors",
          value: indexerData.network.processorStatus?.length || 0,
          source: "Aptos Indexer",
          status:
            (indexerData.network.processorStatus?.length || 0) > 0
              ? "good"
              : "warning",
        },
      );
    }

    // DeFi Ecosystem Metrics (DeFiLlama Data)
    if (defiLlamaData) {
      const yieldFarming = defiLlamaData.yieldFarming;
      const protocols = defiLlamaData.protocols;
      const riskMetrics = defiLlamaData.riskMetrics;

      if (yieldFarming) {
        metrics.push(
          {
            category: "DeFi - Yield Farming",
            metric: "Total Yield Pools",
            value: yieldFarming.totalPools || 0,
            source: "DeFiLlama",
            status: "good",
          },
          {
            category: "DeFi - Yield Farming",
            metric: "Total Yield TVL",
            value: formatUSD(yieldFarming.totalTVL || 0),
            source: "DeFiLlama",
            status: "good",
          },
          {
            category: "DeFi - Yield Farming",
            metric: "Average APY",
            value: formatPercent(yieldFarming.averageApy || 0),
            source: "DeFiLlama",
            status: yieldFarming.averageApy > 5 ? "good" : "neutral",
          },
          {
            category: "DeFi - Yield Farming",
            metric: "High Yield Pools (>10% APY)",
            value: yieldFarming.highYieldPools || 0,
            source: "DeFiLlama",
            status: "neutral",
          },
          {
            category: "DeFi - Yield Farming",
            metric: "High Yield TVL",
            value: formatUSD(yieldFarming.highYieldTVL || 0),
            source: "DeFiLlama",
            status: "neutral",
          },
          {
            category: "DeFi - Yield Farming",
            metric: "Stablecoin Pools",
            value: yieldFarming.stablecoinPools || 0,
            source: "DeFiLlama",
            status: "good",
          },
          {
            category: "DeFi - Yield Farming",
            metric: "Stablecoin TVL",
            value: formatUSD(yieldFarming.stablecoinTVL || 0),
            source: "DeFiLlama",
            status: "good",
          },
          {
            category: "DeFi - Yield Farming",
            metric: "Average Stablecoin APY",
            value: formatPercent(yieldFarming.averageStablecoinApy || 0),
            source: "DeFiLlama",
            status: yieldFarming.averageStablecoinApy > 3 ? "good" : "neutral",
          },
        );
      }

      if (protocols) {
        metrics.push(
          {
            category: "DeFi - Protocols",
            metric: "Total DeFi Protocols",
            value: protocols.totalProtocols || 0,
            source: "DeFiLlama",
            status: "good",
          },
          {
            category: "DeFi - Protocols",
            metric: "Total Protocol TVL",
            value: formatUSD(protocols.totalTVL || 0),
            source: "DeFiLlama",
            status: "good",
          },
          {
            category: "DeFi - Protocols",
            metric: "Protocol Categories",
            value: protocols.categoriesCount || 0,
            source: "DeFiLlama",
            status: "neutral",
          },
        );

        if (protocols.growthMetrics) {
          metrics.push(
            {
              category: "DeFi - Growth",
              metric: "Protocols with Positive 1D Growth",
              value: `${protocols.growthMetrics.positiveGrowth1d}/${protocols.growthMetrics.totalTracked} (${formatPercent(protocols.growthMetrics.growth1dPercent)})`,
              source: "DeFiLlama",
              status:
                protocols.growthMetrics.growth1dPercent > 50
                  ? "good"
                  : "neutral",
            },
            {
              category: "DeFi - Growth",
              metric: "Protocols with Positive 7D Growth",
              value: `${protocols.growthMetrics.positiveGrowth7d}/${protocols.growthMetrics.totalTracked} (${formatPercent(protocols.growthMetrics.growth7dPercent)})`,
              source: "DeFiLlama",
              status:
                protocols.growthMetrics.growth7dPercent > 50
                  ? "good"
                  : "neutral",
            },
          );
        }
      }

      if (riskMetrics) {
        metrics.push(
          {
            category: "DeFi - Risk Analysis",
            metric: "High Risk Pools",
            value: riskMetrics.highRiskPools || 0,
            source: "DeFiLlama",
            status: "warning",
          },
          {
            category: "DeFi - Risk Analysis",
            metric: "No Risk Pools",
            value: riskMetrics.noRiskPools || 0,
            source: "DeFiLlama",
            status: "good",
          },
          {
            category: "DeFi - Risk Analysis",
            metric: "Single Exposure Pools",
            value: riskMetrics.singleExposurePools || 0,
            source: "DeFiLlama",
            status: "neutral",
          },
          {
            category: "DeFi - Risk Analysis",
            metric: "Multi Exposure Pools",
            value: riskMetrics.multiExposurePools || 0,
            source: "DeFiLlama",
            status: "neutral",
          },
          {
            category: "DeFi - Risk Analysis",
            metric: "Predicted Uptrend Pools",
            value: riskMetrics.predictedUpTrend || 0,
            source: "DeFiLlama",
            status: "good",
          },
        );
      }
    }

    // Stablecoin Ecosystem Analysis
    if (globalStablecoins && aptosStablecoins) {
      const globalTotal = globalStablecoins.totalMarketCap || 0;
      const aptosTotal =
        aptosStablecoins.reduce(
          (sum: number, stable: any) =>
            sum + stable.supply * (stable.price || 1),
          0,
        ) || 0;
      const aptosMarketShare =
        globalTotal > 0 ? (aptosTotal / globalTotal) * 100 : 0;

      metrics.push(
        {
          category: "Stablecoins - Global",
          metric: "Global Stablecoin Market Cap",
          value: formatUSD(globalTotal),
          source: "DeFiLlama",
          status: "neutral",
        },
        {
          category: "Stablecoins - Global",
          metric: "Total Global Stablecoins",
          value: globalStablecoins.totalStablecoins || 0,
          source: "DeFiLlama",
          status: "neutral",
        },
        {
          category: "Stablecoins - Aptos",
          metric: "Total Aptos Stablecoins",
          value: aptosStablecoins.length || 0,
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "Stablecoins - Aptos",
          metric: "Aptos Stablecoin TVL",
          value: formatUSD(aptosTotal),
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "Stablecoins - Market Share",
          metric: "Aptos vs Global Market Share",
          value: formatPercent(aptosMarketShare),
          source: "Calculated",
          status: aptosMarketShare > 0.1 ? "good" : "warning",
          description: `Aptos stablecoins represent ${formatPercent(aptosMarketShare)} of global stablecoin market`,
        },
      );

      // Add individual stablecoin metrics
      aptosStablecoins.forEach((stable: any) => {
        metrics.push({
          category: "Stablecoins - Individual",
          metric: `${stable.symbol} Supply`,
          value: formatUSD(stable.supply * (stable.price || 1)),
          source: "Aptos Indexer",
          status: "neutral",
        });
      });
    }

    // Staking Ecosystem
    if (indexerData?.staking) {
      const staking = indexerData.staking;
      metrics.push(
        {
          category: "Staking",
          metric: "Total Staking Pools",
          value: staking.totalPools || 0,
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "Staking",
          metric: "Total Staked APT",
          value: formatAPT(staking.totalStakedCoins || 0),
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "Staking",
          metric: "Total Delegators",
          value: formatNumber(staking.totalDelegators || 0),
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "Staking",
          metric: "Average Commission Rate",
          value: formatPercent(staking.averageCommission || 0),
          source: "Aptos Indexer",
          status: staking.averageCommission < 10 ? "good" : "warning",
        },
        {
          category: "Staking",
          metric: "Recent Staking Activities",
          value: formatNumber(staking.recentStakingActivities || 0),
          source: "Aptos Indexer",
          status: "neutral",
        },
        {
          category: "Staking",
          metric: "Recent Staking Volume",
          value: formatAPT(staking.recentStakingVolume || 0),
          source: "Aptos Indexer",
          status: "neutral",
        },
      );
    }

    // Asset Type Specific Metrics
    if (aptosRWAs) {
      metrics.push({
        category: "Real World Assets",
        metric: "Total RWA Protocols",
        value: aptosRWAs.length || 0,
        source: "Aptos Indexer",
        status: "good",
      });

      aptosRWAs.forEach((rwa: any) => {
        metrics.push({
          category: "Real World Assets",
          metric: `${rwa.name} TVL`,
          value: formatUSD(rwa.tvl || 0),
          source: "Aptos Indexer",
          status: "neutral",
        });
      });
    }

    if (aptosBTC) {
      const totalBTCTVL = aptosBTC.reduce(
        (sum: number, btc: any) => sum + (btc.tvl || 0),
        0,
      );
      metrics.push(
        {
          category: "Bitcoin Assets",
          metric: "Total Bitcoin Protocols",
          value: aptosBTC.length || 0,
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "Bitcoin Assets",
          metric: "Total Bitcoin TVL",
          value: formatUSD(totalBTCTVL),
          source: "Aptos Indexer",
          status: "good",
        },
      );

      aptosBTC.forEach((btc: any) => {
        metrics.push({
          category: "Bitcoin Assets",
          metric: `${btc.name} TVL`,
          value: formatUSD(btc.tvl || 0),
          source: "Aptos Indexer",
          status: "neutral",
        });
      });
    }

    // NFT Ecosystem
    if (indexerData?.nfts) {
      const nfts = indexerData.nfts;
      metrics.push(
        {
          category: "NFTs",
          metric: "Total Collections",
          value: formatNumber(nfts.totalCollections || 0),
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "NFTs",
          metric: "Total NFT Supply",
          value: formatNumber(nfts.totalSupply || 0),
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "NFTs",
          metric: "Total Minted",
          value: formatNumber(nfts.totalMinted || 0),
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "NFTs",
          metric: "Collection Completion Rate",
          value: formatPercent(
            nfts.totalMaxSupply > 0
              ? (nfts.totalSupply / nfts.totalMaxSupply) * 100
              : 0,
          ),
          source: "Calculated",
          status: "neutral",
        },
        {
          category: "NFTs",
          metric: "Recent Activities",
          value: formatNumber(nfts.recentNFTActivities || 0),
          source: "Aptos Indexer",
          status: "neutral",
        },
      );
    }

    // Token Ecosystem
    if (indexerData?.tokens) {
      const tokens = indexerData.tokens;
      metrics.push(
        {
          category: "Tokens",
          metric: "Total Fungible Assets",
          value: formatNumber(tokens.totalFungibleAssets || 0),
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "Tokens",
          metric: "Recent Token Activities",
          value: formatNumber(tokens.recentFAActivities || 0),
          source: "Aptos Indexer",
          status: "neutral",
        },
      );
    }

    // Account Activity
    if (indexerData?.accounts) {
      const accounts = indexerData.accounts;
      metrics.push(
        {
          category: "Accounts",
          metric: "Active Accounts",
          value: formatNumber(accounts.activeAccounts || 0),
          source: "Aptos Indexer",
          status: "good",
        },
        {
          category: "Accounts",
          metric: "Total Asset Balances",
          value: formatNumber(accounts.totalAssetBalances || 0),
          source: "Aptos Indexer",
          status: "neutral",
        },
      );
    }

    // Domain Services
    if (indexerData?.domains) {
      const domains = indexerData.domains;
      metrics.push({
        category: "Domains (ANS)",
        metric: "Total Registered Domains",
        value: formatNumber(domains.totalDomains || 0),
        source: "Aptos Indexer",
        status: "good",
      });
    }

    return metrics;
  };

  const metricsData = buildMetricsData();

  return (
    <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                Comprehensive Aptos Ecosystem Metrics
              </h1>
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-3 py-1 text-sm font-semibold">
                Coming Soon
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Real-time insights from multiple data sources: DeFiLlama, Aptos
              Indexer, Global Markets
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline">DeFi Llama</Badge>
              <Badge variant="outline">Aptos Indexer</Badge>
              <Badge variant="outline">Global Stablecoins</Badge>
              <Badge variant="outline">Cross-Chain Ratios</Badge>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing || isLoading ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh All Data"}
          </Button>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Network Health
              </CardTitle>
              {getStatusIcon("good")}
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                {indexerData?.network ? "Online" : "Loading..."}
              </div>
              <p className="text-xs text-muted-foreground">
                {indexerData?.network?.totalTransactions
                  ? formatNumber(indexerData.network.totalTransactions)
                  : "0"}{" "}
                transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DeFi TVL</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-600">
                {defiLlamaData?.protocols?.totalTVL
                  ? formatUSD(defiLlamaData.protocols.totalTVL)
                  : "Loading..."}
              </div>
              <p className="text-xs text-muted-foreground">
                {defiLlamaData?.protocols?.totalProtocols || 0} protocols
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Stablecoin Dominance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-600">
                {globalStablecoins && aptosStablecoins
                  ? formatPercent(
                      (aptosStablecoins.reduce(
                        (sum: number, s: any) =>
                          sum + s.supply * (s.price || 1),
                        0,
                      ) /
                        globalStablecoins.totalMarketCap) *
                        100,
                    )
                  : "Loading..."}
              </div>
              <p className="text-xs text-muted-foreground">vs Global Market</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Yield Opportunities
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">
                {defiLlamaData?.yieldFarming?.averageApy
                  ? formatPercent(defiLlamaData.yieldFarming.averageApy)
                  : "Loading..."}
              </div>
              <p className="text-xs text-muted-foreground">Average APY</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Data Sources
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-gray-600">
                {
                  [
                    indexerData,
                    defiLlamaData,
                    globalStablecoins,
                    aptosStablecoins,
                    aptosRWAs,
                    aptosBTC,
                    aptosTokens,
                  ].filter(Boolean).length
                }
                /7
              </div>
              <p className="text-xs text-muted-foreground">APIs Connected</p>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive Metrics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Ecosystem Analytics</CardTitle>
            <CardDescription>
              Comprehensive metrics from all data sources including DeFi Llama
              pools, global stablecoin ratios, cross-chain comparisons, and deep
              ecosystem analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(50)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-[800px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 border-b">
                    <TableRow>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Metric</TableHead>
                      <TableHead className="font-semibold">Value</TableHead>
                      <TableHead className="font-semibold">Source</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metricsData.map((metric, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm">{metric.category}</span>
                            {metric.description && (
                              <span className="text-xs text-muted-foreground">
                                {metric.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {metric.metric}
                        </TableCell>
                        <TableCell className="font-mono text-lg">
                          <div className="flex items-center gap-2">
                            {metric.value}
                            {metric.previousValue && (
                              <span className="text-xs text-muted-foreground">
                                (was {metric.previousValue})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              metric.source === "DeFiLlama"
                                ? "default"
                                : metric.source === "Aptos Indexer"
                                  ? "secondary"
                                  : metric.source === "Calculated"
                                    ? "outline"
                                    : "secondary"
                            }
                          >
                            {metric.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(metric.status)}
                            <Badge
                              variant={
                                metric.status === "good"
                                  ? "default"
                                  : metric.status === "warning"
                                    ? "secondary"
                                    : metric.status === "danger"
                                      ? "destructive"
                                      : "outline"
                              }
                            >
                              {metric.status || "neutral"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getChangeIcon(metric.changeType)}
                            {metric.change && (
                              <span
                                className={`text-xs ${
                                  metric.changeType === "increase"
                                    ? "text-green-500"
                                    : metric.changeType === "decrease"
                                      ? "text-red-500"
                                      : "text-gray-500"
                                }`}
                              >
                                {metric.changeType === "increase" ? "+" : ""}
                                {metric.change}%
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoading && metricsData.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No metrics available
                </h3>
                <p className="text-muted-foreground mb-4">
                  Unable to load ecosystem metrics from any data source
                </p>
                <Button onClick={handleRefresh}>Retry Loading Data</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-sm text-muted-foreground flex-wrap gap-2">
              <div className="flex gap-4 flex-wrap">
                <span>
                  Data Sources: DeFiLlama, Aptos Indexer, Global Markets
                </span>
                <span>•</span>
                <span>Metrics: {metricsData.length} total</span>
                <span>•</span>
                <span>
                  Categories: {new Set(metricsData.map((m) => m.category)).size}
                </span>
              </div>
              <div>Last Updated: {new Date().toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default MetricsPage;
