import { graphQLRequest } from '@/lib/utils/fetch-utils';
import { logger } from '@/lib/utils/logger';
import { PROTOCOLS, ProtocolType, getProtocolByAddress } from '@/lib/protocol-registry';
import { PROTOCOL_ADDRESSES, PROTOCOLS_BY_TYPE } from '@/lib/aptos-constants';

const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
const APTOS_API_KEY = process.env.APTOS_BUILD_SECRET;

export interface DeFiPosition {
  protocol: string;
  protocolLabel: string;
  protocolType: ProtocolType;
  address: string;
  position: {
    supplied?: {
      asset: string;
      symbol: string;
      amount: string;
      value?: number;
    }[];
    borrowed?: {
      asset: string;
      symbol: string;
      amount: string;
      value?: number;
    }[];
    liquidity?: {
      poolId: string;
      token0: { asset: string; symbol: string; amount: string };
      token1: { asset: string; symbol: string; amount: string };
      lpTokens: string;
      value?: number;
    }[];
    staked?: {
      asset: string;
      symbol: string;
      amount: string;
      rewards?: string;
      value?: number;
    }[];
    derivatives?: {
      asset: string;
      symbol: string;
      amount: string;
      type: 'long' | 'short' | 'option';
      value?: number;
    }[];
  };
  totalValue: number;
}

// Query to get user's table item data for DeFi protocols
const DEFI_TABLE_ITEMS_QUERY = `
  query GetDeFiTableItems($ownerAddress: String!, $tableHandles: [String!]!) {
    table_items(
      where: {
        table_handle: { _in: $tableHandles },
        decoded_key: { _has_key: $ownerAddress }
      }
    ) {
      table_handle
      decoded_key
      decoded_value
      key
      write_set_change_index
      transaction_version
    }
  }
`;

// Query to get user's token balances in specific protocols
const PROTOCOL_BALANCES_QUERY = `
  query GetProtocolBalances($ownerAddress: String!, $protocolAddresses: [String!]!) {
    current_fungible_asset_balances(
      where: {
        owner_address: { _eq: $ownerAddress },
        amount: { _gt: "0" },
        asset_type: { _regex: $protocolAddresses }
      }
    ) {
      amount
      asset_type
      metadata {
        name
        symbol
        decimals
        icon_uri
      }
    }
  }
`;

// Query to get user's coin balances in specific protocols
const PROTOCOL_COIN_BALANCES_QUERY = `
  query GetProtocolCoinBalances($ownerAddress: String!, $protocolAddresses: [String!]!) {
    current_coin_balances(
      where: {
        owner_address: { _eq: $ownerAddress },
        amount: { _gt: "0" },
        coin_type: { _regex: $protocolAddresses }
      }
    ) {
      amount
      coin_type
      coin_info {
        name
        symbol
        decimals
      }
    }
  }
`;

// Query to get user's events related to DeFi protocols
const DEFI_EVENTS_QUERY = `
  query GetDeFiEvents($ownerAddress: String!, $protocolAddresses: [String!]!, $limit: Int!) {
    events(
      where: {
        account_address: { _in: $protocolAddresses },
        data: { _has_key: $ownerAddress }
      }
      order_by: { transaction_version: desc }
      limit: $limit
    ) {
      account_address
      creation_number
      data
      sequence_number
      type
      transaction_version
      transaction_block_height
    }
  }
`;

// Query to get user's resources at specific protocol addresses
const PROTOCOL_RESOURCES_QUERY = `
  query GetProtocolResources($ownerAddress: String!, $resourceTypes: [String!]!) {
    current_account_data(
      where: {
        address: { _eq: $ownerAddress }
      }
    ) {
      account_address
    }
    account_resources: current_account_data(
      where: {
        address: { _eq: $ownerAddress }
      }
    ) {
      account_address
    }
  }
`;

export class DeFiBalanceService {
  /**
   * Get all DeFi positions for a wallet address
   */
  static async getDeFiPositions(walletAddress: string): Promise<DeFiPosition[]> {
    try {
      logger.info(`Fetching DeFi positions for wallet: ${walletAddress}`);
      
      const positions: DeFiPosition[] = [];
      
      // Get positions from different protocol types
      const [
        liquidStakingPositions,
        lendingPositions,
        dexPositions,
        farmingPositions,
        derivativesPositions,
        bridgePositions
      ] = await Promise.allSettled([
        this.getLiquidStakingPositions(walletAddress),
        this.getLendingPositions(walletAddress),
        this.getDexPositions(walletAddress),
        this.getFarmingPositions(walletAddress),
        this.getDerivativesPositions(walletAddress),
        this.getBridgePositions(walletAddress)
      ]);

      // Collect successful results
      [
        liquidStakingPositions,
        lendingPositions,
        dexPositions,
        farmingPositions,
        derivativesPositions,
        bridgePositions
      ].forEach((result, index) => {
        if (result.status === 'fulfilled') {
          positions.push(...result.value);
        } else {
          const protocolTypes = ['liquid_staking', 'lending', 'dex', 'farming', 'derivatives', 'bridge'];
          logger.warn(`Failed to get ${protocolTypes[index]} positions:`, result.reason);
        }
      });

      logger.info(`Found ${positions.length} DeFi positions for wallet ${walletAddress}`);
      return positions;

    } catch (error) {
      logger.error('Error fetching DeFi positions:', error);
      throw new Error(`Failed to fetch DeFi positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get liquid staking positions (thAPT, amAPT, TruFin)
   */
  private static async getLiquidStakingPositions(walletAddress: string): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];
    const lsProtocols = PROTOCOLS_BY_TYPE.LIQUID_STAKING;

    try {
      // Query for liquid staking token balances
      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
            icon_uri?: string;
          };
        }>;
      }>(INDEXER, {
        query: `
          query GetLiquidStakingBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                _or: [
                  { asset_type: { _like: "%${PROTOCOLS.THALA_LSD.addresses[0]}%" } },
                  { asset_type: { _like: "%${PROTOCOLS.AMNIS_FINANCE.addresses[0]}%" } },
                  { asset_type: { _like: "%${PROTOCOLS.TRUFIN.addresses[0]}%" } }
                ]
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
                icon_uri
              }
            }
          }
        `,
        variables: { ownerAddress: walletAddress }
      });

      // Process liquid staking positions
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.LIQUID_STAKING) {
          positions.push({
            protocol: protocol.name,
            protocolLabel: protocol.label,
            protocolType: protocol.type,
            address: balance.asset_type,
            position: {
              staked: [{
                asset: balance.asset_type,
                symbol: balance.metadata.symbol,
                amount: balance.amount,
              }]
            },
            totalValue: 0 // Will be calculated with price data
          });
        }
      }

    } catch (error) {
      logger.error('Error fetching liquid staking positions:', error);
    }

    return positions;
  }

  /**
   * Get lending positions (Aries, Aptin, Thala CDP, etc.)
   */
  private static async getLendingPositions(walletAddress: string): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      // Query for lending protocol balances and table items
      const lendingAddresses = PROTOCOLS_BY_TYPE.LENDING;
      const addressPattern = lendingAddresses.map(addr => `.*${addr}.*`).join('|');

      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
          };
        }>;
      }>(INDEXER, {
        query: `
          query GetLendingBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                asset_type: { _regex: "${addressPattern}" }
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
              }
            }
          }
        `,
        variables: { ownerAddress: walletAddress }
      });

      // Process lending positions
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.LENDING) {
          const isCollateral = balance.metadata.symbol.toLowerCase().includes('a') || 
                             balance.metadata.symbol.toLowerCase().includes('supply');
          const isDebt = balance.metadata.symbol.toLowerCase().includes('debt') || 
                        balance.metadata.symbol.toLowerCase().includes('borrow');

          const position: DeFiPosition = {
            protocol: protocol.name,
            protocolLabel: protocol.label,
            protocolType: protocol.type,
            address: balance.asset_type,
            position: {},
            totalValue: 0
          };

          if (isCollateral) {
            position.position.supplied = [{
              asset: balance.asset_type,
              symbol: balance.metadata.symbol,
              amount: balance.amount,
            }];
          } else if (isDebt) {
            position.position.borrowed = [{
              asset: balance.asset_type,
              symbol: balance.metadata.symbol,
              amount: balance.amount,
            }];
          }

          positions.push(position);
        }
      }

    } catch (error) {
      logger.error('Error fetching lending positions:', error);
    }

    return positions;
  }

  /**
   * Get DEX liquidity positions (PancakeSwap, LiquidSwap, etc.)
   */
  private static async getDexPositions(walletAddress: string): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const dexAddresses = PROTOCOLS_BY_TYPE.DEX;
      const addressPattern = dexAddresses.map(addr => `.*${addr}.*`).join('|');

      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
          };
        }>;
      }>(INDEXER, {
        query: `
          query GetDexBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                asset_type: { _regex: "${addressPattern}" }
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
              }
            }
          }
        `,
        variables: { ownerAddress: walletAddress }
      });

      // Process DEX positions (LP tokens)
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.DEX) {
          const isLPToken = balance.metadata.symbol.toLowerCase().includes('lp') ||
                           balance.metadata.symbol.toLowerCase().includes('cake') ||
                           balance.metadata.name.toLowerCase().includes('liquidity');

          if (isLPToken) {
            positions.push({
              protocol: protocol.name,
              protocolLabel: protocol.label,
              protocolType: protocol.type,
              address: balance.asset_type,
              position: {
                liquidity: [{
                  poolId: balance.asset_type,
                  token0: { asset: '', symbol: '', amount: '0' },
                  token1: { asset: '', symbol: '', amount: '0' },
                  lpTokens: balance.amount,
                }]
              },
              totalValue: 0
            });
          }
        }
      }

    } catch (error) {
      logger.error('Error fetching DEX positions:', error);
    }

    return positions;
  }

  /**
   * Get farming positions (Thala Farm, etc.)
   */
  private static async getFarmingPositions(walletAddress: string): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const farmingAddresses = PROTOCOLS_BY_TYPE.FARMING;
      const addressPattern = farmingAddresses.map(addr => `.*${addr}.*`).join('|');

      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
          };
        }>;
      }>(INDEXER, {
        query: `
          query GetFarmingBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                asset_type: { _regex: "${addressPattern}" }
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
              }
            }
          }
        `,
        variables: { ownerAddress: walletAddress }
      });

      // Process farming positions
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.FARMING) {
          positions.push({
            protocol: protocol.name,
            protocolLabel: protocol.label,
            protocolType: protocol.type,
            address: balance.asset_type,
            position: {
              staked: [{
                asset: balance.asset_type,
                symbol: balance.metadata.symbol,
                amount: balance.amount,
              }]
            },
            totalValue: 0
          });
        }
      }

    } catch (error) {
      logger.error('Error fetching farming positions:', error);
    }

    return positions;
  }

  /**
   * Get derivatives positions (Merkle Trade, KanaLabs)
   */
  private static async getDerivativesPositions(walletAddress: string): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const derivativesAddresses = PROTOCOLS_BY_TYPE.DERIVATIVES;
      const addressPattern = derivativesAddresses.map(addr => `.*${addr}.*`).join('|');

      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
          };
        }>;
      }>(INDEXER, {
        query: `
          query GetDerivativesBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                asset_type: { _regex: "${addressPattern}" }
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
              }
            }
          }
        `,
        variables: { ownerAddress: walletAddress }
      });

      // Process derivatives positions
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.DERIVATIVES) {
          positions.push({
            protocol: protocol.name,
            protocolLabel: protocol.label,
            protocolType: protocol.type,
            address: balance.asset_type,
            position: {
              derivatives: [{
                asset: balance.asset_type,
                symbol: balance.metadata.symbol,
                amount: balance.amount,
                type: 'long', // Default, would need more analysis to determine
              }]
            },
            totalValue: 0
          });
        }
      }

    } catch (error) {
      logger.error('Error fetching derivatives positions:', error);
    }

    return positions;
  }

  /**
   * Get bridge positions (LayerZero, Wormhole, Celer)
   */
  private static async getBridgePositions(walletAddress: string): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const bridgeAddresses = PROTOCOLS_BY_TYPE.BRIDGE;
      const addressPattern = bridgeAddresses.map(addr => `.*${addr}.*`).join('|');

      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
          };
        }>;
      }>(INDEXER, {
        query: `
          query GetBridgeBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                asset_type: { _regex: "${addressPattern}" }
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
              }
            }
          }
        `,
        variables: { ownerAddress: walletAddress }
      });

      // Process bridge positions (typically locked/wrapped tokens)
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.BRIDGE) {
          // Bridge tokens are usually considered phantom/locked assets
          // but we still track them for transparency
          positions.push({
            protocol: protocol.name,
            protocolLabel: protocol.label,
            protocolType: protocol.type,
            address: balance.asset_type,
            position: {
              supplied: [{
                asset: balance.asset_type,
                symbol: balance.metadata.symbol,
                amount: balance.amount,
              }]
            },
            totalValue: 0
          });
        }
      }

    } catch (error) {
      logger.error('Error fetching bridge positions:', error);
    }

    return positions;
  }

  /**
   * Get aggregated DeFi statistics for a wallet
   */
  static async getDeFiStats(walletAddress: string): Promise<{
    totalPositions: number;
    totalValueLocked: number;
    protocolBreakdown: Record<ProtocolType, number>;
    topProtocols: Array<{ protocol: string; value: number; percentage: number }>;
  }> {
    try {
      const positions = await this.getDeFiPositions(walletAddress);
      
      const stats = {
        totalPositions: positions.length,
        totalValueLocked: positions.reduce((sum, pos) => sum + pos.totalValue, 0),
        protocolBreakdown: {} as Record<ProtocolType, number>,
        topProtocols: [] as Array<{ protocol: string; value: number; percentage: number }>
      };

      // Calculate protocol breakdown
      for (const position of positions) {
        if (!stats.protocolBreakdown[position.protocolType]) {
          stats.protocolBreakdown[position.protocolType] = 0;
        }
        stats.protocolBreakdown[position.protocolType] += position.totalValue;
      }

      // Calculate top protocols
      const protocolValues = new Map<string, number>();
      for (const position of positions) {
        const current = protocolValues.get(position.protocol) || 0;
        protocolValues.set(position.protocol, current + position.totalValue);
      }

      stats.topProtocols = Array.from(protocolValues.entries())
        .map(([protocol, value]) => ({
          protocol,
          value,
          percentage: stats.totalValueLocked > 0 ? (value / stats.totalValueLocked) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      return stats;
    } catch (error) {
      logger.error('Error calculating DeFi stats:', error);
      return {
        totalPositions: 0,
        totalValueLocked: 0,
        protocolBreakdown: {} as Record<ProtocolType, number>,
        topProtocols: []
      };
    }
  }
}