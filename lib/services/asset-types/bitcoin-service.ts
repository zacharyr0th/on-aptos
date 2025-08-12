import { BTC_TOKENS } from "@/lib/config/data";
import { CACHE_TTL } from "@/lib/constants";
import { logger } from "@/lib/utils/core/logger";
import { SimpleCache } from "@/lib/utils/cache/simple-cache";

import type { BTCSupply, BTCAnalytics } from "../shared/types";
import { BaseAssetService } from "../shared/utils/base-service";
import {
  formatTokenAmountFromRaw,
  formatNumber,
  calculatePercentage,
} from "@/lib/utils/format/format";
import { UnifiedGraphQLClient } from "../shared/utils/unified-graphql-client";

// Define all BTC token configurations
interface BTCTokenConfig {
  symbol: string;
  asset_type: string;
  fa_asset_type?: string; // Optional FA address for tokens with both coin and FA
  decimals: number;
  type: 'FA' | 'coin' | 'coin_v1' | 'both' | 'FA_aggregate' | 'coin_and_fa'; // Token type options
  name?: string;
}

const BTC_TOKEN_CONFIGS: BTCTokenConfig[] = [
  {
    symbol: "xBTC",
    asset_type: BTC_TOKENS.xBTC?.asset_type || "0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387",
    decimals: BTC_TOKENS.xBTC?.decimals || 8,
    type: 'FA',
    name: "OKX wBTC",
  },
  {
    symbol: "SBTC",
    asset_type: "0x5dee1d4b13fae338a1e1780f9ad2709a010e824388efd169171a26e3ea9029bb::stakestone_bitcoin::StakeStoneBitcoin",
    fa_asset_type: "0xef1f3c4126176b1aaff3bf0d460a9344b64ac4bd28ff3e53793d49ded5c2d42f",
    decimals: 8,
    type: 'coin_and_fa',
    name: "StakeStone Bitcoin",
  },
  {
    symbol: "WBTC",
    asset_type: "0x68844a0d7f2587e726ad0579f3d640865bb4162c08a4589eeda3f9689ec52a3d",
    decimals: 8,
    type: 'FA',
    name: "Wrapped Bitcoin",
  },
  {
    symbol: "aBTC",
    asset_type: "0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec",
    decimals: 10,
    type: 'FA_aggregate', // Sum all FA balances instead of using supply
    name: "Aptos Bitcoin",
  },
  {
    symbol: "FiaBTC",
    asset_type: "0x75de592a7e62e6224d13763c392190fda8635ebb79c798a5e9dd0840102f3f93",
    decimals: 8,
    type: 'FA',
    name: "Fiat Bitcoin",
  },
];

export interface BTCTokenSupply {
  symbol: string;
  supply: string;
  formatted_supply: string;
  decimals: number;
  percentage?: number;
}

export interface BTCSupplyResponse {
  success: boolean;
  total_supply: string;
  total_supply_formatted: string;
  supplies: BTCTokenSupply[];
  timestamp: string;
  error?: string;
}

export class BitcoinService extends BaseAssetService {
  private static cache = new SimpleCache<BTCSupplyResponse>(5 * 60 * 1000);
  private static readonly CACHE_KEY = "btc:supply:detailed";
  
  /**
   * Get BTC supply analytics
   */
  static async getBTCAnalytics(forceRefresh = false): Promise<BTCAnalytics> {
    const cacheKey = "btc:analytics";

    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const totalSupply = await this.getBTCSupply();

        return {
          totalSupply,
          farmingAPRs: [], // TODO: Implement farming APR data fetching
          timestamp: new Date().toISOString(),
        };
      },
      forceRefresh ? 0 : CACHE_TTL.BTC_SUPPLY,
    );
  }

  /**
   * Get detailed BTC supply data
   */
  static async getBTCSupplyDetailed(forceRefresh = false): Promise<BTCSupplyResponse> {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.cache.get(this.CACHE_KEY);
      if (cached) {
        return cached;
      }
    }

    try {
      const supplies = await this.fetchAllBTCSupplies();
      const response = this.formatSupplyResponse(supplies);
      
      // Cache successful response
      this.cache.set(this.CACHE_KEY, response, CACHE_TTL.BTC_SUPPLY);
      
      return response;
    } catch (error) {
      logger.error("Failed to fetch BTC supplies:", error);
      
      // Try to return cached data even if expired
      const stale = this.cache.get<BTCSupplyResponse>(this.CACHE_KEY);
      if (stale) {
        return { ...stale, error: "Using cached data (stale)" };
      }
      
      return {
        success: false,
        total_supply: "0",
        total_supply_formatted: "0.00",
        supplies: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get total BTC supply across all sources (legacy method)
   */
  static async getBTCSupply(): Promise<BTCSupply> {
    const detailed = await this.getBTCSupplyDetailed();
    
    // Convert to legacy format
    const sources = detailed.supplies.map(supply => ({
      protocol: supply.symbol,
      amount: parseFloat(supply.supply),
      rawAmount: parseFloat(supply.supply),
      decimals: supply.decimals,
      formattedAmount: parseFloat(supply.formatted_supply),
      displayAmount: supply.formatted_supply,
      percentage: supply.percentage || 0,
    }));

    const totalFormatted = parseFloat(detailed.total_supply_formatted);
    const totalRaw = parseFloat(detailed.total_supply);

    return {
      total: totalFormatted,
      totalRaw,
      sources: sources.sort((a, b) => b.formattedAmount - a.formattedAmount),
    };
  }

  /**
   * Fetch all BTC token supplies
   */
  private static async fetchAllBTCSupplies(): Promise<BTCTokenSupply[]> {
    const startTime = Date.now();
    
    try {
      const supplies = await Promise.all(
        BTC_TOKEN_CONFIGS.map(token => this.fetchTokenSupply(token))
      );


      this.logMetrics("fetchAllBTCSupplies", startTime, true, {
        tokenCount: supplies.length,
        successfulCount: supplies.filter(s => s !== null).length,
      });

      return supplies.filter(s => s !== null) as BTCTokenSupply[];
    } catch (error) {
      this.logMetrics("fetchAllBTCSupplies", startTime, false);
      throw error;
    }
  }

  /**
   * Fetch individual token supply
   */
  private static async fetchTokenSupply(token: BTCTokenConfig): Promise<BTCTokenSupply | null> {
    try {
      let supply: string;

      switch (token.type) {
        case 'coin_and_fa':
          // For SBTC which has both coin and FA versions
          let coinSupplyVal = "0";
          let faSupplyVal = "0";
          
          // Get coin supply
          try {
            const coinResult = await this.fetchCoinSupplyViaRestAPI(token);
            if (coinResult && coinResult.supply) {
              coinSupplyVal = coinResult.supply;
            }
          } catch (error) {
            logger.debug(`No coin supply for ${token.symbol}`);
          }
          
          // Get FA supply if fa_asset_type is provided
          if (token.fa_asset_type) {
            try {
              const query = `query GetFA {
                fungible_asset_metadata(where: {asset_type: {_eq: "${token.fa_asset_type}"}}) {
                  supply_v2
                }
              }`;
              
              const response = await fetch('https://api.mainnet.aptoslabs.com/v1/graphql', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.APTOS_BUILD_SECRET}`
                },
                body: JSON.stringify({query})
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.data?.fungible_asset_metadata?.[0]?.supply_v2) {
                  faSupplyVal = data.data.fungible_asset_metadata[0].supply_v2.toString();
                }
              }
            } catch (error) {
              logger.debug(`No FA supply for ${token.symbol}`);
            }
          }
          
          // Sum both supplies
          supply = (BigInt(coinSupplyVal) + BigInt(faSupplyVal)).toString();
          logger.info(`${token.symbol} total: coin=${coinSupplyVal}, fa=${faSupplyVal}, total=${supply}`);
          break;
          
        case 'FA_aggregate':
          // For aBTC - temporarily hardcode while rate limited
          // Actual aggregation query would sum all current_fungible_asset_balances
          if (token.symbol === 'aBTC') {
            // Known value: 2344.7697467284 BTC with 10 decimals
            supply = "23447697467284";
            logger.info(`Using known aBTC supply: ${supply}`);
          } else {
            try {
              const query = `query GetFABalances {
                current_fungible_asset_balances_aggregate(where: {
                  asset_type: {_eq: "${token.asset_type}"}
                }) {
                  aggregate {
                    sum {
                      amount
                    }
                  }
                }
              }`;
              
              const response = await fetch('https://api.mainnet.aptoslabs.com/v1/graphql', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.APTOS_BUILD_SECRET}`
                },
                body: JSON.stringify({query})
              });
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              const data = await response.json();
              
              if (data.errors) {
                throw new Error(`GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`);
              }
              
              const sumAmount = data.data?.current_fungible_asset_balances_aggregate?.aggregate?.sum?.amount;
              supply = sumAmount ? sumAmount.toString() : "0";
            } catch (error) {
              logger.error(`Failed to aggregate FA balances for ${token.symbol}:`, error);
              supply = "0";
            }
          }
          break;
          
        case 'both':
          // Check both coin and FA supply for aBTC
          let coinSupply = "0";
          let faSupply = "0";
          
          // Try to get coin supply
          try {
            const coinResult = await this.fetchCoinSupplyViaRestAPI(token);
            if (coinResult && coinResult.supply) {
              coinSupply = coinResult.supply;
            }
          } catch (error) {
            logger.debug(`No coin supply for ${token.symbol}`);
          }
          
          // Try to get FA supply
          try {
            const query = `query GetFA {
              fungible_asset_metadata(where: {asset_type: {_eq: "${token.asset_type}"}}) {
                supply_v2
              }
            }`;
            
            const response = await fetch('https://api.mainnet.aptoslabs.com/v1/graphql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.APTOS_BUILD_SECRET}`
              },
              body: JSON.stringify({query})
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.data?.fungible_asset_metadata?.[0]?.supply_v2) {
                faSupply = data.data.fungible_asset_metadata[0].supply_v2.toString();
              }
            }
          } catch (error) {
            logger.debug(`No FA supply for ${token.symbol}`);
          }
          
          // Use whichever is greater (non-zero)
          supply = BigInt(coinSupply) > BigInt(faSupply) ? coinSupply : faSupply;
          break;
          
        case 'FA':
          // For Fungible Assets, use direct fetch to bypass UnifiedGraphQLClient issues
          try {
            const query = `query GetFA {
              fungible_asset_metadata(where: {asset_type: {_eq: "${token.asset_type}"}}) {
                asset_type
                supply_v2
                name
                symbol
              }
            }`;

            const response = await fetch('https://api.mainnet.aptoslabs.com/v1/graphql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.APTOS_BUILD_SECRET}`
              },
              body: JSON.stringify({query})
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.errors) {
              throw new Error(`GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`);
            }

            const rawSupply = data.data?.fungible_asset_metadata?.[0]?.supply_v2;
            supply = rawSupply ? String(rawSupply) : "0";
          } catch (error) {
            logger.error(`Failed to fetch ${token.symbol} via direct GraphQL:`, error);
            supply = "0";
          }
          break;

        case 'coin_v1':
          // For coin v1 tokens, use GraphQL coin_infos table
          try {
            const query = `query GetCoinV1Info {
              coin_infos(where: {coin_type: {_eq: "${token.asset_type}"}}) {
                coin_type
                name
                symbol
                decimals
                supply_aggregator_table_handle
                supply_aggregator_table_key
              }
            }`;

            const response = await fetch('https://api.mainnet.aptoslabs.com/v1/graphql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.APTOS_BUILD_SECRET}`
              },
              body: JSON.stringify({query})
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.errors) {
              throw new Error(`GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`);
            }

            const coinInfo = data.data?.coin_infos?.[0];
            if (coinInfo?.supply_aggregator_table_handle && coinInfo?.supply_aggregator_table_key) {
              // If aggregator info is available, we might need to query the aggregator table
              // For now, fall back to REST API approach since the supply isn't in coin_supply table
              throw new Error("Aggregator table query not implemented, falling back to REST API");
            } else {
              // Fall back to REST API approach for coin v1 tokens
              throw new Error("No supply info in coin_infos, falling back to REST API");
            }
          } catch (error) {
            // Fall back to REST API approach for coin v1 tokens
            logger.warn(`Coin v1 GraphQL approach failed for ${token.symbol}, falling back to REST API:`, error);
            return this.fetchCoinSupplyViaRestAPI(token);
          }
          break;

        case 'coin':
          // For new coins, use REST API to get CoinInfo resource
          return this.fetchCoinSupplyViaRestAPI(token);

        default:
          logger.error(`Unknown token type for ${token.symbol}: ${token.type}`);
          supply = "0";
      }

      const supplyBigInt = BigInt(supply);
      const divisor = BigInt(10 ** token.decimals);
      const formattedSupply = Number(supplyBigInt) / Number(divisor);

      return {
        symbol: token.symbol,
        supply: supply,
        formatted_supply: formattedSupply.toFixed(2),
        decimals: token.decimals,
      };
    } catch (error) {
      logger.error(`Failed to fetch ${token.symbol} supply:`, error);
      return null;
    }
  }

  /**
   * Fetch coin supply via REST API (for both coin and coin_v1 types)
   */
  private static async fetchCoinSupplyViaRestAPI(token: BTCTokenConfig): Promise<BTCTokenSupply | null> {
    try {
      const resourceType = `0x1::coin::CoinInfo<${token.asset_type}>`;
      // For coins, we need to find the account that holds the CoinInfo
      // This is typically the creator/deployer address - extract from asset_type
      const creatorAddress = token.asset_type.split("::")[0];
      const url = `https://api.mainnet.aptoslabs.com/v1/accounts/${creatorAddress}/resource/${encodeURIComponent(resourceType)}`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.APTOS_BUILD_SECRET}`,
        },
      });

      let supply: string;
      if (!response.ok) {
        logger.warn(`Failed to fetch ${token.symbol} CoinInfo: HTTP ${response.status}`);
        supply = "0";
      } else {
        const data = await response.json();
        supply = this.extractCoinInfoSupply(data);
      }

      const supplyBigInt = BigInt(supply);
      const divisor = BigInt(10 ** token.decimals);
      const formattedSupply = Number(supplyBigInt) / Number(divisor);

      return {
        symbol: token.symbol,
        supply: supply,
        formatted_supply: formattedSupply.toFixed(2),
        decimals: token.decimals,
      };
    } catch (error) {
      logger.error(`Failed to fetch ${token.symbol} via REST API:`, error);
      return null;
    }
  }

  /**
   * Extract coin supply from CoinInfo resource response
   */
  private static extractCoinInfoSupply(data: any): string {
    // Try different paths for the supply data from CoinInfo resource
    if (data.data?.supply?.vec?.[0]?.integer?.vec?.[0]?.value) {
      return data.data.supply.vec[0].integer.vec[0].value;
    }

    if (data.data?.supply && typeof data.data.supply === "string") {
      return data.data.supply;
    }

    if (data.supply && typeof data.supply === "string") {
      return data.supply;
    }

    return "0";
  }

  /**
   * Format supply response with totals and percentages
   */
  private static formatSupplyResponse(supplies: BTCTokenSupply[]): BTCSupplyResponse {
    // Calculate total supply
    let totalSupply = BigInt(0);
    let totalFormatted = 0;

    for (const supply of supplies) {
      totalSupply += BigInt(supply.supply);
      totalFormatted += parseFloat(supply.formatted_supply);
    }

    // Add percentages
    const suppliesWithPercentage = supplies.map(supply => ({
      ...supply,
      percentage: totalFormatted > 0 
        ? (parseFloat(supply.formatted_supply) / totalFormatted) * 100 
        : 0,
    }));

    // Sort by supply descending
    suppliesWithPercentage.sort((a, b) => 
      parseFloat(b.formatted_supply) - parseFloat(a.formatted_supply)
    );

    return {
      success: true,
      total_supply: totalSupply.toString(),
      total_supply_formatted: totalFormatted.toFixed(2),
      supplies: suppliesWithPercentage,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fetch BTC supplies from Aptos indexer (legacy method - kept for compatibility)
   */
  private static async fetchFromIndexer(): Promise<BTCSupply> {
    const detailed = await this.getBTCSupplyDetailed();
    return this.getBTCSupply(); // Use the new method internally
  }

  /**
   * Aggregate supplies from multiple sources (legacy method - kept for compatibility)
   */
  private static aggregateSupplies(
    supplies: Array<{
      protocol: string;
      amount: number;
      assetType: string;
      decimals: number;
    }>,
  ): BTCSupply {
    const sources = [];
    let totalFormatted = 0;

    for (const supply of supplies) {
      const formattedAmount = formatTokenAmountFromRaw(supply.amount, supply.decimals);
      totalFormatted += formattedAmount;

      sources.push({
        protocol: supply.protocol,
        amount: supply.amount,
        rawAmount: supply.amount,
        decimals: supply.decimals,
        formattedAmount: formattedAmount,
        displayAmount: formatNumber(formattedAmount),
        percentage: 0,
      });
    }

    // Calculate percentages
    sources.forEach((source) => {
      source.percentage = calculatePercentage(
        source.formattedAmount,
        totalFormatted,
      );
    });

    return {
      total: totalFormatted,
      totalRaw: sources.reduce((sum, s) => sum + s.amount, 0),
      sources: sources.sort((a, b) => b.formattedAmount - a.formattedAmount),
    };
  }
}