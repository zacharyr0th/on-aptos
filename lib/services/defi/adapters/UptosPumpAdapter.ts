import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class UptosPumpAdapter extends BaseProtocolAdapter {
  readonly id = 'uptos-pump-adapter';
  readonly name = 'Uptos Pump Adapter';
  readonly protocolName = 'Uptos Pump';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x4e5e85fd647c7e19560590831616a3c021080265576af3182535a1d19e8bc2b3',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Uptos Pump adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for meme coin LP positions
      await this.scanMemeLPPositions(walletAddress, resources, positions);

      // Scan for bonding curve positions
      await this.scanBondingCurvePositions(walletAddress, resources, positions);

      // Scan for creator/launch positions
      await this.scanCreatorPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Uptos Pump positions', error);
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

  private async scanMemeLPPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const lpResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::meme_pool::') || r.type.includes('::pump::'))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.lp_tokens || resource.data?.shares || '0';
      if (balance === '0') continue;

      const poolInfo = this.parseMemeCoinPool(resource.type);
      if (!poolInfo) continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);

      // Meme coins often pair with APT
      const aptPrice = await this.getTokenPrice('0x1::aptos_coin::AptosCoin');
      const valueUSD = amount * aptPrice * 0.5; // Rough estimation

      positions.push({
        id: this.createPositionId('uptos', 'meme-lp', resource.type),
        protocol: 'Uptos Pump',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: resource.type,
            symbol: `${poolInfo.memeCoin}-APT PUMP-LP`,
            amount: amount.toString(),
            valueUSD,
            metadata: {
              poolId: resource.type,
              memeCoin: poolInfo.memeCoin,
              pairToken: '0x1::aptos_coin::AptosCoin',
              launchPhase: poolInfo.phase || 'Active',
              poolAge: resource.data?.created_at,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocol: 'Uptos Pump',
          feature: 'Meme Coin Liquidity',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanBondingCurvePositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const bondingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::bonding::') || r.type.includes('::curve::'))
    );

    for (const resource of bondingResources) {
      const data = resource.data as any;
      const bondedAmount = data?.bonded_tokens || data?.amount || '0';

      if (bondedAmount === '0') continue;

      const tokenType = this.extractAssetType(resource.type);
      const decimals = 8; // Most meme coins use 8 decimals
      const amount = parseFloat(bondedAmount) / Math.pow(10, decimals);

      // Calculate value based on bonding curve
      const currentPrice = data?.current_price || data?.spot_price || 0;
      const valueUSD = amount * parseFloat(currentPrice);

      positions.push({
        id: this.createPositionId('uptos', 'bonding', resource.type),
        protocol: 'Uptos Pump',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LOCKED,
            tokenAddress: tokenType,
            symbol: 'MEME',
            amount: amount.toString(),
            valueUSD,
            metadata: {
              bondingCurveType: data?.curve_type || 'Linear',
              currentSupply: data?.current_supply,
              targetSupply: data?.target_supply,
              progress: data?.progress || 0,
              canWithdraw: data?.can_withdraw || false,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocol: 'Uptos Pump',
          feature: 'Bonding Curve',
          stage: data?.stage || 'Bonding',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanCreatorPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const creatorResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::creator::') || r.type.includes('::launch::'))
    );

    for (const resource of creatorResources) {
      const data = resource.data as any;

      // Check for creator allocation
      const creatorAllocation =
        data?.creator_allocation || data?.reserved_tokens || '0';
      const unlockedAmount = data?.unlocked_amount || '0';

      if (creatorAllocation === '0') continue;

      const tokenAddress = data?.token_address || resource.type;
      const decimals = 8;
      const totalAmount =
        parseFloat(creatorAllocation) / Math.pow(10, decimals);
      const unlocked = parseFloat(unlockedAmount) / Math.pow(10, decimals);
      const locked = totalAmount - unlocked;

      // Creator tokens might not have price yet
      const price = (await this.getTokenPrice(tokenAddress)) || 0;
      const valueUSD = totalAmount * price;

      positions.push({
        id: this.createPositionId('uptos', 'creator', tokenAddress),
        protocol: 'Uptos Pump',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.VESTING,
        address: walletAddress,
        assets: [
          {
            type: AssetType.VESTING,
            tokenAddress,
            symbol: data?.token_symbol || 'CREATOR',
            amount: totalAmount.toString(),
            valueUSD,
            metadata: {
              creatorRole: 'Token Creator',
              totalAllocation: totalAmount.toString(),
              unlockedAmount: unlocked.toString(),
              lockedAmount: locked.toString(),
              vestingSchedule: data?.vesting_schedule,
              launchDate: data?.launch_date,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocol: 'Uptos Pump',
          feature: 'Creator Allocation',
          isCreator: true,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private parseMemeCoinPool(resourceType: string): {
    memeCoin: string;
    phase?: string;
  } | null {
    const match = resourceType.match(/::(?:meme_pool|pump)::Pool<(.+),/);
    if (match) {
      return {
        memeCoin: match[1],
        phase: 'Active',
      };
    }
    return null;
  }

  private extractAssetType(resourceType: string): string {
    const match = resourceType.match(/<([^,>]+)>/);
    if (match) {
      return match[1];
    }
    return '';
  }

  private getTokenSymbol(tokenAddress: string): string {
    if (tokenAddress.includes('::aptos_coin::AptosCoin')) return 'APT';

    const match = tokenAddress.match(/::([^:]+)::([^>]+)$/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'MEME';
  }
}
