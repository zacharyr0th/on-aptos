import { PORTFOLIO_QUERY_LIMITS } from "@/lib/constants";

import {
  UnifiedGraphQLClient,
  UNIFIED_QUERIES,
} from "../../shared/utils/unified-graphql-client";
import type { NFT, PaginatedResponse } from "../types";

// GraphQL Response Types
interface GraphQLError {
  message: string;
  extensions?: Record<string, unknown>;
}

interface NFTOwnership {
  current_token_data: {
    token_data_id: string;
    token_name: string;
    description?: string;
    token_uri?: string;
    cdn_image_uri?: string;
    current_collection?: {
      collection_name: string;
      description?: string;
      uri?: string;
      creator_address?: string;
    };
  };
  amount: string;
  owner_address: string;
  last_transaction_version?: string;
  last_transaction_timestamp?: string;
  property_version?: string;
  table_type?: string;
  token_standard?: string;
}

// Rate limiting configuration
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second initial retry delay
const MAX_RETRY_DELAY = 32000; // 32 seconds max retry delay
const RATE_LIMIT_THRESHOLD = 10; // Only delay after this many requests
let requestCount = 0;
let lastResetTime = Date.now();

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
  attempt = 0,
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (response.status === 429 && retries > 0) {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s
      const delay = Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, attempt),
        MAX_RETRY_DELAY,
      );
        `Rate limited (429), retrying in ${delay}ms... (${retries} retries left)`,
      );
      await sleep(delay);
      return fetchWithRetry(url, options, retries - 1, attempt + 1);
    }

    if (!response.ok && response.status >= 500 && retries > 0) {
      // Server errors - retry with backoff
      const delay = Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, attempt),
        MAX_RETRY_DELAY,
      );
        `Server error (${response.status}), retrying in ${delay}ms... (${retries} retries left)`,
      );
      await sleep(delay);
      return fetchWithRetry(url, options, retries - 1, attempt + 1);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      const delay = Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, attempt),
        MAX_RETRY_DELAY,
      );
        `Request failed, retrying in ${delay}ms... (${retries} retries left)`,
        error,
      );
      await sleep(delay);
      return fetchWithRetry(url, options, retries - 1, attempt + 1);
    }
    throw error;
  }
}

export class NFTService {
  static async getWalletNFTs(
    address: string,
    page: number = 1,
    limit: number = PORTFOLIO_QUERY_LIMITS.NFT,
  ): Promise<PaginatedResponse<NFT>> {
    try {
        `[NFTService] Getting NFTs for address: ${address}, page: ${page}, limit: ${limit}`,
      );
      const { limit: queryLimit, offset } =
        UnifiedGraphQLClient.buildPaginationVariables(page, limit);

      // Only add delay if we're approaching rate limits
      const now = Date.now();
      if (now - lastResetTime > 60000) {
        // Reset counter every minute
        requestCount = 0;
        lastResetTime = now;
      }

      requestCount++;
      if (requestCount > RATE_LIMIT_THRESHOLD) {
        // Progressive delay based on request count
        const delay = Math.min(
          (requestCount - RATE_LIMIT_THRESHOLD) * 500,
          5000,
        );
        await sleep(delay);
      }

      // Build headers with auth
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const apiKey = process.env.APTOS_BUILD_SECRET;
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      // Use direct fetch with retry logic
      const response = await fetchWithRetry(
        "https://api.mainnet.aptoslabs.com/v1/graphql",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: UNIFIED_QUERIES.WALLET_NFTS,
            variables: {
              ownerAddress: address,
              limit: queryLimit + 1, // Fetch one extra to check if there are more
              offset,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          `GraphQL errors: ${result.errors.map((e: GraphQLError) => e.message).join(", ")}`,
        );
      }

      // Get v2 NFTs only
      const nfts = result.data.current_token_ownerships_v2 || [];

      const hasMore = nfts.length > queryLimit;

      // Remove the extra item if present
      if (hasMore) {
        nfts.pop();
      }

        `[NFTService] Processing ${nfts.length} NFTs after pagination`,
      );

      // Process NFTs
      const processedNFTs: NFT[] = await Promise.all(
        nfts.map(async (ownership: NFTOwnership) => {
          const tokenData = ownership.current_token_data;
          const collection = tokenData?.current_collection;

          // Extract image URL from token URI
          const cdnImageUri = await extractNFTImageUrl(
            tokenData?.token_uri,
            tokenData?.cdn_asset_uris?.cdn_image_uri,
          );

          return {
            token_data_id: ownership.token_data_id,
            token_name: tokenData?.token_name || "Unknown NFT",
            collection_name:
              collection?.collection_name || "Unknown Collection",
            token_uri: tokenData?.token_uri || "",
            description: tokenData?.description,
            property_version_v1: ownership.property_version_v1,
            amount: parseInt(ownership.amount),
            cdn_image_uri: cdnImageUri,
            cdn_animation_uri: tokenData?.cdn_asset_uris?.cdn_animation_uri,
            collection_description: collection?.description,
            creator_address: collection?.creator_address,
            collection_uri: collection?.uri,
            last_transaction_version: ownership.last_transaction_version,
            last_transaction_timestamp: ownership.last_transaction_timestamp,
            token_standard: ownership.token_standard,
            is_soulbound: ownership.is_soulbound_v2,
            collection_id: tokenData?.collection_id,
            supply: tokenData?.supply,
            maximum: tokenData?.maximum,
            current_supply: collection?.current_supply,
            max_supply: collection?.max_supply,
          };
        }),
      );

      return {
        data: processedNFTs,
        hasMore,
        nextCursor: hasMore ? String(page + 1) : undefined,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getTotalNFTCount(address: string): Promise<number> {
    try {
      // Add small delay to avoid rate limiting
      await sleep(500);

      // Build headers with auth
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const apiKey = process.env.APTOS_BUILD_SECRET;
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      // Use direct fetch with retry logic
      const response = await fetchWithRetry(
        "https://api.mainnet.aptoslabs.com/v1/graphql",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: UNIFIED_QUERIES.WALLET_NFTS_COUNT,
            variables: { ownerAddress: address },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          `GraphQL errors: ${result.errors.map((e: GraphQLError) => e.message).join(", ")}`,
        );
      }

      return result.data.current_token_ownerships_v2_aggregate.aggregate.count;
    } catch (error) {
      // Return 0 on error to allow the app to continue
      return 0;
    }
  }

  static async getAllWalletNFTs(address: string): Promise<NFT[]> {
      `[NFTService] getAllWalletNFTs starting for address: ${address}`,
    );

    // First get the total count
    const totalCount = await this.getTotalNFTCount(address);

    const allNFTs: NFT[] = [];
    const limit = 500; // Larger batch size for efficiency
    const numPages = Math.ceil(totalCount / limit);

    // Fetch all pages in parallel (with reasonable limit)
    const maxParallel = 3;

    for (let i = 0; i < numPages; i += maxParallel) {
      const pageBatch = [];
      for (let j = 0; j < maxParallel && i + j < numPages; j++) {
        const page = i + j + 1;
          `[NFTService] Queuing page ${page} (NFTs ${(page - 1) * limit + 1} to ${Math.min(page * limit, totalCount)})`,
        );
        pageBatch.push(this.getWalletNFTs(address, page, limit));
      }

      try {
        const results = await Promise.all(pageBatch);
        results.forEach((response, idx) => {
            `[NFTService] Page ${i + idx + 1} returned ${response.data.length} NFTs`,
          );
          allNFTs.push(...response.data);
        });

          `[NFTService] Completed batch ${Math.floor(i / maxParallel) + 1}, total NFTs so far: ${allNFTs.length}/${totalCount}`,
        );

        // Small delay between parallel batches to avoid rate limiting
        if (i + maxParallel < numPages && numPages > maxParallel) {
          await sleep(300);
        }
      } catch (error) {
          `[NFTService] Failed to fetch NFT batch at pages ${i + 1}-${Math.min(i + maxParallel, numPages)}:`,
          error,
        );
        break;
      }
    }

      `[NFTService] getAllWalletNFTs completed. Total NFTs: ${allNFTs.length}`,
    );
    return allNFTs;
  }

  static async getCollectionStats(address: string): Promise<{
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  }> {
    try {
      // Build headers with auth
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const apiKey = process.env.APTOS_BUILD_SECRET;
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const query = `
        query GetCollectionStats($ownerAddress: String!) {
          current_token_ownerships_v2(
            where: { 
              owner_address: { _eq: $ownerAddress },
              amount: { _gt: "0" }
            }
          ) {
            current_token_data {
              current_collection {
                collection_name
              }
            }
          }
        }
      `;

      const response = await fetchWithRetry(
        "https://api.mainnet.aptoslabs.com/v1/graphql",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            query,
            variables: { ownerAddress: address },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          `GraphQL errors: ${result.errors.map((e: GraphQLError) => e.message).join(", ")}`,
        );
      }

      // Count NFTs by collection
      const collectionMap: Record<string, number> = {};
      const ownerships = result.data.current_token_ownerships_v2 || [];

      ownerships.forEach((ownership: NFTOwnership) => {
        const collectionName =
          ownership.current_token_data?.current_collection?.collection_name ||
          "Unknown Collection";
        collectionMap[collectionName] =
          (collectionMap[collectionName] || 0) + 1;
      });

      const collections = Object.entries(collectionMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      return {
        collections,
        totalCollections: collections.length,
      };
    } catch (error) {
      return { collections: [], totalCollections: 0 };
    }
  }

  static async getNFTTransferHistory(tokenDataId: string, limit: number = 50) {
    try {
      const response = await UnifiedGraphQLClient.query<{
        token_activities_v2: Array<{
          transaction_version: string;
          transaction_timestamp: string;
          from_address?: string;
          to_address?: string;
          token_amount: string;
          property_version_v1: number;
          transfer_type: string;
          is_transaction_success: boolean;
        }>;
      }>(
        UNIFIED_QUERIES.NFT_TRANSFER_HISTORY,
        {
          tokenDataId,
          limit,
        },
        {
          includeAuth: true, // Use API key for auth
        },
      );

      return response.token_activities_v2 || [];
    } catch (error) {
      throw error;
    }
  }
}
