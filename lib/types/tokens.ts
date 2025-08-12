/**
 * Centralized token type definitions
 * Single source of truth for all token-related types
 */

import { StaticImageData } from "next/image";

// Base token structure
export interface TokenBase {
  symbol: string;
  name: string;
  decimals: number;
  assetAddress: string; // Required field - always present
}

// Token issuer information
export interface TokenIssuer {
  name?: string;
  logo?: string;
  website?: string;
  twitter?: string;
}

// Complete token metadata
export interface TokenMetadata extends Partial<TokenBase> {
  // Make base fields optional for flexibility
  symbol?: string;
  name?: string;
  decimals?: number;

  // Address fields
  assetAddress?: string;
  faAddress?: string;
  tokenAddress?: string;
  asset_type?: string;

  // Display fields
  logoUrl?: string;
  thumbnail?: string | StaticImageData;
  description?: string;

  // Additional metadata
  issuer?: TokenIssuer | string; // Can be object or string
  tags?: string[];
  panoraTags?: string[];

  // Protocol/platform info
  bridge?: string;
  platform?: string;
  protocol?: string;

  // Market data
  price?: number;
  marketCap?: string | number;
  volume24h?: string | number;
  change24h?: number;

  // Supply data
  supply?: string;
  maxSupply?: string;
  circulatingSupply?: string;

  // Verification status
  isVerified?: boolean;
  isNative?: boolean;
  isBridged?: boolean;

  // External links
  website?: string;
  explorerLink?: string;
  auditLink?: string;
  coinGeckoId?: string;
  coinMarketCapId?: number;

  // Allow additional properties
  [key: string]: unknown;
}

// Display token for UI components
export interface DisplayToken {
  symbol: string;
  name: string;
  supply: string;
  supply_raw?: string;
  value?: number;
  change24h?: number;
  isComposite?: boolean;
  components?: Array<{
    symbol: string;
    percentage: number;
  }>;
}

// Token configuration
export interface TokenConfig {
  name: string;
  symbol: string;
  thumbnail: string | StaticImageData;
  type: string;
  issuer?: string | TokenIssuer;
  assetAddress?: string;
  assetAddresses?: string[];
  decimals?: number;
  website?: string;
  explorerLink?: string;
  auditLink?: string;
  tags?: string[];
  isAccount?: boolean;
}

// Panora token from API
export interface PanoraToken {
  chainId: number;
  panoraId?: string;
  tokenAddress?: string | null;
  faAddress?: string | null;
  name: string;
  symbol: string;
  decimals: number;
  bridge?: string | null;
  panoraSymbol?: string;
  usdPrice?: string;
  logoUrl?: string;
  websiteUrl?: string;
  panoraUI?: boolean;
  panoraTags?: string[];
  panoraIndex?: number;
  coinGeckoId?: string;
  coinMarketCapId?: number;
  isInPanoraTokenList?: boolean;
  isBanned?: boolean;
}

// Token price data
export interface TokenPrice {
  symbol: string;
  price: number;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated?: string;
}

// Token balance
export interface TokenBalance {
  asset_type: string;
  amount: string;
  metadata?: {
    name: string;
    symbol: string;
    decimals: number;
    icon_uri?: string;
  };
  price?: number;
  value?: number;
  balance?: number;
}

// Type guards for runtime checking
export function isTokenMetadata(obj: any): obj is TokenMetadata {
  return (
    obj &&
    (typeof obj.symbol === "string" ||
      typeof obj.name === "string" ||
      typeof obj.assetAddress === "string")
  );
}

export function hasValidThumbnail(metadata: TokenMetadata): boolean {
  return !!(metadata.thumbnail && typeof metadata.thumbnail === "string");
}

export function hasValidIssuer(
  metadata: TokenMetadata,
): metadata is TokenMetadata & { issuer: TokenIssuer } {
  return !!(
    metadata.issuer &&
    typeof metadata.issuer === "object" &&
    "name" in metadata.issuer
  );
}

// Helper to normalize issuer field
export function normalizeIssuer(
  issuer: string | TokenIssuer | undefined,
): TokenIssuer | undefined {
  if (!issuer) return undefined;
  if (typeof issuer === "string") {
    return { name: issuer };
  }
  return issuer;
}

// Helper to get safe thumbnail URL
export function getThumbnailUrl(
  metadata: TokenMetadata,
  fallback = "/placeholder.jpg",
): string {
  if (metadata.thumbnail && typeof metadata.thumbnail === "string") {
    return metadata.thumbnail;
  }
  if (metadata.logoUrl) {
    return metadata.logoUrl;
  }
  return fallback;
}
