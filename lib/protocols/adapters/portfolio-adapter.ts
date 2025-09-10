/**
 * Portfolio Adapter - Bridges new protocol system with existing portfolio components
 */

import type { DeFiPosition } from "@/lib/types/defi";
import { logger } from "@/lib/utils/core/logger";
import { ProtocolDetector } from "../detector";
import { ProtocolLoader } from "../loader";
import { protocolRegistry } from "../registry";
import { PositionType } from "../types";

/**
 * Convert new protocol detection to DeFi position format
 */
export function convertToDefiPosition(detection: any, walletAddress: string): DeFiPosition | null {
  if (!detection || !detection.positions.length) return null;

  const { protocol, positions } = detection;
  const firstPosition = positions[0];
  const assets = firstPosition.assets;

  // Map position type to DeFi position type
  const typeMap: Record<PositionType, DeFiPosition["type"]> = {
    [PositionType.LP]: "lp",
    [PositionType.LENDING_SUPPLY]: "lending",
    [PositionType.LENDING_BORROW]: "lending",
    [PositionType.STAKING]: "staking",
    [PositionType.FARMING]: "farming",
    [PositionType.DERIVATIVE]: "derivatives",
    [PositionType.TOKEN]: "token",
    [PositionType.NFT]: "token", // Map NFT to token for now
  };

  // Calculate total value
  const totalValueUSD = assets.reduce((sum: number, asset: any) => sum + (asset.valueUSD || 0), 0);

  return {
    positionId: `${protocol.metadata.id}-${firstPosition.type}-${Date.now()}`,
    id: `${protocol.metadata.id}-${firstPosition.type}-${Date.now()}`,
    protocol: protocol.metadata.displayName || protocol.metadata.name,
    protocolType: protocol.metadata.type,
    type: typeMap[firstPosition.type as PositionType] || "token",
    totalValue: totalValueUSD,
    address: walletAddress,
    position: {
      supplied:
        firstPosition.type === PositionType.LENDING_BORROW
          ? []
          : assets.map((asset: any) => ({
              asset: asset.address,
              symbol: asset.symbol,
              amount: asset.amount,
              value: asset.valueUSD || 0,
            })),
      borrowed:
        firstPosition.type === PositionType.LENDING_BORROW
          ? assets.map((asset: any) => ({
              asset: asset.address,
              symbol: asset.symbol,
              amount: asset.amount,
              value: asset.valueUSD || 0,
            }))
          : [],
    },
    assets: assets.map((asset: any) => ({
      type: firstPosition.type === PositionType.LENDING_BORROW ? "borrowed" : "supplied",
      tokenAddress: asset.address,
      symbol: asset.symbol,
      amount: asset.amount,
      valueUSD: asset.valueUSD || 0,
      metadata: asset.metadata,
    })),
    totalValueUSD,
    metadata: {
      protocolId: protocol.metadata.id,
      protocolType: protocol.metadata.type,
      confidence: detection.confidence,
      ...firstPosition.metadata,
    },
  };
}

/**
 * Scan wallet for DeFi positions using new protocol system
 */
export async function scanWalletPositions(
  walletAddress: string,
  resources: any[]
): Promise<DeFiPosition[]> {
  // Ensure protocols are loaded
  await ProtocolLoader.loadCore();

  const positions: DeFiPosition[] = [];
  const detectionResults = await ProtocolDetector.detectBatch(resources);

  for (const [resourceType, detection] of detectionResults) {
    const position = convertToDefiPosition(detection, walletAddress);
    if (position) {
      // Include all positions, even with 0 value (they exist but may need price data)
      positions.push(position);
    }
  }

  logger.info("Scanned wallet positions", {
    walletAddress,
    resourcesScanned: resources.length,
    positionsFound: positions.length,
    totalValue: positions.reduce((sum, p) => sum + (p.totalValueUSD || 0), 0),
  });

  return positions;
}

/**
 * Get protocol info for display
 */
export async function getProtocolInfo(protocolId: string) {
  await ProtocolLoader.loadCore();

  const protocol = protocolRegistry.get(protocolId);
  if (!protocol) return null;

  return {
    name: protocol.metadata.displayName || protocol.metadata.name,
    logo: protocol.metadata.logo,
    website: protocol.metadata.website,
    type: protocol.metadata.type,
    riskLevel: protocol.metadata.riskLevel,
    auditStatus: protocol.metadata.auditStatus,
  };
}

/**
 * Get all protocols for filtering
 */
export async function getAllProtocolsForFilter() {
  await ProtocolLoader.loadCore();

  return protocolRegistry.getAll().map((p) => ({
    value: p.metadata.id,
    label: p.metadata.displayName || p.metadata.name,
    logo: p.metadata.logo,
    type: p.metadata.type,
  }));
}

/**
 * Analyze transaction using new protocol system
 */
export async function analyzeTransaction(tx: any) {
  await ProtocolLoader.loadCore();

  const protocol = await ProtocolDetector.detectFromTransaction(tx);

  if (!protocol) {
    return {
      category: "unknown",
      protocol: null,
      displayName: "Unknown Transaction",
      confidence: 0,
    };
  }

  // Map transaction patterns
  let activity = "unknown";
  let description = "Transaction";

  if (protocol.patterns?.transactions) {
    const patterns = Array.isArray(protocol.patterns.transactions)
      ? protocol.patterns.transactions
      : await protocol.patterns.transactions();

    const functionName = tx.function?.toLowerCase() || tx.type.toLowerCase();

    for (const pattern of patterns) {
      const regex =
        typeof pattern.pattern === "string" ? new RegExp(pattern.pattern) : pattern.pattern;

      if (regex.test(functionName)) {
        activity = pattern.activity;
        description = pattern.description || pattern.activity;
        break;
      }
    }
  }

  return {
    category: mapProtocolTypeToCategory(protocol.metadata.type),
    protocol: {
      id: protocol.metadata.id,
      name: protocol.metadata.name,
      label: protocol.metadata.displayName,
    },
    activity,
    displayName: description,
    confidence: 85,
  };
}

/**
 * Map protocol type to transaction category
 */
function mapProtocolTypeToCategory(type: string): string {
  const categoryMap: Record<string, string> = {
    dex: "defi",
    lending: "defi",
    farming: "defi",
    derivatives: "defi",
    liquid_staking: "staking",
    bridge: "bridge",
    nft_marketplace: "nft",
    infrastructure: "system",
    launchpad: "defi",
    gaming: "gaming",
  };

  return categoryMap[type] || "unknown";
}

/**
 * Get protocol logo path
 */
export function getProtocolLogo(protocolId: string): string | null {
  const protocol = protocolRegistry.get(protocolId);
  return protocol?.metadata.logo || null;
}

/**
 * Check if protocol is high risk
 */
export function isHighRiskProtocol(protocolId: string): boolean {
  const protocol = protocolRegistry.get(protocolId);
  return protocol?.metadata.riskLevel === "high" || protocol?.metadata.auditStatus === "unaudited";
}
