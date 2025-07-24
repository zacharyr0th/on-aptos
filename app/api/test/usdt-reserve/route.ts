import { NextResponse } from 'next/server';

import { STABLECOINS } from '@/lib/aptos-constants';
import { TETHER_RESERVE_ADDRESS } from '@/lib/config/data';
import { logger } from '@/lib/utils/logger';

const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';

export async function GET() {
  try {
    // Query to get USDT total supply and reserve balance
    const query = `
      query GetUSDTSupplyAndReserve {
        # Get USDT metadata
        fungible_asset_metadata(where: {
          asset_type: {_eq: "${STABLECOINS.USDT}"}
        }) {
          asset_type
          supply_v2
        }
        
        # Get Tether reserve balance
        current_fungible_asset_balances(where: {
          owner_address: {_eq: "${TETHER_RESERVE_ADDRESS}"},
          asset_type: {_eq: "${STABLECOINS.USDT}"}
        }) {
          amount
          owner_address
          asset_type
        }
      }
    `;

    // Make request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.APTOS_BUILD_SECRET) {
      headers['Authorization'] = `Bearer ${process.env.APTOS_BUILD_SECRET}`;
    }

    const response = await fetch(INDEXER, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      logger.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed: ' + JSON.stringify(result.errors));
    }

    // Process data
    const metadata = result.data?.fungible_asset_metadata?.[0];
    const reserveBalance = result.data?.current_fungible_asset_balances?.[0];

    if (!metadata) {
      throw new Error('USDT metadata not found');
    }

    const totalSupply = BigInt(metadata.supply_v2 || 0);
    const reserveAmount = BigInt(reserveBalance?.amount || 0);
    const circulatingSupply = totalSupply - reserveAmount;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      data: {
        usdt: {
          total_supply: totalSupply.toString(),
          total_supply_formatted: (totalSupply / BigInt(1_000_000)).toString(),
          reserve_balance: reserveAmount.toString(),
          reserve_balance_formatted: (
            reserveAmount / BigInt(1_000_000)
          ).toString(),
          circulating_supply: circulatingSupply.toString(),
          circulating_supply_formatted: (
            circulatingSupply / BigInt(1_000_000)
          ).toString(),
          reserve_address: TETHER_RESERVE_ADDRESS,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching USDT data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch USDT data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
