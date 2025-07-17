import { BTC_ASSETS, BTC_TOKENS } from '@/lib/config/data';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import { getEnvVar } from '@/lib/config/validate-env';
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

// GraphQL query for fungible asset supply
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

    console.log('[Bitcoin] Getting BTC supplies', {
      forceRefresh,
      cacheKey,
      timestamp: new Date().toISOString(),
    });

    const options: CacheFirstOptions<BTCData> = {
      namespace: CACHE_NAMESPACE,
      cacheKey,
      fetchFn: () => this.fetchBTCSuppliesData(),
      startTime,
      forceRefresh,
      apiCallCount: 1,
    };

    const result = await cacheFirstWithFallback(options);

    console.log('[Bitcoin] BTC supplies result', {
      totalBtc: result.data.total.btc,
      tvlUsd: result.data.total.tvlUsd,
      marketCount: result.data.markets.length,
      responseTime: Date.now() - startTime,
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

    console.log('[Bitcoin] Getting comprehensive BTC supplies', {
      forceRefresh,
      cacheKey,
      tokenCount: Object.keys(BTC_TOKENS).length,
      timestamp: new Date().toISOString(),
    });

    const options: CacheFirstOptions<ComprehensiveBTCSupply> = {
      namespace: CACHE_NAMESPACE,
      cacheKey,
      fetchFn: () => this.fetchComprehensiveBTCSuppliesData(),
      startTime,
      forceRefresh,
      apiCallCount: Object.keys(BTC_TOKENS).length,
    };

    const result = await cacheFirstWithFallback(options);

    console.log('[Bitcoin] Comprehensive BTC supplies result', {
      total: result.data.total_formatted,
      suppliesCount: result.data.supplies.length,
      responseTime: Date.now() - startTime,
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

    console.log('[Bitcoin] Fetching Echelon data', {
      endpoint: ECHELON_API,
      timestamp: new Date().toISOString(),
    });

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
        console.error('[Bitcoin] Echelon API error', {
          status: response.status,
          statusText: response.statusText,
        });
        throw new ApiError(
          `Echelon API error: ${response.status} ${response.statusText}`,
          response.status,
          'Echelon'
        );
      }

      const data = await response.json();

      if (!data || typeof data !== 'object') {
        console.error('[Bitcoin] Invalid Echelon response', {
          dataType: typeof data,
          data: JSON.stringify(data).substring(0, 200),
        });
        throw new ApiError(
          'Invalid response format from Echelon API',
          undefined,
          'Echelon'
        );
      }

      console.log('[Bitcoin] Echelon data fetched successfully', {
        hasAssets: !!data?.data?.assets,
        assetCount: data?.data?.assets?.length || 0,
        hasMarketStats: !!data?.data?.marketStats,
        marketStatsCount: data?.data?.marketStats?.length || 0,
      });

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
   * Simple BTC supplies data fetching - REST API only
   */
  private static async fetchBTCSuppliesData(): Promise<BTCData> {
    console.log('[Bitcoin] Fetching BTC supplies data');

    const btcMarkets = [];
    let totalNormalizedBtc = BigInt(0);
    let totalTvlUsd = 0;

    // Fetch Bitcoin price for USD calculations
    const bitcoinPrice = await this.fetchBitcoinPrice();

    // Fetch all BTC assets in parallel
    const results = await Promise.allSettled(
      BTC_ASSETS.map(async (btcAsset) => {
        const supply = await this.fetchAssetSupplyData(btcAsset.assetAddress);
        return { btcAsset, supply };
      })
    );

    // Process results
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { btcAsset, supply } = result.value;
        const decimals = BTC_TOKENS[btcAsset.symbol]?.decimals || 8;
        const formattedBalance = this.formatTokenAmount(supply, decimals);

        // Normalize to 10 decimals for consistent calculations
        const normalizedAmount =
          decimals === 10 ? supply : supply * BigInt(10 ** (10 - decimals));

        totalNormalizedBtc += normalizedAmount;

        // Calculate USD value
        const btcValue = parseFloat(formattedBalance);
        const tvlUsd = btcValue * bitcoinPrice;
        totalTvlUsd += tvlUsd;

        btcMarkets.push({
          symbol: btcAsset.symbol,
          marketAddress: '',
          assetType: btcAsset.assetAddress,
          description: btcAsset.description,
          balance: formattedBalance,
          rawBalance: supply.toString(),
          decimals,
          apyBase: 0,
          apyReward: 0,
          apyBaseBorrow: 0,
          totalSupply: btcValue,
          totalBorrow: 0,
          totalSupplyUsd: tvlUsd,
          totalBorrowUsd: 0,
          tvlUsd,
          price: bitcoinPrice,
        });
      }
    }

    const totalFormatted = this.formatTokenAmount(totalNormalizedBtc, 10);

    return {
      protocol: 'aptos-rest-api',
      markets: btcMarkets,
      total: {
        btc: totalFormatted,
        normalized: totalNormalizedBtc.toString(),
        tvlUsd: totalTvlUsd,
      },
    };
  }

  /**
   * Fetch from Echelon API (original working approach)
   */
  private static async fetchFromEchelonAPI(): Promise<BTCData> {
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
   * Fetch from Aptos indexer with production-optimized timeouts
   */
  private static async fetchFromIndexerWithTimeout(): Promise<BTCData> {
    console.log('[Bitcoin] Fetching from indexer with reduced timeouts');

    const btcMarkets = [];
    let totalNormalizedBtc = BigInt(0);
    let totalTvlUsd = 0;

    // Fetch Bitcoin price for USD calculations
    const bitcoinPrice = await this.fetchBitcoinPrice();

    // Use Promise.allSettled for parallel requests with individual timeouts
    const assetPromises = BTC_ASSETS.map(async btcAsset => {
      try {
        // Shorter timeout for production (10 seconds max per asset)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 10000);
        });

        const supplyPromise = this.fetchAssetSupplyData(btcAsset.assetAddress);
        const supply = await Promise.race([supplyPromise, timeoutPromise]);

        const decimals = BTC_TOKENS[btcAsset.symbol]?.decimals || 8;
        const formattedBalance = this.formatTokenAmount(supply, decimals);

        // Normalize to 10 decimals for consistent calculations
        const normalizedAmount =
          decimals === 10 ? supply : supply * BigInt(10 ** (10 - decimals));

        // Calculate USD value
        const btcValue = parseFloat(formattedBalance);
        const tvlUsd = btcValue * bitcoinPrice;

        return {
          symbol: btcAsset.symbol,
          marketAddress: '',
          assetType: btcAsset.assetAddress,
          description: btcAsset.description,
          balance: formattedBalance,
          rawBalance: supply.toString(),
          decimals,
          apyBase: 0,
          apyReward: 0,
          apyBaseBorrow: 0,
          totalSupply: btcValue,
          totalBorrow: 0,
          totalSupplyUsd: tvlUsd,
          totalBorrowUsd: 0,
          tvlUsd,
          price: bitcoinPrice,
          normalizedAmount,
        };
      } catch (error) {
        console.error(`[Bitcoin] Failed to fetch ${btcAsset.symbol}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(assetPromises);

    // Process results and filter out failed ones
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const market = result.value;
        btcMarkets.push(market);
        totalNormalizedBtc += market.normalizedAmount;
        totalTvlUsd += market.tvlUsd;
      }
    }

    // If we got no successful results, throw error to trigger fallback
    if (btcMarkets.length === 0) {
      throw new Error('All indexer requests failed or timed out');
    }

    const totalFormatted = this.formatTokenAmount(totalNormalizedBtc, 10);

    console.log('[Bitcoin] Indexer data processed successfully', {
      marketsFound: btcMarkets.length,
      totalBTC: totalFormatted,
      totalTvlUsd,
    });

    return {
      protocol: 'aptos-indexer',
      markets: btcMarkets.map(({ normalizedAmount, ...market }) => market), // Remove helper field
      total: {
        btc: totalFormatted,
        normalized: totalNormalizedBtc.toString(),
        tvlUsd: totalTvlUsd,
      },
    };
  }


  /**
   * Fetch current Bitcoin price from Panora or CoinGecko
   */
  private static async fetchBitcoinPrice(): Promise<number> {
    // Try Panora first if API key is available
    const panoraApiKey = process.env.PANORA_API_KEY;

    if (panoraApiKey) {
      try {
        console.log('[Bitcoin] Attempting to fetch BTC price from Panora');
        const response = await enhancedFetch(
          'https://api.panora.exchange/v1/price/bitcoin',
          {
            headers: {
              Authorization: `Bearer ${panoraApiKey}`,
              Accept: 'application/json',
            },
            timeout: 4000,
            retries: 1,
          }
        );

        if (response.ok) {
          const data = await response.json();
          const price = data.price || data.usd;
          if (price && typeof price === 'number') {
            console.log('[Bitcoin] BTC price from Panora:', price);
            return price;
          }
        }
      } catch (error) {
        console.warn('[Bitcoin] Panora price fetch failed:', error);
      }
    }

    // Fallback to CoinGecko
    try {
      console.log('[Bitcoin] Fetching BTC price from CoinGecko');
      const response = await enhancedFetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        {
          headers: {
            Accept: 'application/json',
          },
          timeout: 4000,
          retries: 1,
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const price = data.bitcoin?.usd;
      if (price && typeof price === 'number') {
        console.log('[Bitcoin] BTC price from CoinGecko:', price);
        return price;
      }

      throw new Error('Invalid price data from CoinGecko');
    } catch (error) {
      console.error(
        '[Bitcoin] Failed to fetch Bitcoin price from both sources:',
        error
      );
      return 100000; // Conservative fallback price
    }
  }

  /**
   * Simple asset supply data fetching - REST API only, no fallbacks
   */
  private static async fetchAssetSupplyData(
    assetType: string
  ): Promise<bigint> {
    console.log('[Bitcoin] Fetching asset supply', { assetType });

    // xBTC - Fungible Asset
    if (
      assetType ===
      '0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387'
    ) {
      try {
        const response = await enhancedFetch(
          `https://fullnode.mainnet.aptoslabs.com/v1/accounts/0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387/resource/0x1::fungible_asset::Supply`,
          {
            headers: { Accept: 'application/json' },
            timeout: 5000,
            retries: 2,
          }
        );

        if (response.ok) {
          const data = await response.json();
          const supply = data?.data?.current?.value;
          if (supply) {
            console.log('[Bitcoin] xBTC supply fetched', { supply });
            return BigInt(supply);
          }
        }
      } catch (error) {
        console.error('[Bitcoin] Failed to fetch xBTC supply:', error);
      }
    }

    // aBTC - Coin
    if (
      assetType ===
      '0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec::abtc::ABTC'
    ) {
      try {
        const response = await enhancedFetch(
          `https://fullnode.mainnet.aptoslabs.com/v1/accounts/0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec/resource/0x1::coin::CoinInfo%3C0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec::abtc::ABTC%3E`,
          {
            headers: { Accept: 'application/json' },
            timeout: 5000,
            retries: 2,
          }
        );

        if (response.ok) {
          const data = await response.json();
          const supply =
            data?.data?.supply?.vec?.[0]?.aggregator?.vec?.[0]?.value ||
            data?.data?.supply?.vec?.[0]?.integer?.vec?.[0]?.value;
          if (supply) {
            console.log('[Bitcoin] aBTC supply fetched', { supply });
            return BigInt(supply);
          }
        }
      } catch (error) {
        console.error('[Bitcoin] Failed to fetch aBTC supply:', error);
      }
    }

    // SBTC - Coin
    if (
      assetType ===
      '0x5dee1d4b13fae338a1e1780f9ad2709a010e824388efd169171a26e3ea9029bb::stakestone_bitcoin::StakeStoneBitcoin'
    ) {
      try {
        const response = await enhancedFetch(
          `https://fullnode.mainnet.aptoslabs.com/v1/accounts/0x5dee1d4b13fae338a1e1780f9ad2709a010e824388efd169171a26e3ea9029bb/resource/0x1::coin::CoinInfo%3C0x5dee1d4b13fae338a1e1780f9ad2709a010e824388efd169171a26e3ea9029bb::stakestone_bitcoin::StakeStoneBitcoin%3E`,
          {
            headers: { Accept: 'application/json' },
            timeout: 5000,
            retries: 2,
          }
        );

        if (response.ok) {
          const data = await response.json();
          const supply =
            data?.data?.supply?.vec?.[0]?.aggregator?.vec?.[0]?.value ||
            data?.data?.supply?.vec?.[0]?.integer?.vec?.[0]?.value;
          if (supply) {
            console.log('[Bitcoin] SBTC supply fetched', { supply });
            return BigInt(supply);
          }
        }
      } catch (error) {
        console.error('[Bitcoin] Failed to fetch SBTC supply:', error);
      }
    }

    // No data found
    console.warn(`[Bitcoin] No supply data for asset type: ${assetType}`);
    return BigInt(0);
  }

  /**
   * Simple comprehensive BTC supplies fetching
   */
  private static async fetchComprehensiveBTCSuppliesData(): Promise<ComprehensiveBTCSupply> {
    console.log('[Bitcoin] Fetching comprehensive BTC supplies');

    // Fetch all supplies in parallel
    const results = await Promise.allSettled(
      Object.entries(BTC_TOKENS).map(async ([symbol, { asset_type, decimals }]) => {
        const supply = await this.fetchAssetSupplyData(asset_type);
        return { symbol, supply, decimals };
      })
    );

    // Process results
    const supplies = [];
    let totalRaw = BigInt(0);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { symbol, supply, decimals } = result.value;
        const formattedSupply = this.formatTokenAmount(supply, decimals);

        supplies.push({
          symbol,
          supply: supply.toString(),
          formatted_supply: formattedSupply,
        });

        // Normalize to 10 decimals for total
        const normalizedAmount =
          decimals === 10
            ? supply
            : supply * BigInt(10 ** (10 - decimals));
        totalRaw += normalizedAmount;
      }
    }

    const totalFormatted = this.formatTokenAmount(totalRaw, 10);

    return {
      supplies,
      total: totalRaw.toString(),
      total_formatted: totalFormatted,
      total_decimals: 10,
    };
  }
}
