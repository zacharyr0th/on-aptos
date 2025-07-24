import { logger } from '@/lib/utils/logger';

import { QUERY_LIMITS } from '../constants';
import type { NFT, PaginatedResponse } from '../types';
import {
  executeGraphQLQuery,
  QUERIES,
  buildPaginationVariables,
} from '../utils/graphql-helpers';

// Add rate limiting delay
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds for retry

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429 && retries > 0) {
      logger.warn(`Rate limited, retrying in ${RETRY_DELAY}ms... (${retries} retries left)`);
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      logger.warn(`Request failed, retrying... (${retries} retries left)`);
      await sleep(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export class NFTService {
  static async getWalletNFTs(
    address: string,
    page: number = 1,
    limit: number = QUERY_LIMITS.NFT
  ): Promise<PaginatedResponse<NFT>> {
    try {
      logger.info(
        `[NFTService] Getting NFTs for address: ${address}, page: ${page}, limit: ${limit}`
      );
      const { limit: queryLimit, offset } = buildPaginationVariables(
        page,
        limit
      );

      // Add rate limiting delay
      await sleep(RATE_LIMIT_DELAY);
      
      // Use direct fetch with retry logic
      const response = await fetchWithRetry(
        'https://api.mainnet.aptoslabs.com/v1/graphql',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: QUERIES.WALLET_NFTS,
            variables: {
              ownerAddress: address,
              limit: queryLimit + 1, // Fetch one extra to check if there are more
              offset,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          `GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      // Get v2 NFTs only
      const nfts = result.data.current_token_ownerships_v2 || [];
      logger.info(`[NFTService] Raw response has ${nfts.length} NFTs`);

      const hasMore = nfts.length > queryLimit;

      // Remove the extra item if present
      if (hasMore) {
        nfts.pop();
      }

      logger.info(
        `[NFTService] Processing ${nfts.length} NFTs after pagination`
      );

      // Process NFTs
      const processedNFTs: NFT[] = nfts.map((ownership: any) => {
        const tokenData = ownership.current_token_data;
        const collection = tokenData?.current_collection;

        return {
          token_data_id: ownership.token_data_id,
          token_name: tokenData?.token_name || 'Unknown NFT',
          collection_name: collection?.collection_name || 'Unknown Collection',
          token_uri: tokenData?.token_uri || '',
          description: tokenData?.description,
          property_version_v1: ownership.property_version_v1,
          amount: parseInt(ownership.amount),
          cdn_image_uri: undefined, // Will be extracted from token_uri if needed
          cdn_animation_uri: undefined,
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
      });

      return {
        data: processedNFTs,
        hasMore,
        nextCursor: hasMore ? String(page + 1) : undefined,
      };
    } catch (error) {
      logger.error('Failed to fetch wallet NFTs:', error);
      throw error;
    }
  }

  static async getTotalNFTCount(address: string): Promise<number> {
    try {
      // Add rate limiting delay
      await sleep(RATE_LIMIT_DELAY);
      
      // Use direct fetch with retry logic
      const response = await fetchWithRetry(
        'https://api.mainnet.aptoslabs.com/v1/graphql',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: QUERIES.WALLET_NFTS_COUNT,
            variables: { ownerAddress: address },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          `GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`
        );
      }

      return result.data.current_token_ownerships_v2_aggregate.aggregate.count;
    } catch (error) {
      logger.error('Failed to get NFT count:', error);
      // Return 0 on error to allow the app to continue
      return 0;
    }
  }

  static async getAllWalletNFTs(address: string): Promise<NFT[]> {
    logger.info(
      `[NFTService] getAllWalletNFTs starting for address: ${address}`
    );

    // First get the total count
    const totalCount = await this.getTotalNFTCount(address);
    logger.info(`[NFTService] Total NFTs to fetch: ${totalCount}`);

    const allNFTs: NFT[] = [];
    const limit = 100; // Fetch in batches of 100
    let offset = 0;

    while (offset < totalCount) {
      try {
        const page = Math.floor(offset / limit) + 1;
        logger.info(
          `[NFTService] Fetching NFTs ${offset + 1} to ${Math.min(offset + limit, totalCount)}...`
        );

        const response = await this.getWalletNFTs(address, page, limit);
        logger.info(
          `[NFTService] Page ${page} returned ${response.data.length} NFTs`
        );
        
        // Add a small delay between batches to avoid rate limiting
        if (offset + limit < totalCount) {
          await sleep(500); // 500ms between batches
        }

        allNFTs.push(...response.data);
        offset += limit;

        // Safety check to prevent infinite loops
        if (page > 100) {
          logger.warn(
            `[NFTService] Breaking at page ${page} to prevent infinite loop`
          );
          break;
        }
      } catch (error) {
        logger.error(
          `[NFTService] Failed to fetch NFTs at offset ${offset}:`,
          error
        );
        logger.error(`Failed to fetch NFTs at offset ${offset}:`, error);
        break;
      }
    }

    logger.info(
      `[NFTService] getAllWalletNFTs completed. Total NFTs: ${allNFTs.length}`
    );
    return allNFTs;
  }

  static async getNFTTransferHistory(tokenDataId: string, limit: number = 50) {
    try {
      const response = await executeGraphQLQuery<{
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
      }>(QUERIES.NFT_TRANSFER_HISTORY, {
        tokenDataId,
        limit,
      });

      return response.token_activities_v2 || [];
    } catch (error) {
      logger.error('Failed to fetch NFT transfer history:', error);
      throw error;
    }
  }
}
