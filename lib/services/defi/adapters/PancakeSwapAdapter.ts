import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class PancakeSwapAdapter extends BaseProtocolAdapter {
  readonly id = 'pancakeswap-adapter';
  readonly name = 'PancakeSwap Adapter';
  readonly protocolName = 'PancakeSwap';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x7968a225eba6c99f5f1070aeec1b405757dee939eabcfda43ba91588bf5fccf3',
    '0xfd1d8a523f1be89277ac0787ae3469312667e3d0b3f75a5f01bfc95530a2dc91',
    '0x9936836587ca33240d3d3f91844651b16cb07802faf5e34514ed6f78580deb0a',
    '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('PancakeSwap adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for LP tokens
      await this.scanLPTokens(walletAddress, resources, positions);

      // Scan for farming positions (MasterChef)
      await this.scanFarmingPositions(walletAddress, resources, positions);

      // Scan for CAKE staking
      await this.scanCakeStaking(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning PancakeSwap positions', error);
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
    // Look for PancakeSwap LP tokens
    const lpResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        r.type.includes('::swap::LPToken<')
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

      // Estimate LP value (simplified)
      if (tokenPrices.size > 0) {
        const avgPrice =
          Array.from(tokenPrices.values()).reduce((a, b) => a + b, 0) /
          tokenPrices.size;
        valueUSD = amount * avgPrice * 0.5; // Rough estimation
      }

      positions.push({
        id: this.createPositionId('pancakeswap', 'lp', resource.type),
        protocol: 'PancakeSwap',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: resource.type,
            symbol: `${this.getTokenSymbol(poolInfo.tokens[0])}-${this.getTokenSymbol(poolInfo.tokens[1])} Cake-LP`,
            amount: amount.toString(),
            valueUSD,
            metadata: {
              poolId: resource.type,
              poolTokens: poolInfo.tokens,
              poolType: 'V2 Pool',
              underlying: poolInfo.tokens,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'PancakeSwap',
          version: 'V2',
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
    // Look for MasterChef farming positions
    const farmingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::masterchef::') || r.type.includes('::farm::'))
    );

    for (const resource of farmingResources) {
      const data = resource.data as any;

      // Check for staked amount
      const stakedAmount = data?.amount || data?.staked_amount || '0';
      if (stakedAmount === '0') continue;

      const amount = parseFloat(stakedAmount) / Math.pow(10, 8);
      const pendingRewards = data?.pending_cake || '0';
      const rewardAmount = parseFloat(pendingRewards) / Math.pow(10, 8);

      positions.push({
        id: this.createPositionId('pancakeswap', 'farming', resource.type),
        protocol: 'PancakeSwap',
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
              farmType: 'MasterChef',
              pendingRewards: rewardAmount.toString(),
              rewardToken: 'CAKE',
            },
          },
        ],
        totalValueUSD: 0,
        metadata: {
          dex: 'PancakeSwap',
          feature: 'Yield Farming',
          hasRewards: rewardAmount > 0,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanCakeStaking(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Look for CAKE staking positions
    const cakeStakingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        r.type.includes('::cake_pool::')
    );

    for (const resource of cakeStakingResources) {
      const data = resource.data as any;
      const stakedAmount = data?.shares || data?.amount || '0';

      if (stakedAmount === '0') continue;

      const amount = parseFloat(stakedAmount) / Math.pow(10, 8);
      const cakePrice = await this.getTokenPrice('CAKE'); // Would need actual CAKE token address
      const valueUSD = amount * cakePrice;

      positions.push({
        id: this.createPositionId('pancakeswap', 'cake-staking', resource.type),
        protocol: 'PancakeSwap',
        protocolType: ProtocolType.FARMING,
        positionType: PositionType.STAKING,
        address: walletAddress,
        assets: [
          {
            type: AssetType.STAKED,
            tokenAddress: 'CAKE',
            symbol: 'CAKE',
            amount: amount.toString(),
            valueUSD,
            metadata: {
              stakingType: 'CAKE Pool',
              lockPeriod: data?.lock_until || undefined,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'PancakeSwap',
          feature: 'CAKE Staking',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private parseLPTokenType(resourceType: string): {
    tokens: string[];
  } | null {
    // Parse PancakeSwap LP token types
    const match = resourceType.match(/::swap::LPToken<(.+)>/);
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
    if (tokenAddress.includes('::cake::Cake')) return 'CAKE';

    const match = tokenAddress.match(/::([^:]+)::([^>]+)/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
