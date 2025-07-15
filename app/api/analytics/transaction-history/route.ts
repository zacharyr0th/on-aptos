import { NextRequest, NextResponse } from 'next/server';
import { aptosAnalytics } from '@/lib/services/aptos-analytics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const account_address = searchParams.get('account_address');
    const date_start = searchParams.get('date_start');
    const date_end = searchParams.get('date_end');
    const asset_symbol = searchParams.get('asset_symbol');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!account_address) {
      return NextResponse.json(
        { error: 'Missing required parameter: account_address' },
        { status: 400 }
      );
    }

    const data = await aptosAnalytics.getHistoricalTransactions({
      account_address,
      date_start: date_start || undefined,
      date_end: date_end || undefined,
      asset_symbol: asset_symbol || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Transaction history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    );
  }
}
