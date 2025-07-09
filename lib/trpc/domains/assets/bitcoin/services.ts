import { BTC_ASSETS, BTC_TOKENS } from '@/lib/config/data';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import {
  // Cache management
  cacheFirstWithFallback,
  type CacheFirstOptions,
  type CacheInstanceName,

  // HTTP utilities
  enhancedFetch,
  graphQLRequest,
  batchRequests,

  // Formatting utilities
  formatBigIntWithDecimals,

  // Error handling
  withErrorHandling,
  formatApiError,
  type ErrorContext,

  // Types
  type GraphQLRequest,
  type BatchRequestOptions,
  ApiError,

  // General utilities
  generateId,
} from '@/lib/utils';
import {
  BTCData,
  ComprehensiveBTCSupply,
  EchelonApiResponse,
  EchelonAsset,
  EchelonMarketStats,
  EchelonFarmingData,
  EchelonCoinInfo,
  FarmingAprResult,
  EchelonRewardData,
} from './types';

/**
 * Bitcoin Service
 * Enhanced with full utility integration for caching, error handling, and formatting
 */

// Configuration
const ECHELON_API =
  'https://app.echelon.market/api/markets?network=aptos_mainnet';
const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
const config = SERVICE_CONFIG.btc;
const CACHE_NAMESPACE: CacheInstanceName = 'btc';

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


export class BitcoinService {
  /**
   * Get BTC supplies from Echelon using cache-first pattern
   */
  static async getBTCSupplies(forceRefresh: boolean = false): Promise<BTCData> {
    const startTime = Date.now();
    const cacheKey = `btc:supplies:${forceRefresh ? generateId(4) : 'standard'}`;

    const options: CacheFirstOptions<BTCData> = {
      namespace: CACHE_NAMESPACE,
      cacheKey,
      fetchFn: () => this.fetchBTCSuppliesData(),
      startTime,
      forceRefresh,
      apiCallCount: 1,
    };

    const result = await cacheFirstWithFallback(options, {
      protocol: 'echelon',
      markets: [],
      total: {
        btc: '0',
        normalized: '0',
        tvlUsd: 0
      }
    });
    return result.data;
  }

  /**
   * Get comprehensive BTC supplies using cache-first pattern
   */
  static async getComprehensiveBTCSupplies(
    forceRefresh: boolean = false
  ): Promise<ComprehensiveBTCSupply> {
    const startTime = Date.now();
    const cacheKey = `btc:comprehensive:${forceRefresh ? generateId(4) : 'standard'}`;

    const options: CacheFirstOptions<ComprehensiveBTCSupply> = {
      namespace: CACHE_NAMESPACE,
      cacheKey,
      fetchFn: () => this.fetchComprehensiveBTCSuppliesData(),
      startTime,
      forceRefresh,
      apiCallCount: Object.keys(BTC_TOKENS).length,
    };

    const result = await cacheFirstWithFallback(options, {
      supplies: [],
      total: '0',
      total_formatted: '0',
      total_decimals: 10
    });
    return result.data;
  }

  /**
   * Enhanced token amount formatting with proper error handling
   */
  private static formatTokenAmount(amount: bigint, decimals: number): string {
    try {
      return formatBigIntWithDecimals(amount, decimals);
    } catch (error) {
      console.error('Token amount formatting error:', error);
      return '0.' + '0'.repeat(decimals);
    }
  }

  /**
   * Enhanced BigInt conversion with validation
   */
  private static convertToBigInt(floatValue: number, decimals: number): bigint {
    try {
      if (!Number.isFinite(floatValue) || floatValue < 0) {
        return BigInt(0);
      }
      const intValue = Math.round(floatValue * Math.pow(10, decimals));
      return BigInt(intValue);
    } catch (error) {
      console.error('BigInt conversion error:', error);
      return BigInt(0);
    }
  }

  /**
   * Enhanced farming APR calculation with error handling
   */
  private static calculateFarmingAprs(
    farmingData: EchelonFarmingData,
    coins: Record<string, EchelonCoinInfo>
  ): {
    supply: Record<string, FarmingAprResult[]>;
    borrow: Record<string, FarmingAprResult[]>;
  } {
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

          if (!coinInfo?.price || !pool.stakeAmount || pool.stakeAmount <= 0) {
            continue;
          }

          const stakedValue = coinInfo.price * pool.stakeAmount;

          if (Array.isArray(pool.rewards)) {
            for (const reward of pool.rewards) {
              if (!reward?.rewardKey || reward.allocPoint <= 0) {
                continue;
              }

              const rewardData = rewardsMap.get(reward.rewardKey);
              if (!rewardData?.rewardCoin?.price) {
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
    } catch (error) {
      console.error('Error calculating farming APRs:', error);
      return { supply: {}, borrow: {} };
    }
  }

  /**
   * Enhanced Echelon data fetching with proper error handling and retry logic
   */
  private static async fetchEchelonData(): Promise<EchelonApiResponse> {
    const errorContext: ErrorContext = {
      operation: 'Fetch Echelon market data',
      service: 'BTC-Echelon',
      details: { endpoint: ECHELON_API },
    };

    return withErrorHandling(async () => {
      const response = await enhancedFetch(ECHELON_API, {
        headers: {
          'User-Agent': 'Next.js/14 DeFi-Dashboard (BTC-Supplies)',
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
        timeout: config.timeout || 10000,
        retries: 3,
        retryDelay: 1000,
      });

      if (!response.ok) {
        throw new ApiError(
          `Echelon API error: ${response.status} ${response.statusText}`,
          response.status,
          'Echelon'
        );
      }

      const data = await response.json();

      if (!data || typeof data !== 'object') {
        throw new ApiError(
          'Invalid response format from Echelon API',
          undefined,
          'Echelon'
        );
      }

      return data as EchelonApiResponse;
    }, errorContext);
  }

  /**
   * Enhanced market stats finding with validation
   */
  private static findMarketStats(
    echelonData: EchelonApiResponse,
    assetAddress: string,
    marketAddress: string | undefined
  ): EchelonMarketStats | null {
    try {
      if (!echelonData?.data?.marketStats || !marketAddress) {
        return null;
      }

      // Find market stats by asset address first, then by market address
      let stats = echelonData.data.marketStats.find(
        ([key]) => key === assetAddress
      );

      if (!stats && marketAddress) {
        stats = echelonData.data.marketStats.find(
          ([key]) => key === marketAddress
        );
      }

      return stats?.[1] || null;
    } catch (error) {
      console.error('Error finding market stats:', error);
      return null;
    }
  }

  /**
   * Enhanced BTC supplies data fetching with comprehensive error handling
   */
  private static async fetchBTCSuppliesData(): Promise<BTCData> {
    const echelonData = await this.fetchEchelonData();

    if (!echelonData?.data?.assets) {
      throw new ApiError(
        'Invalid or empty response from Echelon API',
        undefined,
        'Echelon'
      );
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
      ? this.calculateFarmingAprs(echelonData.data.farming, coinInfoByMarket)
      : { supply: {}, borrow: {} };

    const btcMarkets = [];
    let totalNormalizedBtc = BigInt(0);

    for (const btcAsset of BTC_ASSETS) {
      const echelonAsset = echelonData.data.assets.find(
        (asset: EchelonAsset) =>
          asset.address === btcAsset.assetAddress ||
          asset.faAddress === btcAsset.assetAddress
      );

      if (!echelonAsset) {
        continue;
      }

      const marketAddress = echelonAsset.market;
      const stats = this.findMarketStats(
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
      const rawBalanceFloat = parseFloat(stats.totalCash || '0');

      const amountBigInt = this.convertToBigInt(rawBalanceFloat, decimals);
      const formattedBalance = this.formatTokenAmount(amountBigInt, decimals);

      const normalizedAmount =
        decimals === 10
          ? amountBigInt
          : amountBigInt * BigInt(10 ** (10 - decimals));

      totalNormalizedBtc += normalizedAmount;

      // Enhanced formatting with proper currency handling
      const totalSupplyUsd = totalSupplyFloat * echelonAsset.price;
      const totalBorrowUsd = totalBorrowFloat * echelonAsset.price;

      const lendingSupplyApr =
        typeof echelonAsset.supplyApr === 'number' ? echelonAsset.supplyApr : 0;
      const lendingBorrowApr =
        typeof echelonAsset.borrowApr === 'number' ? echelonAsset.borrowApr : 0;
      const stakingSupplyApr =
        typeof echelonAsset.stakingApr === 'number'
          ? echelonAsset.stakingApr
          : 0;

      const farmingAPTApr =
        farmingAprs.supply[marketAddress]?.find(
          item => item.coin.address === '0x1::aptos_coin::AptosCoin'
        )?.apr || 0;

      btcMarkets.push({
        symbol: btcAsset.symbol,
        marketAddress,
        assetType: btcAsset.assetAddress,
        description: btcAsset.description,
        balance: formattedBalance,
        rawBalance: amountBigInt.toString(),
        decimals,
        apyBase: lendingSupplyApr + stakingSupplyApr,
        apyReward: farmingAPTApr,
        apyBaseBorrow: lendingBorrowApr,
        totalSupply: totalSupplyFloat,
        totalBorrow: totalBorrowFloat,
        totalSupplyUsd,
        totalBorrowUsd,
        tvlUsd: totalSupplyUsd,
        price: echelonAsset.price,
      });
    }

    const totalFormatted = this.formatTokenAmount(totalNormalizedBtc, 10);
    const totalTvlUsd = btcMarkets.reduce(
      (sum, market) => sum + market.tvlUsd,
      0
    );

    return {
      protocol: 'echelon',
      markets: btcMarkets,
      total: {
        btc: totalFormatted,
        normalized: totalNormalizedBtc.toString(),
        tvlUsd: totalTvlUsd,
      },
    };
  }

  /**
   * Enhanced asset supply data fetching with GraphQL
   */
  private static async fetchAssetSupplyData(
    assetType: string
  ): Promise<bigint> {
    const errorContext: ErrorContext = {
      operation: 'Fetch asset supply via GraphQL',
      service: 'BTC-GraphQL',
      details: { assetType, endpoint: INDEXER },
    };

    return withErrorHandling(async () => {
      const request: GraphQLRequest = {
        query: ASSET_SUPPLY_GQL,
        variables: { type: assetType },
      };

      const response = await graphQLRequest<{
        current_fungible_asset_balances_aggregate: {
          aggregate: { sum: { amount: string } };
        };
      }>(INDEXER, request, {
        timeout: config.timeout || 10000,
        retries: 2,
        retryDelay: 500,
      });

      const amount =
        response?.current_fungible_asset_balances_aggregate?.aggregate?.sum
          ?.amount;

      if (!amount) {
        console.warn(`No supply data found for asset type: ${assetType}`);
        return BigInt(0);
      }

      return BigInt(amount);
    }, errorContext);
  }

  /**
   * Enhanced comprehensive BTC supplies fetching with batch processing
   */
  private static async fetchComprehensiveBTCSuppliesData(): Promise<ComprehensiveBTCSupply> {
    const tokens = Object.entries(BTC_TOKENS);

    // Create batch requests for parallel processing
    const batchOptions: BatchRequestOptions = {
      concurrency: 3, // Limit concurrent requests to avoid rate limiting
      delayBetween: 200, // 200ms delay between batches
    };

    const requests = tokens.map(
      ([symbol, { asset_type, decimals }]) =>
        async () => {
          const errorContext: ErrorContext = {
            operation: `Asset supply fetch for ${symbol}`,
            service: 'BTC-AssetSupply',
            details: { symbol, assetType: asset_type },
          };

          try {
            const supply = await withErrorHandling(
              () => this.fetchAssetSupplyData(asset_type),
              errorContext
            );
            return { symbol, supply, decimals };
          } catch (error) {
            console.error(
              `Failed to fetch supply for ${symbol}:`,
              formatApiError(error)
            );
            return { symbol, supply: BigInt(0), decimals };
          }
        }
    );

    // Execute batch requests
    const results = await batchRequests(requests, batchOptions);

    // Process results into supplies map
    const supplies = Object.fromEntries(
      results.map(result => [
        result.symbol,
        { supply: result.supply, decimals: result.decimals },
      ])
    );

    // Generate formatted output
    const out = Object.entries(BTC_TOKENS).map(([symbol, { decimals }]) => {
      const rawSupply = supplies[symbol]?.supply ?? BigInt(0);
      const supply = rawSupply.toString();
      const formattedSupply = this.formatTokenAmount(rawSupply, decimals);

      return {
        symbol,
        supply,
        formatted_supply: formattedSupply,
      };
    });

    // Calculate normalized total
    const totalRaw = out.reduce((sum, token, index) => {
      const tokenAmount = token.supply ? BigInt(token.supply) : BigInt(0);
      const decimals = Object.values(BTC_TOKENS)[index].decimals;
      const normalizedAmount =
        decimals === 10
          ? tokenAmount
          : tokenAmount * BigInt(10 ** (10 - decimals));
      return sum + normalizedAmount;
    }, BigInt(0));

    const totalFormatted = this.formatTokenAmount(totalRaw, 10);

    return {
      supplies: out,
      total: totalRaw.toString(),
      total_formatted: totalFormatted,
      total_decimals: 10,
    };
  }
}
