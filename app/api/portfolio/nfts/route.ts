import { NextRequest, NextResponse } from 'next/server';
import { getWalletNFTs } from '@/lib/trpc/domains/blockchain/portfolio/services';
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
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate wallet address
    const validation = validateWalletAddress(walletAddress);
    if (!validation.isValid || !walletAddress) {
      return NextResponse.json(
        createErrorResponse(validation.error || 'Invalid wallet address'),
        { status: 400 }
      );
    }

    logger.info(
      `[NFTs API] Fetching NFTs for ${walletAddress}, limit: ${limit}, offset: ${offset}`
    );

    // Call the service directly
    const nfts = await getWalletNFTs(walletAddress, limit, offset);

    logger.info(`[NFTs API] Retrieved ${nfts.length} NFTs`);

    return NextResponse.json(
      createSuccessResponse(nfts, {
        count: nfts.length,
        limit,
        offset,
        hasMore: nfts.length === limit,
      })
    );
  } catch (error) {
    logger.error('[NFTs API] Error:', error);
    return NextResponse.json(
      createErrorResponse(
        'Failed to fetch NFTs',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      { status: 500 }
    );
  }
}
