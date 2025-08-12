import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

// Mock fetch for direct API calls
global.fetch = vi.fn();

describe("GET /api/aptos/btc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch Bitcoin data on Aptos", async () => {
    // Mock GraphQL responses
    const mockGraphQLResponse = {
      data: {
        fungible_asset_metadata: [
          {
            supply_v2: "10000000000", // 100 BTC with 8 decimals
          },
        ],
      },
    };

    const mockBalancesResponse = {
      data: {
        current_fungible_asset_balances: [
          { amount: "5000000000" },
          { amount: "3000000000" },
        ],
      },
    };

    // Mock different responses for different queries
    vi.mocked(fetch).mockImplementation(async (url: string, options: any) => {
      const body = JSON.parse(options.body);
      if (body.query.includes("fungible_asset_metadata")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockGraphQLResponse,
        } as Response);
      } else {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockBalancesResponse,
        } as Response);
      }
    });

    const request = new Request("http://localhost:3000/api/aptos/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveProperty("supplies");
    expect(data.data).toHaveProperty("total");
    expect(data.data).toHaveProperty("timestamp");
    expect(Array.isArray(data.data.supplies)).toBe(true);
    expect(data.data.supplies.length).toBeGreaterThan(0);
  });

  it("should handle service errors gracefully", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const request = new Request("http://localhost:3000/api/aptos/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch BTC supplies");
  });

  it("should include proper cache headers", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { fungible_asset_metadata: [] } }),
    } as Response);

    const request = new Request("http://localhost:3000/api/aptos/btc");
    const response = await GET(request);

    // The actual route returns no-cache headers for BTC data
    expect(response.headers.get("Cache-Control")).toBe(
      "no-cache, no-store, must-revalidate",
    );
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("Expires")).toBe("0");
  });
});
