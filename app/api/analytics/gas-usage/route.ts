import { NextRequest, NextResponse } from 'next/server';

import { aptosAnalytics } from '@/lib/services/aptos-analytics';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const gas_payer_address =
      searchParams.get('address') || searchParams.get('gas_payer_address');
    let start_unix_secs = searchParams.get('start_unix_secs');
    let end_unix_secs = searchParams.get('end_unix_secs');
    const days = searchParams.get('days');
    const bucket_granularity = searchParams.get('bucket_granularity');
    const group_by_entry_function = searchParams.get('group_by_entry_function');

    // If days is provided, calculate start/end times
    if (days && !start_unix_secs && !end_unix_secs) {
      const now = Math.floor(Date.now() / 1000);
      const daysAgo = now - parseInt(days) * 24 * 60 * 60;
      start_unix_secs = daysAgo.toString();
      end_unix_secs = now.toString();
    }

    if (!gas_payer_address || !start_unix_secs || !end_unix_secs) {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: address and (start_unix_secs/end_unix_secs or days)',
        },
        { status: 400 }
      );
    }

    const data = await aptosAnalytics.getGasUsage({
      gas_payer_address,
      start_unix_secs: parseInt(start_unix_secs),
      end_unix_secs: parseInt(end_unix_secs),
      bucket_granularity: bucket_granularity || undefined,
      group_by_entry_function: group_by_entry_function === 'true',
    });

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Gas usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gas usage data' },
      { status: 500 }
    );
  }
}
