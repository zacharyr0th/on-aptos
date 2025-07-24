import { LEGITIMATE_STABLECOINS, SCAM_TOKENS } from '@/lib/constants';
import { isPhantomAsset } from '@/lib/protocol-registry';
import type { FungibleAsset } from '../types';

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

export function isScamToken(assetType: string, symbol?: string): boolean {
  // Check if the asset type is in the scam tokens set
  if (SCAM_TOKENS.has(assetType)) {
    return true;
  }

  // Check if any part of the asset type or symbol contains scam indicators
  const scamTokenArray = Array.from(SCAM_TOKENS);
  return scamTokenArray.some(
    (token: string) =>
      assetType.toLowerCase().includes(token.toLowerCase()) ||
      symbol?.toLowerCase().includes(token.toLowerCase())
  );
}

export function isLegitimateStablecoin(assetType: string): boolean {
  return LEGITIMATE_STABLECOINS.has(assetType);
}

export function isValidAsset(asset: FungibleAsset): boolean {
  if (!asset.asset_type || !asset.amount) {
    return false;
  }

  if (isScamToken(asset.asset_type, asset.metadata?.symbol)) {
    return false;
  }

  const balance =
    parseFloat(asset.amount) / Math.pow(10, asset.metadata?.decimals || 8);
  if (balance <= 0) {
    return false;
  }

  return true;
}

export function shouldDisplayAsset(
  asset: FungibleAsset,
  minValueUSD: number = 0.01
): boolean {
  if (!isValidAsset(asset)) {
    return false;
  }

  if (asset.value && asset.value < minValueUSD) {
    return false;
  }

  if (asset.protocolInfo?.isPhantomAsset && asset.value && asset.value < 1) {
    return false;
  }

  return true;
}

export function getAssetIdentifier(assetType: string): string {
  // Extract the asset identifier from the full type
  // e.g., "0x1::aptos_coin::AptosCoin" -> "AptosCoin"
  const parts = assetType.split('::');
  return parts[parts.length - 1] || assetType;
}

export function normalizeAssetType(assetType: string): string {
  // Normalize asset type for comparison
  return assetType.toLowerCase().trim();
}
