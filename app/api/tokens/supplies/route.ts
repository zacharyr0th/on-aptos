import { NextRequest, NextResponse } from "next/server";
import { apiLogger } from "@/lib/utils/core/logger";
import { STABLECOINS } from "@/lib/constants";
import { TETHER_RESERVES } from "@/lib/constants/tokens/addresses";

const APTOS_GRAPHQL_ENDPOINT = "https://api.mainnet.aptoslabs.com/v1/graphql";

interface TokenAddress {
  faAddress?: string;
  tokenAddress?: string;
}

// Query to get fungible asset supply - optimized to only fetch needed fields
const GET_FA_SUPPLY_QUERY = `
  query GetFungibleAssetSupply($faAddresses: [String!]!) {
    fungible_asset_metadata(where: {asset_type: {_in: $faAddresses}}) {
      asset_type
      supply_v2
      decimals
    }
  }
`;

// Query to get coin info including supply
const GET_COIN_SUPPLY_QUERY = `
  query GetCoinSupply($coinTypes: [String!]!) {
    coin_infos(where: {coin_type: {_in: $coinTypes}}) {
      coin_type
      decimals
      supply
    }
  }
`;

// Query to get USDT reserve balance
const GET_USDT_RESERVE_QUERY = `
  query GetUSDTReserve {
    current_fungible_asset_balances(where: {
      owner_address: {_eq: "${TETHER_RESERVES.PRIMARY}"},
      asset_type: {_eq: "${STABLECOINS.USDT}"}
    }) {
      amount
    }
  }
`;

async function fetchFromIndexer(query: string, variables: any) {
  const response = await fetch(APTOS_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.APTOS_BUILD_SECRET}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Indexer request failed: ${response.status}`);
  }

  const result = await response.json();
  if (result.errors) {
    apiLogger.error("Indexer query errors:", result.errors);
    throw new Error("Indexer query failed");
  }

  return result.data;
}

export async function POST(request: NextRequest) {
  try {
    const { tokens } = await request.json();

    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json(
        { error: "Invalid tokens array" },
        { status: 400 },
      );
    }

    apiLogger.info(`Fetching supplies for ${tokens.length} tokens`);

    // Separate FA addresses and coin types
    const faAddresses: string[] = [];
    const coinTypes: string[] = [];
    const tokenMap = new Map<string, TokenAddress>();

    tokens.forEach((token: TokenAddress) => {
      if (token.faAddress && token.faAddress !== "0xa") {
        // 0xa is special case for APT
        faAddresses.push(token.faAddress);
        tokenMap.set(token.faAddress, token);
      }
      if (token.tokenAddress) {
        coinTypes.push(token.tokenAddress);
        tokenMap.set(token.tokenAddress, token);
      }
    });

    // Batch process to avoid query limits
    const BATCH_SIZE = 100;
    const supplies: Record<string, number> = {};

    // Check if we need to fetch USDT reserve balance
    let usdtReserveBalance = 0;
    const hasUSDT = faAddresses.includes(STABLECOINS.USDT);
    if (hasUSDT) {
      try {
        const reserveData = await fetchFromIndexer(GET_USDT_RESERVE_QUERY, {});
        if (reserveData.current_fungible_asset_balances?.[0]) {
          usdtReserveBalance = parseFloat(
            reserveData.current_fungible_asset_balances[0].amount || "0",
          );
          apiLogger.info(`USDT reserve balance: ${usdtReserveBalance}`);
        }
      } catch (err) {
        apiLogger.warn("Failed to fetch USDT reserve balance:", err);
      }
    }

    // Process FA addresses in batches
    for (let i = 0; i < faAddresses.length; i += BATCH_SIZE) {
      const batch = faAddresses.slice(i, i + BATCH_SIZE);
      try {
        const faData = await fetchFromIndexer(GET_FA_SUPPLY_QUERY, {
          faAddresses: batch,
        });

        faData.fungible_asset_metadata?.forEach((fa: any) => {
          let supply = parseFloat(fa.supply_v2 || "0");
          const decimals = fa.decimals || 0;

          // For USDT, subtract the reserve balance before dividing by decimals
          if (fa.asset_type === STABLECOINS.USDT && usdtReserveBalance > 0) {
            supply = supply - usdtReserveBalance;
            apiLogger.info(
              `USDT: Total supply ${supply + usdtReserveBalance}, Reserve ${usdtReserveBalance}, Circulating ${supply}`,
            );
          }

          const actualSupply = supply / Math.pow(10, decimals);
          supplies[fa.asset_type] = actualSupply;
        });
      } catch (err) {
        apiLogger.warn(`Failed to fetch FA batch ${i / BATCH_SIZE}:`, err);
      }
    }

    // Process coin types in batches
    for (let i = 0; i < coinTypes.length; i += BATCH_SIZE) {
      const batch = coinTypes.slice(i, i + BATCH_SIZE);
      try {
        const coinData = await fetchFromIndexer(GET_COIN_SUPPLY_QUERY, {
          coinTypes: batch,
        });

        coinData.coin_infos?.forEach((coin: any) => {
          const supply = parseFloat(coin.supply || "0");
          const decimals = coin.decimals || 8;
          const actualSupply = supply / Math.pow(10, decimals);
          supplies[coin.coin_type] = actualSupply;
        });
      } catch (err) {
        apiLogger.warn(`Failed to fetch coin batch ${i / BATCH_SIZE}:`, err);
      }
    }

    // Special case for APT
    if (tokens.some((t) => t.tokenAddress === "0x1::aptos_coin::AptosCoin")) {
      supplies["0x1::aptos_coin::AptosCoin"] = 1100000000;
    }

    apiLogger.info(`Found supplies for ${Object.keys(supplies).length} tokens`);

    return NextResponse.json({
      success: true,
      supplies,
    });
  } catch (error) {
    apiLogger.error("Failed to fetch token supplies:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch supplies",
      },
      { status: 500 },
    );
  }
}
