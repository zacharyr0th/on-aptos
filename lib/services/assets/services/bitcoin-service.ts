import { logger } from '@/lib/utils/logger';
import { BaseAssetService } from '../utils/base-service';
import {
  executeGraphQLQuery,
  getCoinSupply,
  getFungibleAssetSupply,
} from '../utils/graphql-helpers';
import {
  formatTokenAmount,
  formatNumberWithCommas,
  calculatePercentage,
} from '../utils/formatting';
import { CACHE_TTL, DECIMALS, TOKEN_ADDRESSES } from '../constants';
import type {
  BTCSupply,
  BTCAnalytics,
  FarmingAPR,
  AssetSupply,
} from '../types';
import { BTC_ASSETS, BTC_TOKENS } from '@/lib/config/data';

export class BitcoinService extends BaseAssetService {
  /**
   * Get BTC supply analytics
   */
  static async getBTCAnalytics(forceRefresh = false): Promise<BTCAnalytics> {
    const cacheKey = 'btc:analytics';

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
      forceRefresh ? 0 : CACHE_TTL.BTC_SUPPLY
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
      this.logMetrics('getBTCSupply', startTime, true);
    }
  }

  /**
   * Fetch BTC supplies from Aptos indexer
   */
  private static async fetchFromIndexer(): Promise<BTCSupply> {
    logger.info('Fetching BTC supplies from Aptos indexer');

    const supplies = [];

    // Fetch xBTC supply (fungible asset)
    try {
      const xBTCSupply = await this.getTotalSupplyForAsset(
        BTC_TOKENS.xBTC.asset_type
      );
      logger.info(`xBTC supply: ${xBTCSupply}`);
      supplies.push({
        protocol: 'xBTC',
        amount: xBTCSupply,
        assetType: BTC_TOKENS.xBTC.asset_type,
        decimals: BTC_TOKENS.xBTC.decimals,
      });
    } catch (error) {
      logger.error('Failed to fetch xBTC supply:', error);
      supplies.push({
        protocol: 'xBTC',
        amount: 0,
        assetType: BTC_TOKENS.xBTC.asset_type,
        decimals: BTC_TOKENS.xBTC.decimals,
      });
    }

    // Fetch SBTC supply (coin type - needs different handling)
    try {
      const sbtcSupply = await this.getTotalSupplyForCoin(
        BTC_TOKENS.SBTC.asset_type
      );
      logger.info(`SBTC supply: ${sbtcSupply}`);
      supplies.push({
        protocol: 'SBTC',
        amount: sbtcSupply,
        assetType: BTC_TOKENS.SBTC.asset_type,
        decimals: BTC_TOKENS.SBTC.decimals,
      });
    } catch (error) {
      logger.error('Failed to fetch SBTC supply:', error);
      supplies.push({
        protocol: 'SBTC',
        amount: 0,
        assetType: BTC_TOKENS.SBTC.asset_type,
        decimals: BTC_TOKENS.SBTC.decimals,
      });
    }

    // Fetch aBTC supply (coin type - needs different handling)
    try {
      const aBTCSupply = await this.getTotalSupplyForCoin(
        BTC_TOKENS.aBTC.asset_type
      );
      logger.info(`aBTC supply: ${aBTCSupply}`);
      supplies.push({
        protocol: 'aBTC',
        amount: aBTCSupply,
        assetType: BTC_TOKENS.aBTC.asset_type,
        decimals: BTC_TOKENS.aBTC.decimals,
      });
    } catch (error) {
      logger.error('Failed to fetch aBTC supply:', error);
      supplies.push({
        protocol: 'aBTC',
        amount: 0,
        assetType: BTC_TOKENS.aBTC.asset_type,
        decimals: BTC_TOKENS.aBTC.decimals,
      });
    }

    return this.aggregateSupplies(supplies);
  }

  /**
   * Get total supply for a fungible asset by summing all balances
   */
  private static async getTotalSupplyForAsset(
    assetType: string
  ): Promise<number> {
    const query = `
      query GetFungibleAssetTotalSupply($assetType: String!) {
        current_fungible_asset_balances_aggregate(
          where: { 
            asset_type: { _eq: $assetType },
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

    const data = await executeGraphQLQuery<{
      current_fungible_asset_balances_aggregate: {
        aggregate: {
          sum: {
            amount: string | null;
          };
        };
      };
    }>(query, { assetType });

    const totalSupply =
      data.current_fungible_asset_balances_aggregate?.aggregate?.sum?.amount ||
      '0';
    return parseFloat(totalSupply);
  }

  /**
   * Get total supply for a coin type
   */
  private static async getTotalSupplyForCoin(
    coinType: string
  ): Promise<number> {
    const query = `
      query GetCoinTotalSupply($coinType: String!) {
        current_coin_balances_aggregate(
          where: { 
            coin_type: { _eq: $coinType },
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

    const data = await executeGraphQLQuery<{
      current_coin_balances_aggregate: {
        aggregate: {
          sum: {
            amount: string | null;
          };
        };
      };
    }>(query, { coinType });

    const totalSupply =
      data.current_coin_balances_aggregate?.aggregate?.sum?.amount || '0';
    return parseFloat(totalSupply);
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
    }>
  ): BTCSupply {
    const sources = [];
    let total = 0;
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
    sources.forEach(source => {
      source.percentage = calculatePercentage(
        source.formattedAmount,
        totalFormatted
      );
    });

    return {
      total: totalFormatted,
      totalRaw: sources.reduce((sum, s) => sum + s.amount, 0),
      sources: sources.sort((a, b) => b.formattedAmount - a.formattedAmount),
    };
  }
}
