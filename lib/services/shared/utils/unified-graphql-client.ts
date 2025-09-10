import { getEnvVar } from "@/lib/config/validate-env";
import { ENDPOINTS, ERROR_MESSAGES } from "@/lib/constants";
import { graphQLRequest } from "@/lib/utils/api/fetch-utils";
import { logger } from "@/lib/utils/core/logger";

/**
 * Unified GraphQL client that standardizes all Aptos Indexer requests
 * Consolidates request logic and provides consistent error handling
 */

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: Record<string, any>;
  }>;
}

export interface QueryConfig {
  includeAuth?: boolean;
  timeout?: number;
  retries?: number;
  cacheTTL?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationVariables {
  limit: number;
  offset: number;
}

// Additional GraphQL queries from legacy graphql-helpers
export const LEGACY_QUERIES = {
  COIN_SUPPLY: `
    query GetCoinSupply($coinType: String!) {
      coin_supply(where: { coin_type: { _eq: $coinType } }) {
        coin_type
        supply
        last_transaction_timestamp
        last_transaction_version
      }
    }
  `,

  FUNGIBLE_ASSET_METADATA: `
    query GetFungibleAssetMetadata($assetType: String!) {
      fungible_asset_metadata(where: { asset_type: { _eq: $assetType } }) {
        asset_type
        name
        symbol
        decimals
        icon_uri
        last_transaction_timestamp
        last_transaction_version
      }
    }
  `,

  FUNGIBLE_ASSET_SUPPLY: `
    query GetFungibleAssetSupply($assetType: String!) {
      current_fungible_asset_balances_aggregate(
        where: { 
          asset_type: { _eq: $assetType },
          amount: { _gt: "0" }
        }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
    }
  `,

  BATCH_COIN_INFO: `
    query GetBatchCoinInfo($coinTypes: [String!]!) {
      coin_infos(where: { coin_type: { _in: $coinTypes } }) {
        coin_type
        name
        symbol
        decimals
      }
    }
  `,
};

/**
 * Unified GraphQL queries - centralized location for all queries
 */
export const UNIFIED_QUERIES = {
  // Asset queries - use only the current non-deprecated fungible asset balances table
  WALLET_ASSETS: `
    query GetWalletAssets($ownerAddress: String!) {
      current_fungible_asset_balances(
        where: { 
          owner_address: { _eq: $ownerAddress },
          amount: { _gt: "0" }
        },
        order_by: { last_transaction_timestamp: desc }
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
  `,

  // NFT queries
  WALLET_NFTS: `
    query GetWalletNFTs($ownerAddress: String!, $limit: Int!, $offset: Int!) {
      current_token_ownerships_v2(
        where: { 
          owner_address: { _eq: $ownerAddress },
          amount: { _gt: "0" }
        },
        limit: $limit,
        offset: $offset,
        order_by: { last_transaction_timestamp: desc }
      ) {
        amount
        token_data_id
        property_version_v1
        last_transaction_timestamp
        last_transaction_version
        is_soulbound_v2
        token_standard
        current_token_data {
          token_name
          description
          token_uri
          collection_id
          decimals
          supply
          maximum
          cdn_asset_uris {
            cdn_image_uri
            cdn_animation_uri
          }
          current_collection {
            collection_name
            description
            uri
            creator_address
            current_supply
            max_supply
          }
        }
      }
    }
  `,

  WALLET_NFTS_COUNT: `
    query GetWalletNFTsCount($ownerAddress: String!) {
      current_token_ownerships_v2_aggregate(
        where: { 
          owner_address: { _eq: $ownerAddress },
          amount: { _gt: "0" }
        }
      ) {
        aggregate {
          count
        }
      }
    }
  `,

  NFT_TRANSFER_HISTORY: `
    query GetNFTTransferHistory($tokenDataId: String!, $limit: Int!) {
      token_activities_v2(
        where: {
          token_data_id: { _eq: $tokenDataId }
          is_transaction_success: { _eq: true }
        }
        order_by: { transaction_timestamp: desc }
        limit: $limit
      ) {
        transaction_version
        transaction_timestamp
        from_address
        to_address
        token_amount
        property_version_v1
        transfer_type
        is_transaction_success
      }
    }
  `,

  // Transaction queries - directly fetch detailed transaction data
  WALLET_TRANSACTIONS: `
    query GetWalletTransactions($ownerAddress: String!, $limit: Int!) {
      account_transactions(
        where: { 
          account_address: { _eq: $ownerAddress }
        }
        order_by: { transaction_version: desc }
        limit: $limit
      ) {
        transaction_version
        account_address
        user_transaction {
          sender
          timestamp
          success
          gas_used
          gas_unit_price
          max_gas_amount
          entry_function_id_str
          payload
        }
      }
    }
  `,

  HISTORICAL_ACTIVITIES: `
    query GetHistoricalActivities($ownerAddress: String!, $startTime: timestamp!) {
      fungible_asset_activities(
        where: { 
          owner_address: { _eq: $ownerAddress },
          transaction_timestamp: { _gte: $startTime }
        }
        order_by: { transaction_timestamp: desc }
      ) {
        transaction_version
        transaction_timestamp
        type
        amount
        asset_type
        entry_function_id_str
        block_height
        is_transaction_success
      }
    }
  `,

  // DeFi/Protocol queries
  PROTOCOL_BALANCES: `
    query GetProtocolBalances($ownerAddress: String!, $addressPattern: String!) {
      current_fungible_asset_balances(
        where: {
          owner_address: { _eq: $ownerAddress },
          amount: { _gt: "0" },
          asset_type: { _regex: $addressPattern }
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

  // Account resource query for comprehensive positions
  ACCOUNT_RESOURCES: `
    query GetAccountResources($address: String!) {
      move_resources(
        where: { address: { _eq: $address } }
      ) {
        address
        type
        data
      }
    }
  `,
} as const;

export class UnifiedGraphQLClient {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly DEFAULT_CACHE_TTL = 30 * 1000; // 30 seconds

  /**
   * Execute a GraphQL query with unified error handling and auth
   */
  static async query<T>(
    queryString: string,
    variables: Record<string, any> = {},
    config: QueryConfig = {}
  ): Promise<T> {
    const {
      includeAuth = true,
      retries = 1,
      cacheTTL = UnifiedGraphQLClient.DEFAULT_CACHE_TTL,
    } = config;

    // Check cache if TTL is set
    if (cacheTTL > 0) {
      const cacheKey = `${queryString}:${JSON.stringify(variables)}`;
      const cached = UnifiedGraphQLClient.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        logger.debug("Returning cached GraphQL result");
        return cached.data;
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const apiKey = getEnvVar("APTOS_BUILD_SECRET");
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
        logger.info(`[GraphQL] Using API key: ${apiKey.substring(0, 10)}...`);
      } else {
        logger.warn("[GraphQL] No API key found - making unauthenticated request");
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await graphQLRequest<GraphQLResponse<T>>(
          ENDPOINTS.APTOS_INDEXER,
          {
            query: queryString,
            variables,
          },
          { headers }
        );

        if (response.errors && response.errors.length > 0) {
          const errorMessage = response.errors.map((e) => e.message).join(", ");
          const error = new Error(`GraphQL errors: ${errorMessage}`);

          logger.error("GraphQL query errors:", {
            errors: response.errors,
            query: queryString.slice(0, 200),
            variables,
            attempt: attempt + 1,
          });

          lastError = error;

          // Don't retry on GraphQL-level errors
          break;
        }

        if (!response.data) {
          const error = new Error("No data returned from GraphQL query");
          lastError = error;

          if (attempt < retries) {
            logger.warn(
              `GraphQL query returned no data, retrying... (${attempt + 1}/${retries + 1})`
            );
            await UnifiedGraphQLClient.delay(1000 * (attempt + 1)); // Exponential backoff
            continue;
          }
          break;
        }

        // Cache successful result
        if (cacheTTL > 0) {
          const cacheKey = `${queryString}:${JSON.stringify(variables)}`;
          UnifiedGraphQLClient.cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now(),
          });
        }

        logger.debug("GraphQL query successful", {
          query: queryString.slice(0, 100),
          variables,
        });

        return response.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.error("GraphQL query failed:", {
          error: lastError,
          query: queryString.slice(0, 100),
          variables,
          attempt: attempt + 1,
        });

        if (attempt < retries) {
          logger.info(`Retrying GraphQL query... (${attempt + 1}/${retries + 1})`);
          await UnifiedGraphQLClient.delay(1000 * (attempt + 1));
        }
      }
    }

    throw new Error(`${ERROR_MESSAGES.INDEXER_ERROR}: ${lastError?.message || "Unknown error"}`);
  }

  /**
   * Execute a query with pagination support
   */
  static async queryWithPagination<T>(
    queryString: string,
    variables: Record<string, any> = {},
    pagination: PaginationParams = {},
    config: QueryConfig = {}
  ): Promise<T> {
    const paginationVars = UnifiedGraphQLClient.buildPaginationVariables(
      pagination.page,
      pagination.limit
    );

    return UnifiedGraphQLClient.query<T>(queryString, { ...variables, ...paginationVars }, config);
  }

  /**
   * Batch multiple queries efficiently
   */
  static async batchQueries<T extends Record<string, any>>(
    queries: Array<{
      name: string;
      query: string;
      variables?: Record<string, any>;
      config?: QueryConfig;
    }>
  ): Promise<T> {
    const results = await Promise.allSettled(
      queries.map(async ({ name, query, variables, config }) => {
        try {
          const result = await UnifiedGraphQLClient.query(query, variables, config);
          return { name, result, status: "fulfilled" as const };
        } catch (error) {
          return { name, error, status: "rejected" as const };
        }
      })
    );

    const batchResult = {} as T;

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { name, result: data } = result.value;
        (batchResult as any)[name] = data;
      } else {
        const error = result.reason;
        logger.error(`Batch query failed:`, error);
        // For rejected promises, we don't have access to the query name
        // This suggests the batch structure might need to be redesigned
      }
    }

    return batchResult;
  }

  /**
   * Build pagination variables from page/limit
   */
  static buildPaginationVariables(page: number = 1, limit: number = 25): PaginationVariables {
    return {
      limit,
      offset: (page - 1) * limit,
    };
  }

  /**
   * Clear the query cache
   */
  static clearCache(): void {
    UnifiedGraphQLClient.cache.clear();
    logger.info("GraphQL cache cleared");
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    entries: Array<{ key: string; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(UnifiedGraphQLClient.cache.entries()).map(([key, value]) => ({
      key: key.slice(0, 100), // Truncate for readability
      age: now - value.timestamp,
    }));

    return {
      size: UnifiedGraphQLClient.cache.size,
      entries,
    };
  }

  /**
   * Utility delay function for retries
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Legacy helper functions consolidated from graphql-helpers
   */
  static async getCoinSupply(coinType: string): Promise<number> {
    try {
      const data = await UnifiedGraphQLClient.query<{
        coin_supply: Array<{ supply: string }>;
      }>(LEGACY_QUERIES.COIN_SUPPLY, { coinType });

      if (data.coin_supply && data.coin_supply.length > 0) {
        return parseFloat(data.coin_supply[0].supply);
      }
      return 0;
    } catch (error) {
      logger.error("Failed to get coin supply:", { coinType, error });
      return 0;
    }
  }

  static async getFungibleAssetSupply(assetType: string): Promise<{
    supply: number;
    metadata?: {
      name: string;
      symbol: string;
      decimals: number;
      icon_uri?: string;
    };
  }> {
    try {
      logger.info("Getting fungible asset supply for:", assetType);

      // Get metadata first
      const metadataData = await UnifiedGraphQLClient.query<{
        fungible_asset_metadata: Array<{
          name: string;
          symbol: string;
          decimals: number;
          icon_uri?: string;
        }>;
      }>(LEGACY_QUERIES.FUNGIBLE_ASSET_METADATA, { assetType }, { includeAuth: true });

      // Get aggregated supply
      const supplyData = await UnifiedGraphQLClient.query<{
        current_fungible_asset_balances_aggregate: {
          aggregate: {
            sum: {
              amount: string | null;
            };
          };
        };
      }>(LEGACY_QUERIES.FUNGIBLE_ASSET_SUPPLY, { assetType }, { includeAuth: true });

      const totalSupply = parseFloat(
        supplyData.current_fungible_asset_balances_aggregate?.aggregate?.sum?.amount || "0"
      );

      logger.info(`Total supply for ${assetType}: ${totalSupply}`);

      if (metadataData.fungible_asset_metadata && metadataData.fungible_asset_metadata.length > 0) {
        const asset = metadataData.fungible_asset_metadata[0];
        return {
          supply: totalSupply,
          metadata: {
            name: asset.name,
            symbol: asset.symbol,
            decimals: asset.decimals,
            icon_uri: asset.icon_uri,
          },
        };
      }
      return { supply: totalSupply };
    } catch (error) {
      logger.error("Failed to get fungible asset supply:", {
        assetType,
        error,
      });
      return { supply: 0 };
    }
  }

  /**
   * Health check for the GraphQL endpoint
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // Simple query to test connectivity
      await UnifiedGraphQLClient.query(
        `query HealthCheck { 
          processor_status(limit: 1) { 
            processor 
          } 
        }`,
        {},
        { includeAuth: false, cacheTTL: 0 }
      );
      return true;
    } catch (error) {
      logger.error("GraphQL health check failed:", error);
      return false;
    }
  }
}
