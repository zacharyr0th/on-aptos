import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// Mock fetch for direct API calls
global.fetch = vi.fn();

describe("GET /api/data/aptos/stables", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch stablecoin data on Aptos", async () => {
    // Mock GraphQL response for fungible assets
    const mockGraphQLResponse = {
      data: {
        fungible_asset_metadata: [
          {
            asset_type:
              "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
            supply_v2: "500000000000000",
            decimals: 6,
          },
          {
            asset_type:
              "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b",
            supply_v2: "300000000000000",
            decimals: 6,
          },
        ],
        current_fungible_asset_balances: [
          {
            amount: "50000000000000",
          },
        ],
      },
    };

    // Mock REST API responses for bridged coins
    const mockCoinResponse = {
      data: {
        supply: "100000000000000",
      },
    };

    vi.mocked(fetch).mockImplementation(async (url: string) => {
      if (url.includes("graphql")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockGraphQLResponse,
        } as Response);
      } else {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockCoinResponse,
        } as Response);
      }
    });

    const request = new Request("http://localhost:3000/api/data/aptos/stables");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveProperty("supplies");
    expect(data.data).toHaveProperty("total");
    expect(data.data).toHaveProperty("usdt_reserve");
    expect(Array.isArray(data.data.supplies)).toBe(true);
  });

  it("should handle service errors gracefully", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const request = new Request("http://localhost:3000/api/data/aptos/stables");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch stablecoin data");
  });

  it("should include proper cache headers", async () => {
    const mockResponse = {
      data: {
        fungible_asset_metadata: [],
        current_fungible_asset_balances: [],
      },
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const request = new Request("http://localhost:3000/api/data/aptos/stables");
    const response = await GET(request);

    // The actual route returns no-cache headers for stablecoin data
    expect(response.headers.get("Cache-Control")).toBe(
      "no-cache, no-store, must-revalidate",
    );
  });
});
