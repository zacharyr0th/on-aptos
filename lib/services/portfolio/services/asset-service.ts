import { logger } from '@/lib/utils/logger';
import { PanoraService } from '../panora-service';
import { PhantomAssetDetectionService } from '../phantom-detection';
import {
  getProtocolByAddress,
  getProtocolLabel,
  isPhantomAsset,
  shouldShowProtocolBadge,
} from '@/lib/protocol-registry';
import {
  LEGITIMATE_STABLECOINS,
  SCAM_TOKENS,
  AptosValidators,
} from '@/lib/constants';
import { executeGraphQLQuery, QUERIES } from '../utils/graphql-helpers';
import { formatBalance, calculateValue } from '../utils/decimal-converter';
import {
  isScamToken,
  isLegitimateStablecoin,
  shouldDisplayAsset,
} from '../utils/asset-validators';
import { PriceAggregator } from '../utils/price-aggregator';
import type { FungibleAsset, AssetPrice } from '../types';
import { DECIMALS, THRESHOLDS } from '../constants';

export class AssetService {
  static async getWalletAssets(address: string): Promise<FungibleAsset[]> {
    try {
      // Use direct fetch like the working script
      const response = await fetch(
        'https://api.mainnet.aptoslabs.com/v1/graphql',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: QUERIES.WALLET_ASSETS,
            variables: { ownerAddress: address },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          `GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      const assets = result.data.current_fungible_asset_balances || [];

      // Get unique asset types for price fetching
      const uniqueAssetTypes = [
        ...new Set(assets.map((a: any) => a.asset_type)),
      ];

      // Fetch prices for all assets
      const priceData = await PriceAggregator.getBatchPrices(
        uniqueAssetTypes as string[]
      );

      // Process and enrich assets
      const processedAssets = await Promise.all(
        assets.map(async (asset: any) => {
          const decimals = asset.metadata?.decimals || DECIMALS.DEFAULT;
          const balance = formatBalance(asset.amount, decimals);

          // Get price data
          const price = priceData.get(asset.asset_type);

          // Calculate protocol info
          const protocol = getProtocolByAddress(asset.asset_type);
          const protocolInfo = protocol
            ? {
                protocol: protocol.name,
                protocolLabel: getProtocolLabel(asset.asset_type) || '',
                protocolType: protocol.type as string,
                isPhantomAsset: isPhantomAsset(
                  asset.asset_type,
                  asset.metadata
                ),
              }
            : undefined;

          const fungibleAsset: FungibleAsset = {
            asset_type: asset.asset_type,
            amount: asset.amount,
            metadata: asset.metadata,
            balance,
            price: price?.price ?? 0, // Use nullish coalescing to preserve null
            value: calculateValue(balance, price?.price ?? 0),
            isVerified: await this.verifyAsset(asset, balance),
            protocolInfo,
            is_frozen: asset.is_frozen,
            is_primary: asset.is_primary,
            last_transaction_timestamp: asset.last_transaction_timestamp,
            last_transaction_version: asset.last_transaction_version,
            token_standard: asset.token_standard,
          };

          return fungibleAsset;
        })
      );

      // Return ALL assets without any filtering
      return processedAssets;
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'UnknownError',
        address,
        timestamp: new Date().toISOString(),
      };
      
      logger.error('Failed to fetch wallet assets:', errorDetails);
      logger.error('AssetService full error object:', error);
      
      // Re-throw with more context
      throw new Error(`AssetService.getWalletAssets failed: ${errorDetails.message}`);
    }
  }

  static async getAssetPrices(assetTypes: string[]): Promise<AssetPrice[]> {
    try {
      const priceData = await PriceAggregator.getBatchPrices(assetTypes);

      return assetTypes.map(assetType => {
        const price = priceData.get(assetType);
        return {
          assetType,
          symbol: '', // Symbol should be provided by caller or fetched separately
          price: price?.price ?? null, // Preserve null to indicate unavailable
          change24h: price?.change24h || 0,
          marketCap: price?.marketCap,
        };
      });
    } catch (error) {
      logger.error('Failed to fetch asset prices:', error);
      return assetTypes.map(assetType => ({
        assetType,
        symbol: '',
        price: null, // Return null to indicate unavailable
        change24h: 0,
      }));
    }
  }

  private static async verifyAsset(
    asset: { asset_type: string; metadata?: { symbol?: string } },
    balance: number
  ): Promise<boolean> {
    // Check if it's a scam token
    if (isScamToken(asset.asset_type, asset.metadata?.symbol)) {
      return false;
    }

    // Verify stablecoins
    if (this.isStablecoin(asset.asset_type, asset.metadata?.symbol)) {
      return isLegitimateStablecoin(asset.asset_type);
    }

    // Check for fake APT
    if (this.isFakeAPT(asset.asset_type, asset.metadata?.symbol)) {
      return false;
    }

    // Additional validation can be added here
    return true;
  }

  private static isStablecoin(assetType: string, symbol?: string): boolean {
    if (!symbol) return false;

    const stablecoinSymbols = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDD'];
    const upperSymbol = symbol.toUpperCase();

    return (
      stablecoinSymbols.includes(upperSymbol) ||
      assetType.toLowerCase().includes('usdt') ||
      assetType.toLowerCase().includes('usdc') ||
      assetType.toLowerCase().includes('usd')
    );
  }

  private static isFakeAPT(assetType: string, symbol?: string): boolean {
    if (
      symbol?.toUpperCase() === 'APT' ||
      assetType.toLowerCase().includes('apt')
    ) {
      // Real APT is 0x1::aptos_coin::AptosCoin
      return !assetType.includes('0x1::aptos_coin::AptosCoin');
    }
    return false;
  }

  private static hasScamIndicators(
    assetType: string,
    symbol?: string,
    balance?: number
  ): boolean {
    const scamPatterns = [
      /test/i,
      /fake/i,
      /scam/i,
      /airdrop/i,
      /reward/i,
      /bonus/i,
      /gift/i,
      /claim/i,
    ];

    const hasScamPattern = scamPatterns.some(
      pattern => pattern.test(assetType) || (symbol && pattern.test(symbol))
    );

    // Check for suspiciously high balance
    const hasSuspiciousBalance = balance && balance > 1000000;

    return hasScamPattern || !!hasSuspiciousBalance;
  }
}
