import { NextRequest } from "next/server";
import { describe, it, expect, vi } from "vitest";

import { GET } from "./route";

// Mock all services
vi.mock("@/lib/services/portfolio/services/asset-service", () => ({
  AssetService: {
    getWalletAssets: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/lib/services/portfolio/services/nft-service", () => ({
  NFTService: {
    getWalletNFTs: vi
      .fn()
      .mockResolvedValue({ data: [], hasMore: false, count: 0 }),
    getTotalNFTCount: vi.fn().mockResolvedValue(0),
    getNFTCollectionStats: vi
      .fn()
      .mockResolvedValue({ collections: [], totalCollections: 0 }),
    getAllWalletNFTs: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/lib/services/portfolio/services/defi-service", () => ({
  DeFiService: {
    getWalletDeFiPositions: vi.fn().mockResolvedValue([]),
    calculateWalletTotals: vi.fn().mockResolvedValue({ totalValueUSD: 0 }),
    calculateDeFiMetrics: vi.fn().mockResolvedValue({}),
  },
}));

describe("GET /api/portfolio/batch - Simple Test", () => {
  it("should return 400 when wallet address is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/portfolio/batch",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Wallet address is required");
  });

  it("should return portfolio data when address is provided", async () => {
    const validAddress = "0x" + "1".repeat(64);
    const request = new NextRequest(
      `http://localhost:3000/api/portfolio/batch?walletAddress=${validAddress}`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.assets).toBeDefined();
    expect(data.nfts).toBeDefined();
    expect(data.defiPositions).toBeDefined();
  });
});
