import { NextRequest, NextResponse } from 'next/server';
import { aptosAnalytics } from '@/lib/services/aptos-analytics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const account_address = searchParams.get('account_address');
    const profile_address = searchParams.get('profile_address');
    const date_start = searchParams.get('date_start');
    const date_end = searchParams.get('date_end');

    if (!account_address || !profile_address) {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: account_address and profile_address',
        },
        { status: 400 }
      );
    }

    const data = await aptosAnalytics.getAriesRewards({
      account_address,
      profile_address,
      date_start: date_start || undefined,
      date_end: date_end || undefined,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Aries rewards API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Aries rewards' },
      { status: 500 }
    );
  }
}
