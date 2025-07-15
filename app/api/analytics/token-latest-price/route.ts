import { NextRequest, NextResponse } from 'next/server';
import { aptosAnalytics } from '@/lib/services/aptos-analytics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const address = searchParams.get('address');
    const date_utc = searchParams.get('date_utc');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    const data = await aptosAnalytics.getTokenLatestPrice({
      address,
      date_utc: date_utc || undefined,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Token latest price API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token latest price' },
      { status: 500 }
    );
  }
}
