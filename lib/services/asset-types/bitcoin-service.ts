import { BTC_TOKENS } from "@/lib/config/data";
import { CACHE_TTL } from "@/lib/constants";
import { logger } from "@/lib/utils/logger";

import type {
  BTCSupply,
  BTCAnalytics,
} from "../shared/types";
import { BaseAssetService } from "../shared/utils/base-service";
import {
  formatTokenAmount,
  formatNumberWithCommas,
  calculatePercentage,
} from "../shared/utils/formatting";
import {
  executeGraphQLQuery,
} from "../shared/utils/graphql-helpers";

export class BitcoinService extends BaseAssetService {
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
   * Get total BTC supply across all sources
   */
  static async getBTCSupply(): Promise<BTCSupply> {
    const startTime = Date.now();

    try {
      return await this.fetchFromIndexer();
    } finally {
      this.logMetrics("getBTCSupply", startTime, true);
    }
  }

  /**
   * Fetch BTC supplies from Aptos indexer
   */
  private static async fetchFromIndexer(): Promise<BTCSupply> {
    logger.info("Fetching BTC supplies from Aptos indexer");

    // Batch all queries into a single request
    const query = `
      query GetAllBTCSupplies($xBTCAsset: String!, $sBTCCoin: String!, $aBTCCoin: String!, $BTCAsset: String!) {
        xBTC: current_fungible_asset_balances_aggregate(
          where: { 
            asset_type: { _eq: $xBTCAsset },
            amount: { _gt: "0" }
          }
        ) {
          aggregate {
            sum {
              amount
            }
          }
        }
        
        sBTC: current_coin_balances_aggregate(
          where: { 
            coin_type: { _eq: $sBTCCoin },
            amount: { _gt: "0" }
          }
        ) {
          aggregate {
            sum {
              amount
            }
          }
        }
        
        aBTC: current_coin_balances_aggregate(
          where: { 
            coin_type: { _eq: $aBTCCoin },
            amount: { _gt: "0" }
          }
        ) {
          aggregate {
            sum {
              amount
            }
          }
        }

        BTC: current_fungible_asset_balances_aggregate(
          where: { 
            asset_type: { _eq: $BTCAsset },
            amount: { _gt: "0" }
          }
        ) {
          aggregate {
            sum {
              amount
            }
          }
        }
      }
    `;

    try {
      const data = await executeGraphQLQuery<{
        xBTC: { aggregate: { sum: { amount: string | null } } };
        sBTC: { aggregate: { sum: { amount: string | null } } };
        aBTC: { aggregate: { sum: { amount: string | null } } };
        BTC: { aggregate: { sum: { amount: string | null } } };
      }>(query, {
        xBTCAsset: BTC_TOKENS.xBTC.asset_type,
        sBTCCoin: BTC_TOKENS.SBTC.asset_type,
        aBTCCoin: BTC_TOKENS.aBTC.asset_type,
        BTCAsset: "0x75de592a7e62e6224d13763c392190fda8635ebb79c798a5e9dd0840102f3f93",
      });

      const supplies = [
        {
          protocol: "xBTC",
          amount: parseFloat(data.xBTC?.aggregate?.sum?.amount || "0"),
          assetType: BTC_TOKENS.xBTC.asset_type,
          decimals: BTC_TOKENS.xBTC.decimals,
        },
        {
          protocol: "SBTC",
          amount: parseFloat(data.sBTC?.aggregate?.sum?.amount || "0"),
          assetType: BTC_TOKENS.SBTC.asset_type,
          decimals: BTC_TOKENS.SBTC.decimals,
        },
        {
          protocol: "aBTC",
          amount: parseFloat(data.aBTC?.aggregate?.sum?.amount || "0"),
          assetType: BTC_TOKENS.aBTC.asset_type,
          decimals: BTC_TOKENS.aBTC.decimals,
        },
        {
          protocol: "BTC",
          amount: parseFloat(data.BTC?.aggregate?.sum?.amount || "0"),
          assetType: "0x75de592a7e62e6224d13763c392190fda8635ebb79c798a5e9dd0840102f3f93",
          decimals: 8,
        },
      ];

      supplies.forEach((supply) => {
        logger.info(`${supply.protocol} supply: ${supply.amount}`);
      });

      return this.aggregateSupplies(supplies);
    } catch (error) {
      logger.error("Failed to fetch BTC supplies:", error);
      // Return empty supplies on error
      return this.aggregateSupplies([
        {
          protocol: "xBTC",
          amount: 0,
          assetType: BTC_TOKENS.xBTC.asset_type,
          decimals: BTC_TOKENS.xBTC.decimals,
        },
        {
          protocol: "SBTC",
          amount: 0,
          assetType: BTC_TOKENS.SBTC.asset_type,
          decimals: BTC_TOKENS.SBTC.decimals,
        },
        {
          protocol: "aBTC",
          amount: 0,
          assetType: BTC_TOKENS.aBTC.asset_type,
          decimals: BTC_TOKENS.aBTC.decimals,
        },
        {
          protocol: "BTC",
          amount: 0,
          assetType: "0x75de592a7e62e6224d13763c392190fda8635ebb79c798a5e9dd0840102f3f93",
          decimals: 8,
        },
      ]);
    }
  }

  /**
   * Aggregate supplies from multiple sources
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
      const formattedAmount = formatTokenAmount(supply.amount, supply.decimals);
      totalFormatted += formattedAmount;

      sources.push({
        protocol: supply.protocol,
        amount: supply.amount, // Keep raw amount
        rawAmount: supply.amount, // Add raw amount for clarity
        decimals: supply.decimals,
        formattedAmount: formattedAmount,
        displayAmount: formatNumberWithCommas(formattedAmount),
        percentage: 0,
      });
    }

    // Calculate percentages based on formatted amounts
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
