import { ENDPOINTS } from "@/lib/constants";
import {
  getProtocolByAddress,
  getProtocolLabel,
  isPhantomAsset,
} from "@/lib/constants/protocols/protocol-registry";
import { graphQLRequest } from "@/lib/utils/api/fetch-utils";
import { logger } from "@/lib/utils/core/logger";

import {
  UnifiedPriceService,
  UnifiedDecimalUtils,
  UnifiedAssetValidator,
} from "../shared";
import type { FungibleAsset, AssetPrice } from "../types";

export class AssetService {
  static async getWalletAssets(address: string): Promise<FungibleAsset[]> {
    try {
      // Use direct fetch like the working script
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add auth if available
      const apiKey = process.env.APTOS_BUILD_SECRET;
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      // Direct GraphQL request with working query format (bypassing the problematic parametrized query)
      const directQuery = `query { current_fungible_asset_balances(where: { owner_address: { _eq: "${address}" }, amount: { _gt: "0" } }) { amount asset_type is_frozen is_primary last_transaction_timestamp last_transaction_version token_standard metadata { name symbol decimals icon_uri } } }`;

      const result = await graphQLRequest<{
        current_fungible_asset_balances: any[];
      }>(ENDPOINTS.APTOS_INDEXER, { query: directQuery }, { headers });

      const faBalances = result.current_fungible_asset_balances || [];

      logger.info(
        `[AssetService] Found ${faBalances.length} fungible asset balances`,
      );

      // Process fungible asset balances directly
      const assets = faBalances.map((balance: any) => ({
        ...balance,
        hasBalance: true,
      }));

      logger.info(
        `[AssetService] Processing ${assets.length} assets with balances for wallet`,
      );

      if (assets.length === 0) {
        logger.info(
          `[AssetService] No assets with balances found for address: ${address}`,
        );
        return [];
      }

      // Get unique asset types for price fetching
      const uniqueAssetTypes = [
        ...new Set(assets.map((a: any) => a.asset_type)),
      ];

      logger.info(
        `[AssetService] Fetching prices for ${uniqueAssetTypes.length} unique asset types`,
      );

      // Fetch prices using unified price service (using individual calls as batch is failing)
      let priceData = new Map<string, any>();
      try {
        logger.info(
          `[AssetService] Fetching individual prices for ${uniqueAssetTypes.length} assets`,
        );

        const pricePromises = uniqueAssetTypes.map(async (assetType) => {
          try {
            const price = await UnifiedPriceService.getAssetPrice(assetType);
            return { assetType, price };
          } catch (error) {
            logger.warn(
              `Individual price fetch failed for ${assetType}:`,
              error,
            );
            return { assetType, price: null };
          }
        });

        const priceResults = await Promise.allSettled(pricePromises);

        priceResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value.price) {
            priceData.set(result.value.assetType, result.value.price);
          }
        });

        logger.info(
          `[AssetService] Successfully fetched prices, got ${priceData.size} entries`,
        );
      } catch (priceError) {
        logger.warn(
          "Price fetching failed, continuing without prices:",
          priceError,
        );
        priceData = new Map();
      }

      // Process and enrich assets
      const processedAssets = await Promise.all(
        assets.map(async (asset: any) => {
          const formattedBalance = UnifiedDecimalUtils.formatBalance(
            asset.amount,
            asset.asset_type,
            asset.metadata?.symbol,
          );
          const balance = formattedBalance.formatted;

          // Get price data
          const price = priceData.get(asset.asset_type);

          // Calculate protocol info
          const protocol = getProtocolByAddress(asset.asset_type);
          const protocolInfo = protocol
            ? {
                protocol: protocol.name,
                protocolLabel: getProtocolLabel(asset.asset_type) || "",
                protocolType: protocol.type as string,
                isPhantomAsset: isPhantomAsset(
                  asset.asset_type,
                  asset.metadata,
                ),
              }
            : undefined;

          // Calculate value using unified utilities
          const tokenValue = UnifiedDecimalUtils.calculateTokenValue(
            balance,
            price?.price ?? 0,
          );

          // Validate asset using unified validator
          const validation = UnifiedAssetValidator.validateAsset(
            asset.asset_type,
            asset.metadata?.symbol,
            balance,
          );

          const fungibleAsset: FungibleAsset = {
            asset_type: asset.asset_type,
            amount: asset.amount,
            metadata: asset.metadata,
            balance,
            price: price?.price ?? 0,
            value: tokenValue.value,
            isVerified: validation.isVerified,
            protocolInfo,
            is_frozen: asset.is_frozen,
            is_primary: asset.is_primary,
            last_transaction_timestamp: asset.last_transaction_timestamp,
            last_transaction_version: asset.last_transaction_version,
            token_standard: asset.token_standard,
          };

          return fungibleAsset;
        }),
      );

      // Return ALL assets without any filtering
      return processedAssets;
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : "UnknownError",
        address,
        timestamp: new Date().toISOString(),
      };

      logger.error("Failed to fetch wallet assets:", errorDetails);
      logger.error("AssetService full error object:", error);

      // Re-throw with more context
      throw new Error(
        `AssetService.getWalletAssets failed: ${errorDetails.message}`,
      );
    }
  }

  static async getAssetPrices(assetTypes: string[]): Promise<AssetPrice[]> {
    try {
      return await UnifiedPriceService.getAssetPrices(assetTypes);
    } catch (error) {
      logger.error("Failed to fetch asset prices:", error);
      return assetTypes.map((assetType) => ({
        assetType,
        symbol: "",
        price: null,
        change24h: 0,
      }));
    }
  }

  // Removed redundant validation methods - now using UnifiedAssetValidator
}
