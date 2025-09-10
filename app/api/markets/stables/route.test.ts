import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

// Mock fetch for unified endpoint testing
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("GET /api/data/aptos/stables (DEPRECATED)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to unified assets endpoint", async () => {
    const mockUnifiedResponse = {
      supplies: [
        {
          token_address: "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
          symbol: "USDC",
          name: "USD Coin",
          supply: "500000000",
          decimals: 6,
          market_cap_usd: "500000000",
        },
        {
          token_address: "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b",
          symbol: "USDT",
          name: "Tether USD",
          supply: "300000000",
          decimals: 6,
          market_cap_usd: "300000000",
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUnifiedResponse,
    });

    const request = new Request("http://localhost:3000/api/data/aptos/stables");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Deprecated")).toBe("true");
    expect(response.headers.get("X-Redirect-To")).toBe("/api/unified/assets?type=stables");
    expect(data).toEqual(mockUnifiedResponse.supplies);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/unified/assets?type=stables")
    );
  });

  it("should handle unified endpoint errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    });

    const request = new Request("http://localhost:3000/api/data/aptos/stables");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch stablecoin data");
  });

  it("should include proper deprecation headers", async () => {
    const mockUnifiedResponse = {
      supplies: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUnifiedResponse,
    });

    const request = new Request("http://localhost:3000/api/data/aptos/stables");
    const response = await GET(request);

    expect(response.headers.get("X-Deprecated")).toBe("true");
    expect(response.headers.get("X-Redirect-To")).toBe("/api/unified/assets?type=stables");
    expect(response.headers.get("X-Service")).toBe("stables-data");
    expect(response.headers.get("X-Data-Source")).toBe("Aptos Indexer");
  });

  it("should handle network errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const request = new Request("http://localhost:3000/api/data/aptos/stables");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch stablecoin data");
  });

  it("should return unwrapped data format for backward compatibility", async () => {
    const mockUnifiedResponse = {
      supplies: [
        {
          symbol: "USDC",
          supply: "500000000",
        },
      ],
      metadata: {
        total: "500000000",
        count: 1,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUnifiedResponse,
    });

    const request = new Request("http://localhost:3000/api/data/aptos/stables");
    const response = await GET(request);
    const data = await response.json();

    // Should return the supplies directly, not wrapped in a "supplies" property
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual(mockUnifiedResponse.supplies);
  });
});
