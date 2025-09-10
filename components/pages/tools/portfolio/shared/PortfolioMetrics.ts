import { useMemo } from "react";

import { defiProtocols } from "@/components/pages/protocols/defi/data";
import { normalizeProtocolName } from "@/lib/constants";

// Re-export main types from portfolio service
export type {
  DeFiPosition,
  FungibleAsset,
  NFT,
} from "@/lib/services/portfolio/types";

import type { DeFiPosition, FungibleAsset } from "@/lib/services/portfolio/types";

// Local type aliases for backwards compatibility
export interface NFTAsset {
  token_data_id: string;
  collection_name: string;
  token_name?: string;
  amount: number;
}

export interface PortfolioMetrics {
  // Values
  tokenValue: number;
  defiValue: number;
  nftValue: number;
  totalPortfolioValue: number;

  // Counts
  totalAssets: number;
  verifiedAssets: number;
  nftCount: number;
  defiCount: number;
  totalCollections: number;

  // Percentages
  tokenPercentage: number;
  defiPercentage: number;
  nftPercentage: number;
}

// Calculate portfolio metrics from assets
export const calculatePortfolioMetrics = (
  assets: FungibleAsset[] = [],
  defiPositions: DeFiPosition[] = [],
  nfts: NFTAsset[] = [],
  nftValue: number = 0
): PortfolioMetrics => {
  // Calculate token value
  const tokenValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);

  // Calculate DeFi value
  const defiValue = defiPositions.reduce((sum, pos) => sum + (pos.totalValueUSD || 0), 0);

  // Total portfolio value
  const totalPortfolioValue = tokenValue + defiValue + nftValue;

  // Asset counts
  const totalAssets = assets.length;
  const verifiedAssets = assets.filter((asset) => asset.isVerified !== false).length;
  const nftCount = nfts.length;
  const defiCount = defiPositions.length;
  const totalCollections = new Set(nfts.map((nft) => nft.collection_name)).size;

  // Percentages
  const tokenPercentage = totalPortfolioValue > 0 ? (tokenValue / totalPortfolioValue) * 100 : 0;
  const defiPercentage = totalPortfolioValue > 0 ? (defiValue / totalPortfolioValue) * 100 : 0;
  const nftPercentage = totalPortfolioValue > 0 ? (nftValue / totalPortfolioValue) * 100 : 0;

  return {
    tokenValue,
    defiValue,
    nftValue,
    totalPortfolioValue,
    totalAssets,
    verifiedAssets,
    nftCount,
    defiCount,
    totalCollections,
    tokenPercentage,
    defiPercentage,
    nftPercentage,
  };
};

// Note: usePortfolioMetrics hook removed - use MetricsService from @/lib/services/portfolio/services/metrics-service.ts instead

// NFT collection statistics
export interface NFTCollectionStats {
  collections: Array<{ name: string; count: number }>;
  totalCollections: number;
  // Collector metrics
  concentrationTop3: number; // % of NFTs in top 3 collections
  singleItemCollections: number; // Collections with only 1 NFT
  fanCollections: number; // Collections with 5+ NFTs
  stanCollections: number; // Collections with 10+ NFTs
  averageHolding: number; // Average NFTs per collection
  largestCollectionPercentage: number; // % of total NFTs in largest collection
}

export const calculateNFTCollectionStats = (
  nfts: NFTAsset[],
  totalNFTCount?: number | null
): NFTCollectionStats => {
  const actualNFTCount = totalNFTCount ?? nfts.length;

  // Calculate collections from loaded NFTs
  const collectionMap = nfts.reduce((acc: Record<string, number>, nft) => {
    acc[nft.collection_name] = (acc[nft.collection_name] || 0) + 1;
    return acc;
  }, {});

  const collections = Object.entries(collectionMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const totalCollections = collections.length;

  // Collector metrics
  const concentrationTop3 =
    actualNFTCount > 0
      ? (collections.slice(0, 3).reduce((sum, col) => sum + col.count, 0) / actualNFTCount) * 100
      : 0;

  const singleItemCollections = collections.filter((col) => col.count === 1).length;
  const fanCollections = collections.filter((col) => col.count >= 5).length;
  const stanCollections = collections.filter((col) => col.count >= 10).length;
  const averageHolding = totalCollections > 0 ? actualNFTCount / totalCollections : 0;
  const largestCollectionPercentage =
    actualNFTCount > 0 && collections.length > 0
      ? (collections[0].count / actualNFTCount) * 100
      : 0;

  return {
    collections,
    totalCollections,
    concentrationTop3,
    singleItemCollections,
    fanCollections,
    stanCollections,
    averageHolding,
    largestCollectionPercentage,
  };
};

export const useNFTCollectionStats = (
  nfts: NFTAsset[],
  totalNFTCount?: number | null
): NFTCollectionStats => {
  return useMemo(() => calculateNFTCollectionStats(nfts, totalNFTCount), [nfts, totalNFTCount]);
};

export { getProtocolLogo } from "@/lib/constants/protocols/protocol-logos";
// Import utilities from centralized locations
export { normalizeProtocolName as cleanProtocolName } from "@/lib/constants/protocols/registry";

export const formatTimestamp = (timestamp: string | undefined) => {
  if (!timestamp) return "Unknown";

  try {
    // Handle different timestamp formats
    let date: Date;
    if (timestamp.includes("-") || timestamp.includes("T")) {
      // ISO format timestamp
      date = new Date(timestamp);
    } else {
      // Unix timestamp (in microseconds for Aptos)
      const numTimestamp = Number(timestamp);
      if (isNaN(numTimestamp)) return "Invalid date";
      date = new Date(numTimestamp / 1000);
    }

    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleString();
  } catch {
    return "Invalid date";
  }
};

// Use the centralized protocol registry for phantom asset detection and DeFi TVL filtering
export const isPhantomAsset = (assetType: string, metadata?: any): boolean => {
  return false; // Phantom asset detection removed - use new protocol system
};

// Export copyToClipboard from centralized utility
export { copyToClipboard } from "@/lib/utils/clipboard";

// Helper function to get detailed protocol information
export const getDetailedProtocolInfo = (protocolName: string) => {
  const normalizedName = normalizeProtocolName(protocolName);
  return defiProtocols.find(
    (protocol) =>
      protocol.title === normalizedName ||
      protocol.title.toLowerCase() === protocolName.toLowerCase().trim() ||
      protocolName.toLowerCase().trim().includes(protocol.title.toLowerCase())
  );
};
