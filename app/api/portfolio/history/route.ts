import { NextRequest, NextResponse } from 'next/server';
import { graphQLRequest } from '@/lib/utils/fetch-utils';
import { PanoraService } from '@/lib/trpc/domains/blockchain/portfolio/panora-service';
import {
  generateDailyTimestamps,
  withRetry,
  validateWalletAddress,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/utils/portfolio-utils';
import { coinGeckoCache, portfolioCache } from '@/lib/utils/simple-cache';

const INDEXER = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';
const APTOS_API_KEY = process.env.APTOS_BUILD_SECRET;

// Simplified query to get current balance and recent activities
const DAILY_BALANCE_QUERY = `
  query GetDailyBalances($owner_address: String!, $start_time: timestamp!) {
    current_balance: current_fungible_asset_balances(
      where: {
        owner_address: {_eq: $owner_address}
        asset_type: {_eq: "0x1::aptos_coin::AptosCoin"}
      }
    ) {
      amount
    }
    
    daily_activities: coin_activities(
      where: {
        owner_address: {_eq: $owner_address}
        coin_type: {_eq: "0x1::aptos_coin::AptosCoin"}
        transaction_timestamp: {_gte: $start_time}
        is_transaction_success: {_eq: true}
      }
      order_by: {transaction_timestamp: desc}
      limit: 1000
    ) {
      transaction_timestamp
      activity_type
      amount
    }
  }
`;

interface PortfolioDataPoint {
  date: string;
  aptBalance: number;
  aptPrice: number | null;
  totalValue: number;
  dataSource: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');
    const days = parseInt(searchParams.get('days') || '7', 10);
    const fields = searchParams.get('fields')?.split(',') || [
      'date',
      'aptBalance',
      'aptPrice',
      'totalValue',
    ];

    // Validate wallet address
    const validation = validateWalletAddress(walletAddress);
    if (!validation.isValid || !walletAddress) {
      return NextResponse.json(
        createErrorResponse(validation.error || 'Invalid wallet address'),
        { status: 400 }
      );
    }

    // Check combined cache
    const cacheKey = `portfolio-history-${walletAddress}-${days}`;
    const cached = portfolioCache.get<PortfolioDataPoint[]>(cacheKey);
    if (cached) {
      console.log('[Portfolio History] Using cached combined data');
      const filtered = filterFields(cached, fields);
      return NextResponse.json(
        createSuccessResponse(filtered, {
          cached: true,
          lastUpdated: new Date().toISOString(),
        })
      );
    }

    // Fetch data in parallel
    const [balanceData, priceData] = await Promise.all([
      fetchOptimizedBalanceHistory(walletAddress, days),
      fetchOptimizedPriceHistory(days),
    ]);

    // Combine and process data
    const portfolioHistory = processPortfolioData(balanceData, priceData, days);

    // Cache the processed result
    if (portfolioHistory.length > 0) {
      portfolioCache.set(cacheKey, portfolioHistory, 2 * 60 * 1000); // 2 minutes
    }

    // Filter fields based on request
    const filtered = filterFields(portfolioHistory, fields);

    return NextResponse.json(
      createSuccessResponse(filtered, {
        days,
        dataPoints: filtered.length,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('[Portfolio History] Error:', error);
    return NextResponse.json(
      createErrorResponse(
        'Failed to fetch portfolio history',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      { status: 500 }
    );
  }
}

async function fetchOptimizedBalanceHistory(
  walletAddress: string,
  days: number
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days + 3)); // Buffer for accuracy

  const response = await withRetry(
    () =>
      graphQLRequest<any>(
        INDEXER,
        {
          query: DAILY_BALANCE_QUERY,
          variables: {
            owner_address: walletAddress,
            start_time: startDate.toISOString(),
          },
        },
        APTOS_API_KEY
          ? { headers: { Authorization: `Bearer ${APTOS_API_KEY}` } }
          : {}
      ),
    {
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
    }
  );

  // Process balance data
  const currentBalance = response.current_balance[0]?.amount
    ? BigInt(response.current_balance[0].amount)
    : BigInt(0);

  const activities = response.daily_activities;

  return reconstructDailyBalances(currentBalance, activities, days);
}

async function fetchOptimizedPriceHistory(days: number) {
  // Try to get from cache first
  const geckoKey = `aptos-prices-${days}d`;
  const cachedPrices = coinGeckoCache.get<any>(geckoKey);

  if (cachedPrices) {
    return processPriceData(cachedPrices);
  }

  // Fetch current price from Panora
  let currentPrice = null;
  try {
    const panoraPrices = await PanoraService.getAllPrices();
    const aptToken = panoraPrices.find(token => token.symbol === 'APT');
    if (aptToken) {
      currentPrice = parseFloat(aptToken.usdPrice);
    }
  } catch (error) {
    console.warn('[Portfolio History] Panora price fetch failed:', error);
  }

  // Fetch historical prices from CoinGecko
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/aptos/market_chart?vs_currency=usd&days=${days + 1}&interval=daily`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (response.ok) {
      const data = await response.json();
      coinGeckoCache.set(geckoKey, data, 5 * 60 * 1000); // 5 minutes
      const processed = processPriceData(data);

      // Add current price if available
      if (currentPrice) {
        const today = new Date().toISOString().split('T')[0];
        processed.set(today, { price: currentPrice, source: 'panora' });
      }

      return processed;
    }
  } catch (error) {
    console.warn('[Portfolio History] CoinGecko fetch failed:', error);
  }

  // Return with just current price if available
  const priceMap = new Map();
  if (currentPrice) {
    const today = new Date().toISOString().split('T')[0];
    priceMap.set(today, { price: currentPrice, source: 'panora' });
  }
  return priceMap;
}

function reconstructDailyBalances(
  currentBalance: bigint,
  activities: any[],
  days: number
): Map<string, number> {
  const dailyTimestamps = generateDailyTimestamps(days);
  const balanceMap = new Map<string, number>();

  // Sort activities by timestamp
  const sortedActivities = activities
    .map(a => ({
      timestamp: a.transaction_timestamp,
      activity_type: a.activity_type,
      amount: BigInt(a.amount),
    }))
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  let runningBalance = currentBalance;

  // Work backwards through days
  for (let i = dailyTimestamps.length - 1; i >= 0; i--) {
    const timestamp = dailyTimestamps[i];
    const date = timestamp.split('T')[0];
    const snapshotTime = new Date(timestamp).getTime();

    // Reverse transactions that happened after this snapshot
    for (const activity of sortedActivities) {
      const activityTime = new Date(activity.timestamp).getTime();

      if (activityTime > snapshotTime && i < dailyTimestamps.length - 1) {
        const typeStr = activity.activity_type.toLowerCase();
        if (typeStr.includes('deposit') || typeStr.includes('receive')) {
          runningBalance -= activity.amount;
        } else if (typeStr.includes('withdraw') || typeStr.includes('send')) {
          runningBalance += activity.amount;
        }
      }
    }

    balanceMap.set(date, Number(runningBalance) / 1e8);
  }

  return balanceMap;
}

function processPriceData(
  geckoData: any
): Map<string, { price: number; source: string }> {
  const priceMap = new Map();
  const prices = geckoData.prices || [];

  for (const [timestamp, price] of prices) {
    const date = new Date(timestamp).toISOString().split('T')[0];
    priceMap.set(date, { price, source: 'coingecko' });
  }

  return priceMap;
}

function processPortfolioData(
  balances: Map<string, number>,
  prices: Map<string, { price: number; source: string }>,
  days: number
): PortfolioDataPoint[] {
  const dailyTimestamps = generateDailyTimestamps(days);
  const portfolio: PortfolioDataPoint[] = [];

  for (const timestamp of dailyTimestamps) {
    const date = timestamp.split('T')[0];
    const balance = balances.get(date) || 0;
    const priceData = prices.get(date);

    portfolio.push({
      date,
      aptBalance: balance,
      aptPrice: priceData?.price || null,
      totalValue: priceData ? balance * priceData.price : 0,
      dataSource: priceData?.source || null,
    });
  }

  return portfolio;
}

function filterFields(data: PortfolioDataPoint[], fields: string[]): any[] {
  if (fields.includes('*')) return data;

  return data.map(point => {
    const filtered: any = {};
    for (const field of fields) {
      if (field in point) {
        filtered[field] = point[field as keyof PortfolioDataPoint];
      }
    }
    return filtered;
  });
}
