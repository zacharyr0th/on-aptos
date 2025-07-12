import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../../app/api/rwa/route';

// Mock the CSV parser
vi.mock('../../lib/csv-parser', () => ({
  parseCSVData: vi.fn(() => []),
  transformCSVToRWAAsset: vi.fn(asset => asset),
  filterByProtocols: vi.fn(() => []),
}));

// Mock fs
vi.mock('fs', () => ({
  default: {},
  readFileSync: vi.fn(() => 'mock,csv,content'),
}));

// Mock path
vi.mock('path', () => ({
  default: {},
  join: vi.fn((...args) => args.join('/')),
}));

describe('/api/rwa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return enhanced RWA data successfully', async () => {
    // Mock fetch responses
    const mockProtocolsResponse = {
      ok: true,
      json: async () => [
        {
          slug: 'blackrock-buidl',
          name: 'BlackRock BUIDL',
          description: 'BlackRock USD Institutional Digital Liquidity Fund',
          logo: 'https://example.com/logo.png',
          url: 'https://example.com',
          chains: ['Aptos'],
        },
      ],
    };

    const mockProtocolDetailResponse = {
      ok: true,
      json: async () => ({
        tvl: 1000000000,
        chainTvls: {
          Aptos: {
            tvl: [
              {
                totalLiquidityUSD: 50000000,
              },
            ],
          },
        },
      }),
    };

    (global.fetch as any)
      .mockResolvedValueOnce(mockProtocolsResponse)
      .mockResolvedValueOnce(mockProtocolDetailResponse);

    const mockRequest = {
      headers: {
        get: vi.fn(() => 'test-user-agent'),
      },
    } as any;

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.dataSource).toBe('Enhanced DefiLlama API + CSV Export');
    expect(Array.isArray(data.assets)).toBe(true);
    expect(typeof data.totalAptosValue).toBe('number');
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const mockRequest = {
      headers: {
        get: vi.fn(() => 'test-user-agent'),
      },
    } as any;

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch enhanced Aptos RWA data');
    expect(data.details).toBe('Network error');
  });

  it('should handle empty protocol list', async () => {
    const mockEmptyResponse = {
      ok: true,
      json: async () => [],
    };

    (global.fetch as any).mockResolvedValue(mockEmptyResponse);

    const mockRequest = {
      headers: {
        get: vi.fn(() => 'test-user-agent'),
      },
    } as any;

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Since CSV data is mocked to return empty array, we expect 0 assets
    expect(data.assetCount).toBe(0);
  });

  it('should handle fetch errors with retries', async () => {
    // Mock fetch to fail then succeed
    (global.fetch as any)
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            slug: 'test-protocol',
            name: 'Test Protocol',
            chains: ['Aptos'],
          },
        ],
      });

    const mockRequest = {
      headers: {
        get: vi.fn(() => 'test-user-agent'),
      },
    } as any;

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
