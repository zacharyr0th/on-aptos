import { useMemo } from "react";
import { toast } from "sonner";

import { defiProtocols } from "@/components/pages/defi/data";
import { normalizeProtocolName } from "@/lib/constants";
import { isPhantomAsset as isPhantomAssetFromRegistry } from "@/lib/constants/protocols/protocol-registry";

// Re-export main types from portfolio service
export type { FungibleAsset, DeFiPosition, NFT } from "@/lib/services/portfolio/types";
import type { FungibleAsset, DeFiPosition } from "@/lib/services/portfolio/types";

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
  nftValue: number = 0,
): PortfolioMetrics => {
  // Calculate token value
  const tokenValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);

  // Calculate DeFi value
  const defiValue = defiPositions.reduce(
    (sum, pos) => sum + (pos.totalValueUSD || 0),
    0,
  );

  // Total portfolio value
  const totalPortfolioValue = tokenValue + defiValue + nftValue;

  // Asset counts
  const totalAssets = assets.length;
  const verifiedAssets = assets.filter(
    (asset) => asset.isVerified !== false,
  ).length;
  const nftCount = nfts.length;
  const defiCount = defiPositions.length;
  const totalCollections = new Set(nfts.map((nft) => nft.collection_name)).size;

  // Percentages
  const tokenPercentage =
    totalPortfolioValue > 0 ? (tokenValue / totalPortfolioValue) * 100 : 0;
  const defiPercentage =
    totalPortfolioValue > 0 ? (defiValue / totalPortfolioValue) * 100 : 0;
  const nftPercentage =
    totalPortfolioValue > 0 ? (nftValue / totalPortfolioValue) * 100 : 0;

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

// React hook for portfolio metrics
export const usePortfolioMetrics = (
  assets: FungibleAsset[] = [],
  defiPositions: DeFiPosition[] = [],
  nfts: NFTAsset[] = [],
  nftValue: number = 0,
): PortfolioMetrics => {
  return useMemo(
    () => calculatePortfolioMetrics(assets, defiPositions, nfts, nftValue),
    [assets, defiPositions, nfts, nftValue],
  );
};

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
  totalNFTCount?: number | null,
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
      ? (collections.slice(0, 3).reduce((sum, col) => sum + col.count, 0) /
          actualNFTCount) *
        100
      : 0;

  const singleItemCollections = collections.filter(
    (col) => col.count === 1,
  ).length;
  const fanCollections = collections.filter((col) => col.count >= 5).length;
  const stanCollections = collections.filter((col) => col.count >= 10).length;
  const averageHolding =
    totalCollections > 0 ? actualNFTCount / totalCollections : 0;
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
  totalNFTCount?: number | null,
): NFTCollectionStats => {
  return useMemo(
    () => calculateNFTCollectionStats(nfts, totalNFTCount),
    [nfts, totalNFTCount],
  );
};

// Utility functions (moved from utils.ts)

// Helper function to clean protocol names for display
export const cleanProtocolName = (name: string): string => {
  return name
    .replace(/\s+Finance$/i, "")
    .replace(/\s+Markets$/i, "")
    .trim();
};

// Protocol logo mapping - Comprehensive coverage for all protocols
export const getProtocolLogo = (protocol: string): string => {
  const protocolName = protocol.toLowerCase();
  const logoMap: Record<string, string> = {
    // Core Aptos Infrastructure
    "aptos framework": "/icons/apt.png",
    "digital assets": "/icons/apt.png",
    "aptos token v2": "/icons/apt.png",

    // Liquid Staking Protocols
    amnis: "/icons/protocols/amnis.avif",
    "amnis finance": "/icons/protocols/amnis.avif",
    "thala liquid staking": "/icons/protocols/thala.avif",
    trufin: "/icons/protocols/trufin.webp",

    // Lending Protocols
    aries: "/icons/protocols/aries.avif",
    "aries markets": "/icons/protocols/aries.avif",
    aptin: "/icons/protocols/aptin.webp",
    "aptin finance": "/icons/protocols/aptin.webp",
    echelon: "/icons/protocols/echelon.avif",
    "echelon market": "/icons/protocols/echelon.avif",
    echo: "/icons/protocols/echo.webp",
    "echo lending": "/icons/protocols/echo.webp",
    meso: "/icons/protocols/meso.webp",
    "meso finance": "/icons/protocols/meso.webp",
    joule: "/icons/protocols/joule.webp",
    "joule finance": "/icons/protocols/joule.webp",
    superposition: "/icons/protocols/superposition.webp",
    aave: "/placeholder.jpg",
    "thala cdp": "/icons/protocols/thala.avif",

    // DEX Protocols
    liquidswap: "/icons/protocols/liquidswap.webp",
    pancakeswap: "/icons/protocols/pancake.webp",
    pancake: "/icons/protocols/pancake.webp",
    sushi: "/icons/protocols/sushi.webp",
    sushiswap: "/icons/protocols/sushi.webp",
    cellana: "/icons/protocols/cellana.webp",
    "cellana finance": "/icons/protocols/cellana.webp",
    panora: "/icons/protocols/panora.webp",
    "panora exchange": "/icons/protocols/panora.webp",
    kana: "/icons/protocols/kana.webp",
    kanalabs: "/icons/protocols/kana.webp",
    hyperion: "/icons/protocols/hyperion.webp",
    econia: "/icons/protocols/econia.jpg",
    vibrantx: "/icons/protocols/vibrantx.png",
    "uptos pump": "/icons/protocols/pump-uptos.jpg",
    "pump-uptos": "/icons/protocols/pump-uptos.jpg",
    defy: "/placeholder.jpg",
    "lucid finance": "/placeholder.jpg",
    "pact labs": "/placeholder.jpg",
    thetis: "/icons/protocols/thetis.webp",
    "thetis market": "/icons/protocols/thetis.webp",

    // Derivatives & Trading
    merkle: "/icons/protocols/merkle.webp",
    "merkle trade": "/icons/protocols/merkle.webp",

    // Farming Protocols
    thala: "/icons/protocols/thala.avif",
    "thala farm": "/icons/protocols/thala.avif",
    "thala infrastructure": "/icons/protocols/thala.avif",

    // Bridge Protocols
    layerzero: "/placeholder.jpg",
    wormhole: "/placeholder.jpg",
    celer: "/placeholder.jpg",
    "celer bridge": "/placeholder.jpg",

    // Other Protocols
    agdex: "/icons/protocols/agdex.webp",
    anqa: "/icons/protocols/anqa.webp",
    emojicoin: "/icons/protocols/emojicoin.webp",
    ichi: "/icons/protocols/ichi.jpg",
    metamove: "/icons/protocols/metamove.png",
    mirage: "/icons/protocols/mirage.webp",
    moar: "/icons/protocols/moar.webp",
    tapp: "/icons/protocols/tapp.jpg",
    crossmint: "/icons/protocols/crossmint.jpeg",
    eliza: "/icons/protocols/eliza.jpeg",
    tradeport: "/icons/protocols/tradeport.jpg",

    // Stablecoin Protocols
    usdc: "/icons/protocols/usdc.avif",
    usde: "/icons/protocols/usde.avif",
    usdt: "/icons/protocols/usdt.avif",

    // Additional protocol variations and aliases
    kofi: "/icons/protocols/kofi.avif",
    "sushi finance": "/icons/protocols/sushi.webp",
    "pancake finance": "/icons/protocols/pancake.webp",
    "liquid swap": "/icons/protocols/liquidswap.webp",
    "merkle finance": "/icons/protocols/merkle.webp",
  };

  return logoMap[protocolName] || "/placeholder.jpg";
};

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
  return isPhantomAssetFromRegistry(assetType, metadata);
};

export const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  } catch {
    toast.error(`Failed to copy ${label}`);
  }
};

// Helper function to get detailed protocol information
export const getDetailedProtocolInfo = (protocolName: string) => {
  const normalizedName = normalizeProtocolName(protocolName);
  return defiProtocols.find(
    (protocol) =>
      protocol.title === normalizedName ||
      protocol.title.toLowerCase() === protocolName.toLowerCase().trim() ||
      protocolName.toLowerCase().trim().includes(protocol.title.toLowerCase()),
  );
};
