import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class HyperionAdapter extends BaseProtocolAdapter {
  readonly id = 'hyperion-adapter';
  readonly name = 'Hyperion Adapter';
  readonly protocolName = 'Hyperion';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Hyperion adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for LP tokens
      await this.scanLPTokens(walletAddress, resources, positions);

      // Scan for staking positions
      await this.scanStakingPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Hyperion positions', error);
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
    const lpResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::amm::') || r.type.includes('::pool::'))
    );

    for (const resource of lpResources) {
      const balance =
        resource.data?.coin?.value || resource.data?.lp_balance || '0';
      if (balance === '0') continue;

      const poolInfo = this.parseLPTokenType(resource.type);
      if (!poolInfo || poolInfo.tokens.length < 2) continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);

      const tokenPrices = await this.getTokenPrices(poolInfo.tokens);
      let valueUSD = 0;

      if (tokenPrices.size > 0) {
        const avgPrice =
          Array.from(tokenPrices.values()).reduce((a, b) => a + b, 0) /
          tokenPrices.size;
        valueUSD = amount * avgPrice * 0.5;
      }

      positions.push({
        id: this.createPositionId('hyperion', 'lp', resource.type),
        protocol: 'Hyperion',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: resource.type,
            symbol: `${this.getTokenSymbol(poolInfo.tokens[0])}-${this.getTokenSymbol(poolInfo.tokens[1])} HYP-LP`,
            amount: amount.toString(),
            valueUSD,
            metadata: {
              poolId: resource.type,
              poolTokens: poolInfo.tokens,
              poolType: 'Hyperion AMM',
              underlying: poolInfo.tokens,
              fees24h: resource.data?.fees_24h,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'Hyperion',
          poolVersion: 'V1',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanStakingPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const stakingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        r.type.includes('::staking::')
    );

    for (const resource of stakingResources) {
      const data = resource.data as any;
      const stakedAmount = data?.staked_amount || data?.amount || '0';

      if (stakedAmount === '0') continue;

      const tokenType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(tokenType);
      const amount = parseFloat(stakedAmount) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(tokenType);
      const valueUSD = amount * price;

      const pendingRewards = data?.pending_rewards || '0';
      const rewardAmount = parseFloat(pendingRewards) / Math.pow(10, decimals);
      const rewardToken = data?.reward_token || 'HYP';

      positions.push({
        id: this.createPositionId('hyperion', 'staking', resource.type),
        protocol: 'Hyperion',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.STAKING,
        address: walletAddress,
        assets: [
          {
            type: AssetType.STAKED,
            tokenAddress: tokenType,
            symbol: this.getTokenSymbol(tokenType),
            amount: amount.toString(),
            valueUSD,
            metadata: {
              stakingType: 'LP Staking',
              pendingRewards: rewardAmount.toString(),
              rewardToken,
              apy: data?.current_apy,
              stakingEndTime: data?.stake_end_time,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocol: 'Hyperion',
          feature: 'Staking Rewards',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private parseLPTokenType(resourceType: string): {
    tokens: string[];
  } | null {
    const match = resourceType.match(/::(?:amm|pool)::.*<(.+)>$/);
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

  private extractAssetType(resourceType: string): string {
    const match = resourceType.match(/<([^,>]+)>/);
    if (match) {
      return match[1];
    }
    return '';
  }

  private getDecimals(tokenAddress: string): number {
    if (tokenAddress.includes('::aptos_coin::AptosCoin')) return 8;
    if (tokenAddress.includes('::usdc::') || tokenAddress.includes('USDC'))
      return 6;
    if (tokenAddress.includes('::usdt::') || tokenAddress.includes('USDT'))
      return 6;
    return 8;
  }

  private getTokenSymbol(tokenAddress: string): string {
    if (tokenAddress.includes('::aptos_coin::AptosCoin')) return 'APT';
    if (tokenAddress.includes('::usdc::USDC')) return 'USDC';
    if (tokenAddress.includes('::usdt::USDT')) return 'USDT';
    if (tokenAddress.includes('::hyp::HYP')) return 'HYP';

    const match = tokenAddress.match(/::([^:]+)::([^>]+)$/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
