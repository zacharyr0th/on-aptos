import { NextRequest, NextResponse } from 'next/server';
import { DeFiBalanceService } from '@/lib/services/blockchain/portfolio/defi-balance-service';
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

    // Validate wallet address
    const validation = validateWalletAddress(walletAddress);
    if (!validation.isValid || !walletAddress) {
      return NextResponse.json(
        createErrorResponse(validation.error || 'Invalid wallet address'),
        { status: 400 }
      );
    }

    logger.info(`[DeFi API] Fetching DeFi positions for ${walletAddress}`);

    // Call the service directly with longer timeout
    const positions = await DeFiBalanceService.getDeFiPositions(walletAddress);

    logger.info(`[DeFi API] Found ${positions.length} DeFi positions`);

    return NextResponse.json(
      createSuccessResponse(positions, {
        count: positions.length,
        totalValue: positions.reduce((sum, pos) => sum + pos.totalValue, 0),
      })
    );
  } catch (error) {
    logger.error('[DeFi API] Error:', error);
    return NextResponse.json(
      createErrorResponse(
        'Failed to fetch DeFi positions',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      { status: 500 }
    );
  }
}
