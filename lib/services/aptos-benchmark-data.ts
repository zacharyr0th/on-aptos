import { logger } from "@/lib/utils/core/logger";

/**
 * Comprehensive Aptos Blockchain Benchmark Data (2025)
 * Sources: Official Aptos announcements, DeFiLlama, CoinMarketCap, Messari, etc.
 * Last updated: August 2025
 */

export interface AptosBenchmarkData {
  networkStats: {
    totalWallets: number;
    totalTransactions: number;
    monthlyActiveUsers: number;
    dailyActiveWallets: number;
    blockchainRanking: number; // by daily active users
  };
  performanceRecords: {
    peakDailyTransactions: number;
    sustainedPeakTPS: number;
    recordDailyTransactions: number;
    recordTPS: number;
    currentTPS: number;
    maxTPS: number;
    theoreticalMaxTPS: number;
    blockTime: number; // in seconds
    finality: number; // in seconds
    e2eLatency: number; // in seconds
  };
  technicalSpecs: {
    programmingLanguage: string;
    executionEngine: string;
    consensusMechanism: string;
    blockTimeMs: number;
    finalityMs: number;
    parallelExecutionTPS: number;
  };
  defiEcosystem: {
    totalValueLocked: number; // in millions USD
    tvlGrowthYTD: number; // multiplier
    majorProtocols: Array<{
      name: string;
      tvl?: number;
      category: string;
      description: string;
    }>;
    foundationFunding: number; // in millions USD
    projectsFunded: number;
    grants: {
      total: number; // in millions USD
      phase1Projects: number;
      ecosystemGrants: { min: number; max: number };
      artistGrants: number;
      securityAudits: number;
    };
  };
  stablecoinMarket: {
    totalMarketCap: number; // in millions USD
    growthFromJan: number; // in millions USD
    tradingVolumeYoY: number; // percentage growth
    majorStablecoins: Array<{
      name: string;
      symbol: string;
      marketShare?: number; // percentage
      features: string[];
    }>;
  };
  gaming: {
    topGames: Array<{
      name: string;
      category: string;
      dailyInteractions?: number;
      firstDayTransactions?: number;
    }>;
  };
  nftProjects: {
    majorCollections: string[];
    marketplaces: string[];
    metaverseProjects: string[];
  };
  partnerships: {
    major: Array<{
      partner: string;
      accounts?: number;
      transactions?: number;
      description: string;
    }>;
    rwaProjects: string[];
  };
  tokenEconomics: {
    currentPrice: number;
    marketCap: number; // in millions USD
    ranking: number;
    circulatingSupply: number; // in millions
    maxSupply: number; // in millions
    distribution: {
      community: number;
      contributors: number;
      foundation: number;
      investors: number;
    };
    priceTargets: {
      year: number;
      target: number;
    }[];
  };
  recentUpgrades: {
    frameworkVersions: string[];
    performanceImprovements: Array<{
      aip: string;
      improvement: string;
      impact: string;
    }>;
    governanceChanges: Array<{
      aip: string;
      change: string;
    }>;
  };
  futureTechnology: {
    raptrConsensus: {
      targetTPS: number;
      latency: number;
    };
    stateSync: {
      targetTPS: number;
      features: string[];
    };
  };
  transactionCosts: {
    averageFeeAPT: number;
    averageFeeUSD: number;
    costComparison: string;
  };
  ecosystem: {
    totalProjects: number;
    fundingRounds: Array<{
      round: string;
      amount: number;
      leaders: string[];
    }>;
    investors: string[];
  };
}

/**
 * Get comprehensive Aptos blockchain benchmark data
 */
export function getAptosBenchmarkData(): AptosBenchmarkData {
  logger.info("Fetching Aptos benchmark data from 2025 comprehensive analysis");

  return {
    networkStats: {
      totalWallets: 71000000, // Over 71 million wallets
      totalTransactions: 2700000000, // 2.7 billion transactions
      monthlyActiveUsers: 18000000, // 18+ million MAU in H1 2025
      dailyActiveWallets: 1000000, // Nearly 1M daily active wallets
      blockchainRanking: 4, // 4th by daily active users
    },
    performanceRecords: {
      peakDailyTransactions: 326000000, // 326M transactions in single day
      sustainedPeakTPS: 13367, // Sustained peak TPS on mainnet
      recordDailyTransactions: 115400000, // 115.4M daily transactions
      recordTPS: 32000, // Record 32,000 TPS
      currentTPS: 52.12,
      maxTPS: 12933,
      theoreticalMaxTPS: 160000,
      blockTime: 0.12, // 120ms
      finality: 0.9, // 900ms
      e2eLatency: 1.0, // Sub-second E2E latency at 30k TPS
    },
    technicalSpecs: {
      programmingLanguage: "Move",
      executionEngine: "Block-STM",
      consensusMechanism: "Byzantine Fault Tolerant Proof-of-Stake",
      blockTimeMs: 130, // Under 130ms
      finalityMs: 650, // 650ms user finality
      parallelExecutionTPS: 160000, // Block-STM parallel execution
    },
    defiEcosystem: {
      totalValueLocked: 1160, // $1.16B TVL peak
      tvlGrowthYTD: 5, // Nearly 5x increase YTD
      majorProtocols: [
        {
          name: "Echo Protocol",
          tvl: 878,
          category: "Leading Protocol",
          description: "Largest protocol by TVL",
        },
        {
          name: "Aave",
          tvl: 70000,
          category: "Lending",
          description: "$70B in net deposits",
        },
        {
          name: "Aries Markets",
          category: "Trading",
          description: "Leading trading platform",
        },
        {
          name: "Amnis Finance",
          category: "Liquid Staking",
          description: "Liquid staking protocol",
        },
        {
          name: "Hyperion",
          category: "DEX",
          description: "Fast-growing DEX, top 10 by TVL",
        },
      ],
      foundationFunding: 200, // $200M committed
      projectsFunded: 165,
      grants: {
        total: 3.5,
        phase1Projects: 50,
        ecosystemGrants: { min: 5000, max: 50000 },
        artistGrants: 20000000,
        securityAudits: 25000,
      },
    },
    stablecoinMarket: {
      totalMarketCap: 1270, // $1.27B market cap
      growthFromJan: 642, // From $627.8M Jan 1
      tradingVolumeYoY: 1000, // 1,000% YoY growth
      majorStablecoins: [
        {
          name: "Tether USD",
          symbol: "USDT",
          marketShare: 75,
          features: ["Native on Aptos"],
        },
        {
          name: "USD Coin",
          symbol: "USDC",
          features: ["Cross-Chain Transfer Protocol"],
        },
        {
          name: "US Dollar Yield",
          symbol: "USDY",
          features: ["Ondo Finance", "Permissionless yieldcoin"],
        },
      ],
    },
    gaming: {
      topGames: [
        {
          name: "Defi Cattos",
          category: "Battle RPG",
          dailyInteractions: 339660,
        },
        {
          name: "Tapos Cat",
          category: "Web3 Game",
          firstDayTransactions: 10000000,
        },
        {
          name: "KGeN",
          category: "Gaming",
        },
        {
          name: "Merkle Trade",
          category: "Trading Game",
        },
      ],
    },
    nftProjects: {
      majorCollections: ["Aptos Monkeys", "GUI Gang"],
      marketplaces: ["Rarible", "TradePort", "Wapal", "BlueMove"],
      metaverseProjects: ["Aptos Art Museum"],
    },
    partnerships: {
      major: [
        {
          partner: "EXPO2025 Digital Wallet",
          accounts: 500000,
          transactions: 4370000,
          description: "Major enterprise partnership",
        },
        {
          partner: "Bitso",
          description: "Instant USDT/USDC transfers across Mexico, Brazil, Colombia",
        },
        {
          partner: "PACT",
          description: "$1+ billion onchain credit infrastructure migration",
        },
      ],
      rwaProjects: [
        "Apollo ACRED",
        "Libre Capital UMA",
        "Libre Capital BHMA",
        "Franklin Templeton BENJI",
      ],
    },
    tokenEconomics: {
      currentPrice: 4.4,
      marketCap: 3000, // $3B market cap
      ranking: 37,
      circulatingSupply: 690, // ~690M APT
      maxSupply: 1000, // 1B APT max supply
      distribution: {
        community: 51.02,
        contributors: 19.0,
        foundation: 16.5,
        investors: 13.48,
      },
      priceTargets: [{ year: 2025, target: 20 }],
    },
    recentUpgrades: {
      frameworkVersions: ["1.25.0", "1.26.0", "1.27.0", "1.28.0", "1.29.0", "1.30.2"],
      performanceImprovements: [
        {
          aip: "AIP-107",
          improvement: "Code cache sharing",
          impact: "~2x performance improvement",
        },
      ],
      governanceChanges: [
        {
          aip: "AIP-110",
          change: "Reduced governance threshold from 400M to 300M APT",
        },
      ],
    },
    futureTechnology: {
      raptrConsensus: {
        targetTPS: 260000,
        latency: 800, // <800ms latency
      },
      stateSync: {
        targetTPS: 100000,
        features: ["Transaction batching", "Network compression", "Sub-second latency"],
      },
    },
    transactionCosts: {
      averageFeeAPT: 0.00011,
      averageFeeUSD: 0.00052,
      costComparison: "10-100x cheaper than other L1 blockchains",
    },
    ecosystem: {
      totalProjects: 250,
      fundingRounds: [
        {
          round: "Seed",
          amount: 200,
          leaders: ["a16z"],
        },
        {
          round: "Series A",
          amount: 200,
          leaders: ["a16z"],
        },
      ],
      investors: [
        "Andreessen Horowitz (a16z)",
        "Dragonfly Capital",
        "Apollo Global Management",
        "Franklin Templeton",
        "Binance Labs",
      ],
    },
  };
}

/**
 * Get network performance context data comparing live metrics to benchmarks
 */
export function getNetworkPerformanceContext(liveData: any) {
  const benchmark = getAptosBenchmarkData();

  return {
    comparison: {
      currentTPS: {
        live: liveData?.currentTPS || 0,
        benchmark: benchmark.performanceRecords.currentTPS,
        record: benchmark.performanceRecords.recordTPS,
      },
      blockTime: {
        live: liveData?.averageBlockTime || 0,
        benchmark: benchmark.performanceRecords.blockTime,
        target: benchmark.technicalSpecs.blockTimeMs / 1000,
      },
      finality: {
        live: liveData?.estimatedFinalityTime || 0,
        benchmark: benchmark.performanceRecords.finality,
        target: benchmark.technicalSpecs.finalityMs / 1000,
      },
    },
    context: {
      ecosystemSize: benchmark.ecosystem.totalProjects,
      monthlyUsers: benchmark.networkStats.monthlyActiveUsers,
      totalTransactions: benchmark.networkStats.totalTransactions,
      totalWallets: benchmark.networkStats.totalWallets,
      defiTVL: benchmark.defiEcosystem.totalValueLocked,
      stablecoinMarketCap: benchmark.stablecoinMarket.totalMarketCap,
    },
  };
}
