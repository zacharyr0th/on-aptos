import { NextRequest, NextResponse } from 'next/server';
import { getWalletAssets } from '@/lib/services/blockchain/portfolio/portfolio-service';
import {
  withValidation,
  PortfolioAssetsQuerySchema,
} from '@/lib/utils/validation';
import {
  buildSuccessResponse,
  withAPIHandler,
  createCacheHeaders,
} from '@/lib/utils/api-response';
// Rate limiting removed - not compatible with serverless architecture
import { PortfolioAssetsResponse, StandardAPIResponse } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';

// Set max duration for Vercel serverless function
export const maxDuration = 30; // 30 seconds

const handler = withValidation(PortfolioAssetsQuerySchema)(async ({
  query,
  request,
}) => {
  const startTime = Date.now();

  return await withAPIHandler(
    async (): Promise<PortfolioAssetsResponse> => {
      if (!query) throw new Error('Missing query parameters');

      const { walletAddress, showOnlyVerified } = query;

      logger.info(
        `[Assets API] Fetching assets for ${walletAddress}, showOnlyVerified: ${showOnlyVerified}`
      );

      // Call the service directly - showOnlyVerified is a string from query params
      const assets = await getWalletAssets(
        walletAddress,
        showOnlyVerified === 'true' || showOnlyVerified === true
      );

      logger.info(`[Assets API] Retrieved ${assets.length} assets`);

      // Calculate total portfolio value
      const totalValue = assets.reduce(
        (sum, asset) => sum + (asset.value || 0),
        0
      );

      return {
        assets,
        totalValue,
        assetCount: assets.length,
      };
    },
    {
      startTime,
      operation: 'Portfolio Assets Fetch',
      apiCalls: 1,
    }
  )();
});

export async function GET(request: NextRequest) {
  const response = await handler(request);

  // Add caching headers for portfolio data
  const cacheHeaders = createCacheHeaders(
    30, // 30 seconds cache
    60, // 1 minute stale-while-revalidate
    {
      'X-Service': 'portfolio-assets',
      'X-API-Version': '1.0',
    }
  );

  Object.entries(cacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
