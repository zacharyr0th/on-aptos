import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class SushiSwapAdapter extends BaseProtocolAdapter {
  readonly id = 'sushiswap-adapter';
  readonly name = 'SushiSwap Adapter';
  readonly protocolName = 'SushiSwap';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('SushiSwap adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for LP tokens
      await this.scanLPTokens(walletAddress, resources, positions);

      // Scan for farming positions
      await this.scanFarmingPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning SushiSwap positions', error);
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
    // Look for SushiSwap LP tokens
    const lpResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::swap::LPToken<') || r.type.includes('::lp::LP<'))
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
        id: this.createPositionId('sushiswap', 'lp', resource.type),
        protocol: 'SushiSwap',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: resource.type,
            symbol: `${this.getTokenSymbol(poolInfo.tokens[0])}-${this.getTokenSymbol(poolInfo.tokens[1])} SLP`,
            amount: amount.toString(),
            valueUSD,
            metadata: {
              poolId: resource.type,
              poolTokens: poolInfo.tokens,
              poolType: 'Constant Product Pool',
              underlying: poolInfo.tokens,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'SushiSwap',
          version: 'V1',
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
    // Look for MasterChef positions
    const farmingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::masterchef::') || r.type.includes('::minichef::'))
    );

    for (const resource of farmingResources) {
      const data = resource.data as any;

      const stakedAmount = data?.amount || data?.deposit_amount || '0';
      if (stakedAmount === '0') continue;

      const amount = parseFloat(stakedAmount) / Math.pow(10, 8);
      const pendingRewards =
        data?.pending_sushi || data?.pending_rewards || '0';
      const rewardAmount = parseFloat(pendingRewards) / Math.pow(10, 8);

      positions.push({
        id: this.createPositionId('sushiswap', 'farming', resource.type),
        protocol: 'SushiSwap',
        protocolType: ProtocolType.FARMING,
        positionType: PositionType.FARMING,
        address: walletAddress,
        assets: [
          {
            type: AssetType.STAKED,
            tokenAddress: resource.type,
            symbol: 'Staked SLP',
            amount: amount.toString(),
            valueUSD: 0, // Would need LP value calculation
            metadata: {
              farmType: 'MasterChef',
              pendingRewards: rewardAmount.toString(),
              rewardToken: 'SUSHI',
            },
          },
        ],
        totalValueUSD: 0,
        metadata: {
          dex: 'SushiSwap',
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
    // Parse SushiSwap LP token types
    const match = resourceType.match(/::(?:swap|lp)::(?:LPToken|LP)<(.+)>$/);
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
    if (tokenAddress.includes('::sushi::SUSHI')) return 'SUSHI';
    if (tokenAddress.includes('::weth::WETH')) return 'WETH';

    const match = tokenAddress.match(/::([^:]+)::([^>]+)$/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
