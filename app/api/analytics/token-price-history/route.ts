import { NextRequest, NextResponse } from 'next/server';

import { aptosAnalytics } from '@/lib/services/aptos-analytics';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const address =
      searchParams.get('address') || searchParams.get('tokenAddress');
    const lookback = (searchParams.get('lookback') ||
      searchParams.get('timeframe')) as
      | 'hour'
      | 'day'
      | 'week'
      | 'month'
      | 'year'
      | 'all';
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const downsample_to = searchParams.get('downsample_to');

    if (!address || !lookback) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const data = await aptosAnalytics.getTokenHistoricalPrices({
      address,
      lookback,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      downsample_to: downsample_to ? parseInt(downsample_to) : undefined,
    });

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Token price history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token price history' },
      { status: 500 }
    );
  }
}
