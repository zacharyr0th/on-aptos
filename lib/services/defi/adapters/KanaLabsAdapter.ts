import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class KanaLabsAdapter extends BaseProtocolAdapter {
  readonly id = 'kana-labs-adapter';
  readonly name = 'Kana Labs Adapter';
  readonly protocolName = 'Kana Labs';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x9538c839fe490ccfaf32ad9f7491b5e84e610ff6edc110ff883f06ebde82463d',
    '0x7a38039fffd016adcac2c53795ee49325e5ec6fddf3bf02651c09f9a583655a6',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Kana Labs adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for LP tokens
      await this.scanLPTokens(walletAddress, resources, positions);

      // Scan for perps positions
      await this.scanPerpsPositions(walletAddress, resources, positions);

      // Scan for staking positions
      await this.scanStakingPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Kana Labs positions', error);
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
        (r.type.includes('::pool::') || r.type.includes('::lp::'))
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
        id: this.createPositionId('kana', 'lp', resource.type),
        protocol: 'Kana Labs',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: resource.type,
            symbol: `${this.getTokenSymbol(poolInfo.tokens[0])}-${this.getTokenSymbol(poolInfo.tokens[1])} KANA-LP`,
            amount: amount.toString(),
            valueUSD,
            metadata: {
              poolId: resource.type,
              poolTokens: poolInfo.tokens,
              poolType: 'Kana Pool',
              underlying: poolInfo.tokens,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'Kana Labs',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanPerpsPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Kana Labs has perpetual trading
    const perpsResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::perps::') ||
          r.type.includes('::position::') ||
          r.type.includes('::perpetual::'))
    );

    for (const resource of perpsResources) {
      const data = resource.data as any;

      const collateral = data?.collateral || data?.margin || '0';
      const positionSize = data?.size || data?.notional || '0';

      if (collateral === '0' && positionSize === '0') continue;

      const asset = data?.asset || data?.market || 'Unknown';
      const isLong = data?.is_long || data?.side === 'long';
      const entryPrice = parseFloat(data?.entry_price || '0');
      const markPrice = parseFloat(data?.mark_price || entryPrice);
      const leverage = parseFloat(data?.leverage || '1');

      const collateralValue = parseFloat(collateral) / Math.pow(10, 8);
      const size = parseFloat(positionSize) / Math.pow(10, 8);

      // Calculate PnL
      let pnl = 0;
      if (entryPrice && markPrice && size) {
        const priceChange = markPrice - entryPrice;
        pnl = isLong ? priceChange * size : -priceChange * size;
      }

      const totalValue = collateralValue + pnl;

      positions.push({
        id: this.createPositionId('kana', 'perps', resource.type),
        protocol: 'Kana Labs',
        protocolType: ProtocolType.DERIVATIVES,
        positionType: PositionType.TRADING,
        address: walletAddress,
        assets: [
          {
            type: AssetType.COLLATERAL,
            tokenAddress: '0x1::aptos_coin::AptosCoin',
            symbol: 'APT',
            amount: collateralValue.toString(),
            valueUSD: totalValue,
            metadata: {
              positionType: isLong ? 'Long' : 'Short',
              market: asset,
              leverage,
              entryPrice,
              markPrice,
              pnl,
              size,
              liquidationPrice: data?.liquidation_price,
            },
          },
        ],
        totalValueUSD: totalValue,
        metadata: {
          protocol: 'Kana Labs',
          feature: 'Perpetual Trading',
          hasOpenPosition: true,
          funding: data?.funding_paid,
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
        (r.type.includes('::staking::') || r.type.includes('::rewards::'))
    );

    for (const resource of stakingResources) {
      const data = resource.data as any;
      const stakedAmount = data?.staked || data?.amount || '0';

      if (stakedAmount === '0') continue;

      const tokenType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(tokenType);
      const amount = parseFloat(stakedAmount) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(tokenType);
      const valueUSD = amount * price;

      const pendingRewards = data?.pending_rewards || '0';
      const rewardAmount = parseFloat(pendingRewards) / Math.pow(10, decimals);

      positions.push({
        id: this.createPositionId('kana', 'staking', resource.type),
        protocol: 'Kana Labs',
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
              stakingType: 'KANA Staking',
              pendingRewards: rewardAmount.toString(),
              apy: data?.apy,
              vestingPeriod: data?.vesting_period,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocol: 'Kana Labs',
          feature: 'Token Staking',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private parseLPTokenType(resourceType: string): {
    tokens: string[];
  } | null {
    const match = resourceType.match(/::(?:pool|lp)::.*<(.+)>$/);
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
    if (tokenAddress.includes('::kana::KANA')) return 'KANA';

    const match = tokenAddress.match(/::([^:]+)::([^>]+)$/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
