import { NextRequest, NextResponse } from 'next/server';
import { PanoraService } from '@/lib/trpc/domains/blockchain/portfolio/panora-service';
import {
  generateDailyTimestamps,
  withRetry,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/utils/portfolio-utils';
import { coinGeckoCache } from '@/lib/utils/simple-cache';

// Only cache external API responses to avoid rate limits

export async function GET(request: NextRequest) {
  try {
    const priceHistory = [];
    const today = new Date();

    // Get current price from Panora for today with error handling
    let currentPrice = null;
    let panoraError = null;
    try {
      const panoraPrices = await PanoraService.getAllPrices();
      const aptToken = panoraPrices.find(token => token.symbol === 'APT');
      if (aptToken) {
        currentPrice = parseFloat(aptToken.usdPrice);
        console.log(
          '[APT Price History] Using Panora price for today:',
          currentPrice
        );
      }
    } catch (error) {
      panoraError = error;
      console.warn('[APT Price History] Failed to get Panora price:', error);
    }

    // Use market_chart endpoint to get all 7 days in one request with retries
    let historicalPrices = new Map<string, number>();
    let geckoError = null;

    // Check CoinGecko cache first
    const geckoKey = 'aptos-market-chart-7d';
    const cachedGecko = coinGeckoCache.get<any>(geckoKey);

    if (cachedGecko) {
      const prices = cachedGecko.prices || [];
      for (const [timestamp, price] of prices) {
        const date = new Date(timestamp);
        const dateStr = date.toISOString().split('T')[0];
        historicalPrices.set(dateStr, price);
      }
      console.log(
        `[APT Price History] Using cached CoinGecko data: ${historicalPrices.size} prices`
      );
    } else {
      try {
        const response = await withRetry(
          () =>
            fetch(
              'https://api.coingecko.com/api/v3/coins/aptos/market_chart?vs_currency=usd&days=8&interval=daily',
              {
                headers: {
                  Accept: 'application/json',
                },
                signal: AbortSignal.timeout(10000), // 10 second timeout
              }
            ),
          {
            maxAttempts: 3,
            backoffStrategy: 'exponential',
            baseDelay: 1000,
            onRetry: (attempt, error) => {
              console.log(`[APT Price History] Retry attempt ${attempt}/3`);
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const prices = data.prices || [];

          // Cache the successful response
          coinGeckoCache.set(geckoKey, data);

          // Convert to date map
          for (const [timestamp, price] of prices) {
            const date = new Date(timestamp);
            const dateStr = date.toISOString().split('T')[0];
            historicalPrices.set(dateStr, price);
          }
          console.log(
            `[APT Price History] Got ${historicalPrices.size} prices from market_chart`
          );
        } else if (response.status === 429) {
          console.warn(`[APT Price History] Rate limited`);
        } else {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }
      } catch (error) {
        geckoError = error;
        console.warn(
          `[APT Price History] Failed to fetch historical prices:`,
          error
        );
      }
    }

    // If both APIs failed, return error (no fallback data)
    if (historicalPrices.size === 0 && !currentPrice) {
      return NextResponse.json(
        createErrorResponse('Unable to fetch price data', 503, {
          panoraError:
            panoraError instanceof Error
              ? panoraError.message
              : String(panoraError),
          geckoError:
            geckoError instanceof Error
              ? geckoError.message
              : String(geckoError),
        }),
        { status: 503 }
      );
    }

    // Generate last 7 days at noon UTC
    const dailyTimestamps = generateDailyTimestamps(7);
    let successCount = 0;

    for (let i = 0; i < dailyTimestamps.length; i++) {
      const timestamp = dailyTimestamps[i];
      const dateStr = timestamp.split('T')[0];
      const isToday = i === dailyTimestamps.length - 1;

      let price = null;
      let dataSource = null;

      if (isToday && currentPrice) {
        price = currentPrice;
        dataSource = 'panora';
      } else if (historicalPrices.has(dateStr)) {
        price = historicalPrices.get(dateStr);
        dataSource = 'coingecko';
      }

      if (price !== null) {
        successCount++;
      }

      priceHistory.push({
        date: dateStr,
        timestamp: timestamp,
        price,
        dataSource,
        hasData: price !== null,
      });
    }

    return NextResponse.json(
      createSuccessResponse(priceHistory, {
        days: 7,
        successfulPrices: successCount,
        missingDays: 7 - successCount,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('[APT Price History] Unexpected error:', error);
    return NextResponse.json(
      createErrorResponse(
        'Failed to fetch APT price history',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      { status: 500 }
    );
  }
}
