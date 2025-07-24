import { NextRequest, NextResponse } from 'next/server';

import { defiLlamaService } from '@/lib/services/defi-llama';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeProtocols = searchParams.get('include_protocols') === 'true';

    const metrics = await defiLlamaService.getAptosDefiMetrics();

    if (!metrics) {
      return NextResponse.json(
        { error: 'Failed to fetch DeFi metrics from DeFi Llama' },
        { status: 503 }
      );
    }

    const response: any = { data: metrics };

    // Optionally include protocol count
    if (includeProtocols) {
      const protocols = await defiLlamaService.getAptosProtocols();
      response.data.protocols = protocols.length;
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
      },
    });
  } catch (error) {
    logger.error('DeFi metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
