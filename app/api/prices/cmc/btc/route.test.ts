import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("GET /api/data/prices/cmc/btc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CMC_API_KEY", "test-cmc-api-key");
  });

  it("should fetch BTC price from CoinMarketCap", async () => {
    const mockResponse = {
      data: {
        "1": {
          id: 1,
          name: "Bitcoin",
          symbol: "BTC",
          quote: {
            USD: {
              price: 45000,
              volume_24h: 20000000000,
              percent_change_1h: 0.5,
              percent_change_24h: 2.3,
              percent_change_7d: -1.2,
              market_cap: 850000000000,
            },
          },
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const request = new Request("http://localhost:3000/api/data/prices/cmc/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.symbol).toBe("BTC");
    expect(data.name).toBe("Bitcoin");
    expect(data.price).toBe(45000);
    expect(data.change24h).toBe(2.3);
    expect(data.marketCap).toBe(850000000000);
    expect(data.source).toBe("CoinMarketCap");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=1",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-CMC_PRO_API_KEY": "test-cmc-api-key",
          Accept: "application/json",
          "User-Agent": "OnAptos-BTC-Tracker/1.0",
        }),
      })
    );
  });

  it("should handle missing API key", async () => {
    vi.stubEnv("CMC_API_KEY", "");

    const request = new Request("http://localhost:3000/api/data/prices/cmc/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("CMC API key is required but not configured");
  });

  it("should handle CoinMarketCap API errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "Unauthorized access",
    });

    const request = new Request("http://localhost:3000/api/data/prices/cmc/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain("CMC API error");
  });

  it("should handle invalid price data", async () => {
    const mockResponse = {
      data: {
        "1": {
          quote: {
            USD: {
              price: null, // Invalid price
            },
          },
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const request = new Request("http://localhost:3000/api/data/prices/cmc/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe("Invalid Bitcoin price data received from CMC");
  });

  it("should include proper cache headers", async () => {
    const mockResponse = {
      data: {
        "1": {
          quote: {
            USD: {
              price: 45000,
              percent_change_24h: 2.3,
              market_cap: 850000000000,
            },
          },
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const request = new Request("http://localhost:3000/api/data/prices/cmc/btc");
    const response = await GET(request);

    expect(response.headers.get("Cache-Control")).toContain("s-maxage");
    expect(response.headers.get("X-Service")).toBe("btc-price");
    expect(response.headers.get("X-Data-Source")).toBe("CoinMarketCap");
  });
});
