import { NextRequest, NextResponse } from 'next/server';
import { getAllWalletNFTs } from '@/lib/services/blockchain/portfolio/portfolio-service';
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

      const { walletAddress } = query;

      logger.info(`[NFTs API] Fetching ALL NFTs for ${walletAddress}`);

      // Call the service to get all NFTs exhaustively
      const nfts = await getAllWalletNFTs(walletAddress);

      logger.info(`[NFTs API] Retrieved ${nfts.length} NFTs`);

      return {
        nfts,
        totalCount: nfts.length,
        hasMore: false, // We fetched everything
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
