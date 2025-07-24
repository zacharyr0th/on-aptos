import { logger } from '@/lib/utils/logger';
import { createDeFiProvider } from '@/lib/services/defi/createDeFiProvider';
import type { DeFiPosition as NewDeFiPosition } from '@/lib/services/defi';
import type { DeFiPosition } from '../types';

// Create singleton provider instance
let defiProvider: any = null;
let providerInitialized = false;

async function getProvider() {
  if (!defiProvider) {
    defiProvider = await createDeFiProvider({
      apiKey: process.env.APTOS_BUILD_SECRET,
      // Enable all adapters by default
      enabledAdapters: [
        'thala-adapter',
        'liquidswap-adapter',
        'pancakeswap-adapter',
        'aries-adapter',
        'cellana-adapter',
        'sushiswap-adapter',
        'merkle-trade-adapter',
        'echelon-adapter',
        'echo-lending-adapter',
        'meso-finance-adapter',
        'joule-finance-adapter',
        'superposition-adapter',
        'vibrantx-adapter',
        'kana-labs-adapter',
        'hyperion-adapter',
        'panora-exchange-adapter',
        'uptos-pump-adapter',
        'thetis-market-adapter',
        'generic-token-adapter',
      ],
    });
    providerInitialized = true;
  }
  return defiProvider;
}

export class DeFiService {
  static async getWalletDeFiPositions(
    address: string
  ): Promise<DeFiPosition[]> {
    try {
      // Get provider instance
      const provider = await getProvider();

      // Scan positions using new provider
      const result = await provider.scanPositions(address, {
        parallel: true,
        minValueUSD: 0, // Show ALL positions regardless of value
        includeDust: true,
      });

      // Convert from new format to existing portfolio format
      return result.positions.map((pos: NewDeFiPosition) => this.convertNewPosition(pos));
    } catch (error) {
      logger.error('Failed to fetch DeFi positions:', error);
      throw error;
    }
  }

  private static convertNewPosition(
    newPosition: NewDeFiPosition
  ): DeFiPosition {
    const suppliedAssets: DeFiPosition['suppliedAssets'] = [];
    const borrowedAssets: DeFiPosition['borrowedAssets'] = [];

    // Convert assets based on their type
    for (const asset of newPosition.assets) {
      const assetData = {
        asset: asset.tokenAddress,
        amount: parseFloat(asset.amount),
        value: asset.valueUSD,
        apy: asset.metadata?.apy,
      };

      switch (asset.type) {
        case 'supplied':
        case 'staked':
        case 'lp_token':
        case 'vault_share':
          suppliedAssets.push(assetData);
          break;
        case 'borrowed':
          borrowedAssets.push(assetData);
          break;
      }
    }

    // Map position type to string
    let positionTypeStr = 'Other';
    switch (newPosition.positionType) {
      case 'liquidity_pool':
        positionTypeStr = 'Liquidity Pool';
        break;
      case 'lending_supply':
        positionTypeStr = 'Lending';
        break;
      case 'lending_borrow':
        positionTypeStr = 'Lending/Borrowing';
        break;
      case 'staking':
        positionTypeStr = 'Staking';
        break;
      case 'farming':
        positionTypeStr = 'Farming';
        break;
      case 'vault':
        positionTypeStr = 'Vault';
        break;
    }

    return {
      protocol: newPosition.protocol,
      protocolType: newPosition.protocolType,
      poolName: newPosition.protocol, // Could be enhanced with metadata
      positionType: positionTypeStr,
      suppliedAssets,
      borrowedAssets,
      totalValueUSD: newPosition.totalValueUSD,
      healthFactor: undefined, // Could be calculated for lending protocols
      claimableRewards: undefined, // Could be enhanced later
    };
  }

  private static convertPosition(rawPosition: any): DeFiPosition {
    const suppliedAssets: DeFiPosition['suppliedAssets'] = [];
    const borrowedAssets: DeFiPosition['borrowedAssets'] = [];
    let totalValue = 0;

    // Convert supplied assets
    if (rawPosition.position.supplied) {
      rawPosition.position.supplied.forEach((asset: any) => {
        const value = parseFloat(asset.value || '0');
        totalValue += value;
        suppliedAssets.push({
          asset: asset.asset,
          amount: parseFloat(asset.amount || '0'),
          value,
          apy: undefined, // Could be enhanced later
        });
      });
    }

    // Convert borrowed assets
    if (rawPosition.position.borrowed) {
      rawPosition.position.borrowed.forEach((asset: any) => {
        const value = parseFloat(asset.value || '0');
        borrowedAssets.push({
          asset: asset.asset,
          amount: parseFloat(asset.amount || '0'),
          value,
          apy: undefined, // Could be enhanced later
        });
      });
    }

    // Handle liquidity positions
    if (rawPosition.position.liquidity) {
      rawPosition.position.liquidity.forEach((lp: any) => {
        const value = parseFloat(lp.value || '0');
        totalValue += value;
        // Convert LP tokens to supplied assets format
        suppliedAssets.push({
          asset: lp.poolId || 'LP Token',
          amount: parseFloat(lp.lpTokens || '0'),
          value,
        });
      });
    }

    // Handle staked positions
    if (rawPosition.position.staked) {
      rawPosition.position.staked.forEach((stake: any) => {
        const value = parseFloat(stake.value || '0');
        totalValue += value;
        suppliedAssets.push({
          asset: stake.asset,
          amount: parseFloat(stake.amount || '0'),
          value,
        });
      });
    }

    return {
      protocol: rawPosition.protocol,
      protocolType: rawPosition.protocolType.toString(),
      poolName: rawPosition.protocolLabel || rawPosition.protocol,
      positionType: this.getPositionType(rawPosition),
      suppliedAssets,
      borrowedAssets,
      totalValueUSD: totalValue,
      healthFactor: undefined, // Could be calculated for lending protocols
      claimableRewards: undefined, // Could be enhanced later
    };
  }

  private static getPositionType(rawPosition: any): string {
    if (
      rawPosition.position.borrowed &&
      rawPosition.position.borrowed.length > 0
    ) {
      return 'Lending/Borrowing';
    }
    if (
      rawPosition.position.liquidity &&
      rawPosition.position.liquidity.length > 0
    ) {
      return 'Liquidity Pool';
    }
    if (rawPosition.position.staked && rawPosition.position.staked.length > 0) {
      return 'Staking';
    }
    if (
      rawPosition.position.supplied &&
      rawPosition.position.supplied.length > 0
    ) {
      return 'Lending';
    }
    return 'Other';
  }

  static async calculateDeFiMetrics(positions: DeFiPosition[]): Promise<{
    totalValueLocked: number;
    totalSupplied: number;
    totalBorrowed: number;
    netAPY: number;
    protocols: string[];
  }> {
    let totalValueLocked = 0;
    let totalSupplied = 0;
    let totalBorrowed = 0;
    let weightedAPY = 0;
    const protocols = new Set<string>();

    for (const position of positions) {
      totalValueLocked += position.totalValueUSD;
      protocols.add(position.protocol);

      // Calculate supplied value
      const suppliedValue = position.suppliedAssets.reduce(
        (sum, asset) => sum + asset.value,
        0
      );
      totalSupplied += suppliedValue;

      // Calculate borrowed value
      const borrowedValue = position.borrowedAssets.reduce(
        (sum, asset) => sum + asset.value,
        0
      );
      totalBorrowed += borrowedValue;

      // Calculate weighted APY
      for (const asset of position.suppliedAssets) {
        if (asset.apy) {
          weightedAPY += (asset.value / totalValueLocked) * asset.apy;
        }
      }
    }

    return {
      totalValueLocked,
      totalSupplied,
      totalBorrowed,
      netAPY: weightedAPY,
      protocols: Array.from(protocols),
    };
  }

  // Get aggregated stats directly from provider
  static async getDeFiSummary(address: string): Promise<{
    totalPositions: number;
    totalValueUSD: number;
    protocolBreakdown: Record<string, number>;
    topProtocols: Array<{
      protocol: string;
      valueUSD: number;
      percentage: number;
    }>;
  }> {
    try {
      const provider = await getProvider();

      const result = await provider.scanPositions(address, {
        parallel: true,
        minValueUSD: 0, // Show ALL positions regardless of value
      });

      return result.summary;
    } catch (error) {
      logger.error('Failed to fetch DeFi summary:', error);
      return {
        totalPositions: 0,
        totalValueUSD: 0,
        protocolBreakdown: {},
        topProtocols: [],
      };
    }
  }
}
