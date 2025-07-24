import { NextRequest, NextResponse } from 'next/server';

import { aptosAnalytics } from '@/lib/services/aptos-analytics';
import { PanoraService } from '@/lib/services/portfolio/panora-service';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const address =
      searchParams.get('address') || searchParams.get('tokenAddress');
    const date_utc = searchParams.get('date_utc');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    // First try Panora API for better coverage
    try {
      const panoraPrices = await PanoraService.getTokenPrices([address]);

      if (panoraPrices && panoraPrices.length > 0) {
        const panoraPrice = panoraPrices[0];

        // Convert Panora response to match expected format
        const data = [
          {
            bucketed_timestamp_minutes_utc: new Date().toISOString(),
            price_usd: parseFloat(panoraPrice.usdPrice),
            token_address: panoraPrice.tokenAddress || panoraPrice.faAddress,
            symbol: panoraPrice.symbol,
            name: panoraPrice.name,
            decimals: panoraPrice.decimals,
          },
        ];

        logger.info(
          `Token price fetched from Panora for ${address}: $${panoraPrice.usdPrice}`
        );
        return NextResponse.json({ data, source: 'panora' });
      }
    } catch (panoraError) {
      logger.warn(
        `Failed to fetch price from Panora for ${address}:`,
        panoraError
      );
    }

    // Fallback to Aptos Analytics API
    try {
      const data = await aptosAnalytics.getTokenLatestPrice({
        address,
        date_utc: date_utc || undefined,
      });

      if (data && data.length > 0) {
        logger.info(`Token price fetched from Aptos Analytics for ${address}`);
        return NextResponse.json({ data, source: 'aptos-analytics' });
      }
    } catch (aptosError) {
      logger.warn(
        `Failed to fetch price from Aptos Analytics for ${address}:`,
        aptosError
      );
    }

    // If both fail, return empty data
    logger.warn(`No price data found for token ${address}`);
    return NextResponse.json({
      data: [],
      message: 'No price data available for this token',
      address,
    });
  } catch (error) {
    logger.error('Token latest price API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch token latest price',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
