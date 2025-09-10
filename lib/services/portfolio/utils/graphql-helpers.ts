import { getEnvVar } from "@/lib/config/validate-env";
import { logger } from "@/lib/utils/core/logger";
import { graphQLRequest } from "@/lib/utils/fetch-utils";

import { APTOS_INDEXER_URL, ERROR_MESSAGES } from "../constants";

// GraphQL query definitions
export const QUERIES = {
  WALLET_ASSETS: `
    query GetWalletAssets($ownerAddress: String!) {
      current_fungible_asset_balances(
        where: { 
          owner_address: { _eq: $ownerAddress }
          amount: { _gt: "0" }
        }
        order_by: { last_transaction_timestamp: desc }
      ) {
        amount
        asset_type
        is_frozen
        is_primary
        last_transaction_timestamp
        last_transaction_version
        metadata {
          name
          symbol
          decimals
          icon_uri
          project_uri
          creator_address
        }
        token_standard
      }
      fungible_asset_metadata {
        asset_type
        creator_address
        decimals
        icon_uri
        last_transaction_timestamp
        last_transaction_version
        name
        project_uri
        symbol
        token_standard
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

  WALLET_TRANSACTIONS: `
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
  `,

  WALLET_NFTS: `
    query GetWalletNFTs($ownerAddress: String!, $limit: Int!, $offset: Int!) {
      current_token_ownerships_v2(
        where: { 
          owner_address: { _eq: $ownerAddress }
        }
        limit: $limit
        offset: $offset
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
          owner_address: { _eq: $ownerAddress }
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
};

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: Record<string, any>;
  }>;
}

export async function executeGraphQLQuery<T>(
  query: string,
  variables: Record<string, any>,
  options?: {
    includeAuth?: boolean;
    timeout?: number;
  }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.includeAuth) {
    const apiKey = getEnvVar("APTOS_BUILD_SECRET");
    logger.info("[GraphQL] Auth check:", {
      includeAuth: options?.includeAuth,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
    });
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
  }

  try {
    const response = await graphQLRequest<GraphQLResponse<T>>(
      APTOS_INDEXER_URL,
      {
        query,
        variables,
      },
      headers
    );

    if (response.errors && response.errors.length > 0) {
      const errorMessage = response.errors.map((e) => e.message).join(", ");
      logger.error("GraphQL query errors:", {
        errors: response.errors,
        query: query.slice(0, 200),
        variables,
      });
      throw new Error(`GraphQL errors: ${errorMessage}`);
    }

    if (!response.data) {
      throw new Error("No data returned from GraphQL query");
    }

    return response.data;
  } catch (error) {
    logger.error("GraphQL query failed:", {
      error,
      query: query.slice(0, 100),
      variables,
    });
    throw new Error(
      `${ERROR_MESSAGES.INDEXER_ERROR}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export function buildPaginationVariables(
  page: number = 1,
  limit: number = 25
): { limit: number; offset: number } {
  return {
    limit,
    offset: (page - 1) * limit,
  };
}
