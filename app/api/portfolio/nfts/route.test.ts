import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { NFTService } from "@/lib/services/portfolio/services/nft-service";

import { GET } from "./route";

vi.mock("@/lib/services/portfolio/services/nft-service", () => ({
  NFTService: {
    getWalletNFTs: vi.fn(),
    getTotalNFTCount: vi.fn(),
    getNFTCollectionStats: vi.fn(),
  },
}));

describe("GET /api/portfolio/nfts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when address is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/portfolio/nfts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Wallet address is required");
  });

  it("should return NFTs with proper pagination", async () => {
    const mockNFTs = [
      {
        token_data_id: "0x123",
        collection_name: "Test Collection",
        name: "Test NFT #1",
        description: "Test NFT",
        uri: "https://example.com/nft/1",
        amount: 1,
      },
    ];

    vi.mocked(NFTService.getWalletNFTs).mockResolvedValue({
      data: mockNFTs,
      hasMore: true,
      nextCursor: "next-page-cursor",
    });

    const validAddress = "0x" + "1".repeat(64);
    const request = new NextRequest(
      `http://localhost:3000/api/portfolio/nfts?walletAddress=${validAddress}&page=1&limit=20`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.nfts).toEqual(mockNFTs);
    expect(data.data.hasMore).toBe(true);
    expect(data.data.page).toBe(1);
    expect(data.data.limit).toBe(20);
    expect(NFTService.getWalletNFTs).toHaveBeenCalledWith(validAddress, 1, 20);
  });

  it("should handle service errors gracefully", async () => {
    const error = new Error("Service error");

    vi.mocked(NFTService.getWalletNFTs).mockRejectedValue(error);

    const validAddress = "0x" + "1".repeat(64);
    const request = new NextRequest(
      `http://localhost:3000/api/portfolio/nfts?walletAddress=${validAddress}`,
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch portfolio NFTs");
    expect(data.details).toBe("Service error");
  });
});
