import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class VibrantXAdapter extends BaseProtocolAdapter {
  readonly id = 'vibrantx-adapter';
  readonly name = 'VibrantX Adapter';
  readonly protocolName = 'VibrantX';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x17f1e926a81639e9557f4e4934df93452945ec30bc962e11351db59eb0d78c33',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('VibrantX adapter initialized');
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

      // Scan for farming positions
      await this.scanFarmingPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning VibrantX positions', error);
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
        (r.type.includes('::lp::') || r.type.includes('::pool::LPToken<'))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || '0';
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
        id: this.createPositionId('vibrantx', 'lp', resource.type),
        protocol: 'VibrantX',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: resource.type,
            symbol: `${this.getTokenSymbol(poolInfo.tokens[0])}-${this.getTokenSymbol(poolInfo.tokens[1])} VX-LP`,
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
          dex: 'VibrantX',
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
        (r.type.includes('::staking::') || r.type.includes('::stake::'))
    );

    for (const resource of stakingResources) {
      const data = resource.data as any;
      const stakedAmount = data?.staked_amount || data?.amount || '0';

      if (stakedAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const amount = parseFloat(stakedAmount) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(assetType);
      const valueUSD = amount * price;

      const pendingRewards = data?.pending_rewards || '0';
      const rewardAmount = parseFloat(pendingRewards) / Math.pow(10, decimals);

      positions.push({
        id: this.createPositionId('vibrantx', 'staking', resource.type),
        protocol: 'VibrantX',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.STAKING,
        address: walletAddress,
        assets: [
          {
            type: AssetType.STAKED,
            tokenAddress: assetType,
            symbol: this.getTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD,
            metadata: {
              stakingType: 'Single Asset Staking',
              pendingRewards: rewardAmount.toString(),
              apy: data?.apy,
              lockPeriod: data?.lock_period,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'VibrantX',
          feature: 'Staking',
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
    const farmingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::farm::') || r.type.includes('::farming::'))
    );

    for (const resource of farmingResources) {
      const data = resource.data as any;
      const depositAmount = data?.deposited || data?.amount || '0';

      if (depositAmount === '0') continue;

      const lpTokenType = data?.lp_token_type || resource.type;
      const amount = parseFloat(depositAmount) / Math.pow(10, 8);

      const pendingRewards = data?.pending_rewards || '0';
      const rewardAmount = parseFloat(pendingRewards) / Math.pow(10, 8);

      positions.push({
        id: this.createPositionId('vibrantx', 'farming', resource.type),
        protocol: 'VibrantX',
        protocolType: ProtocolType.FARMING,
        positionType: PositionType.FARMING,
        address: walletAddress,
        assets: [
          {
            type: AssetType.STAKED,
            tokenAddress: lpTokenType,
            symbol: 'Staked LP',
            amount: amount.toString(),
            valueUSD: 0, // Would need LP value calculation
            metadata: {
              farmType: 'LP Farming',
              pendingRewards: rewardAmount.toString(),
              rewardToken: 'VX',
              apy: data?.farm_apy,
            },
          },
        ],
        totalValueUSD: 0,
        metadata: {
          dex: 'VibrantX',
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
    const match = resourceType.match(/::(?:lp|pool)::LPToken<(.+)>$/);
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
    if (tokenAddress.includes('::vx::VX')) return 'VX';

    const match = tokenAddress.match(/::([^:]+)::([^>]+)$/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
