import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class ThetisMarketAdapter extends BaseProtocolAdapter {
  readonly id = 'thetis-market-adapter';
  readonly name = 'Thetis Market Adapter';
  readonly protocolName = 'Thetis';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x0c727553dd5019c4887581f0a89dca9c8ea400116d70e9da7164897812c6646e',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Thetis Market adapter initialized');
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

      // Scan for vault positions
      await this.scanVaultPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Thetis Market positions', error);
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
        (r.type.includes('::market::') || r.type.includes('::pool::'))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.lp_balance || resource.data?.shares || '0';
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
        id: this.createPositionId('thetis', 'lp', resource.type),
        protocol: 'Thetis',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: resource.type,
            symbol: `${this.getTokenSymbol(poolInfo.tokens[0])}-${this.getTokenSymbol(poolInfo.tokens[1])} THETIS-LP`,
            amount: amount.toString(),
            valueUSD,
            metadata: {
              poolId: resource.type,
              poolTokens: poolInfo.tokens,
              poolType: 'Thetis Market',
              underlying: poolInfo.tokens,
              totalLiquidity: resource.data?.total_liquidity,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'Thetis Market',
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
      const stakedAmount = data?.staked || data?.amount || '0';

      if (stakedAmount === '0') continue;

      const tokenType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(tokenType);
      const amount = parseFloat(stakedAmount) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(tokenType);
      const valueUSD = amount * price;

      const pendingRewards = data?.pending_rewards || '0';
      const rewardAmount = parseFloat(pendingRewards) / Math.pow(10, decimals);
      const rewardToken = data?.reward_token || 'THETIS';

      positions.push({
        id: this.createPositionId('thetis', 'staking', resource.type),
        protocol: 'Thetis',
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
              stakingType: 'Thetis Staking',
              pendingRewards: rewardAmount.toString(),
              rewardToken,
              apy: data?.apy,
              lockDuration: data?.lock_duration,
              unlockTime: data?.unlock_time,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocol: 'Thetis Market',
          feature: 'Staking',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanVaultPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const vaultResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        r.type.includes('::vault::')
    );

    for (const resource of vaultResources) {
      const data = resource.data as any;
      const vaultShares = data?.shares || data?.balance || '0';

      if (vaultShares === '0') continue;

      const underlyingAsset = this.extractUnderlyingAsset(resource.type);
      const decimals = this.getDecimals(underlyingAsset);
      const shareAmount = parseFloat(vaultShares) / Math.pow(10, decimals);

      // Get share price
      const sharePrice = data?.price_per_share || 1;
      const underlyingAmount = shareAmount * sharePrice;

      const price = await this.getTokenPrice(underlyingAsset);
      const valueUSD = underlyingAmount * price;

      positions.push({
        id: this.createPositionId('thetis', 'vault', resource.type),
        protocol: 'Thetis',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.VAULT,
        address: walletAddress,
        assets: [
          {
            type: AssetType.VAULT_SHARE,
            tokenAddress: resource.type,
            symbol: `v${this.getTokenSymbol(underlyingAsset)}`,
            amount: shareAmount.toString(),
            valueUSD,
            metadata: {
              underlying: underlyingAsset,
              underlyingAmount: underlyingAmount.toString(),
              sharePrice,
              vaultStrategy: data?.strategy || 'Auto-compound',
              performanceFee: data?.performance_fee,
              totalVaultAssets: data?.total_assets,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocol: 'Thetis Market',
          feature: 'Yield Vault',
          apy: data?.current_apy,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private parseLPTokenType(resourceType: string): {
    tokens: string[];
  } | null {
    const match = resourceType.match(/::(?:market|pool)::.*<(.+)>$/);
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

  private extractUnderlyingAsset(vaultType: string): string {
    const match = vaultType.match(/vault::Vault<([^>]+)>/);
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
    if (tokenAddress.includes('::thetis::THETIS')) return 'THETIS';

    const match = tokenAddress.match(/::([^:]+)::([^>]+)$/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
