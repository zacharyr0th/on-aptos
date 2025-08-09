import { NextResponse } from "next/server";

import { apiLogger } from "@/lib/utils/logger";

const APTOS_INDEXER_URL = "https://api.mainnet.aptoslabs.com/v1/graphql";
const API_KEY = process.env.APTOS_BUILD_SECRET || "";

async function queryGraphQL(query: string, variables: Record<string, unknown>) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    apiLogger.info("[BTC API] Executing GraphQL query");
    const response = await fetch(APTOS_INDEXER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      apiLogger.error(`GraphQL error: ${response.status} - ${errorText}`);
      throw new Error(`GraphQL error: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      apiLogger.error(`GraphQL query errors: ${result.errors.map((e: any) => e.message).join(", ")}`);
      throw new Error(
        `GraphQL errors: ${result.errors.map((e: any) => e.message).join(", ")}`,
      );
    }

    apiLogger.info("[BTC API] GraphQL query completed successfully");
    return result;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      apiLogger.warn("[BTC API] GraphQL query timed out after 30 seconds");
      throw new Error("Request timeout");
    }
    apiLogger.error(`[BTC API] GraphQL query failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function GET() {
  try {
    // Use a mixed approach to get REAL supply numbers
    // For coins that exist as both FA and coin, we'll use fungible_asset_metadata which has pre-computed supply
    // For pure coins, we'll query ALL balances to get exact total supply

    const tokens = [
      {
        symbol: "xBTC",
        asset_type:
          "0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387",
        decimals: 8,
        isFA: true,
      },
      {
        symbol: "SBTC",
        asset_type:
          "0x5dee1d4b13fae338a1e1780f9ad2709a010e824388efd169171a26e3ea9029bb::stakestone_bitcoin::StakeStoneBitcoin",
        decimals: 8,
        isFA: false,
      },
      {
        symbol: "WBTC",
        asset_type:
          "0x68844a0d7f2587e726ad0579f3d640865bb4162c08a4589eeda3f9689ec52a3d",
        decimals: 8,
        isFA: true,
      },
      {
        symbol: "aBTC",
        asset_type:
          "0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec::abtc::ABTC",
        decimals: 10,
        isFA: false,
      },
      {
        symbol: "FiaBTC",
        asset_type:
          "0x75de592a7e62e6224d13763c392190fda8635ebb79c798a5e9dd0840102f3f93",
        decimals: 8,
        isFA: true,
      },
    ];

    const supplies = await Promise.all(
      tokens.map(async (token) => {
        try {
          if (token.isFA) {
            // For FAs, use fungible_asset_metadata
            const query = `
            query {
              fungible_asset_metadata(where: {asset_type: {_eq: "${token.asset_type}"}}) {
                supply_v2
              }
            }
          `;
            const result = await queryGraphQL(query, {});
            const supply = parseFloat(
              result.data?.fungible_asset_metadata?.[0]?.supply_v2 || "0",
            );

            return {
              symbol: token.symbol,
              supply: supply.toString(),
              formatted_supply: (supply / Math.pow(10, token.decimals)).toFixed(
                2,
              ),
              decimals: token.decimals,
            };
          } else {
            // For pure coins, get FULL supply by querying ALL balances with pagination
            let allBalances: any[] = [];
            let offset = 0;
            const batchSize = 1000;
            let hasMore = true;

            while (hasMore) {
              const query = `
              query {
                current_fungible_asset_balances(
                  where: {asset_type: {_eq: "${token.asset_type}"}, amount: {_gt: "0"}}
                  order_by: {amount: desc}
                  limit: ${batchSize}
                  offset: ${offset}
                ) {
                  amount
                }
              }
            `;

              const result = await queryGraphQL(query, {});
              const balances =
                result.data?.current_fungible_asset_balances || [];

              allBalances = allBalances.concat(balances);

              // Check if we got fewer results than requested (end of data)
              if (balances.length < batchSize) {
                hasMore = false;
              } else {
                offset += batchSize;
              }

              // Safety limit to prevent infinite loops
              if (offset > 100000) {
                apiLogger.warn(`[BTC API] Hit safety limit for ${token.symbol}, got ${allBalances.length} records`);
                break;
              }
            }

            // Sum ALL balances to get REAL total supply
            const totalSupply = allBalances.reduce(
              (sum: number, b: any) => sum + parseFloat(b.amount || "0"),
              0,
            );

            return {
              symbol: token.symbol,
              supply: totalSupply.toString(),
              formatted_supply: (
                totalSupply / Math.pow(10, token.decimals)
              ).toFixed(2),
              decimals: token.decimals,
            };
          }
        } catch (err) {
          apiLogger.warn(`[BTC API] Failed to fetch ${token.symbol}: ${err instanceof Error ? err.message : String(err)}`);
          return {
            symbol: token.symbol,
            supply: "0",
            formatted_supply: "0.00",
            decimals: token.decimals,
          };
        }
      }),
    );

    // Calculate totals
    const totalBTC = supplies.reduce((sum, token) => {
      return sum + parseFloat(token.formatted_supply);
    }, 0);

    return NextResponse.json(
      {
        data: {
          supplies,
          total: totalBTC.toFixed(2),
          totalRaw: supplies
            .reduce((sum, token) => {
              return sum + parseFloat(token.supply);
            }, 0)
            .toString(),
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          // No cache - always fetch fresh BTC data
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    apiLogger.error(`[BTC API] Error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      {
        error: "Failed to fetch BTC supplies",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
