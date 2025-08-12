import { NextRequest } from "next/server";
import { describe, it, expect, vi } from "vitest";

import { GET } from "./route";

// Mock the entire module before importing
vi.mock("@/lib/services/portfolio/services/asset-service", () => ({
  AssetService: {
    getWalletAssets: vi.fn().mockResolvedValue([
      {
        asset_type: "0x1::aptos_coin::AptosCoin",
        amount: "1000000000",
        metadata: {
          decimals: 8,
          name: "Aptos",
          symbol: "APT",
        },
      },
    ]),
  },
}));

describe("GET /api/portfolio/assets - Simple Test", () => {
  it("should return 400 when wallet address is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/portfolio/assets",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Wallet address is required");
  });

  it("should return assets when wallet address is provided", async () => {
    const validAddress = "0x" + "1".repeat(64);
    const request = new NextRequest(
      `http://localhost:3000/api/portfolio/assets?walletAddress=${validAddress}`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.assets).toBeDefined();
    expect(data.data.assets).toHaveLength(1);
    expect(data.data.assets[0].asset_type).toBe("0x1::aptos_coin::AptosCoin");
  });
});
