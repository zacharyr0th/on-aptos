import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class CellanaAdapter extends BaseProtocolAdapter {
  readonly id = 'cellana-adapter';
  readonly name = 'Cellana Finance Adapter';
  readonly protocolName = 'Cellana Finance';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x4bf51972879e3b95c4781a5cdcb9e1ee24ef483e7d22f2d903626f126df62bd1',
    '0xea098f1fa9245447c792d18c069433f5da2904358e1e340c55bdc68a8f5fe037',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Cellana Finance adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for LP tokens
      await this.scanLPTokens(walletAddress, resources, positions);

      // Scan for staked/farming positions
      await this.scanFarmingPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Cellana positions', error);
      return [];
    }
  }

  private async fetchAccountResources(address: string): Promise<any[]> {
    const apiUrl = 'https://api.mainnet.aptoslabs.com/v1';

    const response = await fetch(`${apiUrl}/accounts/${address}/resources`, {
      headers: {
        'Content-Type': 'application/json',
        ...(this.context?.apiKey
          ? { Authorization: `Bearer ${this.context.apiKey}` }
          : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch resources: ${response.statusText}`);
    }

    return response.json();
  }

  private async scanLPTokens(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Look for Cellana LP tokens
    const lpResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::pool::LPToken<') ||
          r.type.includes('::pair::LPToken<'))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || '0';
      if (balance === '0') continue;

      // Parse LP token type
      const poolInfo = this.parseLPTokenType(resource.type);
      if (!poolInfo || poolInfo.tokens.length < 2) continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);

      // Get token prices for value calculation
      const tokenPrices = await this.getTokenPrices(poolInfo.tokens);
      let valueUSD = 0;

      if (tokenPrices.size > 0) {
        const avgPrice =
          Array.from(tokenPrices.values()).reduce((a, b) => a + b, 0) /
          tokenPrices.size;
        valueUSD = amount * avgPrice * 0.5; // Rough estimation
      }

      positions.push({
        id: this.createPositionId('cellana', 'lp', resource.type),
        protocol: 'Cellana Finance',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: resource.type,
            symbol: `${this.getTokenSymbol(poolInfo.tokens[0])}-${this.getTokenSymbol(poolInfo.tokens[1])} CELL-LP`,
            amount: amount.toString(),
            valueUSD,
            metadata: {
              poolId: resource.type,
              poolTokens: poolInfo.tokens,
              poolType: 'AMM Pool',
              underlying: poolInfo.tokens,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'Cellana Finance',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanFarmingPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Look for farming positions
    const farmingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::farm::') || r.type.includes('::staking::'))
    );

    for (const resource of farmingResources) {
      const data = resource.data as any;

      const stakedAmount = data?.amount || data?.staked_amount || '0';
      if (stakedAmount === '0') continue;

      const amount = parseFloat(stakedAmount) / Math.pow(10, 8);
      const pendingRewards = data?.pending_rewards || '0';
      const rewardAmount = parseFloat(pendingRewards) / Math.pow(10, 8);

      positions.push({
        id: this.createPositionId('cellana', 'farming', resource.type),
        protocol: 'Cellana Finance',
        protocolType: ProtocolType.FARMING,
        positionType: PositionType.FARMING,
        address: walletAddress,
        assets: [
          {
            type: AssetType.STAKED,
            tokenAddress: resource.type,
            symbol: 'Staked LP',
            amount: amount.toString(),
            valueUSD: 0, // Would need LP value calculation
            metadata: {
              farmType: 'Cellana Farm',
              pendingRewards: rewardAmount.toString(),
              rewardToken: 'CELL',
            },
          },
        ],
        totalValueUSD: 0,
        metadata: {
          dex: 'Cellana Finance',
          feature: 'Yield Farming',
          hasRewards: rewardAmount > 0,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private parseLPTokenType(resourceType: string): {
    tokens: string[];
  } | null {
    // Parse Cellana LP token types
    const match = resourceType.match(/::(?:pool|pair)::LPToken<(.+)>$/);
    if (!match) return null;

    const innerTypes = match[1];
    const tokens: string[] = [];
    let depth = 0;
    let currentToken = '';

    for (let i = 0; i < innerTypes.length; i++) {
      const char = innerTypes[i];
      if (char === '<') depth++;
      else if (char === '>') depth--;
      else if (char === ',' && depth === 0) {
        tokens.push(currentToken.trim());
        currentToken = '';
        continue;
      }
      currentToken += char;
    }
    if (currentToken) tokens.push(currentToken.trim());

    return { tokens };
  }

  private getTokenSymbol(tokenAddress: string): string {
    if (tokenAddress.includes('::aptos_coin::AptosCoin')) return 'APT';
    if (tokenAddress.includes('::usdc::USDC')) return 'USDC';
    if (tokenAddress.includes('::usdt::USDT')) return 'USDT';
    if (tokenAddress.includes('::cell_coin::CELL')) return 'CELL';

    const match = tokenAddress.match(/::([^:]+)::([^>]+)$/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
