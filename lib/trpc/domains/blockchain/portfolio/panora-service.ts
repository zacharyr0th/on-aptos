import { logger } from '@/lib/utils/logger';
// import { getCachedData, setCachedData } from '@/lib/utils/cache-manager';
import { PriceService } from '@/lib/trpc/domains/market-data/prices/services';
import { getEnvVar } from '@/lib/config/validate-env';

const PANORA_API_ENDPOINT = 'https://api.panora.exchange/prices';
const PANORA_API_KEY =
  getEnvVar('PANORA_API_KEY') ||
  'a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi';

export interface PanoraPriceResponse {
  chainId: number;
  tokenAddress: string | null;
  faAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  usdPrice: string;
  nativePrice: string;
  iconUrl?: string;
}

interface TokenPriceData {
  price: number;
  change24h: number;
  symbol: string;
  decimals: number;
}

export class PanoraService {
  /**
   * Fetch prices for all tokens with liquidity
   */
  static async getAllPrices(): Promise<PanoraPriceResponse[]> {
    // Temporarily disable caching to fix configuration issues
    logger.info('Fetching all prices from Panora API');

    try {
      const response = await fetch(PANORA_API_ENDPOINT, {
        method: 'GET',
        headers: {
          'x-api-key': PANORA_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Panora API error: ${response.status}`);
      }

      const data = await response.json();
      const result = Array.isArray(data) ? data : [];

      logger.info(`Retrieved ${result.length} prices from Panora API`);
      return result;
    } catch (error) {
      logger.error('Failed to fetch all prices from Panora:', error);
      throw error;
    }
  }

  /**
   * Fetch prices for specific token addresses
   */
  static async getTokenPrices(
    tokenAddresses: string[]
  ): Promise<PanoraPriceResponse[]> {
    if (tokenAddresses.length === 0) return [];

    // Temporarily disable caching to fix configuration issues
    logger.info(
      `Fetching prices for specific tokens: ${tokenAddresses.join(', ')}`
    );

    try {
      const queryParams = new URLSearchParams({
        tokenAddress: tokenAddresses.join(','),
      });

      const response = await fetch(`${PANORA_API_ENDPOINT}?${queryParams}`, {
        method: 'GET',
        headers: {
          'x-api-key': PANORA_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Panora API error: ${response.status}`);
      }

      const data = await response.json();
      const result = Array.isArray(data) ? data : [];

      logger.info(
        `Retrieved ${result.length} specific token prices from Panora API`
      );
      return result;
    } catch (error) {
      logger.error('Failed to fetch token prices from Panora:', error);
      throw error;
    }
  }

  /**
   * Get price data for a specific asset type, trying Panora first, then CMC as fallback
   */
  static async getAssetPrice(
    assetType: string,
    symbol: string
  ): Promise<TokenPriceData> {
    try {
      // Try Panora first
      const panoraPrices = await this.getAllPrices();
      const panoraMatch = panoraPrices.find(
        price =>
          price.faAddress === assetType || price.tokenAddress === assetType
      );

      if (panoraMatch) {
        return {
          price: parseFloat(panoraMatch.usdPrice),
          change24h: 0, // Panora doesn't provide 24h change, set to 0
          symbol: panoraMatch.symbol,
          decimals: panoraMatch.decimals,
        };
      }

      // Fallback to CMC
      logger.info(
        `Asset ${assetType} not found in Panora, falling back to CMC for ${symbol}`
      );

      try {
        const cmcData = await PriceService.getCMCPrice(symbol);
        return {
          price: cmcData.price,
          change24h: 0, // CMC data doesn't include change24h in this interface
          symbol: symbol,
          decimals: 8, // Default decimals for CMC data
        };
      } catch (cmcError) {
        logger.warn(`CMC fallback failed for ${symbol}:`, cmcError);
        return {
          price: 0,
          change24h: 0,
          symbol: symbol,
          decimals: 8,
        };
      }
    } catch (error) {
      logger.error(`Failed to get price for ${assetType}:`, error);
      return {
        price: 0,
        change24h: 0,
        symbol: symbol,
        decimals: 8,
      };
    }
  }

  /**
   * Map asset types to their corresponding symbols for CMC fallback
   */
  static getSymbolForAssetType(assetType: string): string {
    const assetMap: Record<string, string> = {
      '0x1::aptos_coin::AptosCoin': 'APT',
      '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC':
        'USDC',
      '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT':
        'USDT',
      '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH':
        'ETH',
      '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WBTC':
        'BTC',
      '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt':
        'APT',
      '0x7e783b349d3e89cf5931af376ebeadbfab855b3fa239b7ada8f5a92fbea6b387::staking::AMAPT':
        'APT',
      // Add more common Aptos token addresses
      '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>': 'APT',
      '0x3::token::Token': 'APT',
      // Additional USDC variants
      '0x397071c01929cc6672a17f130bd62b1bce224309029837ce4f18214cc83ce2a7::USDC::USDC':
        'USDC',
      // GUI token
      '0xe4ccb6d39136469f376242c31b34d10515c8eaaa38092f804db8e08a8f53c5b2::assets_v1::EchoCoin002':
        'GUI',
      // More APT variants
      '0x48327a479bf5c5d2e36d5e9846362cff2d99e0e27ff92859fc247893fded3fbd::APTOS::APTOS':
        'APT',
      '0x50788befc1107c0cc4473848a92e5c783c635866ce3c98de71d2eeb7d2a34f85::aptos_coin::AptosCoin':
        'APT',
    };

    return assetMap[assetType] || 'UNKNOWN';
  }
}
