import { NextRequest, NextResponse } from 'next/server';
import { aptosAnalytics } from '@/lib/services/aptos-analytics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const gas_payer_address = searchParams.get('gas_payer_address');
    const start_unix_secs = searchParams.get('start_unix_secs');
    const end_unix_secs = searchParams.get('end_unix_secs');
    const bucket_granularity = searchParams.get('bucket_granularity');
    const group_by_entry_function = searchParams.get('group_by_entry_function');

    if (!gas_payer_address || !start_unix_secs || !end_unix_secs) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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
    console.error('Gas usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gas usage data' },
      { status: 500 }
    );
  }
}
