import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bitcoinRouter } from '../../lib/trpc/domains/assets/bitcoin/router';
import { createContext } from '../../lib/trpc/core/context';

// Mock the utility functions
vi.mock('../../lib/utils', () => ({
  formatBigIntWithDecimals: vi.fn((amount, decimals) =>
    (Number(amount) / Math.pow(10, decimals)).toFixed(decimals)
  ),
  graphQLRequest: vi.fn(),
  cacheFirst: vi.fn(),
  withErrorHandling: vi.fn(fn => fn()),
}));

// Mock the config
vi.mock('../../lib/config/data', () => ({
  BTC_ASSETS: [
    {
      symbol: 'BTC',
      assetAddress: '0x123abc',
      description: 'Bitcoin',
    },
  ],
  BTC_TOKENS: {
    BTC: {
      asset_type: '0x123abc',
      decimals: 8,
    },
  },
}));

vi.mock('../../lib/config/cache', () => ({
  SERVICE_CONFIG: {
    btc: {
      timeout: 5000,
      retries: 3,
    },
  },
}));

// Mock fetch for Echelon API
global.fetch = vi.fn();

describe('btcRouter', () => {
  let caller: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const ctx = await createContext({
      req: {} as any,
      res: {} as any,
    });
    caller = bitcoinRouter.createCaller(ctx);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return BTC supplies data from Echelon', async () => {
    // Mock Echelon API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          assets: [
            {
              address: '0x123abc',
              market: '0x456def',
              symbol: 'BTC',
              price: 50000,
              decimals: 8,
              supplyApr: 0.05,
              borrowApr: 0.08,
              stakingApr: 0.02,
            },
          ],
          marketStats: [
            [
              '0x123abc',
              {
                totalCash: '10.0',
                totalLiability: '5.0',
                totalReserve: '1.0',
              },
            ],
          ],
        },
      }),
    });

    const mockData = {
      protocol: 'Echelon',
      markets: [
        {
          symbol: 'BTC',
          marketAddress: '0x456def',
          assetType: '0x123abc',
          description: 'Bitcoin',
          balance: '10.00000000',
          rawBalance: '1000000000',
          decimals: 8,
          apyBase: 5,
          apyReward: 2,
          apyBaseBorrow: 8,
          totalSupply: 14,
          totalBorrow: 5,
          totalSupplyUsd: 700000,
          totalBorrowUsd: 250000,
          tvlUsd: 450000,
          price: 50000,
        },
      ],
      total: {
        btc: '10.0000000000',
        normalized: '100000000000',
        tvlUsd: 450000,
      },
    };

    const { cacheFirst } = await import('../../lib/utils');
    (cacheFirst as any).mockResolvedValue({
      data: mockData,
      timestamp: new Date().toISOString(),
      performance: {
        responseTimeMs: 100,
        cacheHits: 0,
        cacheMisses: 0,
        apiCalls: 1,
      },
      cache: {
        cached: false,
      },
    });

    const result = await caller.getSupplies({ forceRefresh: false });

    expect(result.data.protocol).toBe('Echelon');
    expect(result.data.markets).toHaveLength(1);
    expect(result.data.markets[0].symbol).toBe('BTC');
    expect(result.data.total.tvlUsd).toBe(450000);
  });

  it('should return comprehensive BTC supplies', async () => {
    const mockData = {
      supplies: [
        {
          symbol: 'BTC',
          supply: '1000000000',
          formatted_supply: '10.00000000',
        },
      ],
      total: '1000000000',
      total_formatted: '10.00000000',
      total_decimals: 8,
    };

    const { cacheFirst } = await import('../../lib/utils');
    (cacheFirst as any).mockResolvedValue({
      data: mockData,
      timestamp: new Date().toISOString(),
      performance: {
        responseTimeMs: 100,
        cacheHits: 0,
        cacheMisses: 0,
        apiCalls: 1,
      },
      cache: {
        cached: false,
      },
    });

    const result = await caller.getBTCSupplies({ forceRefresh: false });

    expect(result.data.supplies).toHaveLength(1);
    expect(result.data.supplies[0].symbol).toBe('BTC');
    expect(result.data.total_formatted).toBe('10.00000000');
  });

  it('should handle Echelon API errors with fallback', async () => {
    // Mock failed API call
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    const { cacheFirst } = await import('../../lib/utils');
    (cacheFirst as any).mockRejectedValue(new Error('Cache error'));

    const result = await caller.getBTCSupplies({ forceRefresh: false });

    // Should return fallback data
    expect(result.data.supplies).toHaveLength(1);
    expect(result.data.supplies[0].supply).toBe('0');
    expect(result.data.total).toBe('0');
  });

  it('should handle GraphQL errors for individual asset supplies', async () => {
    const { graphQLRequest } = await import('../../lib/utils');
    (graphQLRequest as any).mockRejectedValue(new Error('GraphQL error'));

    const { cacheFirst } = await import('../../lib/utils');
    (cacheFirst as any).mockImplementation(async ({ fetchFn }) => {
      return {
        data: await fetchFn(),
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: 100,
          cacheHits: 0,
          cacheMisses: 0,
          apiCalls: 1,
        },
        cache: {
          cached: false,
        },
      };
    });

    const result = await caller.getBTCSupplies({ forceRefresh: false });

    // Should handle errors gracefully and return zeros
    expect(result.data.supplies).toHaveLength(1);
    expect(result.data.supplies[0].supply).toBe('0');
  });
});
