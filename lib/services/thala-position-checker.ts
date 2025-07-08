/**
 * Thala Protocol Position Checker
 * Queries the Aptos indexer for Thala protocol positions
 */

import { z } from 'zod';

// Thala protocol addresses from the protocol list
const THALA_ADDRESSES = {
  THALA_SWAP:
    '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af',
  THALA_PROTOCOL:
    '0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01',
  THALA_FARMING:
    '0x6b3720cd988adeaf721ed9d4730da4324d52364871a68eac62b46d21e4d2fa99',
  THALA_LSD:
    '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6',
  THALA_LAUNCH:
    '0x6970b4878c3aea96732be3f31c2dded12d94d9455ff0c76c67d84859dce35136',
  THL_COIN:
    '0x07fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615',
  THALA_MANAGER:
    '0x4dcae85fc5559071906cd5c76b7420fcbb4b0a92f00ab40ffc394aadbbff5ee9',
  THALA_ORACLE:
    '0x092e95ed77b5ac815d3fbc2227e76db238339e9ca43ace45031ec2589bea5b8c',
  THALA_TREASURY:
    '0x9c6d58fa009e08dfb2f5928ded14b3a790a94131da89891466b41ba1e61d83e1',
} as const;

// Response schemas
const AptosResourceSchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
});

const AptosAccountResourcesSchema = z.object({
  resources: z.array(AptosResourceSchema),
});

const TransactionSchema = z.object({
  version: z.string(),
  hash: z.string(),
  state_change_hash: z.string(),
  event_root_hash: z.string(),
  state_checkpoint_hash: z.string().optional(),
  gas_used: z.string(),
  success: z.boolean(),
  vm_status: z.string(),
  accumulator_root_hash: z.string(),
  timestamp: z.string(),
  changes: z.array(z.record(z.unknown())),
  events: z.array(z.record(z.unknown())),
  payload: z.record(z.unknown()),
});

const AccountTransactionsSchema = z.object({
  transactions: z.array(TransactionSchema),
});

export interface ThalaPosition {
  protocol: string;
  address: string;
  type: 'liquidity' | 'farming' | 'lending' | 'staking' | 'other';
  resources: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
  transactions: Array<{
    version: string;
    hash: string;
    timestamp: string;
    success: boolean;
    type: string;
  }>;
}

export interface ThalaPositionSummary {
  walletAddress: string;
  positions: ThalaPosition[];
  totalPositions: number;
  protocolsActive: string[];
  lastUpdated: string;
}

export class ThalaPositionChecker {
  private readonly indexerUrl: string;
  private readonly apiKey?: string;

  constructor(
    indexerUrl = 'https://api.mainnet.aptoslabs.com/v1',
    apiKey?: string
  ) {
    this.indexerUrl = indexerUrl;
    this.apiKey = apiKey;
  }

  /**
   * Get headers for Aptos indexer requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Fetch account resources from Aptos indexer
   */
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
      console.error('Error fetching account resources:', error);
      return [];
    }
  }

  /**
   * Fetch account transactions from Aptos indexer
   */
  private async fetchAccountTransactions(
    address: string,
    limit = 100
  ): Promise<
    Array<{
      version: string;
      hash: string;
      timestamp: string;
      success: boolean;
      type: string;
    }>
  > {
    try {
      const response = await fetch(
        `${this.indexerUrl}/accounts/${address}/transactions?limit=${limit}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch account transactions: ${response.statusText}`
        );
      }

      const data = await response.json();
      return Array.isArray(data)
        ? data.map(tx => ({
            version: tx.version || '',
            hash: tx.hash || '',
            timestamp: tx.timestamp || '',
            success: tx.success || false,
            type: tx.type || 'unknown',
          }))
        : [];
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      return [];
    }
  }

  /**
   * Check if a resource or transaction involves Thala protocol
   */
  private isThalaRelated(
    resourceType: string,
    transactionData?: Record<string, unknown>
  ): {
    isThala: boolean;
    protocol: string;
    type: 'liquidity' | 'farming' | 'lending' | 'staking' | 'other';
  } {
    const thalaAddresses = Object.values(THALA_ADDRESSES);
    const result: {
      isThala: boolean;
      protocol: string;
      type: 'liquidity' | 'farming' | 'lending' | 'staking' | 'other';
    } = {
      isThala: false,
      protocol: '',
      type: 'other',
    };

    // Check if resource type contains any Thala addresses
    for (const [name, address] of Object.entries(THALA_ADDRESSES)) {
      if (resourceType.includes(address)) {
        result.isThala = true;
        result.protocol = name;

        // Determine position type based on address
        if (name === 'THALA_SWAP') {
          result.type = 'liquidity';
        } else if (name === 'THALA_FARMING') {
          result.type = 'farming';
        } else if (name === 'THALA_LSD') {
          result.type = 'staking';
        } else {
          result.type = 'other';
        }

        break;
      }
    }

    // Also check transaction payload if provided
    if (transactionData && transactionData.payload) {
      const payload = transactionData.payload as Record<string, unknown>;
      const payloadStr = JSON.stringify(payload);

      for (const [name, address] of Object.entries(THALA_ADDRESSES)) {
        if (payloadStr.includes(address)) {
          result.isThala = true;
          result.protocol = name;
          break;
        }
      }
    }

    return result;
  }

  /**
   * Check wallet for Thala protocol positions
   */
  async checkWalletPositions(
    walletAddress: string
  ): Promise<ThalaPositionSummary> {
    try {
      console.log(`Checking Thala positions for wallet: ${walletAddress}`);

      // Fetch account resources and transactions
      const [resources, transactions] = await Promise.all([
        this.fetchAccountResources(walletAddress),
        this.fetchAccountTransactions(walletAddress, 200), // Get more transactions to find Thala interactions
      ]);

      const positions: ThalaPosition[] = [];
      const protocolsActive = new Set<string>();

      // Check resources for Thala-related data
      const thalaResources = resources.filter(resource => {
        const check = this.isThalaRelated(resource.type);
        return check.isThala;
      });

      // Check transactions for Thala interactions
      const thalaTransactions = transactions.filter(tx => {
        const check = this.isThalaRelated('', tx as Record<string, unknown>);
        return check.isThala;
      });

      // Group positions by protocol
      const positionMap = new Map<string, ThalaPosition>();

      // Process resources
      thalaResources.forEach(resource => {
        const check = this.isThalaRelated(resource.type);
        if (check.isThala) {
          const key = `${check.protocol}_${check.type}`;

          if (!positionMap.has(key)) {
            positionMap.set(key, {
              protocol: check.protocol,
              address:
                THALA_ADDRESSES[check.protocol as keyof typeof THALA_ADDRESSES],
              type: check.type,
              resources: [],
              transactions: [],
            });
          }

          positionMap.get(key)!.resources.push(resource);
          protocolsActive.add(check.protocol);
        }
      });

      // Process transactions
      thalaTransactions.forEach(tx => {
        const check = this.isThalaRelated('', tx as Record<string, unknown>);
        if (check.isThala) {
          const key = `${check.protocol}_${check.type}`;

          if (!positionMap.has(key)) {
            positionMap.set(key, {
              protocol: check.protocol,
              address:
                THALA_ADDRESSES[check.protocol as keyof typeof THALA_ADDRESSES],
              type: check.type,
              resources: [],
              transactions: [],
            });
          }

          positionMap.get(key)!.transactions.push(tx);
          protocolsActive.add(check.protocol);
        }
      });

      return {
        walletAddress,
        positions: Array.from(positionMap.values()),
        totalPositions: positionMap.size,
        protocolsActive: Array.from(protocolsActive),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error checking Thala positions:', error);
      return {
        walletAddress,
        positions: [],
        totalPositions: 0,
        protocolsActive: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Check for specific Thala token holdings (like thAPT)
   */
  async checkThalaTokenHoldings(walletAddress: string): Promise<
    Array<{
      token: string;
      balance: string;
      type: string;
    }>
  > {
    try {
      const resources = await this.fetchAccountResources(walletAddress);

      const thalaTokens = resources.filter(resource => {
        // Check for thAPT token
        return (
          resource.type.includes(
            '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6'
          ) ||
          resource.type.includes(
            '0x07fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615'
          )
        ); // THL
      });

      return thalaTokens.map(resource => ({
        token: resource.type.includes(
          '0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6'
        )
          ? 'thAPT'
          : 'THL',
        balance: (resource.data as any)?.coin?.value || '0',
        type: resource.type,
      }));
    } catch (error) {
      console.error('Error checking Thala token holdings:', error);
      return [];
    }
  }
}
