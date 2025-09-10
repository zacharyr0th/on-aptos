import { serviceLogger } from "@/lib/utils/core/logger";

// Simple price service interface
interface PriceService {
  getTokenPrice(tokenAddress: string): Promise<number | null>;
  getTokenPrices(tokenAddresses: string[]): Promise<Map<string, number>>;
}

import { AssetService } from "../portfolio/services/asset-service";

export class DefaultPriceService implements PriceService {
  private priceCache = new Map<string, { price: number; timestamp: number }>();
  private readonly CACHE_TTL = 60000; // 1 minute

  async getTokenPrice(tokenAddress: string): Promise<number | null> {
    // Hardcoded price for MKLP tokens
    if (tokenAddress.includes("::house_lp::MKLP") || tokenAddress.includes("::mklp::MKLP")) {
      const hardcodedPrice = 1.05;
      this.priceCache.set(tokenAddress, {
        price: hardcodedPrice,
        timestamp: Date.now(),
      });
      return hardcodedPrice;
    }

    // Hardcoded price for THALA-LP tokens (Thala Farm LP tokens)
    if (tokenAddress === "0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d") {
      const hardcodedPrice = 1.5; // Estimated LP token price
      this.priceCache.set(tokenAddress, {
        price: hardcodedPrice,
        timestamp: Date.now(),
      });
      return hardcodedPrice;
    }

    // Check cache first
    const cached = this.priceCache.get(tokenAddress);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.price;
    }

    try {
      const priceData = await AssetService.getAssetPrices([tokenAddress]);
      const price = priceData[0]?.price;

      if (price !== null && price !== undefined) {
        this.priceCache.set(tokenAddress, { price, timestamp: Date.now() });
        return price;
      }

      return null;
    } catch (error) {
      serviceLogger.warn(`Failed to fetch price for ${tokenAddress}:`, error);
      return null;
    }
  }

  async getTokenPrices(tokenAddresses: string[]): Promise<Map<string, number>> {
    const priceMap = new Map<string, number>();

    // Handle hardcoded MKLP prices first
    const hardcodedPrices = new Map<string, number>();
    const remainingAddresses: string[] = [];

    for (const address of tokenAddresses) {
      if (address.includes("::house_lp::MKLP") || address.includes("::mklp::MKLP")) {
        const hardcodedPrice = 1.05;
        priceMap.set(address, hardcodedPrice);
        hardcodedPrices.set(address, hardcodedPrice);
        // Cache the hardcoded price
        this.priceCache.set(address, {
          price: hardcodedPrice,
          timestamp: Date.now(),
        });
      } else if (address === "0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d") {
        const hardcodedPrice = 1.5;
        priceMap.set(address, hardcodedPrice);
        hardcodedPrices.set(address, hardcodedPrice);
        // Cache the hardcoded price
        this.priceCache.set(address, {
          price: hardcodedPrice,
          timestamp: Date.now(),
        });
      } else {
        remainingAddresses.push(address);
      }
    }

    if (remainingAddresses.length === 0) {
      return priceMap;
    }

    try {
      const priceData = await AssetService.getAssetPrices(remainingAddresses);

      for (const data of priceData) {
        if (data.price !== null && data.price !== undefined) {
          priceMap.set(data.assetType, data.price);
          // Cache individual prices
          this.priceCache.set(data.assetType, {
            price: data.price,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      serviceLogger.warn("Failed to fetch batch prices:", error);
    }

    return priceMap;
  }
}
