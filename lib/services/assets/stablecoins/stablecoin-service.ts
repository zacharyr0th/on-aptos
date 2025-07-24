import { SERVICE_CONFIG } from '@/lib/config/cache';
import { TETHER_RESERVE_ADDRESS } from '@/lib/config/data';
import {
  STABLECOINS,
  LAYERZERO_STABLECOINS,
  WORMHOLE_STABLECOINS,
  CELER_STABLECOINS,
  ALGO_STABLECOINS,
} from '@/lib/constants';
import { formatBigIntWithDecimals } from '@/lib/utils/format';
import { logger } from '@/lib/utils/logger';

import { BaseAssetService } from '../utils/base-service';

import type {
  StablecoinSupply,
  StablecoinData,
  BridgedCoinConfig,
  FungibleAssetMetadata,
  CurrentFungibleAssetBalance,
  StablecoinGraphQLResponse,
  CoinBalanceResponse,
} from './types';

// Constants
const INDEXER_URL = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
const REST_API_URL = 'https://api.mainnet.aptoslabs.com/v1';

// Configuration
const config = SERVICE_CONFIG.stables;

// Stablecoin metadata
const STABLECOIN_METADATA: Record<
  string,
  { symbol: string; decimals: number }
> = {
  [STABLECOINS.USDC]: { symbol: 'USDC', decimals: 6 },
  [STABLECOINS.USDT]: { symbol: 'USDT', decimals: 6 },
  [STABLECOINS.USDE]: { symbol: 'USDe', decimals: 6 },
  [STABLECOINS.SUSDE]: { symbol: 'sUSDe', decimals: 6 },
  [STABLECOINS.MUSD]: { symbol: 'mUSD', decimals: 8 },
  [STABLECOINS.USDA]: { symbol: 'USDA', decimals: 8 },
  [ALGO_STABLECOINS.MOD]: { symbol: 'MOD', decimals: 8 },
};

const BRIDGED_COINS: BridgedCoinConfig[] = [
  {
    symbol: 'lzUSDC',
    name: 'LayerZero USDC',
    asset_type: LAYERZERO_STABLECOINS.LZ_USDC,
    account:
      '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa',
    decimals: 6,
  },
  {
    symbol: 'lzUSDT',
    name: 'LayerZero USDT',
    asset_type: LAYERZERO_STABLECOINS.LZ_USDT,
    account:
      '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa',
    decimals: 6,
  },
  {
    symbol: 'whUSDC',
    name: 'Wormhole USDC',
    asset_type: WORMHOLE_STABLECOINS.WH_USDC,
    account:
      '0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea',
    decimals: 6,
  },
  {
    symbol: 'whUSDT',
    name: 'Wormhole USDT',
    asset_type: WORMHOLE_STABLECOINS.WH_USDT,
    account:
      '0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852',
    decimals: 6,
  },
  {
    symbol: 'ceUSDC',
    name: 'Celer USDC',
    asset_type: CELER_STABLECOINS.CELER_USDC,
    account:
      '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d',
    decimals: 6,
  },
  {
    symbol: 'ceUSDT',
    name: 'Celer USDT',
    asset_type: CELER_STABLECOINS.CELER_USDT,
    account:
      '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d',
    decimals: 6,
  },
];

export class StablecoinService extends BaseAssetService {
  /**
   * Get all stablecoin supplies with caching
   */
  static async getStablecoinSupplies(): Promise<StablecoinData> {
    const cacheKey = 'stablecoin-supplies';

    return this.getCachedOrFetch(
      cacheKey,
      () => this.fetchStablecoinSupplies(),
      config.ttl * 1000
    );
  }

  /**
   * Fetch fresh stablecoin supply data
   */
  private static async fetchStablecoinSupplies(): Promise<StablecoinData> {
    const startTime = Date.now();

    try {
      // Fetch native fungible assets and USDT reserve
      const nativeData = await this.fetchNativeFungibleAssets();

      // Fetch bridged coin supplies
      const bridgedSupplies = await this.fetchBridgedCoinSupplies();

      // Combine and process all supplies
      const allSupplies = [...nativeData.supplies, ...bridgedSupplies];

      // Calculate total supply and percentages
      const processedData = this.processSupplies(allSupplies);

      // Add USDT reserve data
      const result: StablecoinData = {
        ...processedData,
        usdt_reserve: nativeData.usdtReserve,
      };

      this.logMetrics('fetchStablecoinSupplies', startTime, true, {
        supplyCount: result.supplies.length,
        totalSupply: result.total,
      });

      return result;
    } catch (error) {
      this.logMetrics('fetchStablecoinSupplies', startTime, false);
      logger.error('Failed to fetch stablecoin supplies:', error);
      throw error;
    }
  }

  /**
   * Fetch native fungible asset supplies
   */
  private static async fetchNativeFungibleAssets(): Promise<{
    supplies: StablecoinSupply[];
    usdtReserve: StablecoinData['usdt_reserve'];
  }> {
    const fungibleAssets = [
      ...Object.values(STABLECOINS),
      ALGO_STABLECOINS.MOD,
    ];

    const query = `
      query GetAllStablecoins {
        fungible_asset_metadata(where: {
          asset_type: {_in: ${JSON.stringify(fungibleAssets)}}
        }) {
          asset_type
          supply_v2
          decimals
        }
        
        current_fungible_asset_balances(where: {
          owner_address: {_eq: "${TETHER_RESERVE_ADDRESS}"},
          asset_type: {_eq: "${STABLECOINS.USDT}"}
        }) {
          amount
        }
      }
    `;

    const result =
      await this.executeGraphQLQuery<StablecoinGraphQLResponse>(query);

    const supplies: StablecoinSupply[] = [];
    const usdtReserveBalance =
      result.current_fungible_asset_balances?.[0]?.amount || '0';

    if (result.fungible_asset_metadata) {
      for (const item of result.fungible_asset_metadata) {
        if (item.supply_v2) {
          const metadata = STABLECOIN_METADATA[item.asset_type];
          if (!metadata) {
            logger.warn(`Unknown stablecoin asset type: ${item.asset_type}`);
            continue;
          }

          let supply = BigInt(item.supply_v2);
          const { symbol, decimals } = metadata;

          // For USDT, subtract the reserve balance
          if (symbol === 'USDT') {
            const reserveAmount = BigInt(usdtReserveBalance);
            supply = supply - reserveAmount;
            logger.info(
              `USDT: Total supply ${item.supply_v2}, Reserve ${usdtReserveBalance}, Circulating ${supply.toString()}`
            );
          }

          const divisor = BigInt(10 ** decimals);
          supplies.push({
            symbol,
            supply: (supply / divisor).toString(),
            supply_raw: supply.toString(),
            percentage: 0,
            asset_type: item.asset_type,
            type: 'fungible_asset',
          });
        }
      }
    }

    return {
      supplies,
      usdtReserve: {
        amount: usdtReserveBalance,
        amount_formatted: formatBigIntWithDecimals(
          BigInt(usdtReserveBalance),
          6
        ),
        address: TETHER_RESERVE_ADDRESS,
      },
    };
  }

  /**
   * Fetch bridged coin supplies
   */
  private static async fetchBridgedCoinSupplies(): Promise<StablecoinSupply[]> {
    const supplies = await Promise.all(
      BRIDGED_COINS.map(coin => this.fetchCoinSupply(coin))
    );

    return supplies.filter(supply => supply !== null) as StablecoinSupply[];
  }

  /**
   * Fetch individual coin supply
   */
  private static async fetchCoinSupply(
    coin: BridgedCoinConfig
  ): Promise<StablecoinSupply | null> {
    try {
      const resourceType = `0x1::coin::CoinInfo<${coin.asset_type}>`;
      const url = `${REST_API_URL}/accounts/${coin.account}/resource/${encodeURIComponent(resourceType)}`;

      const response = await this.withTimeout(
        fetch(url, {
          headers: {
            'User-Agent': 'Next.js/14 DeFi-Dashboard (Stablecoin-Service)',
          },
        }),
        10000
      );

      if (!response.ok) {
        logger.warn(`Failed to fetch ${coin.symbol}: HTTP ${response.status}`);
        return null;
      }

      const data = await response.json();
      let supply = this.extractCoinSupply(data, coin);

      // Special handling for MOD if supply is empty
      if (coin.symbol === 'MOD' && supply === BigInt(0)) {
        supply = await this.fetchMODSupplyViaGraphQL(coin);
      }

      const divisor = BigInt(10 ** coin.decimals);

      return {
        symbol: coin.symbol,
        supply: (supply / divisor).toString(),
        supply_raw: supply.toString(),
        percentage: 0,
        asset_type: coin.asset_type,
        type: 'coin',
        note: supply > 0 ? coin.name : `${coin.name} (no supply found)`,
      };
    } catch (error) {
      logger.error(`Failed to fetch supply for ${coin.symbol}:`, error);
      return null;
    }
  }

  /**
   * Extract coin supply from various response formats
   */
  private static extractCoinSupply(data: any, coin: BridgedCoinConfig): bigint {
    // Try different paths for the supply data
    if (data.data?.supply?.vec?.[0]?.integer?.vec?.[0]?.value) {
      return BigInt(data.data.supply.vec[0].integer.vec[0].value);
    }

    if (data.data?.supply && typeof data.data.supply === 'string') {
      return BigInt(data.data.supply);
    }

    if (data.supply && typeof data.supply === 'string') {
      return BigInt(data.supply);
    }

    return BigInt(0);
  }

  /**
   * Fetch MOD supply via GraphQL aggregation
   */
  private static async fetchMODSupplyViaGraphQL(
    coin: BridgedCoinConfig
  ): Promise<bigint> {
    logger.info(
      'MOD supply vector is empty, trying GraphQL manual aggregation...'
    );

    let totalSupply = BigInt(0);
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const query = `
        query {
          current_coin_balances(where: {
            coin_type: {_eq: "${coin.asset_type}"},
            amount: {_gt: "0"}
          }, limit: ${batchSize}, offset: ${offset}) {
            amount
          }
        }
      `;

      try {
        const result =
          await this.executeGraphQLQuery<CoinBalanceResponse>(query);

        if (result.current_coin_balances) {
          const balances = result.current_coin_balances;
          logger.info(
            `Batch ${Math.floor(offset / batchSize) + 1}: Found ${balances.length} MOD holders`
          );

          for (const balance of balances) {
            totalSupply += BigInt(balance.amount);
          }

          hasMore = balances.length === batchSize;
          offset += batchSize;
        } else {
          hasMore = false;
        }
      } catch (error) {
        logger.error('Failed to fetch MOD supply via GraphQL:', error);
        hasMore = false;
      }
    }

    logger.info(
      `MOD total supply from GraphQL aggregation: ${totalSupply.toString()}`
    );
    return totalSupply;
  }

  /**
   * Process supplies to calculate totals and percentages
   */
  private static processSupplies(
    supplies: StablecoinSupply[]
  ): Omit<StablecoinData, 'usdt_reserve'> {
    // Sort by supply descending
    supplies.sort((a, b) => {
      const aSupply = BigInt(a.supply);
      const bSupply = BigInt(b.supply);
      return bSupply > aSupply ? 1 : -1;
    });

    // Calculate total dollar value
    let totalDollarValue = BigInt(0);
    for (const item of supplies) {
      totalDollarValue += BigInt(item.supply);
    }

    // Calculate percentages
    for (const item of supplies) {
      const dollarSupply = BigInt(item.supply);
      item.percentage =
        totalDollarValue > 0
          ? Number((dollarSupply * BigInt(10000)) / totalDollarValue) / 100
          : 0;
    }

    // Calculate total supply in raw units (normalized to 6 decimals)
    let totalSupplyRaw = BigInt(0);
    for (const supply of supplies) {
      const metadata =
        STABLECOIN_METADATA[supply.asset_type] ||
        BRIDGED_COINS.find(c => c.asset_type === supply.asset_type);

      const decimals = metadata?.decimals || 6;
      const supplyBigInt = BigInt(supply.supply_raw);

      // Normalize to 6 decimals
      const normalizedSupply =
        decimals === 8 ? supplyBigInt / BigInt(100) : supplyBigInt;

      totalSupplyRaw += normalizedSupply;
    }

    return {
      supplies,
      total: (totalSupplyRaw / BigInt(1000000)).toString(),
      total_raw: totalSupplyRaw.toString(),
    };
  }

  /**
   * Execute GraphQL query
   */
  private static async executeGraphQLQuery<T>(query: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Next.js/14 DeFi-Dashboard (Stablecoin-Service)',
    };

    if (process.env.APTOS_BUILD_SECRET) {
      headers['Authorization'] = `Bearer ${process.env.APTOS_BUILD_SECRET}`;
    }

    const response = await this.withTimeout(
      fetch(INDEXER_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      }),
      30000
    );

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      logger.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed: ' + JSON.stringify(result.errors));
    }

    return result.data;
  }
}
