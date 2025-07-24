import { DeFiPositionProvider } from '../DeFiPositionProvider';
import {
  AdapterContext,
  Logger,
  PriceService,
  CacheService,
} from '../interfaces/adapter';
import { AdapterConfig } from '../types';
import { ThalaAdapter } from '../adapters/ThalaAdapter';
import { GenericTokenAdapter } from '../adapters/GenericTokenAdapter';
import { AssetService } from '../../portfolio/services/asset-service';
import { serviceLogger } from '@/lib/utils/logger';

export interface DeFiProviderConfig {
  indexerUrl?: string;
  apiKey?: string;
  priceService?: PriceService;
  cacheService?: CacheService;
  logger?: Logger;
  adapterConfigs?: Record<string, Partial<AdapterConfig>>;
  enabledAdapters?: string[];
}

export class DeFiProviderFactory {
  static createProvider(config: DeFiProviderConfig): DeFiPositionProvider {
    // Create context
    const context: AdapterContext = {
      walletAddress: '', // Will be set during scan
      indexerUrl:
        config.indexerUrl || 'https://indexer.mainnet.aptoslabs.com/v1',
      apiKey: config.apiKey,
      priceService: config.priceService || new DefaultPriceService(),
      cacheService: config.cacheService,
      logger: config.logger || new DefaultLogger(),
    };

    // Create provider
    const provider = new DeFiPositionProvider(context);

    // Register default adapters
    this.registerDefaultAdapters(provider, config);

    return provider;
  }

  private static registerDefaultAdapters(
    provider: DeFiPositionProvider,
    config: DeFiProviderConfig
  ): void {
    const enabledAdapters = config.enabledAdapters || [
      'thala-adapter',
      'generic-token-adapter',
    ];

    // Thala Adapter
    if (enabledAdapters.includes('thala-adapter')) {
      const thalaConfig = config.adapterConfigs?.['thala-adapter'] || {};
      const thalaAdapter = new ThalaAdapter(thalaConfig);
      provider.registerAdapter(thalaAdapter);
    }

    // Generic Token Adapter (usually lowest priority)
    if (enabledAdapters.includes('generic-token-adapter')) {
      const genericConfig = {
        priority: 10, // Low priority
        ...config.adapterConfigs?.['generic-token-adapter'],
      };
      const genericAdapter = new GenericTokenAdapter(genericConfig);
      provider.registerAdapter(genericAdapter);
    }

    // Add more adapters as needed
  }

  static async createAndInitialize(
    config: DeFiProviderConfig
  ): Promise<DeFiPositionProvider> {
    const provider = this.createProvider(config);
    await provider.initializeAllAdapters();
    return provider;
  }
}

// Default implementations for services
class DefaultPriceService implements PriceService {
  private priceCache = new Map<string, { price: number; timestamp: number }>();
  private readonly CACHE_TTL = 60000; // 1 minute

  async getTokenPrice(tokenAddress: string): Promise<number | null> {
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

    try {
      const priceData = await AssetService.getAssetPrices(tokenAddresses);

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
      serviceLogger.warn('Failed to fetch batch prices:', error);
    }

    return priceMap;
  }
}

class DefaultLogger implements Logger {
  info(message: string, data?: any): void {
    serviceLogger.info(`${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  warn(message: string, data?: any): void {
    serviceLogger.warn(
      `${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    );
  }

  error(message: string, error?: any): void {
    serviceLogger.error(`${message}`, error);
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      serviceLogger.debug(
        `${message}`,
        data ? JSON.stringify(data, null, 2) : ''
      );
    }
  }
}

// Utility function for quick setup
export function createDeFiProvider(
  options: {
    apiKey?: string;
    enabledAdapters?: string[];
    logger?: Logger;
  } = {}
): DeFiPositionProvider {
  return DeFiProviderFactory.createProvider({
    apiKey: options.apiKey || process.env.APTOS_BUILD_SECRET,
    enabledAdapters: options.enabledAdapters,
    logger: options.logger,
    indexerUrl: 'https://indexer.mainnet.aptoslabs.com/v1',
  });
}
