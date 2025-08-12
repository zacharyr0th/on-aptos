import { NextRequest, NextResponse } from "next/server";

import { apiLogger } from "@/lib/utils/core/logger";

const APTOS_ANALYTICS_API = "https://api.mainnet.aptoslabs.com/v1/analytics";

interface PerformanceData {
  timestamp: string;
  value: number;
  price: number;
  balance: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("address");
    const timeframe = searchParams.get("timeframe") || "7d";

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    // Map timeframe to appropriate lookback and granularity
    const lookbackConfig = getTimeframeConfig(timeframe);

    // Fetch both balance history and price history in parallel
    const [balanceData, priceData] = await Promise.all([
      fetchBalanceHistory(walletAddress, lookbackConfig),
      fetchPriceHistory(lookbackConfig),
    ]);

    // If we're getting flat data, try the balance-history API directly
    if (balanceData && balanceData.length > 1) {
      const uniqueValues = [
        ...new Set(
          balanceData.map(
            (item: any) =>
              item.total_store_balance_usd ||
              item.total_balance_usd ||
              item.balance_usd ||
              0,
          ),
        ),
      ];

      if (uniqueValues.length <= 1) {
        // Try fetching via the internal balance-history API
        try {
          const balanceHistoryUrl = `${request.nextUrl.origin}/api/analytics/balance-history?address=${walletAddress}&lookback=${lookbackConfig.balanceLookback}`;
          const balanceHistoryResponse = await fetch(balanceHistoryUrl);

          if (balanceHistoryResponse.ok) {
            const balanceHistoryResult = await balanceHistoryResponse.json();
            if (
              balanceHistoryResult.data &&
              balanceHistoryResult.data.length > 0
            ) {
              apiLogger.info(
                "[Portfolio Performance] Using balance-history API data",
              );
              const alternativeData = balanceHistoryResult.data;

              // Check if this data is also flat
              const altUniqueValues = [
                ...new Set(
                  alternativeData.map(
                    (item: any) =>
                      item.total_store_balance_usd ||
                      item.total_balance_usd ||
                      item.balance_usd ||
                      0,
                  ),
                ),
              ];

              if (altUniqueValues.length > 1) {
                // Use the alternative data since it has variation
                balanceData.splice(0, balanceData.length, ...alternativeData);
              }
            }
          }
        } catch (altError) {
          apiLogger.warn(
            { error: altError },
            "[Portfolio Performance] Alternative balance fetch failed",
          );
        }
      }
    }

    // Check if we have any data
    if (!balanceData || balanceData.length === 0) {
      apiLogger.warn(
        { walletAddress },
        "[Portfolio Performance] No balance data returned for wallet",
      );
      return NextResponse.json({
        success: true,
        data: [],
        timeframe,
        dataPoints: 0,
        message: "No balance history found for this wallet",
      });
    }

    if (!priceData || priceData.length === 0) {
      apiLogger.warn("[Portfolio Performance] No price data returned");
      return NextResponse.json({
        success: true,
        data: [],
        timeframe,
        dataPoints: 0,
        message: "No price data available",
      });
    }

    // Combine and interpolate data
    const performanceData = combineData(balanceData, priceData, lookbackConfig);

    // If we have flat data, just return it as-is (real data only)
    if (performanceData.length > 1) {
      const uniqueValues = [
        ...new Set(performanceData.map((item) => item.value)),
      ];

      if (uniqueValues.length <= 1) {
        apiLogger.info(
          "[Portfolio Performance] Wallet has flat balance history - returning real data",
        );
      }
    }

    // Debug the combined data
    apiLogger.info(
      {
        firstItem: performanceData[0],
        lastItem: performanceData[performanceData.length - 1],
        totalItems: performanceData.length,
        allValuesSame:
          performanceData.length > 1
            ? performanceData.every(
                (item) => item.value === performanceData[0].value,
              )
            : false,
        uniqueValues: [...new Set(performanceData.map((item) => item.value))]
          .length,
        valueRange: {
          min: Math.min(...performanceData.map((item) => item.value)),
          max: Math.max(...performanceData.map((item) => item.value)),
        },
      },
      "[Portfolio Performance] Combined data sample",
    );

    return NextResponse.json({
      success: true,
      data: performanceData,
      timeframe,
      dataPoints: performanceData.length,
    });
  } catch (error) {
    apiLogger.error({ error }, "[Portfolio Performance] Error");
    return NextResponse.json(
      { error: "Failed to fetch portfolio performance data" },
      { status: 500 },
    );
  }
}

function getTimeframeConfig(timeframe: string) {
  switch (timeframe) {
    case "1h":
      return {
        balanceLookback: "year",
        priceLookback: "day", // 5min data
        days: 1 / 24, // 1 hour
        granularity: "minutes",
      };
    case "12h":
      return {
        balanceLookback: "year",
        priceLookback: "day", // 5min data
        days: 0.5, // 12 hours
        granularity: "minutes",
      };
    case "24h":
      return {
        balanceLookback: "year",
        priceLookback: "day", // 5min data
        days: 1,
        granularity: "hourly",
      };
    case "7d":
      return {
        balanceLookback: "year",
        priceLookback: "week", // 1hr data
        days: 7,
        granularity: "hourly",
      };
    case "30d":
      return {
        balanceLookback: "year",
        priceLookback: "month", // 4hr data
        days: 30,
        granularity: "daily",
      };
    case "90d":
      return {
        balanceLookback: "year",
        priceLookback: "year", // daily data
        days: 90,
        granularity: "daily",
      };
    case "1y":
      return {
        balanceLookback: "year",
        priceLookback: "year", // daily data
        days: 365,
        granularity: "daily",
      };
    case "all":
      return {
        balanceLookback: "all",
        priceLookback: "all", // daily closes
        days: 999999, // All time
        granularity: "daily",
      };
    default:
      return {
        balanceLookback: "year",
        priceLookback: "week",
        days: 7,
        granularity: "hourly",
      };
  }
}

async function fetchBalanceHistory(walletAddress: string, config: any) {
  const url = `${APTOS_ANALYTICS_API}/historical_store_balances?account_address=${walletAddress}&lookback=${config.balanceLookback}`;

  apiLogger.info(`[fetchBalanceHistory] Fetching from: ${url}`);

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  const apiKey = process.env.APTOS_BUILD_KEY || process.env.APTOS_BUILD_SECRET;
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    apiLogger.error(
      `[fetchBalanceHistory] API error: ${response.status} - ${errorText}`,
    );
    throw new Error(`Balance API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (result.status !== "success" || !result.data) {
    apiLogger.error(
      `[fetchBalanceHistory] Unexpected response: ${result instanceof Error ? result.message : JSON.stringify(result)}`,
    );
    throw new Error("Failed to fetch balance data");
  }

  apiLogger.info(
    `[Portfolio Performance] Balance data sample: ${result.data.length} items`,
  );

  return result.data;
}

async function fetchPriceHistory(config: any) {
  const url = `${APTOS_ANALYTICS_API}/token/historical_prices?address=0x1::aptos_coin::AptosCoin&lookback=${config.priceLookback}`;

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  const apiKey = process.env.APTOS_BUILD_KEY || process.env.APTOS_BUILD_SECRET;
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Price API error: ${response.status}`);
  }

  const result = await response.json();

  if (result.status !== "success" || !result.data) {
    throw new Error("Failed to fetch price data");
  }

  apiLogger.info(
    `[Portfolio Performance] Price data sample: ${result.data.length} items`,
  );

  return result.data;
}

function combineData(
  balanceData: any[],
  priceData: any[],
  config: any,
): PerformanceData[] {
  // Create maps for easier lookup
  const priceMap = new Map();
  priceData.forEach((item: any) => {
    // Handle different timestamp fields based on lookback period
    const timestamp =
      item.price_hourly_timestamp ||
      item.bucketed_timestamp_minutes_utc ||
      item.timestamp ||
      item.date;
    if (timestamp) {
      priceMap.set(timestamp, item.price_usd);
    }
  });

  const allBalances = balanceData;

  // Create a map of balance data for easier lookup
  const balanceMap = new Map();
  allBalances.forEach((item: any) => {
    // The actual field names from the API
    const timestamp =
      item.date_day || item.hourly_timestamp || item.date || item.timestamp;
    const value =
      item.total_balance_usd ||
      item.total_store_balance_usd ||
      item.balance_usd ||
      0;
    if (timestamp) {
      // Store as date string normalized to start of day for daily data
      const dateKey = new Date(timestamp).toISOString().split("T")[0];
      balanceMap.set(dateKey, value);
    }
  });

  // For granular timeframes, iterate through price data to maintain granularity
  const result: PerformanceData[] = [];

  if (
    config.granularity === "minutes" ||
    config.granularity === "hourly" ||
    config.days <= 90
  ) {
    // For short timeframes, use price data points to maintain granularity
    priceData.forEach((priceItem: any) => {
      const priceTimestamp =
        priceItem.price_hourly_timestamp ||
        priceItem.bucketed_timestamp_minutes_utc ||
        priceItem.timestamp ||
        priceItem.date;

      if (!priceTimestamp) return;

      const price = priceItem.price_usd || 0;

      // Find the closest balance data
      const priceDate = new Date(priceTimestamp);
      const dateKey = priceDate.toISOString().split("T")[0];

      // Try exact date match first, then previous day
      let balanceValue = balanceMap.get(dateKey);
      if (!balanceValue && balanceMap.size > 0) {
        // Find closest balance by checking all dates
        const sortedDates = Array.from(balanceMap.keys()).sort();

        // Find the latest date that's not after the price date
        let closestDate = null;
        for (const date of sortedDates) {
          if (date <= dateKey) {
            closestDate = date;
          } else {
            break;
          }
        }

        if (closestDate) {
          balanceValue = balanceMap.get(closestDate);
        } else {
          // Use the first available balance if all dates are after price date
          balanceValue = balanceMap.get(sortedDates[0]) || 0;
        }
      }

      const totalValue = balanceValue || 0;
      const balance = price > 0 ? totalValue / price : 0;

      result.push({
        timestamp: priceTimestamp,
        value: totalValue,
        price,
        balance,
      });
    });
  } else {
    // For longer timeframes, use balance data points (daily granularity is fine)
    allBalances.forEach((balanceItem: any) => {
      const timestamp =
        balanceItem.date_day ||
        balanceItem.hourly_timestamp ||
        balanceItem.date ||
        balanceItem.timestamp;
      const totalValue =
        balanceItem.total_balance_usd ||
        balanceItem.total_store_balance_usd ||
        balanceItem.balance_usd ||
        0;

      if (!timestamp) return;

      // Find the closest price
      let price = 0;
      let closestPrice = null;
      let minDiff = Infinity;

      const balanceTime = new Date(timestamp).getTime();

      priceMap.forEach((priceValue, priceTimestamp) => {
        const priceTime = new Date(priceTimestamp).getTime();
        const diff = Math.abs(balanceTime - priceTime);

        if (diff < minDiff) {
          minDiff = diff;
          closestPrice = priceValue;
        }
      });

      price = closestPrice || 0;
      const balance = price > 0 ? totalValue / price : 0;

      result.push({
        timestamp,
        value: totalValue,
        price,
        balance,
      });
    });
  }

  // Sort by timestamp
  result.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Now filter to the requested timeframe (unless it's 'all')
  let filteredResult = result;

  if (config.days < 999999) {
    // Not 'all' timeframe
    const cutoffDate = new Date();
    cutoffDate.setTime(
      cutoffDate.getTime() - config.days * 24 * 60 * 60 * 1000,
    );

    filteredResult = result.filter((item) => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= cutoffDate;
    });
  }

  return filteredResult;
}
