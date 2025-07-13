import { NextResponse } from 'next/server';
import { env } from '@/lib/config/validate-env';

export async function GET() {
  try {
    // Test if env vars are loaded
    const hasAptosSecret = !!env.APTOS_BUILD_SECRET;

    // Try making a simple GraphQL request
    const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (env.APTOS_BUILD_SECRET) {
      headers['Authorization'] = `Bearer ${env.APTOS_BUILD_SECRET}`;
    }

    const response = await fetch(INDEXER, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
          query TestQuery {
            fungible_asset_metadata(limit: 1) {
              asset_type
            }
          }
        `,
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      status: 'ok',
      hasAptosSecret,
      indexerResponse: {
        status: response.status,
        ok: response.ok,
        data: data,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        hasAptosSecret: !!env.APTOS_BUILD_SECRET,
      },
      { status: 500 }
    );
  }
}
