import { PositionAggregator as IPositionAggregator } from '../interfaces/provider';
import { DeFiPosition, PositionType, AggregatedPositions } from '../types';

export class PositionAggregator implements IPositionAggregator {
  aggregate(
    results: Array<{ adapterId: string; positions: DeFiPosition[] }>
  ): AggregatedPositions {
    const allPositions = results.flatMap(result => result.positions);
    const deduplicatedPositions = this.deduplicate(allPositions);
    const summary = this.calculateSummary(deduplicatedPositions);

    return {
      positions: deduplicatedPositions,
      summary,
      metadata: {
        walletAddress: deduplicatedPositions[0]?.address || '',
        adaptersUsed: results.map(r => r.adapterId),
        scanDuration: 0, // Will be set by provider
        timestamp: new Date().toISOString(),
      },
    };
  }

  deduplicate(positions: DeFiPosition[]): DeFiPosition[] {
    const positionMap = new Map<string, DeFiPosition>();
    const duplicateGroups = new Map<string, DeFiPosition[]>();

    // Group positions by similarity
    for (const position of positions) {
      const key = this.generateDeduplicationKey(position);

      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key)!.push(position);
    }

    // Merge duplicate positions
    for (const [key, group] of duplicateGroups.entries()) {
      if (group.length === 1) {
        positionMap.set(key, group[0]);
      } else {
        const mergedPosition = this.mergePositions(group);
        positionMap.set(key, mergedPosition);
      }
    }

    return Array.from(positionMap.values()).sort(
      (a, b) => b.totalValueUSD - a.totalValueUSD
    );
  }

  calculateSummary(positions: DeFiPosition[]): AggregatedPositions['summary'] {
    const totalPositions = positions.length;
    const totalValueUSD = positions.reduce(
      (sum, pos) => sum + pos.totalValueUSD,
      0
    );

    // Protocol breakdown
    const protocolBreakdown: Record<string, number> = {};
    for (const position of positions) {
      protocolBreakdown[position.protocol] =
        (protocolBreakdown[position.protocol] || 0) + position.totalValueUSD;
    }

    // Position type breakdown
    const positionTypeBreakdown: Record<string, number> = {};
    for (const position of positions) {
      positionTypeBreakdown[position.positionType] =
        (positionTypeBreakdown[position.positionType] || 0) +
        position.totalValueUSD;
    }

    // Top protocols
    const topProtocols = Object.entries(protocolBreakdown)
      .map(([protocol, valueUSD]) => ({
        protocol,
        valueUSD,
        percentage: totalValueUSD > 0 ? (valueUSD / totalValueUSD) * 100 : 0,
      }))
      .sort((a, b) => b.valueUSD - a.valueUSD)
      .slice(0, 5);

    return {
      totalPositions,
      totalValueUSD,
      protocolBreakdown,
      positionTypeBreakdown,
      topProtocols,
    };
  }

  private generateDeduplicationKey(position: DeFiPosition): string {
    // Create a key that identifies similar positions that should be merged
    const keyParts = [
      position.protocol.toLowerCase(),
      position.positionType,
      position.address.toLowerCase(),
    ];

    // Add asset-specific identifiers for more precise deduplication
    if (position.assets.length > 0) {
      const sortedAssetKeys = position.assets
        .map(asset => `${asset.tokenAddress}-${asset.type}`)
        .sort()
        .join(',');
      keyParts.push(sortedAssetKeys);
    }

    return keyParts.join('|');
  }

  private mergePositions(positions: DeFiPosition[]): DeFiPosition {
    if (positions.length === 1) {
      return positions[0];
    }

    // Use the position with the highest value as the base
    const basePosition = positions.reduce((max, pos) =>
      pos.totalValueUSD > max.totalValueUSD ? pos : max
    );

    // Merge assets from all positions
    const assetMap = new Map<string, (typeof basePosition.assets)[0]>();

    for (const position of positions) {
      for (const asset of position.assets) {
        const assetKey = `${asset.tokenAddress}-${asset.type}`;
        const existing = assetMap.get(assetKey);

        if (existing) {
          // Merge asset amounts (convert to numbers, add, convert back)
          const existingAmount = parseFloat(existing.amount);
          const newAmount = parseFloat(asset.amount);
          const totalAmount = existingAmount + newAmount;

          assetMap.set(assetKey, {
            ...existing,
            amount: totalAmount.toString(),
            valueUSD: existing.valueUSD + asset.valueUSD,
            metadata: this.mergeAssetMetadata(
              existing.metadata,
              asset.metadata
            ),
          });
        } else {
          assetMap.set(assetKey, asset);
        }
      }
    }

    const mergedAssets = Array.from(assetMap.values());
    const totalValueUSD = mergedAssets.reduce(
      (sum, asset) => sum + asset.valueUSD,
      0
    );

    return {
      ...basePosition,
      id: `merged-${basePosition.id}`,
      assets: mergedAssets,
      totalValueUSD,
      metadata: {
        ...basePosition.metadata,
        mergedFrom: positions.map(p => p.id),
        mergedAt: new Date().toISOString(),
      },
    };
  }

  private mergeAssetMetadata(
    existing?: Record<string, unknown>,
    incoming?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!existing && !incoming) return undefined;
    if (!existing) return incoming;
    if (!incoming) return existing;

    return { ...existing, ...incoming };
  }

  // Utility method to filter positions by minimum value
  filterByMinValue(
    positions: DeFiPosition[],
    minValueUSD: number
  ): DeFiPosition[] {
    return positions.filter(position => {
      // Always include LP tokens regardless of value
      const hasLPTokens = position.assets.some(
        asset => asset.type === 'lp_token' || asset.metadata?.poolId
      );

      return hasLPTokens || position.totalValueUSD >= minValueUSD;
    });
  }

  // Utility method to group positions by protocol
  groupByProtocol(positions: DeFiPosition[]): Record<string, DeFiPosition[]> {
    const groups: Record<string, DeFiPosition[]> = {};

    for (const position of positions) {
      if (!groups[position.protocol]) {
        groups[position.protocol] = [];
      }
      groups[position.protocol].push(position);
    }

    return groups;
  }
}
