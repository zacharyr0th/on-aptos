import { NextResponse } from 'next/server';
import {
  STABLECOINS,
  LAYERZERO_STABLECOINS,
  WORMHOLE_STABLECOINS,
  CELER_STABLECOINS,
  ALGO_STABLECOINS,
} from '@/lib/aptos-constants';
import { TETHER_RESERVE_ADDRESS } from '@/lib/config/data';

const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';

// Note: TETHER_RESERVE_ADDRESS is imported from lib/config/data.ts for consistency

export async function GET() {
  try {
    // Prepare all stablecoin addresses
    const fungibleAssets = [
      ...Object.values(STABLECOINS),
      ALGO_STABLECOINS.MOD,
    ];
    console.log('Querying fungible assets:', fungibleAssets);

    // GraphQL query for native fungible assets and USDT reserve
    const query = `
      query GetAllStablecoins {
        # Query fungible assets (native stablecoins)
        fungible_asset_metadata(where: {
          asset_type: {_in: ${JSON.stringify(fungibleAssets)}}
        }) {
          asset_type
          supply_v2
          decimals
        }
        
        # Get Tether reserve balance
        current_fungible_asset_balances(where: {
          owner_address: {_eq: "${TETHER_RESERVE_ADDRESS}"},
          asset_type: {_eq: "${STABLECOINS.USDT}"}
        }) {
          amount
        }
      }
    `;

    // Make request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add Authorization header if APTOS_BUILD_SECRET is set
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

    // Check for GraphQL errors
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query failed: ' + JSON.stringify(result.errors));
    }

    console.log(
      'GraphQL response:',
      JSON.stringify(result.data?.fungible_asset_metadata, null, 2)
    );

    // Get USDT reserve balance
    const usdtReserveBalance =
      result.data?.current_fungible_asset_balances?.[0]?.amount || '0';

    // Process data
    const supplies = [];
    let totalSupply = BigInt(0);

    // Map all addresses to symbols and decimals
    const addressToSymbol: Record<string, string> = {
      // Native fungible assets
      [STABLECOINS.USDC]: 'USDC',
      [STABLECOINS.USDT]: 'USDT',
      [STABLECOINS.USDE]: 'USDe',
      [STABLECOINS.SUSDE]: 'sUSDe',
      [STABLECOINS.MUSD]: 'mUSD',
      [ALGO_STABLECOINS.MOD]: 'MOD',
    };

    // FA decimals configuration
    const faDecimals: Record<string, number> = {
      USDC: 6,
      USDT: 6,
      USDe: 6,
      sUSDe: 6,
      mUSD: 8, // mUSD has 8 decimals, not 6
      MOD: 8, // MOD has 8 decimals
    };

    // Process fungible assets
    if (result.data?.fungible_asset_metadata) {
      for (const item of result.data.fungible_asset_metadata) {
        if (item.supply_v2) {
          let supply = BigInt(item.supply_v2);
          const symbol = addressToSymbol[item.asset_type] || 'UNKNOWN';
          const decimals = faDecimals[symbol] || 6;

          // For USDT, subtract the reserve balance
          if (symbol === 'USDT') {
            const reserveAmount = BigInt(usdtReserveBalance);
            supply = supply - reserveAmount;
            console.log(
              `USDT: Total supply ${item.supply_v2}, Reserve ${usdtReserveBalance}, Circulating ${supply.toString()}`
            );
          }

          // Add to total supply (normalize to 6 decimals for consistency)
          const normalizedSupply =
            decimals === 8 ? supply / BigInt(100) : supply;
          totalSupply += normalizedSupply;

          // Calculate divisor based on decimals
          const divisor = BigInt(10 ** decimals);

          // Log mUSD and MOD for debugging
          if (symbol === 'mUSD') {
            console.log(
              `mUSD: Raw supply ${supply.toString()}, Decimals ${decimals}, Formatted ${(supply / divisor).toString()}`
            );
          }
          if (symbol === 'MOD') {
            console.log(
              `MOD: Raw supply ${supply.toString()}, Decimals ${decimals}, Formatted ${(supply / divisor).toString()}`
            );
          }

          supplies.push({
            symbol,
            supply: (supply / divisor).toString(), // Convert based on decimals
            supply_raw: supply.toString(),
            percentage: 0,
            asset_type: item.asset_type,
            type: 'fungible_asset',
          });
        }
      }
    }

    // For coins, we need to use the REST API to get supply data
    const bridgedCoins = [
      {
        symbol: 'lzUSDC',
        name: 'LayerZero USDC',
        asset_type: LAYERZERO_STABLECOINS.LZ_USDC,
        account:
          '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa',
        decimals: 6,
      },
      {
        symbol: 'lzUSDT',
        name: 'LayerZero USDT',
        asset_type: LAYERZERO_STABLECOINS.LZ_USDT,
        account:
          '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa',
        decimals: 6,
      },
      {
        symbol: 'whUSDC',
        name: 'Wormhole USDC',
        asset_type: WORMHOLE_STABLECOINS.WH_USDC,
        account:
          '0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea',
        decimals: 6,
      },
      {
        symbol: 'whUSDT',
        name: 'Wormhole USDT',
        asset_type: WORMHOLE_STABLECOINS.WH_USDT,
        account:
          '0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852',
        decimals: 6,
      },
      {
        symbol: 'ceUSDC',
        name: 'Celer USDC',
        asset_type: CELER_STABLECOINS.CELER_USDC,
        account:
          '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d',
        decimals: 6,
      },
      {
        symbol: 'ceUSDT',
        name: 'Celer USDT',
        asset_type: CELER_STABLECOINS.CELER_USDT,
        account:
          '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d',
        decimals: 6,
      },
    ];

    // Fetch coin supplies from REST API
    const coinSupplyPromises = bridgedCoins.map(async coin => {
      try {
        const resourceType = `0x1::coin::CoinInfo<${coin.asset_type}>`;
        const response = await fetch(
          `https://api.mainnet.aptoslabs.com/v1/accounts/${coin.account}/resource/${encodeURIComponent(resourceType)}`
        );

        if (response.ok) {
          const data = await response.json();

          // Log the response to understand the structure
          console.log(
            `Response for ${coin.symbol}:`,
            JSON.stringify(data, null, 2)
          );

          // Try different paths for the supply data
          let supply = BigInt(0);

          // Path 1: data.data.supply.vec[0].integer.vec[0].value
          if (data.data?.supply?.vec?.[0]?.integer?.vec?.[0]?.value) {
            supply = BigInt(data.data.supply.vec[0].integer.vec[0].value);
          }
          // Path 2: data.data.supply (direct string)
          else if (data.data?.supply && typeof data.data.supply === 'string') {
            supply = BigInt(data.data.supply);
          }
          // Path 3: data.supply (if data is the resource directly)
          else if (data.supply && typeof data.supply === 'string') {
            supply = BigInt(data.supply);
          }

          // Path 4: For MOD, if supply is 0 or supply.vec is empty, try GraphQL manual aggregation with pagination
          if (
            coin.symbol === 'MOD' &&
            (supply === BigInt(0) ||
              (data.data?.supply?.vec && data.data.supply.vec.length === 0))
          ) {
            try {
              console.log(
                'MOD supply vector is empty, trying GraphQL manual aggregation with pagination...'
              );
              let totalSupply = BigInt(0);
              let offset = 0;
              const batchSize = 1000;
              let hasMore = true;

              while (hasMore) {
                const graphqlQuery = `
                  query {
                    current_coin_balances(where: {
                      coin_type: {_eq: "${coin.asset_type}"},
                      amount: {_gt: "0"}
                    }, limit: ${batchSize}, offset: ${offset}) {
                      amount
                    }
                  }
                `;

                const graphqlHeaders: Record<string, string> = {
                  'Content-Type': 'application/json',
                };

                // Add Authorization header if available
                if (process.env.APTOS_BUILD_SECRET) {
                  graphqlHeaders['Authorization'] =
                    `Bearer ${process.env.APTOS_BUILD_SECRET}`;
                }

                const graphqlResponse = await fetch(INDEXER, {
                  method: 'POST',
                  headers: graphqlHeaders,
                  body: JSON.stringify({ query: graphqlQuery }),
                });

                if (graphqlResponse.ok) {
                  const graphqlResult = await graphqlResponse.json();
                  if (graphqlResult.data?.current_coin_balances) {
                    const balances = graphqlResult.data.current_coin_balances;
                    console.log(
                      `Batch ${Math.floor(offset / batchSize) + 1}: Found ${balances.length} MOD holders`
                    );

                    for (const balance of balances) {
                      totalSupply += BigInt(balance.amount);
                    }

                    // Check if we have more data
                    if (balances.length < batchSize) {
                      hasMore = false;
                    } else {
                      offset += batchSize;
                    }
                  } else {
                    hasMore = false;
                  }
                } else {
                  console.error(
                    `GraphQL request failed: ${graphqlResponse.status}`
                  );
                  hasMore = false;
                }
              }

              supply = totalSupply;
              console.log(
                `MOD total supply from paginated GraphQL aggregation: ${supply.toString()}`
              );
            } catch (e) {
              console.error('Failed to fetch MOD supply via GraphQL:', e);
            }
          }

          // Log MOD specifically for debugging
          if (coin.symbol === 'MOD') {
            console.log(
              `MOD final supply: ${supply.toString()} (should be ~500k = 50000000000000 raw with 8 decimals)`
            );
          }
          console.log(`${coin.symbol} supply:`, supply.toString());

          return {
            coin,
            supply,
          };
        } else {
          console.error(
            `Failed to fetch ${coin.symbol}: HTTP ${response.status}`
          );
        }
        return { coin, supply: BigInt(0) };
      } catch (e) {
        console.error(`Failed to fetch supply for ${coin.symbol}:`, e);
        return { coin, supply: BigInt(0) };
      }
    });

    const coinSupplies = await Promise.all(coinSupplyPromises);

    // Process coin supplies
    for (const { coin, supply } of coinSupplies) {
      // Calculate divisor based on decimals
      const divisor = BigInt(10 ** coin.decimals);
      supplies.push({
        symbol: coin.symbol,
        supply: (supply / divisor).toString(), // Convert based on decimals
        supply_raw: supply.toString(),
        percentage: 0,
        asset_type: coin.asset_type,
        type: 'coin',
        note: supply > 0 ? coin.name : `${coin.name} (no supply found)`,
      });

      // Add to total supply (normalize to 6 decimals for consistency)
      const normalizedSupply =
        coin.decimals === 8 ? supply / BigInt(100) : supply;
      totalSupply += normalizedSupply;
    }

    // Sort by dollar supply descending (using the supply field which is already in dollar units)
    supplies.sort((a, b) => {
      const aSupply = BigInt(a.supply);
      const bSupply = BigInt(b.supply);
      return bSupply > aSupply ? 1 : -1;
    });

    console.log(
      'Total supply (normalized to 6 decimals):',
      totalSupply.toString()
    );

    // Calculate total dollar value from all supplies
    let totalDollarValue = BigInt(0);
    for (const item of supplies) {
      totalDollarValue += BigInt(item.supply);
    }

    // Calculate percentages based on dollar values
    for (const item of supplies) {
      const dollarSupply = BigInt(item.supply);

      item.percentage =
        totalDollarValue > 0
          ? Number((dollarSupply * BigInt(10000)) / totalDollarValue) / 100
          : 0;

      // Debug log for MOD and mUSD
      if (item.symbol === 'MOD' || item.symbol === 'mUSD') {
        console.log(`${item.symbol} percentage calc:`, {
          supply: item.supply,
          totalDollarValue: totalDollarValue.toString(),
          percentage: item.percentage,
        });
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      data: {
        supplies,
        total: (totalSupply / BigInt(1000000)).toString(), // Total is in 6 decimal units
        total_raw: totalSupply.toString(),
        usdt_reserve: {
          amount: usdtReserveBalance,
          amount_formatted: (
            BigInt(usdtReserveBalance) / BigInt(1000000)
          ).toString(),
          address: TETHER_RESERVE_ADDRESS,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching stablecoin data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch stablecoin data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
