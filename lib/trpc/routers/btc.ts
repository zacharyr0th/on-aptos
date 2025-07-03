import { z } from 'zod';
import { router, publicProcedure } from '../core/server';
import {
  BaseResponseSchema,
  ForceRefreshInputSchema,
  MarketDataSchema,
} from '../schemas';
import { BTC_ASSETS, BTC_TOKENS } from '@/lib/config/data';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import {
  formatBigIntWithDecimals,
  graphQLRequest,
  cacheFirst,
  withErrorHandling,
  type FetchOptions,
  type ErrorContext,
} from '@/lib/utils';

/**
 * BTC specific schemas
 */
const BTCMarketSchema = MarketDataSchema.extend({
  description: z.string(),
  balance: z.string(),
  rawBalance: z.string(),
  decimals: z.number(),
  apyBaseBorrow: z.number(),
  totalSupplyUsd: z.number(),
  totalBorrowUsd: z.number(),
});

const BTCSupplyTokenSchema = z.object({
  symbol: z.string(),
  supply: z.string(),
  formatted_supply: z.string(),
});

const BTCDataResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    protocol: z.string(),
    markets: z.array(BTCMarketSchema),
    total: z.object({
      btc: z.string(),
      normalized: z.string(),
      tvlUsd: z.number(),
    }),
  }),
});

const ComprehensiveBTCSupplyResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    supplies: z.array(BTCSupplyTokenSchema),
    total: z.string(),
    total_formatted: z.string(),
    total_decimals: z.number(),
  }),
});

// The official Echelon protocol API endpoint
const ECHELON_API =
  'https://app.echelon.market/api/markets?network=aptos_mainnet';

// Define interfaces for Echelon API responses
interface EchelonReward {
  rewardKey: string;
  allocPoint: number;
}

interface EchelonPool {
  stakeAmount: number;
  rewards: EchelonReward[];
}

interface EchelonRewardData {
  rewardPerSec: number;
  totalAllocPoint: number;
  startTime: number;
  endTime: number;
  rewardCoin: {
    price: number;
    address?: string;
    symbol?: string;
  };
}

interface EchelonFarmingData {
  rewards: [string, EchelonRewardData][];
  pools: {
    supply: [string, EchelonPool][];
    borrow: [string, EchelonPool][];
  };
}

interface EchelonCoinInfo {
  price: number;
  symbol: string;
  address?: string;
}

interface EchelonMarketStats {
  totalCash?: string;
  totalLiability?: string;
  totalReserve?: string;
}

interface EchelonAsset {
  address: string;
  market: string;
  faAddress?: string;
  symbol: string;
  price: number;
  decimals?: number;
  supplyApr?: number;
  borrowApr?: number;
  stakingApr?: number;
}

interface EchelonApiResponse {
  data: {
    assets: EchelonAsset[];
    marketStats: [string, EchelonMarketStats][];
    farming?: EchelonFarmingData;
  };
}

interface FarmingAprResult {
  coin: {
    price: number;
    address?: string;
    symbol?: string;
  };
  apr: number;
}

/**
 * Convert a float value to a BigInt with the specified number of decimals
 */
function convertToBigInt(floatValue: number, decimals: number): bigint {
  const intValue = Math.round(floatValue * Math.pow(10, decimals));
  return BigInt(intValue);
}

/**
 * Format a token amount for display with proper decimals
 */
function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatBigIntWithDecimals(amount, decimals);
}

/**
 * Calculate farming APRs for markets
 */
function calculateFarmingAprs(
  farmingData: EchelonFarmingData,
  coins: Record<string, EchelonCoinInfo>
) {
  try {
    const rewardsMap = new Map<string, EchelonRewardData>();
    if (Array.isArray(farmingData.rewards)) {
      farmingData.rewards.forEach(
        ([key, value]: [string, EchelonRewardData]) => {
          rewardsMap.set(key, value);
        }
      );
    }

    const result = {
      supply: {} as Record<string, FarmingAprResult[]>,
      borrow: {} as Record<string, FarmingAprResult[]>,
    };

    const SEC_PER_YEAR = 365 * 24 * 60 * 60;

    if (farmingData.pools && Array.isArray(farmingData.pools.supply)) {
      for (const poolData of farmingData.pools.supply) {
        if (!Array.isArray(poolData) || poolData.length < 2) continue;

        const [market, pool] = poolData;
        const aprs: FarmingAprResult[] = [];
        const coinInfo = coins[market];

        if (
          !coinInfo ||
          !coinInfo.price ||
          !pool.stakeAmount ||
          pool.stakeAmount <= 0
        ) {
          continue;
        }

        const stakedValue = coinInfo.price * pool.stakeAmount;

        if (Array.isArray(pool.rewards)) {
          for (const reward of pool.rewards) {
            if (!reward || !reward.rewardKey || reward.allocPoint <= 0) {
              continue;
            }

            const rewardData = rewardsMap.get(reward.rewardKey);
            if (
              !rewardData ||
              !rewardData.rewardCoin ||
              !rewardData.rewardCoin.price
            ) {
              continue;
            }

            const now = Date.now() / 1000;
            if (rewardData.startTime > now || rewardData.endTime < now) {
              continue;
            }

            const apr =
              ((rewardData.rewardPerSec / rewardData.totalAllocPoint) *
                reward.allocPoint *
                SEC_PER_YEAR *
                rewardData.rewardCoin.price) /
              stakedValue;

            aprs.push({
              coin: rewardData.rewardCoin,
              apr: apr,
            });
          }
        }

        if (aprs.length > 0) {
          result.supply[market] = aprs;
        }
      }
    }

    return result;
  } catch {
    return { supply: {}, borrow: {} };
  }
}

/**
 * Core data fetching logic for Echelon API
 */
async function fetchEchelonData(): Promise<EchelonApiResponse> {
  const response = await fetch(ECHELON_API, {
    headers: {
      'User-Agent': 'Next.js/14 DeFi-Dashboard (Aptos-Stables)',
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Echelon API returned ${response.status}: ${response.statusText}`
    );
  }

  const data: EchelonApiResponse = await response.json();
  return data;
}

/**
 * Find market stats for a given asset
 */
function findMarketStats(
  echelonData: EchelonApiResponse,
  assetAddress: string,
  marketAddress: string | undefined
): EchelonMarketStats | null {
  let stats = echelonData.data.marketStats.find(
    stats => stats[0] === assetAddress
  );

  if ((!stats || !stats[1]) && marketAddress) {
    stats = echelonData.data.marketStats.find(
      stats => stats[0] === marketAddress
    );
  }

  return stats && stats[1] ? stats[1] : null;
}

/**
 * Core data processing logic for BTC supplies from Echelon
 */
async function fetchBTCSuppliesData(): Promise<
  z.infer<typeof BTCDataResponseSchema>['data']
> {
  const echelonData = await fetchEchelonData();

  if (!echelonData || !echelonData.data || !echelonData.data.assets) {
    throw new Error('Invalid or empty response from Echelon API');
  }

  const coinInfoByMarket: Record<string, EchelonCoinInfo> = {};
  for (const market of echelonData.data.assets) {
    coinInfoByMarket[market.market] = {
      symbol: market.symbol,
      price: market.price,
      address: market.address || market.faAddress,
    };
  }

  const farmingAprs = echelonData.data.farming
    ? calculateFarmingAprs(echelonData.data.farming, coinInfoByMarket)
    : { supply: {}, borrow: {} };

  const btcMarkets = [];
  let totalNormalizedBtc = BigInt(0);

  for (const btcAsset of BTC_ASSETS) {
    const echelonAsset = echelonData.data.assets.find(
      (asset: EchelonAsset) => asset.address === btcAsset.assetAddress
    );

    if (!echelonAsset) {
      continue;
    }

    const marketAddress = echelonAsset.market;
    const stats = findMarketStats(
      echelonData,
      btcAsset.assetAddress,
      marketAddress
    );

    if (!stats) {
      continue;
    }

    const decimals = echelonAsset.decimals || 8;

    const totalSupplyFloat =
      parseFloat(stats.totalCash || '0') +
      parseFloat(stats.totalLiability || '0') -
      parseFloat(stats.totalReserve || '0');

    const totalBorrowFloat = parseFloat(stats.totalLiability || '0');
    const totalSupplyUsd = totalSupplyFloat * echelonAsset.price;
    const totalBorrowUsd = totalBorrowFloat * echelonAsset.price;
    const rawBalanceFloat = parseFloat(stats.totalCash || '0');
    const amountBigInt = convertToBigInt(rawBalanceFloat, decimals);
    const formattedBalance = formatTokenAmount(amountBigInt, decimals);

    const normalizedAmount =
      decimals === 10
        ? amountBigInt
        : amountBigInt * BigInt(10 ** (10 - decimals));

    totalNormalizedBtc += normalizedAmount;

    const lendingSupplyApr =
      typeof echelonAsset.supplyApr === 'number' ? echelonAsset.supplyApr : 0;
    const lendingBorrowApr =
      typeof echelonAsset.borrowApr === 'number' ? echelonAsset.borrowApr : 0;
    const stakingSupplyApr =
      typeof echelonAsset.stakingApr === 'number' ? echelonAsset.stakingApr : 0;

    const farmingAPTApr =
      farmingAprs.supply[marketAddress]?.find(
        item => item.coin.address === '0x1::aptos_coin::AptosCoin'
      )?.apr || 0;

    const farmingTHAPTApr =
      farmingAprs.supply[marketAddress]?.find(
        item =>
          item.coin.address ===
          '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT'
      )?.apr || 0;

    const rewardApr = farmingAPTApr + farmingTHAPTApr + stakingSupplyApr;

    btcMarkets.push({
      symbol: btcAsset.symbol,
      marketAddress: marketAddress,
      assetType: btcAsset.assetAddress,
      description: btcAsset.description,
      balance: formattedBalance,
      rawBalance: amountBigInt.toString(),
      decimals,
      apyBase: lendingSupplyApr * 100,
      apyReward: rewardApr * 100,
      apyBaseBorrow: lendingBorrowApr * 100,
      totalSupply: totalSupplyFloat,
      totalBorrow: totalBorrowFloat,
      totalSupplyUsd,
      totalBorrowUsd,
      tvlUsd: totalSupplyUsd - totalBorrowUsd,
      price: echelonAsset.price,
    });
  }

  const totalFormatted = formatTokenAmount(totalNormalizedBtc, 10);

  return {
    protocol: 'Echelon',
    markets: btcMarkets,
    total: {
      btc: totalFormatted,
      normalized: totalNormalizedBtc.toString(),
      tvlUsd: btcMarkets.reduce((sum, market) => sum + market.tvlUsd, 0),
    },
  };
}

/** Aptos Labs public Indexer endpoint */
const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';

// Use centralized cache
const config = SERVICE_CONFIG.btc;

// GraphQL query for asset supply
const ASSET_SUPPLY_GQL = `
  query AssetSupply($type: String!) {
    current_fungible_asset_balances_aggregate(
      where: { asset_type: { _eq: $type } }
    ) {
      aggregate { sum { amount } }
    }
  }
`;

/**
 * Core data fetching logic for individual asset supply
 */
async function fetchAssetSupplyData(assetType: string): Promise<bigint> {
  const fetchOptions: FetchOptions = {
    timeout: config.timeout,
    retries: config.retries,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Next.js/14 DeFi-Dashboard (BTC-Supplies)',
    },
  };

  const result = (await graphQLRequest(
    INDEXER,
    { query: ASSET_SUPPLY_GQL, variables: { type: assetType } },
    fetchOptions
  )) as {
    data: {
      current_fungible_asset_balances_aggregate: {
        aggregate?: { sum?: { amount?: string } };
      };
    };
  };

  const raw =
    result.data.current_fungible_asset_balances_aggregate.aggregate?.sum
      ?.amount;

  if (raw === undefined || raw === null) {
    return BigInt(0);
  }

  return BigInt(raw);
}

/**
 * Core data processing logic for comprehensive BTC supplies
 */
async function fetchComprehensiveBTCSuppliesData(): Promise<
  z.infer<typeof ComprehensiveBTCSupplyResponseSchema>['data']
> {
  const tokens = Object.entries(BTC_TOKENS);
  const entries = [];

  for (let i = 0; i < tokens.length; i++) {
    const [symbol, { asset_type, decimals }] = tokens[i];

    const errorContext: ErrorContext = {
      operation: `Asset supply fetch for ${symbol}`,
      service: 'BTC-AssetSupply',
      details: { symbol, assetType: asset_type },
    };

    try {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const supply = await withErrorHandling(
        () => fetchAssetSupplyData(asset_type),
        errorContext
      );
      entries.push([symbol, { supply, decimals }]);
    } catch {
      entries.push([symbol, { supply: BigInt(0), decimals }]);
    }
  }

  const supplies = Object.fromEntries(entries);

  const out = Object.entries(BTC_TOKENS).map(([symbol, { decimals }]) => {
    const rawSupply = supplies[symbol]?.supply ?? BigInt(0);
    const supply = rawSupply.toString();
    const formattedSupply = formatTokenAmount(rawSupply, decimals);

    return {
      symbol,
      supply,
      formatted_supply: formattedSupply,
    };
  });

  const totalRaw = out.reduce((sum, token, index) => {
    const tokenAmount = token.supply ? BigInt(token.supply) : BigInt(0);
    const decimals = Object.values(BTC_TOKENS)[index].decimals;

    const normalized =
      decimals === 10
        ? tokenAmount
        : tokenAmount * BigInt(10 ** (10 - decimals));

    return sum + normalized;
  }, BigInt(0));

  const totalFormatted = formatTokenAmount(totalRaw, 10);

  return {
    supplies: out,
    total: totalRaw.toString(),
    total_formatted: totalFormatted,
    total_decimals: 10,
  };
}

/**
 * BTC router using the new utilities
 */
export const btcRouter = router({
  getSupplies: publicProcedure
    .input(ForceRefreshInputSchema)
    .output(BTCDataResponseSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();
      const cacheKey = 'btc-supplies';

      const errorContext: ErrorContext = {
        operation: 'BTC supplies fetch',
        service: 'BTC',
        details: { forceRefresh: input.forceRefresh },
      };

      return await withErrorHandling(
        () =>
          cacheFirst({
            namespace: 'btc',
            cacheKey,
            fetchFn: fetchBTCSuppliesData,
            startTime,
            forceRefresh: input.forceRefresh,
            apiCallCount: 1,
          }),
        errorContext
      );
    }),

  getBTCSupplies: publicProcedure
    .input(ForceRefreshInputSchema)
    .output(ComprehensiveBTCSupplyResponseSchema)
    .query(async ({ input }) => {
      const startTime = Date.now();
      const cacheKey = 'comprehensive-btc-supplies';

      const errorContext: ErrorContext = {
        operation: 'Comprehensive BTC supplies fetch',
        service: 'BTC-Comprehensive',
        details: { forceRefresh: input.forceRefresh },
      };

      // Create a fallback function for this endpoint
      const fallbackData = (): z.infer<
        typeof ComprehensiveBTCSupplyResponseSchema
      >['data'] => {
        const fallbackSupplies = Object.entries(BTC_TOKENS).map(
          ([symbol, { decimals: _decimals }]) => ({
            symbol,
            supply: '0',
            formatted_supply: '0.0000000000',
          })
        );

        return {
          supplies: fallbackSupplies,
          total: '0',
          total_formatted: '0.0000000000',
          total_decimals: 10,
        };
      };

      try {
        return await withErrorHandling(
          () =>
            cacheFirst({
              namespace: 'btc',
              cacheKey,
              fetchFn: fetchComprehensiveBTCSuppliesData,
              startTime,
              forceRefresh: input.forceRefresh,
              apiCallCount: Object.keys(BTC_TOKENS).length,
            }),
          errorContext
        );
      } catch (error) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 0,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: {
            cached: false,
          },
          data: fallbackData(),
        };
      }
    }),
});
