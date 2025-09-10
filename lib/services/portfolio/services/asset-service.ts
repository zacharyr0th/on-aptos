import { ENDPOINTS } from "@/lib/constants";
import { graphQLRequest } from "@/lib/utils/api/fetch-utils";
import { logger } from "@/lib/utils/core/logger";
import { UnifiedAssetValidator, UnifiedDecimalUtils, UnifiedPriceService } from "../shared";
import type { AssetPrice, FungibleAsset } from "../types";

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

      // Use parameterized GraphQL query for better performance and safety
      const query = `
        query GetWalletAssets($owner_address: String!) {
          current_fungible_asset_balances(
            where: { 
              owner_address: { _eq: $owner_address }, 
              amount: { _gt: "0" } 
            }
          ) {
            amount
            asset_type
            is_frozen
            is_primary
            last_transaction_timestamp
            last_transaction_version
            token_standard
            metadata {
              name
              symbol
              decimals
              icon_uri
            }
          }
        }
      `;

      const result = await graphQLRequest<{
        current_fungible_asset_balances: any[];
      }>(
        ENDPOINTS.APTOS_INDEXER,
        {
          query,
          variables: { owner_address: address },
        },
        { headers }
      );

      const faBalances = result.current_fungible_asset_balances || [];

      logger.info(`[AssetService] Found ${faBalances.length} fungible asset balances`);

      // Process fungible asset balances directly
      const assets = faBalances.map((balance: any) => ({
        ...balance,
        hasBalance: true,
      }));

      logger.info(`[AssetService] Processing ${assets.length} assets with balances for wallet`);

      if (assets.length === 0) {
        logger.info(`[AssetService] No assets with balances found for address: ${address}`);
        return [];
      }

      // Get unique asset types for price fetching
      const uniqueAssetTypes = [...new Set(assets.map((a: any) => a.asset_type))];

      logger.info(
        `[AssetService] Fetching prices for ${uniqueAssetTypes.length} unique asset types`
      );

      // Fetch prices using unified price service with improved batch processing
      let priceData = new Map<string, any>();
      try {
        logger.info(`[AssetService] Fetching batch prices for ${uniqueAssetTypes.length} assets`);

        // Use batch price fetching for better performance
        priceData = await UnifiedPriceService.getBatchPrices(uniqueAssetTypes);

        logger.info(
          `[AssetService] Successfully fetched ${priceData.size} prices from ${uniqueAssetTypes.length} requested`
        );

        // Log which assets didn't get prices for debugging
        const missingPrices = uniqueAssetTypes.filter((assetType) => !priceData.has(assetType));
        if (missingPrices.length > 0) {
          logger.debug(
            `[AssetService] Assets without prices: ${missingPrices
              .slice(0, 5)
              .map(
                (addr) =>
                  assets.find((a) => a.asset_type === addr)?.metadata?.symbol || addr.slice(-8)
              )
              .join(
                ", "
              )}${missingPrices.length > 5 ? ` and ${missingPrices.length - 5} more` : ""}`
          );
        }
      } catch (priceError) {
        logger.warn("Batch price fetching failed, continuing without prices:", priceError);
        priceData = new Map();
      }

      // Get Panora token metadata to enrich assets
      const { UnifiedPanoraService } = await import("../unified-panora-service");
      const panoraTokens = await UnifiedPanoraService.getAllTokens(false);
      const tokenMap = new Map<string, any>();

      panoraTokens.forEach((token) => {
        if (token.faAddress) tokenMap.set(token.faAddress, token);
        if (token.tokenAddress) tokenMap.set(token.tokenAddress, token);
      });

      // Process and enrich assets with prices and metadata
      const processedAssets = await Promise.all(
        assets.map(async (asset: any) => {
          const formattedBalance = UnifiedDecimalUtils.formatBalance(
            asset.amount,
            asset.asset_type,
            asset.metadata?.symbol,
            { decimals: asset.metadata?.decimals }
          );
          const balance = formattedBalance.formatted;

          // Get price data
          const price = priceData.get(asset.asset_type);

          // Get Panora token metadata
          const panoraToken = tokenMap.get(asset.asset_type);

          // Debug log for each asset
          if (asset.metadata?.symbol) {
            logger.debug(`[AssetService] Processing asset ${asset.metadata.symbol}:`, {
              balance,
              price: price?.price ?? 0,
              hasPrice: !!price,
              hasPanoraData: !!panoraToken,
            });
          }

          // Calculate value using unified utilities
          const tokenValue = UnifiedDecimalUtils.calculateTokenValue(balance, price?.price ?? 0);

          // Validate asset using unified validator
          const validation = UnifiedAssetValidator.validateAsset(
            asset.asset_type,
            asset.metadata?.symbol,
            balance
          );

          // Enrich metadata with Panora data if available
          const enrichedMetadata = {
            ...asset.metadata,
            ...(panoraToken && {
              name: panoraToken.name || asset.metadata?.name,
              symbol: panoraToken.symbol || asset.metadata?.symbol,
              decimals: panoraToken.decimals || asset.metadata?.decimals,
              icon_uri: panoraToken.logoUrl || asset.metadata?.icon_uri,
            }),
          };

          const fungibleAsset: FungibleAsset & {
            logoUrl?: string;
            panoraTags?: string[];
            isVerified?: boolean;
          } = {
            asset_type: asset.asset_type,
            amount: asset.amount,
            metadata: enrichedMetadata,
            balance,
            price: price?.price ?? 0,
            value: tokenValue.value,
            isVerified: panoraToken?.isVerified || validation.isVerified,
            logoUrl: panoraToken?.logoUrl,
            panoraTags: panoraToken?.panoraTags || [],
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
      logger.info(
        `[AssetService] Returning ${processedAssets.length} processed assets for address ${address}`
      );

      // Debug: Log the first few assets being returned
      if (processedAssets.length > 0) {
        logger.debug("[AssetService] Sample of assets being returned:", {
          count: processedAssets.length,
          firstAsset: {
            symbol: processedAssets[0].metadata?.symbol,
            value: processedAssets[0].value,
            price: processedAssets[0].price,
            balance: processedAssets[0].balance,
          },
          totalValue: processedAssets.reduce((sum, a) => sum + (a.value || 0), 0),
        });
      }

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
      throw new Error(`AssetService.getWalletAssets failed: ${errorDetails.message}`);
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
