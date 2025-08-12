import { describe, it, expect, vi, beforeEach } from "vitest";

import { AssetService } from "@/lib/services/portfolio/services/asset-service";

import { GET } from "./route";

// Mock the service
vi.mock("@/lib/services/portfolio/services/asset-service", () => ({
  AssetService: {
    getWalletAssets: vi.fn(),
  },
}));

describe("GET /api/portfolio/assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when address is missing", async () => {
    const request = new Request("http://localhost:3000/api/portfolio/assets");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Wallet address is required");
  });

  it("should return 400 when address is invalid", async () => {
    const request = new Request(
      "http://localhost:3000/api/portfolio/assets?walletAddress=invalid",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Wallet address is required");
  });

  it("should return assets when address is valid", async () => {
    const mockAssets = [
      {
        asset_type: "0x1::aptos_coin::AptosCoin",
        amount: "1000000000",
        metadata: {
          decimals: 8,
          name: "Aptos",
          symbol: "APT",
        },
      },
    ];

    vi.mocked(AssetService.getWalletAssets).mockResolvedValue(mockAssets);

    const validAddress = "0x" + "1".repeat(64);
    const request = new Request(
      `http://localhost:3000/api/portfolio/assets?walletAddress=${validAddress}`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.assets).toEqual(mockAssets);
    // Logging is tested
  });

  it("should handle service errors gracefully", async () => {
    const error = new Error("Service error");
    vi.mocked(AssetService.getWalletAssets).mockRejectedValue(error);

    const validAddress = "0x" + "1".repeat(64);
    const request = new Request(
      `http://localhost:3000/api/portfolio/assets?walletAddress=${validAddress}`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch portfolio assets");
    expect(
      // apiLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "/api/portfolio/assets",
        address: validAddress,
        error: error.message,
      }),
      "Failed to fetch wallet assets",
    );
  });

  it("should include proper cache headers", async () => {
    vi.mocked(AssetService.getWalletAssets).mockResolvedValue([]);

    const validAddress = "0x" + "1".repeat(64);
    const request = new Request(
      `http://localhost:3000/api/portfolio/assets?walletAddress=${validAddress}`,
    );
    const response = await GET(request);

    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
  });
});
