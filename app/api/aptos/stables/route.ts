import { NextResponse } from 'next/server';
import { 
  STABLECOINS, 
  LAYERZERO_STABLECOINS, 
  WORMHOLE_STABLECOINS, 
  CELER_STABLECOINS 
} from '@/lib/aptos-constants';
import { TETHER_RESERVE_ADDRESS } from '@/lib/config/data';

const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';

// Note: TETHER_RESERVE_ADDRESS is imported from lib/config/data.ts for consistency

export async function GET() {
  try {
    // Prepare all stablecoin addresses
    const fungibleAssets = Object.values(STABLECOINS);

    // GraphQL query for native fungible assets and USDT reserve
    const query = `
      query GetAllStablecoins {
        # Query fungible assets (native stablecoins)
        fungible_asset_metadata(where: {
          asset_type: {_in: ${JSON.stringify(fungibleAssets)}}
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
    
    // Get USDT reserve balance
    const usdtReserveBalance = result.data?.current_fungible_asset_balances?.[0]?.amount || '0';
    
    // Process data
    const supplies = [];
    let totalSupply = BigInt(0);
    
    
    // Map all addresses to symbols
    const addressToSymbol: Record<string, string> = {
      // Native fungible assets
      [STABLECOINS.USDC]: 'USDC',
      [STABLECOINS.USDT]: 'USDT',
      [STABLECOINS.USDE]: 'USDe',
      [STABLECOINS.SUSDE]: 'sUSDe',
    };

    // Process fungible assets
    if (result.data?.fungible_asset_metadata) {
      for (const item of result.data.fungible_asset_metadata) {
        if (item.supply_v2) {
          let supply = BigInt(item.supply_v2);
          const symbol = addressToSymbol[item.asset_type] || 'UNKNOWN';
          
          // For USDT, subtract the reserve balance
          if (symbol === 'USDT') {
            const reserveAmount = BigInt(usdtReserveBalance);
            supply = supply - reserveAmount;
            console.log(`USDT: Total supply ${item.supply_v2}, Reserve ${usdtReserveBalance}, Circulating ${supply.toString()}`);
          }
          
          totalSupply += supply;
          
          supplies.push({
            symbol,
            supply: (supply / BigInt(1000000)).toString(),
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
      { symbol: 'USDC.lz', name: 'LayerZero USDC', asset_type: LAYERZERO_STABLECOINS.LZ_USDC, account: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa' },
      { symbol: 'USDT.lz', name: 'LayerZero USDT', asset_type: LAYERZERO_STABLECOINS.LZ_USDT, account: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa' },
      { symbol: 'USDC.wh', name: 'Wormhole USDC', asset_type: WORMHOLE_STABLECOINS.WH_USDC, account: '0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea' },
      { symbol: 'USDT.wh', name: 'Wormhole USDT', asset_type: WORMHOLE_STABLECOINS.WH_USDT, account: '0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852' },
      { symbol: 'USDC.ce', name: 'Celer USDC', asset_type: CELER_STABLECOINS.CELER_USDC, account: '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d' },
      { symbol: 'USDT.ce', name: 'Celer USDT', asset_type: CELER_STABLECOINS.CELER_USDT, account: '0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d' },
    ];

    // Fetch coin supplies from REST API
    const coinSupplyPromises = bridgedCoins.map(async (coin) => {
      try {
        const resourceType = `0x1::coin::CoinInfo<${coin.asset_type}>`;
        const response = await fetch(
          `https://api.mainnet.aptoslabs.com/v1/accounts/${coin.account}/resource/${encodeURIComponent(resourceType)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Log the response to understand the structure
          console.log(`Response for ${coin.symbol}:`, JSON.stringify(data, null, 2));
          
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
          
          console.log(`${coin.symbol} supply:`, supply.toString());
          
          return {
            coin,
            supply,
          };
        } else {
          console.error(`Failed to fetch ${coin.symbol}: HTTP ${response.status}`);
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
      supplies.push({
        symbol: coin.symbol,
        supply: (supply / BigInt(1000000)).toString(), // Convert to millions
        supply_raw: supply.toString(),
        percentage: 0,
        asset_type: coin.asset_type,
        type: 'coin',
        note: supply > 0 ? coin.name : `${coin.name} (no supply found)`,
      });
      
      // Add to total supply
      totalSupply += supply;
    }
    
    
    // Sort by supply descending
    supplies.sort((a, b) => {
      const aSupply = BigInt(a.supply_raw);
      const bSupply = BigInt(b.supply_raw);
      return bSupply > aSupply ? 1 : -1;
    });
    
    // Calculate percentages
    for (const item of supplies) {
      const rawSupply = BigInt(item.supply_raw);
      item.percentage = totalSupply > 0 
        ? Number((rawSupply * BigInt(10000)) / totalSupply) / 100 
        : 0;
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      data: {
        supplies,
        total: (totalSupply / BigInt(1000000)).toString(),
        total_raw: totalSupply.toString(),
        usdt_reserve: {
          amount: usdtReserveBalance,
          amount_formatted: (BigInt(usdtReserveBalance) / BigInt(1000000)).toString(),
          address: TETHER_RESERVE_ADDRESS,
        }
      },
    });
    
  } catch (error) {
    console.error('Error fetching stablecoin data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stablecoin data',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}