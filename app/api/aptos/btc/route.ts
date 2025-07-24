import { NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';

const APTOS_INDEXER_URL = 'https://api.mainnet.aptoslabs.com/v1/graphql';
const API_KEY = 'AG-AJXHKGSUNEWR4H3ACAEUK8Z4SJZTJ8XDW';

async function queryGraphQL(query: string, variables: Record<string, unknown>) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(APTOS_INDEXER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('GraphQL error:', response.status, errorText);
      throw new Error(`GraphQL error: ${response.status}`);
    }

    return response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

export async function GET() {
  try {
    // Single combined query to reduce requests
    const combinedQuery = `
      query GetBTCSupplies {
        xBTC: current_fungible_asset_balances_aggregate(
          where: {
            asset_type: {_eq: "0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387"},
            amount: {_gt: "0"}
          }
        ) {
          aggregate {
            sum {
              amount
            }
          }
        }
        SBTC: current_fungible_asset_balances_aggregate(
          where: {
            asset_type: {_eq: "0x5dee1d4b13fae338a1e1780f9ad2709a010e824388efd169171a26e3ea9029bb::stakestone_bitcoin::StakeStoneBitcoin"},
            amount: {_gt: "0"}
          }
        ) {
          aggregate {
            sum {
              amount
            }
          }
        }
        WBTC: current_fungible_asset_balances_aggregate(
          where: {
            asset_type: {_eq: "0x68844a0d7f2587e726ad0579f3d640865bb4162c08a4589eeda3f9689ec52a3d"},
            amount: {_gt: "0"}
          }
        ) {
          aggregate {
            sum {
              amount
            }
          }
        }
        aBTC: current_fungible_asset_balances_aggregate(
          where: {
            asset_type: {_eq: "0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec::abtc::ABTC"},
            amount: {_gt: "0"}
          }
        ) {
          aggregate {
            sum {
              amount
            }
          }
        }
      }
    `;

    // Execute combined query
    const result = await queryGraphQL(combinedQuery, {});

    // Extract amounts from combined result
    const xBTCAmount = parseFloat(
      result.data?.xBTC?.aggregate?.sum?.amount || '0'
    );
    const SBTCAmount = parseFloat(
      result.data?.SBTC?.aggregate?.sum?.amount || '0'
    );
    const WBTCAmount = parseFloat(
      result.data?.WBTC?.aggregate?.sum?.amount || '0'
    );
    const aBTCAmount = parseFloat(
      result.data?.aBTC?.aggregate?.sum?.amount || '0'
    );

    // Format supplies
    const supplies = [
      {
        symbol: 'xBTC',
        supply: xBTCAmount.toString(),
        formatted_supply: (xBTCAmount / 1e8).toFixed(2),
        decimals: 8,
      },
      {
        symbol: 'SBTC',
        supply: SBTCAmount.toString(),
        formatted_supply: (SBTCAmount / 1e8).toFixed(2),
        decimals: 8,
      },
      {
        symbol: 'WBTC',
        supply: WBTCAmount.toString(),
        formatted_supply: (WBTCAmount / 1e8).toFixed(2),
        decimals: 8,
      },
      {
        symbol: 'aBTC',
        supply: aBTCAmount.toString(),
        formatted_supply: (aBTCAmount / 1e10).toFixed(2), // 10 decimals
        decimals: 10,
      },
    ];

    // Calculate totals
    const totalBTC =
      xBTCAmount / 1e8 +
      SBTCAmount / 1e8 +
      WBTCAmount / 1e8 +
      aBTCAmount / 1e10;

    return NextResponse.json({
      data: {
        supplies,
        total: totalBTC.toFixed(2),
        totalRaw: (
          xBTCAmount +
          SBTCAmount +
          WBTCAmount +
          aBTCAmount
        ).toString(),
        timestamp: new Date().toISOString(),
      },
    }, {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        'CDN-Cache-Control': 'public, max-age=86400',
      }
    });
  } catch (error) {
    logger.error('[BTC API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BTC supplies' },
      { status: 500 }
    );
  }
}
