import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

// Mock fetch for unified endpoint testing
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("GET /api/data/aptos/btc (DEPRECATED)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to unified assets endpoint", async () => {
    const mockUnifiedResponse = {
      supplies: [
        {
          token_address: "0x1::bitcoin::Bitcoin",
          symbol: "BTC",
          name: "Bitcoin",
          supply: "21000000",
          decimals: 8,
          market_cap_usd: "850000000000",
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUnifiedResponse,
    });

    const request = new Request("http://localhost:3000/api/data/aptos/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Deprecated")).toBe("true");
    expect(response.headers.get("X-Redirect-To")).toBe("/api/unified/assets?type=btc");
    expect(data).toEqual(mockUnifiedResponse.supplies);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/unified/assets?type=btc"));
  });

  it("should handle refresh parameter", async () => {
    const mockUnifiedResponse = {
      supplies: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUnifiedResponse,
    });

    const request = new Request("http://localhost:3000/api/data/aptos/btc?refresh=true");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("refresh=true"));
  });

  it("should handle unified endpoint errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    });

    const request = new Request("http://localhost:3000/api/data/aptos/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch Bitcoin data");
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

    const request = new Request("http://localhost:3000/api/data/aptos/btc");
    const response = await GET(request);

    expect(response.headers.get("X-Deprecated")).toBe("true");
    expect(response.headers.get("X-Redirect-To")).toBe("/api/unified/assets?type=btc");
    expect(response.headers.get("X-Service")).toBe("btc-supply");
    expect(response.headers.get("X-Data-Source")).toBe("Aptos Indexer");
  });

  it("should handle network errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const request = new Request("http://localhost:3000/api/data/aptos/btc");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch Bitcoin data");
  });
});
