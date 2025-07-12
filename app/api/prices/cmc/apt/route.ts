import { withApiEnhancements } from '@/lib/utils/server';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import { enhancedFetch } from '@/lib/utils/fetch-utils';
import {
  ApiError,
  formatApiError,
  withErrorHandling,
  type ErrorContext,
} from '@/lib/utils';
import { NextRequest } from 'next/server';

// Revalidate this route every 1 minute
export const revalidate = 60;

export async function GET(request: NextRequest) {
  const errorContext: ErrorContext = {
    operation: 'CMC APT Price API',
    service: 'CMC-APT',
    details: {
      endpoint: '/api/prices/cmc/apt',
      userAgent: request.headers.get('user-agent')?.slice(0, 50) || 'unknown',
    },
  };

  return withApiEnhancements(
    () =>
      withErrorHandling(async () => {
        // Validate API key
        const apiKey = process.env.CMC_API_KEY;
        if (!apiKey) {
          throw new ApiError(
            'CMC API key is required but not configured',
            500,
            'CMC-Config'
          );
        }

        try {
          // APT's ID on CMC is 21794
          const response = await enhancedFetch(
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=21794',
            {
              headers: {
                'X-CMC_PRO_API_KEY': apiKey,
                Accept: 'application/json',
                'User-Agent': 'OnAptos-APT-Tracker/1.0',
              },
              timeout: SERVICE_CONFIG.prices.timeout,
              next: { revalidate },
            }
          );

          if (!response.ok) {
            const errorBody = await response
              .text()
              .catch(() => 'Unknown error');
            throw new ApiError(
              `CMC API error: ${response.status} - ${errorBody}`,
              response.status,
              'CMC-API'
            );
          }

          const data = await response.json();
          const price = data?.data?.['21794']?.quote?.USD?.price;

          if (typeof price !== 'number' || price <= 0) {
            throw new ApiError(
              'Invalid APT price data received from CMC',
              502,
              'CMC-Data'
            );
          }

          return {
            symbol: 'APT',
            name: 'Aptos',
            price,
            change24h:
              data?.data?.['21794']?.quote?.USD?.percent_change_24h || null,
            marketCap: data?.data?.['21794']?.quote?.USD?.market_cap || null,
            updated: new Date().toISOString(),
            source: 'CoinMarketCap',
          };
        } catch (error) {
          console.error(
            'CMC APT price fetch error:',
            formatApiError(error)
          );

          if (error instanceof ApiError) {
            throw error;
          }

          if (error instanceof Error && error.name === 'TimeoutError') {
            throw new ApiError('CMC API request timed out', 504, 'CMC-Timeout');
          }

          throw new ApiError(
            `CMC APT price fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            500,
            'CMC-APT'
          );
        }
      }, errorContext),
    {
      customHeaders: {
        'Cache-Control': `public, max-age=${Math.floor(SERVICE_CONFIG.prices.ttl / 1000)}, stale-while-revalidate=${Math.floor(SERVICE_CONFIG.prices.ttl / 2000)}`,
        'X-Content-Type': 'application/json',
        'X-Service': 'apt-price',
        'X-API-Version': '2.0',
        'X-Data-Source': 'CoinMarketCap',
        Vary: 'Accept-Encoding',
      },
    }
  );
}