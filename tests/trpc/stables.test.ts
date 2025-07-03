import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stablesRouter } from '../../lib/trpc/routers/stables';
import { createContext } from '../../lib/trpc/core/context';

// Mock the utility functions
vi.mock('../../lib/utils', () => ({
  getCachedData: vi.fn(),
  setCachedData: vi.fn(),
  graphQLRequest: vi.fn(),
  cacheFirst: vi.fn(),
  withErrorHandling: vi.fn(fn => fn()),
}));

// Mock the config
vi.mock('../../lib/config/data', () => ({
  STABLE_TOKENS: {
    USDC: '0x1::coin::CoinStore<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>',
    USDt: '0x1::coin::CoinStore<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT>',
  },
  TETHER_RESERVE_ADDRESS: '0x1234567890abcdef',
}));

vi.mock('../../lib/config/cache', () => ({
  SERVICE_CONFIG: {
    stables: {
      timeout: 5000,
      retries: 3,
    },
  },
}));

describe('stablesRouter', () => {
  let caller: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const ctx = await createContext({
      req: {} as any,
      res: {} as any,
    });
    caller = stablesRouter.createCaller(ctx);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return stables supplies data', async () => {
    const mockData = {
      supplies: [
        {
          symbol: 'USDC',
          supply: '1000000',
          supply_raw: '1000000000000',
          percentage: 60,
          asset_type:
            '0x1::coin::CoinStore<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>',
        },
        {
          symbol: 'USDt',
          supply: '666666',
          supply_raw: '666666000000',
          percentage: 40,
          asset_type:
            '0x1::coin::CoinStore<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT>',
        },
      ],
      total: '1666666',
      total_raw: '1666666000000',
      debug: {
        cached_entries: 0,
        fallback_used: false,
        performance: {
          cache_hits: 0,
          cache_misses: 2,
          api_calls: 2,
        },
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
        apiCalls: 2,
      },
      cache: {
        cached: false,
      },
    });

    const result = await caller.getSupplies({ forceRefresh: false });

    expect(result.data.supplies).toHaveLength(2);
    expect(result.data.supplies[0].symbol).toBe('USDC');
    expect(result.data.supplies[1].symbol).toBe('USDt');
    expect(result.data.total).toBe('1666666');
  });

  it('should handle GraphQL errors', async () => {
    const { cacheFirst } = await import('../../lib/utils');
    (cacheFirst as any).mockRejectedValue(new Error('GraphQL error'));

    await expect(caller.getSupplies({ forceRefresh: false })).rejects.toThrow(
      'GraphQL error'
    );
  });

  it('should handle force refresh', async () => {
    const mockData = {
      supplies: [],
      total: '0',
      total_raw: '0',
      debug: {
        cached_entries: 0,
        fallback_used: false,
        performance: {
          cache_hits: 0,
          cache_misses: 0,
          api_calls: 2,
        },
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
        apiCalls: 2,
      },
      cache: {
        cached: false,
      },
    });

    const result = await caller.getSupplies({ forceRefresh: true });

    expect(result.data.supplies).toHaveLength(0);
    expect(cacheFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        forceRefresh: true,
      })
    );
  });
});
