import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";
import { aptosAnalytics } from "@/lib/services/blockchain/aptos-analytics";
import { UnifiedPanoraService } from "@/lib/services/portfolio/unified-panora-service";


// Mock the services
vi.mock("@/lib/services/portfolio/unified-panora-service");
vi.mock("@/lib/services/blockchain/aptos-analytics");

describe("GET /api/data/analytics/token-latest-price", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when tokenAddress is missing", async () => {
    const request = new Request(
      "http://localhost:3000/api/data/analytics/token-latest-price",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required parameter: address");
  });

  it("should fetch token price from Panora API", async () => {
    const mockTokenAddress = "0x1::aptos_coin::AptosCoin";
    const mockPriceData = {
      chainId: 1,
      tokenAddress: mockTokenAddress,
      faAddress: null,
      name: "Aptos",
      symbol: "APT",
      decimals: 8,
      usdPrice: "5.53",
      nativePrice: "1",
    };

    vi.mocked(UnifiedPanoraService.getTokenPrices).mockResolvedValueOnce(
      new Map([mockPriceData]),
    );

    const request = new Request(
      `http://localhost:3000/api/data/analytics/token-latest-price?tokenAddress=${mockTokenAddress}`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe("panora");
    expect(data.data).toHaveLength(1);
    expect(data.data[0].price_usd).toBe(5.53);
    expect(data.data[0].token_address).toBe(mockTokenAddress);
    expect(UnifiedPanoraService.getTokenPrices).toHaveBeenCalledWith([
      mockTokenAddress,
    ]);
  });

  it("should handle empty price data", async () => {
    const mockTokenAddress = "0x1::unknown::Token";

    vi.mocked(UnifiedPanoraService.getTokenPrices).mockResolvedValueOnce(
      new Map(),
    );
    vi.mocked(aptosAnalytics.getTokenLatestPrice).mockResolvedValueOnce([]);

    const request = new Request(
      `http://localhost:3000/api/data/analytics/token-latest-price?tokenAddress=${mockTokenAddress}`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.message).toBe("No price data available for this token");
    expect(data.address).toBe(mockTokenAddress);
  });

  it("should handle Panora API errors", async () => {
    const mockTokenAddress = "0x1::aptos_coin::AptosCoin";
    const mockAptosData = [
      {
        bucketed_timestamp_minutes_utc: new Date().toISOString(),
        price_usd: 5.5,
        token_address: mockTokenAddress,
      },
    ];

    vi.mocked(UnifiedPanoraService.getTokenPrices).mockRejectedValueOnce(
      new Error("Panora API error"),
    );
    vi.mocked(aptosAnalytics.getTokenLatestPrice).mockResolvedValueOnce(
      mockAptosData,
    );

    const request = new Request(
      `http://localhost:3000/api/data/analytics/token-latest-price?tokenAddress=${mockTokenAddress}`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe("aptos-analytics");
    expect(data.data).toEqual(mockAptosData);
  });

  it("should handle network errors", async () => {
    const mockTokenAddress = "0x1::aptos_coin::AptosCoin";
    const error = new Error("Network error");

    vi.mocked(UnifiedPanoraService.getTokenPrices).mockRejectedValueOnce(error);
    vi.mocked(aptosAnalytics.getTokenLatestPrice).mockRejectedValueOnce(error);

    const request = new Request(
      `http://localhost:3000/api/data/analytics/token-latest-price?tokenAddress=${mockTokenAddress}`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.message).toBe("No price data available for this token");
  });

  it("should include proper cache headers", async () => {
    const mockTokenAddress = "0x1::aptos_coin::AptosCoin";
    const mockPriceData = {
      chainId: 1,
      tokenAddress: mockTokenAddress,
      faAddress: null,
      name: "Aptos",
      symbol: "APT",
      decimals: 8,
      usdPrice: "5.53",
      nativePrice: "1",
    };

    vi.mocked(UnifiedPanoraService.getTokenPrices).mockResolvedValueOnce(
      new Map([mockPriceData]),
    );

    const request = new Request(
      `http://localhost:3000/api/data/analytics/token-latest-price?tokenAddress=${mockTokenAddress}`,
    );
    const response = await GET(request);

    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
  });
});
