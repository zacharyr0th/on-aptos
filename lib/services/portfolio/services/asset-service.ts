import {
  getProtocolByAddress,
  getProtocolLabel,
  isPhantomAsset,
} from "@/lib/protocol-registry";
import { logger } from "@/lib/utils/logger";

import { DECIMALS } from "../constants";
import type { FungibleAsset, AssetPrice } from "../types";
import {
  isScamToken,
  isLegitimateStablecoin,
} from "../utils/asset-validators";
import { formatBalance, calculateValue } from "../utils/decimal-converter";
import { QUERIES } from "../utils/graphql-helpers";
import { PriceAggregator } from "../utils/price-aggregator";

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

      const response = await fetch(
        "https://api.mainnet.aptoslabs.com/v1/graphql",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: QUERIES.WALLET_ASSETS,
            variables: { ownerAddress: address },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          `GraphQL errors: ${result.errors.map((e: any) => e.message).join(", ")}`,
        );
      }

      // Get current balances only (removed unnecessary metadata fetch)
      const balances = result.data.current_fungible_asset_balances || [];

      logger.info(
        `[AssetService] Found ${balances.length} assets with balances`,
      );

      // Process only assets with balances
      const assetMap = new Map<string, any>();

      balances.forEach((balance: any) => {
        assetMap.set(balance.asset_type, {
          ...balance,
          hasBalance: true,
        });
      });

      // Convert map to array, but only include assets with actual balances for the wallet
      const assets = Array.from(assetMap.values()).filter(
        (asset) => asset.hasBalance,
      );

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

      // Fetch prices for all assets with error handling
      let priceData = new Map<string, any>();
      try {
        const fetchedPrices = await PriceAggregator.getBatchPrices(
          uniqueAssetTypes as string[],
        );
        // Ensure we got a Map back
        if (fetchedPrices && typeof fetchedPrices.get === "function") {
          priceData = fetchedPrices;
          logger.info(
            `[AssetService] Successfully fetched prices, got Map with ${priceData.size} entries`,
          );
        } else {
          logger.warn(
            "[AssetService] PriceAggregator returned invalid data, using empty Map",
          );
          priceData = new Map();
        }
      } catch (priceError) {
        logger.warn(
          "Price fetching failed, continuing without prices:",
          priceError,
        );
        // Continue without prices if the price service fails
        priceData = new Map(); // Ensure it's a Map
      }

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
                protocolLabel: getProtocolLabel(asset.asset_type) || "",
                protocolType: protocol.type as string,
                isPhantomAsset: isPhantomAsset(
                  asset.asset_type,
                  asset.metadata,
                ),
              }
            : undefined;

          const fungibleAsset: FungibleAsset = {
            asset_type: asset.asset_type,
            amount: asset.amount,
            metadata: asset.metadata,
            balance,
            price: price?.price ?? 0, // Show 0 for tokens without prices
            value: calculateValue(balance, price?.price ?? 0),
            isVerified: await AssetService.verifyAsset(asset, balance),
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
      const priceData = await PriceAggregator.getBatchPrices(assetTypes);

      return assetTypes.map((assetType) => {
        const price = priceData.get(assetType);
        return {
          assetType,
          symbol: "", // Symbol should be provided by caller or fetched separately
          price: price?.price ?? null, // Preserve null to indicate unavailable
          change24h: price?.change24h || 0,
          marketCap: price?.marketCap,
        };
      });
    } catch (error) {
      logger.error("Failed to fetch asset prices:", error);
      return assetTypes.map((assetType) => ({
        assetType,
        symbol: "",
        price: null, // Return null to indicate unavailable
        change24h: 0,
      }));
    }
  }

  private static async verifyAsset(
    asset: { asset_type: string; metadata?: { symbol?: string } },
    balance: number,
  ): Promise<boolean> {
    // Check if it's a scam token
    if (isScamToken(asset.asset_type, asset.metadata?.symbol)) {
      return false;
    }

    // Verify stablecoins
    if (AssetService.isStablecoin(asset.asset_type, asset.metadata?.symbol)) {
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

    const stablecoinSymbols = ["USDT", "USDC", "BUSD", "DAI", "TUSD", "USDD"];
    const upperSymbol = symbol.toUpperCase();

    return (
      stablecoinSymbols.includes(upperSymbol) ||
      assetType.toLowerCase().includes("usdt") ||
      assetType.toLowerCase().includes("usdc") ||
      assetType.toLowerCase().includes("usd")
    );
  }

  private static isFakeAPT(assetType: string, symbol?: string): boolean {
    if (
      symbol?.toUpperCase() === "APT" ||
      assetType.toLowerCase().includes("apt")
    ) {
      // Real APT is 0x1::aptos_coin::AptosCoin
      return !assetType.includes("0x1::aptos_coin::AptosCoin");
    }
    return false;
  }

  private static hasScamIndicators(
    assetType: string,
    symbol?: string,
    balance?: number,
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
      (pattern) => pattern.test(assetType) || (symbol && pattern.test(symbol)),
    );

    // Check for suspiciously high balance
    const hasSuspiciousBalance = balance && balance > 1000000;

    return hasScamPattern || !!hasSuspiciousBalance;
  }
}
