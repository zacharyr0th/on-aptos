import { serviceLogger } from '@/lib/utils/logger';

import { PriceService } from '../interfaces/services';

export interface PoolReserves {
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
}

export class LPTokenPriceService {
  constructor(private priceService: PriceService) {}

  /**
   * Calculate LP token price based on pool reserves
   */
  async calculateLPTokenPrice(
    poolReserves: PoolReserves,
    lpTokenDecimals: number = 8
  ): Promise<number> {
    try {
      // Get prices for both tokens
      const [price0, price1] = await Promise.all([
        this.priceService.getTokenPrice(poolReserves.token0),
        this.priceService.getTokenPrice(poolReserves.token1),
      ]);

      // Get decimals for each token
      const decimals0 = this.getTokenDecimals(poolReserves.token0);
      const decimals1 = this.getTokenDecimals(poolReserves.token1);

      // Convert reserves to actual amounts
      const reserve0Amount =
        parseFloat(poolReserves.reserve0) / Math.pow(10, decimals0);
      const reserve1Amount =
        parseFloat(poolReserves.reserve1) / Math.pow(10, decimals1);

      // Calculate total value in pool
      const totalValueUSD = reserve0Amount * (price0 || 0) + reserve1Amount * (price1 || 0);

      // Convert total supply to actual amount
      const totalSupply =
        parseFloat(poolReserves.totalSupply) / Math.pow(10, lpTokenDecimals);

      // LP token price = Total Value / Total Supply
      if (totalSupply === 0) return 0;

      return totalValueUSD / totalSupply;
    } catch (error) {
      serviceLogger.error('Failed to calculate LP token price:', error);
      return 0;
    }
  }

  /**
   * Fetch pool reserves from the blockchain
   * This is a placeholder - actual implementation would need to query specific pool contracts
   */
  async fetchPoolReserves(poolAddress: string): Promise<PoolReserves | null> {
    try {
      const apiUrl = 'https://api.mainnet.aptoslabs.com/v1';

      // Fetch pool resource
      const response = await fetch(
        `${apiUrl}/accounts/${poolAddress}/resource/${poolAddress}::pool::Pool`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Extract reserves based on common pool structures
      // This would need to be adapted for each DEX's specific structure
      return {
        token0: data.data?.token0_type || '',
        token1: data.data?.token1_type || '',
        reserve0: data.data?.reserve0 || '0',
        reserve1: data.data?.reserve1 || '0',
        totalSupply: data.data?.lp_token_supply || '0',
      };
    } catch (error) {
      serviceLogger.error('Failed to fetch pool reserves:', error);
      return null;
    }
  }

  /**
   * Estimate LP token price using simplified calculation
   * Used when pool reserves are not available
   */
  async estimateLPTokenPrice(
    token0: string,
    token1: string,
    lpAmount: number
  ): Promise<number> {
    try {
      const prices = await this.priceService.getTokenPrices([token0, token1]);

      // Simple estimation: assume 50/50 pool
      const price0 = prices.get(token0) || 0;
      const price1 = prices.get(token1) || 0;

      // Average price weighted by typical pool composition
      const avgPrice = (price0 + price1) / 2;

      // LP tokens typically represent 2x the value of a single token
      // This is a rough approximation
      return avgPrice * 0.5;
    } catch (error) {
      serviceLogger.error('Failed to estimate LP token price:', error);
      return 0;
    }
  }

  private getTokenDecimals(tokenAddress: string): number {
    // Common token decimals mapping
    if (tokenAddress.includes('::aptos_coin::AptosCoin')) return 8;
    if (tokenAddress.includes('::usdc::') || tokenAddress.includes('USDC'))
      return 6;
    if (tokenAddress.includes('::usdt::') || tokenAddress.includes('USDT'))
      return 6;
    if (tokenAddress.includes('::weth::') || tokenAddress.includes('WETH'))
      return 8;
    if (tokenAddress.includes('::wbtc::') || tokenAddress.includes('WBTC'))
      return 8;

    // Default to 8 decimals
    return 8;
  }

  /**
   * Parse LP token type to extract underlying tokens
   */
  parseLPTokenType(
    lpTokenType: string
  ): { token0: string; token1: string } | null {
    // Common patterns for LP token types
    const patterns = [
      /LPToken<(.+?),\s*(.+?)>/,
      /LP<(.+?),\s*(.+?)>/,
      /StablePoolToken<(.+?),\s*(.+?)(?:,|>)/,
      /WeightedPoolToken<(.+?),\s*(.+?)(?:,|>)/,
    ];

    for (const pattern of patterns) {
      const match = lpTokenType.match(pattern);
      if (match) {
        return {
          token0: match[1].trim(),
          token1: match[2].trim(),
        };
      }
    }

    // Handle nested generics more carefully
    const innerMatch = lpTokenType.match(/<(.+)>/);
    if (innerMatch) {
      const tokens = this.parseNestedTokens(innerMatch[1]);
      if (tokens.length >= 2) {
        return {
          token0: tokens[0],
          token1: tokens[1],
        };
      }
    }

    return null;
  }

  private parseNestedTokens(innerTypes: string): string[] {
    const tokens: string[] = [];
    let depth = 0;
    let currentToken = '';

    for (let i = 0; i < innerTypes.length; i++) {
      const char = innerTypes[i];
      if (char === '<') depth++;
      else if (char === '>') depth--;
      else if (char === ',' && depth === 0) {
        const token = currentToken.trim();
        // Filter out null types
        if (token && !token.includes('::Null')) {
          tokens.push(token);
        }
        currentToken = '';
        continue;
      }
      currentToken += char;
    }

    if (currentToken) {
      const token = currentToken.trim();
      if (token && !token.includes('::Null')) {
        tokens.push(token);
      }
    }

    return tokens;
  }
}
