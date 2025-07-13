import { NextRequest, NextResponse } from 'next/server';
import { getWalletNFTs } from '@/lib/services/blockchain/portfolio/portfolio-service';
import {
  withValidation,
  PortfolioNFTsQuerySchema,
} from '@/lib/utils/validation';
import { withAPIHandler, createCacheHeaders } from '@/lib/utils/api-response';
// Rate limiting removed - not compatible with serverless architecture
import { NFTsResponse, StandardAPIResponse } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';

// Set max duration for Vercel serverless function
export const maxDuration = 30; // 30 seconds

const handler = withValidation(PortfolioNFTsQuerySchema)(async ({
  query,
  request,
}) => {
  const startTime = Date.now();

  return await withAPIHandler(
    async (): Promise<NFTsResponse> => {
      if (!query) throw new Error('Missing query parameters');

      const { walletAddress, limit, offset } = query;

      logger.info(
        `[NFTs API] Fetching NFTs for ${walletAddress}, limit: ${limit}, offset: ${offset}`
      );

      // Call the service directly
      const nfts = await getWalletNFTs(walletAddress, limit || 30, offset || 0);

      logger.info(`[NFTs API] Retrieved ${nfts.length} NFTs`);

      return {
        nfts,
        totalCount: nfts.length,
        hasMore: nfts.length === (limit || 30),
      };
    },
    {
      startTime,
      operation: 'Portfolio NFTs Fetch',
      apiCalls: 1,
    }
  )();
});

export async function GET(request: NextRequest) {
  const response = await handler(request);

  // Add caching headers for NFT data
  const cacheHeaders = createCacheHeaders(
    60, // 1 minute cache (NFTs change less frequently)
    120, // 2 minutes stale-while-revalidate
    {
      'X-Service': 'portfolio-nfts',
      'X-API-Version': '1.0',
    }
  );

  Object.entries(cacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
