import { NextRequest, NextResponse } from 'next/server';
import { getWalletAssets } from '@/lib/trpc/domains/blockchain/portfolio/services';
import {
  validateWalletAddress,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/utils/portfolio-utils';
import { logger } from '@/lib/utils/logger';

// Set max duration for Vercel serverless function
export const maxDuration = 30; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');
    const showOnlyVerified = searchParams.get('showOnlyVerified') !== 'false';

    // Validate wallet address
    const validation = validateWalletAddress(walletAddress);
    if (!validation.isValid || !walletAddress) {
      return NextResponse.json(
        createErrorResponse(validation.error || 'Invalid wallet address'),
        { status: 400 }
      );
    }

    logger.info(
      `[Assets API] Fetching assets for ${walletAddress}, showOnlyVerified: ${showOnlyVerified}`
    );

    // Call the service directly
    const assets = await getWalletAssets(walletAddress, showOnlyVerified);

    logger.info(`[Assets API] Retrieved ${assets.length} assets`);

    // Calculate total portfolio value
    const totalValue = assets.reduce(
      (sum, asset) => sum + (asset.value || 0),
      0
    );

    return NextResponse.json(
      createSuccessResponse(assets, {
        count: assets.length,
        totalValue,
        showOnlyVerified,
      })
    );
  } catch (error) {
    logger.error('[Assets API] Error:', error);
    return NextResponse.json(
      createErrorResponse(
        'Failed to fetch wallet assets',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      { status: 500 }
    );
  }
}
