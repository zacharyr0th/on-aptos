/**
 * Comprehensive Position Checker for Multiple Protocols
 * Queries the Aptos indexer for positions across all major protocols
 */

import { z } from 'zod';

import {
  PROTOCOLS,
  ProtocolType,
  getProtocolsByType,
  getAllProtocolAddresses,
} from '@/lib/protocol-registry';
import { serviceLogger } from '@/lib/utils/logger';

// Token addresses for better parsing
const TOKEN_ADDRESSES = {
  APT: '0x1::aptos_coin::AptosCoin',
  USDC: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
  USDT: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
  THAPT:
    '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT',
  THL: '0x07fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL',
  MOD: '0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD',
} as const;

export interface DetailedPosition {
  protocol: string;
  protocolAddress: string;
  type:
    | 'liquidity'
    | 'farming'
    | 'lending'
    | 'staking'
    | 'nft'
    | 'derivatives'
    | 'other';
  description: string;
  tokens: Array<{
    symbol: string;
    address: string;
    balance: string;
    value?: string;
  }>;
  lpTokens: Array<{
    poolType: string;
    poolTokens: string[];
    balance: string;
    value?: string;
  }>;
  resources: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
  isActive: boolean;
}

export interface ComprehensivePositionSummary {
  walletAddress: string;
  positions: DetailedPosition[];
  totalActivePositions: number;
  totalProtocols: number;
  protocolBreakdown: Record<string, number>;
  valueBreakdown: Record<string, string>;
  lastUpdated: string;
}

export class ComprehensivePositionChecker {
  private readonly indexerUrl: string;
  private readonly apiKey?: string;

  constructor(
    indexerUrl = 'https://api.mainnet.aptoslabs.com/v1',
    apiKey?: string
  ) {
    this.indexerUrl = indexerUrl;
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  private async fetchAccountResources(
    address: string
  ): Promise<Array<{ type: string; data: Record<string, unknown> }>> {
    try {
      const response = await fetch(
        `${this.indexerUrl}/accounts/${address}/resources`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch account resources: ${response.statusText}`
        );
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      serviceLogger.error('Error fetching account resources:', error);
      return [];
    }
  }

  /**
   * Parse LP token type to extract pool information
   */
  private parseLPToken(resourceType: string): {
    isLPToken: boolean;
    poolType: string;
    tokens: string[];
    protocol: string;
  } {
    const result = {
      isLPToken: false,
      poolType: '',
      tokens: [] as string[],
      protocol: '',
    };

    // Check for Thala LP tokens
    if (
      resourceType.includes('::stable_pool::StablePoolToken<') ||
      resourceType.includes('::weighted_pool::WeightedPoolToken<')
    ) {
      result.isLPToken = true;
      result.protocol = 'Thala';
      result.poolType = resourceType.includes('::stable_pool::')
        ? 'Stable Pool'
        : 'Weighted Pool';

      // Extract token types from generic parameters
      const match = resourceType.match(/<(.+)>/);
      if (match) {
        const tokenTypes = match[1].split(',').map(t => t.trim());
        result.tokens = tokenTypes.filter(
          t => !t.includes('::base_pool::Null')
        );
      }
    }

    // Check for Liquidswap LP tokens
    if (
      resourceType.includes('liquidswap') ||
      resourceType.includes('::lp_coin::LP<')
    ) {
      result.isLPToken = true;
      result.protocol = 'Liquidswap';
      result.poolType = 'AMM Pool';

      const match = resourceType.match(/<(.+)>/);
      if (match) {
        result.tokens = match[1].split(',').map(t => t.trim());
      }
    }

    // Check for PancakeSwap LP tokens
    if (
      resourceType.includes('pancakeswap') ||
      resourceType.includes('::lp_token::LP<')
    ) {
      result.isLPToken = true;
      result.protocol = 'PancakeSwap';
      result.poolType = 'AMM Pool';

      const match = resourceType.match(/<(.+)>/);
      if (match) {
        result.tokens = match[1].split(',').map(t => t.trim());
      }
    }

    return result;
  }

  /**
   * Get human-readable token symbol from address
   */
  private getTokenSymbol(tokenAddress: string): string {
    if (tokenAddress.includes('::aptos_coin::AptosCoin')) return 'APT';
    if (tokenAddress.includes('::asset::USDC')) return 'USDC';
    if (tokenAddress.includes('::asset::USDT')) return 'USDT';
    if (tokenAddress.includes('::staking::ThalaAPT')) return 'thAPT';
    if (tokenAddress.includes('::thl_coin::THL')) return 'THL';
    if (tokenAddress.includes('::mod_coin::MOD')) return 'MOD';

    // Extract module name as fallback
    const match = tokenAddress.match(/::([^:]+)::([^>]+)/);
    if (match) {
      return match[2].toUpperCase();
    }

    return tokenAddress.substring(0, 10) + '...';
  }

  /**
   * Identify protocol and position type from resource using protocol registry
   */
  private identifyProtocol(resourceType: string): {
    protocol: string;
    type:
      | 'liquidity'
      | 'farming'
      | 'lending'
      | 'staking'
      | 'nft'
      | 'derivatives'
      | 'other';
    description: string;
  } {
    // Check all protocol addresses from the registry
    const allAddresses = getAllProtocolAddresses();
    for (const address of allAddresses) {
      if (resourceType.includes(address)) {
        // Find the protocol info from the registry
        const protocol = Object.values(PROTOCOLS).find(p =>
          p.addresses.includes(address)
        );

        if (protocol) {
          const type = this.mapProtocolTypeToPositionType(protocol.type);
          return {
            protocol: protocol.name,
            type,
            description:
              protocol.description || this.getDescriptionForType(type),
          };
        }
      }
    }

    // Fallback: check all protocols by their addresses
    for (const protocol of Object.values(PROTOCOLS)) {
      for (const address of protocol.addresses) {
        if (resourceType.includes(address)) {
          const type = this.mapProtocolTypeToPositionType(protocol.type);
          return {
            protocol: protocol.name,
            type,
            description:
              protocol.description || this.getDescriptionForType(type),
          };
        }
      }
    }

    return {
      protocol: 'Unknown',
      type: 'other',
      description: 'Unknown Protocol',
    };
  }

  /**
   * Map ProtocolType to position type
   */
  private mapProtocolTypeToPositionType(
    protocolType: ProtocolType
  ):
    | 'liquidity'
    | 'farming'
    | 'lending'
    | 'staking'
    | 'nft'
    | 'derivatives'
    | 'other' {
    switch (protocolType) {
      case ProtocolType.DEX:
        return 'liquidity';
      case ProtocolType.FARMING:
        return 'farming';
      case ProtocolType.LENDING:
        return 'lending';
      case ProtocolType.LIQUID_STAKING:
        return 'staking';
      case ProtocolType.NFT_MARKETPLACE:
        return 'nft';
      case ProtocolType.DERIVATIVES:
        return 'derivatives';
      default:
        return 'other';
    }
  }

  /**
   * Get description for position type
   */
  private getDescriptionForType(
    type:
      | 'liquidity'
      | 'farming'
      | 'lending'
      | 'staking'
      | 'nft'
      | 'derivatives'
      | 'other'
  ): string {
    switch (type) {
      case 'liquidity':
        return 'DEX/Liquidity Pool';
      case 'farming':
        return 'Yield Farming';
      case 'lending':
        return 'Lending/Borrowing';
      case 'staking':
        return 'Liquid Staking';
      case 'nft':
        return 'NFT Platform';
      case 'derivatives':
        return 'Derivatives Trading';
      default:
        return 'Other Protocol';
    }
  }

  /**
   * Get comprehensive position analysis
   */
  async getComprehensivePositions(
    walletAddress: string
  ): Promise<ComprehensivePositionSummary> {
    try {
      serviceLogger.info(
        `🔍 Analyzing comprehensive positions for wallet: ${walletAddress}`
      );

      const resources = await this.fetchAccountResources(walletAddress);

      const positions: DetailedPosition[] = [];
      const protocolBreakdown: Record<string, number> = {};

      // Group resources by protocol
      const protocolResources = new Map<
        string,
        Array<{ type: string; data: Record<string, unknown> }>
      >();

      for (const resource of resources) {
        const identification = this.identifyProtocol(resource.type);

        if (identification.protocol !== 'Unknown') {
          const key = `${identification.protocol}-${identification.type}`;

          if (!protocolResources.has(key)) {
            protocolResources.set(key, []);
          }

          protocolResources.get(key)!.push(resource);
        }
      }

      // Process each protocol position
      for (const [key, protocolResourceList] of protocolResources.entries()) {
        const [protocolName, positionType] = key.split('-');
        const firstResource = protocolResourceList[0];
        const identification = this.identifyProtocol(firstResource.type);

        const tokens: Array<{
          symbol: string;
          address: string;
          balance: string;
          value?: string;
        }> = [];
        const lpTokens: Array<{
          poolType: string;
          poolTokens: string[];
          balance: string;
          value?: string;
        }> = [];

        // Process each resource in this protocol
        for (const resource of protocolResourceList) {
          // Check if it's an LP token
          const lpInfo = this.parseLPToken(resource.type);

          if (lpInfo.isLPToken) {
            const balance = (resource.data as any)?.coin?.value || '0';
            const tokenSymbols = lpInfo.tokens.map(t => this.getTokenSymbol(t));

            lpTokens.push({
              poolType: lpInfo.poolType,
              poolTokens: tokenSymbols,
              balance,
            });
          } else if (resource.type.includes('::coin::CoinStore<')) {
            // Regular token
            const balance = (resource.data as any)?.coin?.value || '0';
            const tokenMatch = resource.type.match(/CoinStore<(.+)>/);

            if (tokenMatch) {
              const tokenAddress = tokenMatch[1];
              const symbol = this.getTokenSymbol(tokenAddress);

              tokens.push({
                symbol,
                address: tokenAddress,
                balance,
              });
            }
          }
        }

        // Find the protocol address from the registry
        const allAddresses = getAllProtocolAddresses();
        const protocolAddress =
          allAddresses.find(addr =>
            protocolResourceList.some(r => r.type.includes(addr))
          ) || '';

        // Determine if position is active (has non-zero balance)
        const isActive =
          tokens.some(t => t.balance !== '0') ||
          lpTokens.some(lp => lp.balance !== '0') ||
          protocolResourceList.some(r => {
            const data = r.data as any;
            return data?.coin?.value !== '0' || Object.keys(data).length > 1;
          });

        positions.push({
          protocol: protocolName,
          protocolAddress,
          type: positionType as any,
          description: identification.description,
          tokens,
          lpTokens,
          resources: protocolResourceList,
          isActive,
        });

        // Update protocol breakdown
        if (isActive) {
          protocolBreakdown[protocolName] =
            (protocolBreakdown[protocolName] || 0) + 1;
        }
      }

      // Sort positions by activity and protocol name
      positions.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.protocol.localeCompare(b.protocol);
      });

      return {
        walletAddress,
        positions,
        totalActivePositions: positions.filter(p => p.isActive).length,
        totalProtocols: Object.keys(protocolBreakdown).length,
        protocolBreakdown,
        valueBreakdown: {}, // TODO: Calculate USD values
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      serviceLogger.error('Error getting comprehensive positions:', error);
      return {
        walletAddress,
        positions: [],
        totalActivePositions: 0,
        totalProtocols: 0,
        protocolBreakdown: {},
        valueBreakdown: {},
        lastUpdated: new Date().toISOString(),
      };
    }
  }
}
