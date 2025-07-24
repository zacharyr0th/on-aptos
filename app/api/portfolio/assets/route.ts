import { NextRequest, NextResponse } from 'next/server';

import { AssetService } from '@/lib/services/portfolio/services/asset-service';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');
  
  try {

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    logger.info('[Portfolio Assets API] Fetching assets for:', walletAddress);

    // Get wallet assets using our updated service
    const assets = await AssetService.getWalletAssets(walletAddress);

    logger.info(`[Portfolio Assets API] Found ${assets.length} assets`);

    // Return ALL assets - no filtering
    const filteredAssets = assets;

    return NextResponse.json({
      success: true,
      data: {
        assets: filteredAssets,
        totalCount: filteredAssets.length,
      },
    });
  } catch (error) {
    // Enhanced error logging with full error details
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError',
      walletAddress,
      timestamp: new Date().toISOString(),
    };

    logger.error('Portfolio assets API error:', errorDetails);
    logger.error('[Portfolio Assets API] Full error object:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch portfolio assets',
        details: errorDetails.message,
        walletAddress,
      },
      { status: 500 }
    );
  }
}
