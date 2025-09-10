import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeFiService } from "@/lib/services/defi/services/defi-service";
import { AssetService } from "@/lib/services/portfolio/services/asset-service";
import { NFTService } from "@/lib/services/portfolio/services/nft-service";
import { TransactionService } from "@/lib/services/portfolio/services/transaction-service";
import { GET } from "./route";

// Mock all services
vi.mock("@/lib/services/defi/services/defi-service", () => ({
  DeFiService: {
    getWalletDeFiPositions: vi.fn(),
    calculateDeFiMetrics: vi.fn(),
  },
}));

vi.mock("@/lib/services/portfolio/services/asset-service", () => ({
  AssetService: {
    getWalletAssets: vi.fn(),
  },
}));

vi.mock("@/lib/services/portfolio/services/nft-service", () => ({
  NFTService: {
    getTotalNFTCount: vi.fn(),
    getWalletNFTs: vi.fn(),
    getAllWalletNFTs: vi.fn(),
    getCollectionStats: vi.fn(),
  },
}));

vi.mock("@/lib/services/portfolio/services/transaction-service", () => ({
  TransactionService: {
    fetchTransactionsWithDetails: vi.fn(),
  },
}));

describe("GET /api/portfolio/batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful responses
    (AssetService.getWalletAssets as any).mockResolvedValue([]);
    (DeFiService.getWalletDeFiPositions as any).mockResolvedValue([]);
    (DeFiService.calculateDeFiMetrics as any).mockResolvedValue({});
    (NFTService.getTotalNFTCount as any).mockResolvedValue(0);
    (NFTService.getWalletNFTs as any).mockResolvedValue({ data: [] });
    (NFTService.getCollectionStats as any).mockResolvedValue({});
    (TransactionService.fetchTransactionsWithDetails as any).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  it("should return 400 when walletAddress is missing", async () => {
    const request = new Request("http://localhost:3000/api/portfolio/batch");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("walletAddress");
  });

  it("should return batch portfolio data when walletAddress is provided", async () => {
    const mockAssets = [{ symbol: "APT", amount: "1000" }];
    const mockPositions = [{ protocol: "Thala", value: "500" }];
    const mockNFTs = [{ name: "Test NFT", collection: "Test Collection" }];
    const mockTransactions = [{ hash: "0xabc", type: "user_transaction" }];

    (AssetService.getWalletAssets as any).mockResolvedValue(mockAssets);
    (DeFiService.getWalletDeFiPositions as any).mockResolvedValue(mockPositions);
    (NFTService.getTotalNFTCount as any).mockResolvedValue(5);
    (NFTService.getWalletNFTs as any).mockResolvedValue({ data: mockNFTs });
    (NFTService.getCollectionStats as any).mockResolvedValue({
      totalCollections: 2,
    });
    (TransactionService.fetchTransactionsWithDetails as any).mockResolvedValue({
      success: true,
      data: mockTransactions,
    });

    const request = new Request("http://localhost:3000/api/portfolio/batch?walletAddress=0x123");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.assets).toEqual(mockAssets);
    expect(body.data.defiPositions).toEqual(mockPositions);
    expect(body.data.nfts).toEqual(mockNFTs);
    expect(body.data.nftTotalCount).toBe(5);
    expect(body.data.transactions).toEqual(mockTransactions);
    expect(body.data.nftCollectionStats).toEqual({ totalCollections: 2 });
  });

  it("should handle includeAllNFTs parameter", async () => {
    const mockAllNFTs = [
      { name: "NFT 1", collection: "Collection A" },
      { name: "NFT 2", collection: "Collection B" },
    ];

    (NFTService.getAllWalletNFTs as any).mockResolvedValue(mockAllNFTs);

    const request = new Request(
      "http://localhost:3000/api/portfolio/batch?walletAddress=0x123&includeAllNFTs=true"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(NFTService.getAllWalletNFTs).toHaveBeenCalledWith("0x123");
    expect(body.data.nfts).toEqual(mockAllNFTs);
  });

  it("should handle nftLimit parameter", async () => {
    const request = new Request(
      "http://localhost:3000/api/portfolio/batch?walletAddress=0x123&nftLimit=25"
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(NFTService.getWalletNFTs).toHaveBeenCalledWith("0x123", 1, 25);
  });

  it("should handle individual service failures gracefully", async () => {
    // Make one service fail
    (AssetService.getWalletAssets as any).mockRejectedValue(new Error("Asset service error"));

    const request = new Request("http://localhost:3000/api/portfolio/batch?walletAddress=0x123");

    const response = await GET(request);
    const body = await response.json();

    // Should still return 200 with partial data
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.assets).toBeUndefined();
    // Other services should still work
    expect(body.data.defiPositions).toBeDefined();
  });

  it("should handle DeFi metrics calculation", async () => {
    const mockPositions = [{ protocol: "Thala", value: "1000" }];
    const mockMetrics = { totalValueLocked: "1000" };

    (DeFiService.getWalletDeFiPositions as any).mockResolvedValue(mockPositions);
    (DeFiService.calculateDeFiMetrics as any).mockResolvedValue(mockMetrics);

    const request = new Request("http://localhost:3000/api/portfolio/batch?walletAddress=0x123");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.metrics).toEqual({
      totalValue: "1000",
      totalAssets: 0,
      totalNFTs: 0,
      totalDeFi: 1,
    });
  });
});
