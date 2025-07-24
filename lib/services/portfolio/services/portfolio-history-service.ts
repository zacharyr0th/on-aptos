import { logger } from '@/lib/utils/logger';

import { DECIMALS } from '../constants';
import type { PortfolioHistoryPoint, FungibleAsset } from '../types';
import { formatBalance } from '../utils/decimal-converter';

import { AssetService } from './asset-service';
import { TransactionService } from './transaction-service';

export class PortfolioHistoryService {
  static async getPortfolioHistory(
    address: string,
    days: number = 30
  ): Promise<PortfolioHistoryPoint[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Get historical activities
      const { fungibleActivities, coinActivities } =
        await TransactionService.getHistoricalActivities(
          address,
          startDate.toISOString()
        );

      // Get current portfolio
      const currentAssets = await AssetService.getWalletAssets(address);

      // Generate daily snapshots
      const history: PortfolioHistoryPoint[] = [];

      for (let d = 0; d <= days; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + d);

        const portfolio = await this.reconstructPortfolioAtDate(
          currentAssets,
          fungibleActivities,
          coinActivities,
          date
        );

        history.push(portfolio);
      }

      return history;
    } catch (error) {
      logger.error('Failed to get portfolio history:', error);
      throw error;
    }
  }

  private static async reconstructPortfolioAtDate(
    currentAssets: FungibleAsset[],
    fungibleActivities: any[],
    coinActivities: any[],
    targetDate: Date
  ): Promise<PortfolioHistoryPoint> {
    const assetBalances = new Map<string, number>();

    // Initialize with current balances
    currentAssets.forEach(asset => {
      assetBalances.set(asset.asset_type, asset.balance || 0);
    });

    // Reverse apply activities after target date
    const activitiesAfterDate = [
      ...fungibleActivities.filter(
        a => new Date(a.transaction_timestamp) > targetDate
      ),
      ...coinActivities.filter(
        a => new Date(a.transaction_timestamp) > targetDate
      ),
    ].sort(
      (a, b) =>
        new Date(b.transaction_timestamp).getTime() -
        new Date(a.transaction_timestamp).getTime()
    );

    activitiesAfterDate.forEach(activity => {
      const assetType = activity.asset_type || activity.coin_type;
      const amount = parseFloat(activity.amount);
      const currentBalance = assetBalances.get(assetType) || 0;

      // Reverse the activity
      if (activity.type === 'deposit' || activity.activity_type === 'deposit') {
        assetBalances.set(assetType, currentBalance - amount);
      } else if (
        activity.type === 'withdraw' ||
        activity.activity_type === 'withdraw'
      ) {
        assetBalances.set(assetType, currentBalance + amount);
      }
    });

    // Get historical prices (would need a price history service)
    const prices = await this.getHistoricalPrices(
      Array.from(assetBalances.keys()),
      targetDate
    );

    // Calculate portfolio value
    let totalValue = 0;
    const assets: PortfolioHistoryPoint['assets'] = [];

    assetBalances.forEach((balance, assetType) => {
      if (balance > 0) {
        const price = prices.get(assetType) || 0;
        const value = balance * price;
        totalValue += value;

        assets.push({
          assetType,
          symbol:
            currentAssets.find(a => a.asset_type === assetType)?.metadata
              ?.symbol || '',
          balance,
          value,
          price,
        });
      }
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      totalValue,
      assets,
    };
  }

  private static async getHistoricalPrices(
    assetTypes: string[],
    date: Date
  ): Promise<Map<string, number>> {
    // TODO: Implement historical price fetching
    // For now, return current prices as placeholder
    const prices = new Map<string, number>();

    try {
      const priceData = await AssetService.getAssetPrices(assetTypes);
      priceData.forEach(price => {
        if (price.price !== null) {
          prices.set(price.assetType, price.price);
        }
      });
    } catch (error) {
      logger.warn('Failed to get historical prices, using defaults', error);
    }

    return prices;
  }
}
