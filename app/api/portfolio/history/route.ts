import { NextRequest, NextResponse } from 'next/server';
import { PanoraService } from '@/lib/services/blockchain/portfolio/panora-service';
import {
  validateWalletAddress,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/utils/portfolio-utils';
import { portfolioCache } from '@/lib/utils/simple-cache';
import { logger } from '@/lib/utils/logger';

const APTOS_ANALYTICS_API = 'https://api.mainnet.aptoslabs.com/v1/analytics';

// Map timeframe to lookback parameter for store balances
// Note: historical_store_balances only accepts 'year' or 'all'
function getStoreBalanceLookback(days: number): string {
  if (days <= 365) return 'year';
  return 'all';
}

// Map timeframe to lookback parameter for token prices
// Token price history accepts 'hour', 'day', 'week', 'month'
function getTokenPriceLookback(days: number): string {
  if (days <= 1) return 'hour';
  if (days <= 7) return 'day';
  if (days <= 30) return 'week';
  return 'month';
}

interface PortfolioDataPoint {
  date: string;
  aptBalance: number;
  aptPrice: number | null;
  totalValue: number;
  dataSource: string | null;
}

interface StoreBalanceResponse {
  hourly_timestamp: string;
  total_store_balance_usd: number;
}

interface TokenPriceResponse {
  asset_address: string;
  price_hourly_timestamp: string;
  price_usd: number;
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

    // Fetch data in parallel from new Aptos Analytics APIs
    const [balanceData, priceData] = await Promise.all([
      fetchStoreBalanceHistory(walletAddress, days),
      fetchTokenPriceHistory(days),
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

async function fetchStoreBalanceHistory(
  walletAddress: string,
  days: number
): Promise<Map<string, number>> {
  try {
    const lookback = getStoreBalanceLookback(days);
    const url = `${APTOS_ANALYTICS_API}/historical_store_balances?account_address=${walletAddress}&lookback=${lookback}`;

    logger.info(
      `[Portfolio History] Fetching store balance history from ${url}`
    );

    const headers: HeadersInit = {
      Accept: 'application/json',
    };

    // Add authorization header if API key is available
    const apiKey =
      process.env.APTOS_BUILD_KEY || process.env.APTOS_BUILD_SECRET;
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Store balance API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.status !== 'success' || !result.data) {
      throw new Error(result.message || 'Failed to fetch store balances');
    }

    // Convert to map format
    const balanceMap = new Map<string, number>();

    for (const item of result.data as any[]) {
      // Convert timestamp to date string - handle both formats
      let dateString: string | undefined;
      if (item.hourly_timestamp) {
        dateString = item.hourly_timestamp.split(' ')[0]; // Get YYYY-MM-DD part
      } else if (item.date_day) {
        dateString = item.date_day; // Already in YYYY-MM-DD format
      }

      if (!dateString) {
        logger.warn('[Portfolio History] Skipping item with missing timestamp');
        continue;
      }

      const balanceValue =
        item.total_store_balance_usd || item.total_balance_usd || 0;
      balanceMap.set(dateString, balanceValue);
    }

    logger.info(
      `[Portfolio History] Retrieved ${balanceMap.size} balance data points`
    );
    return balanceMap;
  } catch (error) {
    logger.error('[Portfolio History] Error fetching store balances:', error);
    throw error;
  }
}

async function fetchTokenPriceHistory(
  days: number
): Promise<Map<string, { price: number; source: string }>> {
  try {
    const lookback = getTokenPriceLookback(days);
    const url = `${APTOS_ANALYTICS_API}/token/historical_prices?address=0x1::aptos_coin::AptosCoin&lookback=${lookback}`;

    logger.info(`[Portfolio History] Fetching APT price history from ${url}`);

    const headers: HeadersInit = {
      Accept: 'application/json',
    };

    // Add authorization header if API key is available
    const apiKey =
      process.env.APTOS_BUILD_KEY || process.env.APTOS_BUILD_SECRET;
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Token price API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.status !== 'success' || !result.data) {
      throw new Error(result.message || 'Failed to fetch token prices');
    }

    // Convert to map format
    const priceMap = new Map<string, { price: number; source: string }>();

    for (const item of result.data as TokenPriceResponse[]) {
      // Convert timestamp to date string
      if (!item.price_hourly_timestamp) {
        logger.warn(
          '[Portfolio History] Skipping price item with missing timestamp'
        );
        continue;
      }
      const date = item.price_hourly_timestamp.split(' ')[0]; // Get YYYY-MM-DD part
      priceMap.set(date, {
        price: item.price_usd || 0,
        source: 'aptos_analytics',
      });
    }

    // Try to get current price from Panora for today
    try {
      const panoraPrices = await PanoraService.getAllPrices();
      const aptToken = panoraPrices.find(token => token.symbol === 'APT');
      if (aptToken) {
        const today = new Date().toISOString().split('T')[0];
        priceMap.set(today, {
          price: parseFloat(aptToken.usdPrice),
          source: 'panora',
        });
      }
    } catch (error) {
      logger.warn('[Portfolio History] Panora price fetch failed:', error);
    }

    logger.info(
      `[Portfolio History] Retrieved ${priceMap.size} price data points`
    );
    return priceMap;
  } catch (error) {
    logger.error('[Portfolio History] Error fetching token prices:', error);
    throw error;
  }
}

function processPortfolioData(
  balances: Map<string, number>,
  prices: Map<string, { price: number; source: string }>,
  days: number
): PortfolioDataPoint[] {
  const portfolio: PortfolioDataPoint[] = [];

  // Get all unique dates from both balance and price data
  const allDates = new Set<string>();
  balances.forEach((_, date) => allDates.add(date));
  prices.forEach((_, date) => allDates.add(date));

  // Sort dates chronologically
  const sortedDates = Array.from(allDates).sort();

  // Filter to requested timeframe
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const filteredDates = sortedDates.filter(
    date => new Date(date) >= cutoffDate
  );

  for (const date of filteredDates) {
    const totalValueUsd = balances.get(date) || 0;
    const priceData = prices.get(date);

    // Calculate APT balance from USD value if we have price
    const aptBalance = priceData?.price ? totalValueUsd / priceData.price : 0;

    portfolio.push({
      date,
      aptBalance,
      aptPrice: priceData?.price || null,
      totalValue: totalValueUsd, // This is already in USD from the API
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
