import { NextResponse } from "next/server";
import { apiLogger } from "@/lib/utils/core/logger";

// Key metrics from Aptos Indexer API
export async function GET() {
  try {
    const aptosSecret = process.env.APTOS_BUILD_SECRET;
    const indexerUrl = process.env.NEXT_PUBLIC_APTOS_INDEXER_URL || "https://api.mainnet.aptoslabs.com/v1/graphql";
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (aptosSecret) {
      headers["Authorization"] = `Bearer ${aptosSecret}`;
    }

    // Query 1: All-time transaction count (from latest transaction version)
    const allTimeTransactionsQuery = `
      query GetAllTimeTransactions {
        user_transactions(limit: 1, order_by: {version: desc}) {
          version
        }
      }
    `;

    // Query 2: Recent transactions for gas fees (no success field in user_transactions)
    const recentTransactionsQuery = `
      query GetRecentTransactions {
        user_transactions(
          limit: 100
          order_by: {version: desc}
        ) {
          gas_unit_price
          gas_used
          version
          timestamp
        }
      }
    `;

    // Query 3: Block metadata for block times
    const blockTimesQuery = `
      query GetBlockTimes {
        block_metadata_transactions(
          limit: 50
          order_by: {block_height: desc}
        ) {
          block_height
          timestamp
        }
      }
    `;

    // Execute queries in parallel
    const [allTimeResponse, recentResponse, blockResponse] = await Promise.allSettled([
      fetch(indexerUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: allTimeTransactionsQuery }),
      }),
      fetch(indexerUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: recentTransactionsQuery }),
      }),
      fetch(indexerUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: blockTimesQuery }),
      }),
    ]);

    let allTimeTransactions = 0;
    let avgGasFeeAPT = 0;
    let avgBlockTimeSeconds = 4.0; // Default for Aptos
    let networkReliability: number | string = "-"; // Not available in user_transactions table

    // Process all-time transactions
    if (allTimeResponse.status === "fulfilled" && allTimeResponse.value.ok) {
      const data = await allTimeResponse.value.json();
      apiLogger.info("All-time transactions response:", data);
      const latestTx = data.data?.user_transactions?.[0];
      if (latestTx) {
        allTimeTransactions = parseInt(latestTx.version) || 0;
        apiLogger.info(`Latest transaction version (total transactions): ${allTimeTransactions}`);
      }
    } else {
      apiLogger.error("All-time transactions request failed:", allTimeResponse);
    }

    // Process recent transactions for gas fees only (no success field available)
    if (recentResponse.status === "fulfilled" && recentResponse.value.ok) {
      const data = await recentResponse.value.json();
      const transactions = data.data?.user_transactions || [];
      
      if (transactions.length > 0) {
        // Calculate average gas fee in APT
        const totalGasFees = transactions.reduce((sum: number, tx: any) => {
          const gasUsed = parseInt(tx.gas_used) || 0;
          const gasPrice = parseInt(tx.gas_unit_price) || 0;
          return sum + (gasUsed * gasPrice);
        }, 0);
        avgGasFeeAPT = totalGasFees / transactions.length / 1e8; // Convert octa to APT
      }
    }

    // Process block times
    if (blockResponse.status === "fulfilled" && blockResponse.value.ok) {
      const data = await blockResponse.value.json();
      apiLogger.info("Block response data:", data);
      const blocks = data.data?.block_metadata_transactions || [];
      
      if (blocks.length > 1) {
        const blockTimes: number[] = [];
        // Calculate time differences between consecutive blocks
        for (let i = 1; i < Math.min(blocks.length, 20); i++) {
          const currentTime = new Date(blocks[i-1].timestamp).getTime();
          const prevTime = new Date(blocks[i].timestamp).getTime();
          const timeDiff = (currentTime - prevTime) / 1000; // Convert to seconds
          
          if (timeDiff > 0 && timeDiff < 60) { // Filter reasonable block times (0-60 seconds)
            blockTimes.push(timeDiff);
          }
        }
        
        if (blockTimes.length > 0) {
          avgBlockTimeSeconds = blockTimes.reduce((sum, time) => sum + time, 0) / blockTimes.length;
          apiLogger.info(`Calculated average block time: ${avgBlockTimeSeconds}s from ${blockTimes.length} blocks`);
        }
      }
    }

    const keyMetrics = {
      allTimeTransactions,
      avgGasFeeAPT,
      avgBlockTimeSeconds,
      networkReliability, // "-" since not available in user_transactions
      avgFinalityTime: avgBlockTimeSeconds, // Approximate finality as block time for now
    };

    apiLogger.info("Successfully fetched key metrics from Aptos Indexer", keyMetrics);

    return NextResponse.json(keyMetrics, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });

  } catch (error) {
    apiLogger.error("Error fetching key metrics from Aptos Indexer:", error);
    
    // Return fallback values - show "-" for unavailable data
    return NextResponse.json({
      allTimeTransactions: 0,
      avgGasFeeAPT: 0,
      avgBlockTimeSeconds: 4.0,
      networkReliability: "-", // Not available from API
      avgFinalityTime: 4.0,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  }
}