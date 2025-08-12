import { describe, it, expect, vi, beforeEach } from "vitest";

import { enhancedFetch } from "@/lib/utils/api/fetch-utils";
import { errorLogger } from "@/lib/utils/core/logger";

import { GET } from "./route";

// Mock enhancedFetch
vi.mock("@/lib/utils/fetch-utils", () => ({
  enhancedFetch: vi.fn(),
}));

describe("GET /api/prices/cmc/btc", () => {
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

    vi.mocked(enhancedFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const request = new Request("http://localhost:3000/api/prices/cmc/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.symbol).toBe("BTC");
    expect(data.data.name).toBe("Bitcoin");
    expect(data.data.price).toBe(45000);
    expect(data.data.change24h).toBe(2.3);
    expect(data.data.marketCap).toBe(850000000000);
    expect(data.data.source).toBe("CoinMarketCap");
    expect(enhancedFetch).toHaveBeenCalledWith(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=1",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-CMC_PRO_API_KEY": "test-cmc-api-key",
        }),
      }),
    );
  });

  it("should handle missing API key", async () => {
    vi.stubEnv("CMC_API_KEY", "");

    const request = new Request("http://localhost:3000/api/prices/cmc/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("CMC API key is required but not configured");
  });

  it("should handle CoinMarketCap API errors", async () => {
    vi.mocked(enhancedFetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "Unauthorized access",
    } as unknown as Response);

    const request = new Request("http://localhost:3000/api/prices/cmc/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain("CMC API error");
  });

  it("should handle network errors", async () => {
    const error = new Error("Network error");
    vi.mocked(enhancedFetch).mockRejectedValueOnce(error);

    const request = new Request("http://localhost:3000/api/prices/cmc/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("CMC Bitcoin price fetch failed");
    expect(errorLogger.error).toHaveBeenCalled();
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

    vi.mocked(enhancedFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const request = new Request("http://localhost:3000/api/prices/cmc/btc");
    const response = await GET(request);

    expect(response.headers.get("Cache-Control")).toContain("public");
    expect(response.headers.get("X-Service")).toBe("btc-price");
    expect(response.headers.get("X-Data-Source")).toBe("CoinMarketCap");
  });
});
