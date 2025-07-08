import { createHash } from 'crypto';
import type {
  ProcessedTransaction,
  TransactionStats,
  TransactionFilter,
  CoinActivity,
  FungibleAssetActivity,
  TokenActivity,
  TransactionType,
  TransactionCategory,
} from './types';
import { PANORA_TOKENS } from '@/lib/config/data';

const INDEXER = 'https://api.mainnet.aptoslabs.com/v1/graphql';
const APTOS_NODE_ENDPOINT = 'https://api.mainnet.aptoslabs.com/v1';
const APTOS_API_KEY = process.env.APTOS_BUILD_KEY;

// Helper function for GraphQL requests (borrowed from portfolio service)
async function graphQLRequest<T>(
  url: string,
  options: {
    query: string;
    variables?: any;
  },
  requestOptions?: {
    headers?: Record<string, string>;
  }
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...requestOptions?.headers,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    console.error('GraphQL errors:', result.errors);
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

// Cache for processed transactions
const transactionCache = new Map<string, ProcessedTransaction[]>();
const CACHE_TTL = 30000; // 30 seconds

// Get list of verified asset types from Panora tokens
const VERIFIED_ASSET_TYPES = new Set(
  Object.values(PANORA_TOKENS).map(token => token.asset_type)
) as Set<string>;

// Helper function to check if an asset type is verified
function isVerifiedAsset(assetType: string): boolean {
  if (!assetType) return false;

  // Check exact match first
  if (VERIFIED_ASSET_TYPES.has(assetType)) return true;

  // For fungible assets that have complex type formats, check if they start with any verified type
  for (const verifiedType of VERIFIED_ASSET_TYPES) {
    if (assetType.startsWith(verifiedType.split('::')[0])) {
      return true;
    }
  }

  return false;
}

export class TransactionService {
  private static createCacheKey(walletAddress: string, options: any): string {
    const hash = createHash('md5')
      .update(JSON.stringify({ walletAddress, ...options }))
      .digest('hex');
    return hash;
  }

  /**
   * Get comprehensive transaction history for a wallet
   */
  static async getTransactions(
    walletAddress: string,
    limit: number = 20,
    offset: number = 0,
    filter?: TransactionFilter
  ): Promise<ProcessedTransaction[]> {
    const cacheKey = this.createCacheKey(walletAddress, {
      limit,
      offset,
      filter,
    });

    // Check cache
    if (transactionCache.has(cacheKey)) {
      return transactionCache.get(cacheKey)!;
    }

    try {
      console.log('Fetching transactions for wallet:', walletAddress);

      // Use the exact same query as the working portfolio service
      const query = `
        query GetWalletTransactions($ownerAddress: String!, $limit: Int!) {
          fungible_asset_activities(
            where: { 
              owner_address: { _eq: $ownerAddress }
            }
            order_by: { transaction_timestamp: desc }
            limit: $limit
          ) {
            transaction_version
            transaction_timestamp
            type
            amount
            asset_type
            entry_function_id_str
            is_transaction_success
            gas_fee_payer_address
          }
        }
      `;

      const response = await graphQLRequest<{
        fungible_asset_activities: any[];
      }>(
        INDEXER,
        {
          query,
          variables: { ownerAddress: walletAddress, limit },
        },
        APTOS_API_KEY
          ? {
              headers: {
                Authorization: `Bearer ${APTOS_API_KEY}`,
              },
            }
          : {}
      );

      console.log('Raw transaction response:', response);
      const transactions = response.fungible_asset_activities || [];
      console.log('Found transactions:', transactions.length);

      // Convert to ProcessedTransaction format
      const processedTransactions: ProcessedTransaction[] = transactions.map(
        tx => ({
          version: tx.transaction_version,
          timestamp: tx.transaction_timestamp,
          type: tx.type as TransactionType,
          category: 'other' as TransactionCategory,
          success: tx.is_transaction_success,
          amount: tx.amount,
          currency: this.extractAssetSymbol(tx.asset_type),
          asset_type: tx.asset_type,
          entry_function: tx.entry_function_id_str,
          details: {
            gas_fee_payer_address: tx.gas_fee_payer_address,
          },
        })
      );

      console.log('Processed transactions:', processedTransactions);

      // Apply filters
      let filteredTransactions = processedTransactions;
      if (filter) {
        filteredTransactions = this.applyFilters(processedTransactions, filter);
      }

      // Apply pagination
      const paginatedTransactions = filteredTransactions.slice(
        offset,
        offset + limit
      );

      // Cache the result
      transactionCache.set(cacheKey, paginatedTransactions);
      setTimeout(() => transactionCache.delete(cacheKey), CACHE_TTL);

      return paginatedTransactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(
        `Failed to fetch transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get detailed information for a specific transaction
   */
  static async getTransactionDetail(
    version: string
  ): Promise<ProcessedTransaction | null> {
    try {
      const response = await fetch(
        `${APTOS_NODE_ENDPOINT}/transactions/by_version/${version}`,
        {
          headers: {
            Accept: 'application/json',
            ...(process.env.APTOS_BUILD_KEY && {
              Authorization: `Bearer ${process.env.APTOS_BUILD_KEY}`,
            }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.statusText}`);
      }

      const transaction = await response.json();
      return this.processNodeTransaction(transaction);
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      return null;
    }
  }

  /**
   * Get transaction statistics for a wallet
   */
  static async getTransactionStats(
    walletAddress: string,
    days: number = 30
  ): Promise<TransactionStats> {
    try {
      const transactions = await this.getTransactions(walletAddress, 1000); // Get more for stats

      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const filteredTransactions = transactions.filter(
        tx => new Date(tx.timestamp) >= dateFrom
      );

      const stats: TransactionStats = {
        total_transactions: filteredTransactions.length,
        successful_transactions: filteredTransactions.filter(tx => tx.success)
          .length,
        failed_transactions: filteredTransactions.filter(tx => !tx.success)
          .length,
        total_gas_used: filteredTransactions
          .reduce((sum, tx) => sum + parseFloat(tx.gas_used || '0'), 0)
          .toString(),
        total_gas_fees: filteredTransactions
          .reduce((sum, tx) => sum + parseFloat(tx.gas_fee || '0'), 0)
          .toString(),
        transaction_types: this.groupByField(filteredTransactions, 'type'),
        transaction_categories: this.groupByField(
          filteredTransactions,
          'category'
        ),
        date_range: {
          earliest:
            filteredTransactions.length > 0
              ? filteredTransactions[filteredTransactions.length - 1].timestamp
              : new Date().toISOString(),
          latest:
            filteredTransactions.length > 0
              ? filteredTransactions[0].timestamp
              : new Date().toISOString(),
        },
      };

      return stats;
    } catch (error) {
      console.error('Error generating transaction stats:', error);
      throw new Error('Failed to generate transaction statistics');
    }
  }

  // Private helper methods

  private static async getCoinActivities(
    walletAddress: string,
    limit: number
  ): Promise<CoinActivity[]> {
    const query = `
      query GetCoinActivities($ownerAddress: String!, $limit: Int!) {
        coin_activities(
          where: { owner_address: { _eq: $ownerAddress } }
          order_by: { transaction_timestamp: desc }
          limit: $limit
        ) {
          transaction_version
          event_account_address
          event_creation_number
          event_sequence_number
          owner_address
          coin_type
          amount
          activity_type
          is_gas_fee
          is_transaction_success
          transaction_timestamp
          block_height
          entry_function_id_str
          event_index
        }
      }
    `;

    try {
      const response = await graphQLRequest<{
        coin_activities: CoinActivity[];
      }>(
        INDEXER,
        {
          query,
          variables: { ownerAddress: walletAddress, limit },
        },
        APTOS_API_KEY
          ? {
              headers: {
                Authorization: `Bearer ${APTOS_API_KEY}`,
              },
            }
          : {}
      );

      return response.coin_activities || [];
    } catch (error) {
      console.error('Error fetching coin activities:', error);
      return [];
    }
  }

  private static async getFungibleAssetActivities(
    walletAddress: string,
    limit: number
  ): Promise<FungibleAssetActivity[]> {
    const query = `
      query GetFungibleAssetActivities($ownerAddress: String!, $limit: Int!) {
        fungible_asset_activities(
          where: { owner_address: { _eq: $ownerAddress } }
          order_by: { transaction_timestamp: desc }
          limit: $limit
        ) {
          transaction_version
          transaction_timestamp
          type
          amount
          asset_type
          entry_function_id_str
          is_transaction_success
          gas_fee_payer_address
          owner_address
          storage_id
          token_standard
        }
      }
    `;

    try {
      const response = await graphQLRequest<{
        fungible_asset_activities: FungibleAssetActivity[];
      }>(
        INDEXER,
        {
          query,
          variables: { ownerAddress: walletAddress, limit },
        },
        APTOS_API_KEY
          ? {
              headers: {
                Authorization: `Bearer ${APTOS_API_KEY}`,
              },
            }
          : {}
      );

      return response.fungible_asset_activities || [];
    } catch (error) {
      console.error('Error fetching fungible asset activities:', error);
      return [];
    }
  }

  private static async getTokenActivities(
    walletAddress: string,
    limit: number
  ): Promise<TokenActivity[]> {
    const query = `
      query GetTokenActivities($ownerAddress: String!, $limit: Int!) {
        token_activities_v2(
          where: { 
            _or: [
              { from_address: { _eq: $ownerAddress } },
              { to_address: { _eq: $ownerAddress } }
            ]
          }
          order_by: { transaction_timestamp: desc }
          limit: $limit
        ) {
          transaction_version
          event_account_address
          event_creation_number
          event_sequence_number
          collection_data_id_hash
          token_data_id_hash
          property_version
          creator_address
          collection_name
          name
          transfer_type
          from_address
          to_address
          token_amount
          transaction_timestamp
          is_transaction_success
        }
      }
    `;

    try {
      const response = await graphQLRequest<{
        token_activities_v2: TokenActivity[];
      }>(
        INDEXER,
        {
          query,
          variables: { ownerAddress: walletAddress, limit },
        },
        APTOS_API_KEY
          ? {
              headers: {
                Authorization: `Bearer ${APTOS_API_KEY}`,
              },
            }
          : {}
      );

      return response.token_activities_v2 || [];
    } catch (error) {
      console.error('Error fetching token activities:', error);
      return [];
    }
  }

  private static processCoinActivities(
    activities: CoinActivity[],
    walletAddress: string
  ): ProcessedTransaction[] {
    return activities.map(activity => ({
      version: activity.transaction_version,
      timestamp: activity.transaction_timestamp,
      type: this.mapCoinActivityType(activity.activity_type),
      category: this.categorizeTransaction(
        activity.activity_type,
        activity.entry_function_id_str
      ),
      success: activity.is_transaction_success,
      amount: activity.amount,
      currency: this.extractCoinSymbol(activity.coin_type),
      asset_type: activity.coin_type,
      gas_used: activity.is_gas_fee ? activity.amount : undefined,
      entry_function: activity.entry_function_id_str,
      details: {
        event_account_address: activity.event_account_address,
        block_height: activity.block_height,
        is_gas_fee: activity.is_gas_fee,
      },
    }));
  }

  private static processFungibleAssetActivities(
    activities: FungibleAssetActivity[],
    walletAddress: string
  ): ProcessedTransaction[] {
    return activities.map(activity => ({
      version: activity.transaction_version,
      timestamp: activity.transaction_timestamp,
      type: this.mapFungibleAssetType(activity.type),
      category: this.categorizeTransaction(
        activity.type,
        activity.entry_function_id_str
      ),
      success: activity.is_transaction_success,
      amount: activity.amount,
      currency: this.extractAssetSymbol(activity.asset_type),
      asset_type: activity.asset_type,
      entry_function: activity.entry_function_id_str,
      details: {
        storage_id: activity.storage_id,
        token_standard: activity.token_standard,
        gas_fee_payer_address: activity.gas_fee_payer_address,
      },
    }));
  }

  private static processTokenActivities(
    activities: TokenActivity[],
    walletAddress: string
  ): ProcessedTransaction[] {
    return activities.map(activity => ({
      version: activity.transaction_version,
      timestamp: activity.transaction_timestamp,
      type: this.mapTokenActivityType(activity.transfer_type),
      category: 'nft' as TransactionCategory,
      success: activity.is_transaction_success,
      amount: activity.token_amount,
      currency: activity.name,
      from_address: activity.from_address,
      to_address: activity.to_address,
      details: {
        collection_name: activity.collection_name,
        token_name: activity.name,
        creator_address: activity.creator_address,
        collection_data_id_hash: activity.collection_data_id_hash,
        token_data_id_hash: activity.token_data_id_hash,
      },
    }));
  }

  private static processNodeTransaction(
    transaction: any
  ): ProcessedTransaction {
    return {
      version: transaction.version,
      hash: transaction.hash,
      timestamp: transaction.timestamp,
      type: this.mapTransactionType(transaction.type),
      category: this.categorizeTransaction(transaction.type),
      success: transaction.success,
      gas_used: transaction.gas_used,
      gas_fee: transaction.gas_unit_price
        ? (
            parseInt(transaction.gas_used || '0') *
            parseInt(transaction.gas_unit_price)
          ).toString()
        : undefined,
      details: {
        sender: transaction.sender,
        sequence_number: transaction.sequence_number,
        max_gas_amount: transaction.max_gas_amount,
        expiration_timestamp_secs: transaction.expiration_timestamp_secs,
        vm_status: transaction.vm_status,
      },
      events: transaction.events,
      changes: transaction.changes,
    };
  }

  private static mapCoinActivityType(activityType: string): TransactionType {
    switch (activityType.toLowerCase()) {
      case 'deposit':
        return 'coin_deposit';
      case 'withdraw':
        return 'coin_withdraw';
      case 'gas_fee':
        return 'coin_withdraw';
      default:
        return 'coin_transfer';
    }
  }

  private static mapFungibleAssetType(type: string): TransactionType {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'token_mint';
      case 'withdraw':
        return 'token_burn';
      case 'transfer':
        return 'token_transfer';
      default:
        return 'token_transfer';
    }
  }

  private static mapTokenActivityType(transferType: string): TransactionType {
    switch (transferType.toLowerCase()) {
      case 'mint':
        return 'nft_mint';
      case 'burn':
        return 'nft_burn';
      case 'transfer':
        return 'nft_transfer';
      default:
        return 'nft_transfer';
    }
  }

  private static mapTransactionType(type: string): TransactionType {
    switch (type.toLowerCase()) {
      case 'user_transaction':
        return 'user_transaction';
      case 'genesis_transaction':
        return 'genesis';
      case 'block_metadata_transaction':
        return 'block_metadata';
      case 'state_checkpoint_transaction':
        return 'state_checkpoint';
      default:
        return 'unknown';
    }
  }

  private static categorizeTransaction(
    type: string,
    entryFunction?: string
  ): TransactionCategory {
    if (!entryFunction) {
      if (type.includes('nft') || type.includes('token_activities'))
        return 'nft';
      if (type.includes('coin') || type.includes('transfer')) return 'transfer';
      return 'other';
    }

    const func = entryFunction.toLowerCase();

    if (
      func.includes('swap') ||
      func.includes('liquidity') ||
      func.includes('pool')
    )
      return 'defi';
    if (func.includes('stake') || func.includes('delegate')) return 'staking';
    if (func.includes('vote') || func.includes('proposal')) return 'governance';
    if (func.includes('mint') || func.includes('create_token')) return 'nft';
    if (func.includes('transfer') || func.includes('send')) return 'transfer';

    return 'other';
  }

  private static extractCoinSymbol(coinType: string): string {
    const parts = coinType.split('::');
    return parts[parts.length - 1] || coinType;
  }

  private static extractAssetSymbol(assetType: string): string {
    const parts = assetType.split('::');
    return parts[parts.length - 1] || assetType;
  }

  private static applyFilters(
    transactions: ProcessedTransaction[],
    filter: TransactionFilter
  ): ProcessedTransaction[] {
    return transactions.filter(tx => {
      if (filter.types && !filter.types.includes(tx.type)) return false;
      if (filter.categories && !filter.categories.includes(tx.category))
        return false;
      if (filter.success !== undefined && tx.success !== filter.success)
        return false;
      if (filter.currency && tx.currency !== filter.currency) return false;
      if (filter.dateFrom && new Date(tx.timestamp) < new Date(filter.dateFrom))
        return false;
      if (filter.dateTo && new Date(tx.timestamp) > new Date(filter.dateTo))
        return false;
      if (
        filter.minAmount &&
        (!tx.amount || parseFloat(tx.amount) < filter.minAmount)
      )
        return false;
      if (
        filter.maxAmount &&
        (!tx.amount || parseFloat(tx.amount) > filter.maxAmount)
      )
        return false;
      if (
        filter.verifiedOnly &&
        tx.asset_type &&
        !isVerifiedAsset(tx.asset_type)
      )
        return false;

      return true;
    });
  }

  private static groupByField(
    items: any[],
    field: string
  ): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }
}
