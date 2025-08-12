import { getEnvVar } from "@/lib/config/validate-env";
import { API_ENDPOINTS, ERROR_MESSAGES } from "@/lib/constants";
import { graphQLRequest } from "@/lib/utils/api/fetch-utils";
import { logger } from "@/lib/utils/core/logger";

// GraphQL queries for asset services
export const QUERIES = {
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

  CURRENT_FUNGIBLE_ASSET_BALANCES_AGGREGATE: `
    query GetFungibleAssetBalances($assetType: String!) {
      current_fungible_asset_balances(
        where: { 
          asset_type: { _eq: $assetType },
          amount: { _gt: 0 }
        }
        limit: 1000
      ) {
        amount
        asset_type
        owner_address
      }
    }
  `,

  CURRENT_FUNGIBLE_ASSET_BALANCES: `
    query GetAssetBalances($assetTypes: [String!]!) {
      current_fungible_asset_balances(
        where: { 
          asset_type: { _in: $assetTypes },
          amount: { _gt: 0 }
        }
      ) {
        amount
        asset_type
        owner_address
        metadata {
          name
          symbol
          decimals
          icon_uri
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
  _options?: {
    includeAuth?: boolean;
    timeout?: number;
  },
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Always include auth for better rate limits
  const apiKey = getEnvVar("APTOS_BUILD_SECRET");
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const response = await graphQLRequest<GraphQLResponse<T>>(
      API_ENDPOINTS.APTOS_INDEXER,
      { query, variables },
      { headers },
    );

    if (response.errors && response.errors.length > 0) {
      const errorMessage = response.errors.map((e) => e.message).join(", ");
      logger.error("GraphQL query errors:", response.errors);
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
      `${ERROR_MESSAGES.INDEXER_ERROR}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function getCoinSupply(coinType: string): Promise<number> {
  try {
    const data = await executeGraphQLQuery<{
      coin_supply: Array<{ supply: string }>;
    }>(QUERIES.COIN_SUPPLY, { coinType });

    if (data.coin_supply && data.coin_supply.length > 0) {
      return parseFloat(data.coin_supply[0].supply);
    }
    return 0;
  } catch (error) {
    logger.error("Failed to get coin supply:", { coinType, error });
    return 0;
  }
}

export async function getFungibleAssetSupply(assetType: string): Promise<{
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
    const metadataData = await executeGraphQLQuery<{
      fungible_asset_metadata: Array<{
        name: string;
        symbol: string;
        decimals: number;
        icon_uri?: string;
      }>;
    }>(QUERIES.FUNGIBLE_ASSET_METADATA, { assetType }, { includeAuth: true });

    // Get aggregated supply
    const supplyData = await executeGraphQLQuery<{
      current_fungible_asset_balances_aggregate: {
        aggregate: {
          sum: {
            amount: string | null;
          };
        };
      };
    }>(QUERIES.FUNGIBLE_ASSET_SUPPLY, { assetType }, { includeAuth: true });

    const totalSupply = parseFloat(
      supplyData.current_fungible_asset_balances_aggregate?.aggregate?.sum
        ?.amount || "0",
    );

    logger.info(`Total supply for ${assetType}: ${totalSupply}`);

    if (
      metadataData.fungible_asset_metadata &&
      metadataData.fungible_asset_metadata.length > 0
    ) {
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
    logger.error("Failed to get fungible asset supply:", { assetType, error });
    return { supply: 0 };
  }
}
