import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class SuperpositionAdapter extends BaseProtocolAdapter {
  readonly id = 'superposition-adapter';
  readonly name = 'Superposition Adapter';
  readonly protocolName = 'Superposition';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0xccd1a84ccea93531d7f165b90134aa0415feb30e8757ab1632dac68c0055f5c2',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Superposition adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for lending positions
      await this.scanLendingPositions(walletAddress, resources, positions);

      // Scan for borrowing positions
      await this.scanBorrowingPositions(walletAddress, resources, positions);

      // Scan for sToken positions (Superposition's yield tokens)
      await this.scanSTokenPositions(walletAddress, resources, positions);

      // Scan for liquidity positions
      await this.scanLiquidityPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Superposition positions', error);
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

  private async scanLendingPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const lendingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::lending::') || r.type.includes('::position::'))
    );

    for (const resource of lendingResources) {
      const data = resource.data as any;

      const suppliedAmount = data?.supplied || data?.deposit_amount || '0';
      const accruedInterest = data?.accrued_interest || '0';
      const pendingRewards = data?.pending_rewards || '0';

      if (suppliedAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const principal = parseFloat(suppliedAmount) / Math.pow(10, decimals);
      const interest = parseFloat(accruedInterest) / Math.pow(10, decimals);
      const rewards = parseFloat(pendingRewards) / Math.pow(10, decimals);
      const totalAmount = principal + interest;

      const price = await this.getTokenPrice(assetType);
      const valueUSD = totalAmount * price;
      const rewardsValueUSD = rewards * price;

      const apy = data?.supply_apy || data?.lending_rate || undefined;

      positions.push({
        id: this.createPositionId('superposition', 'lending', assetType),
        protocol: 'Superposition',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.LENDING_SUPPLY,
        address: walletAddress,
        assets: [
          {
            type: AssetType.SUPPLIED,
            tokenAddress: assetType,
            symbol: this.getTokenSymbol(assetType),
            amount: totalAmount.toString(),
            valueUSD,
            metadata: {
              apy: apy ? parseFloat(apy) / 100 : undefined,
              principal: principal.toString(),
              accruedInterest: interest.toString(),
              pendingRewards: rewards.toString(),
              rewardsValueUSD,
              underlying: assetType,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Lending',
          utilization: data?.utilization_rate,
          totalRewardsUSD: rewardsValueUSD,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanBorrowingPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const borrowResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::borrow::') || r.type.includes('::debt::'))
    );

    for (const resource of borrowResources) {
      const data = resource.data as any;

      const borrowAmount = data?.borrowed || data?.debt || '0';
      const accruedInterest = data?.accrued_interest || '0';

      if (borrowAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const principal = parseFloat(borrowAmount) / Math.pow(10, decimals);
      const interest = parseFloat(accruedInterest) / Math.pow(10, decimals);
      const totalDebt = principal + interest;

      const price = await this.getTokenPrice(assetType);
      const valueUSD = totalDebt * price;

      const apy = data?.borrow_apy || data?.interest_rate || undefined;

      positions.push({
        id: this.createPositionId('superposition', 'borrow', assetType),
        protocol: 'Superposition',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.LENDING_BORROW,
        address: walletAddress,
        assets: [
          {
            type: AssetType.BORROWED,
            tokenAddress: assetType,
            symbol: this.getTokenSymbol(assetType),
            amount: totalDebt.toString(),
            valueUSD,
            metadata: {
              apy: apy ? parseFloat(apy) / 100 : undefined,
              principal: principal.toString(),
              accruedInterest: interest.toString(),
              borrowType: data?.rate_type || 'Variable',
              collateralRequirement: data?.collateral_requirement,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Borrowing',
          healthFactor: data?.health_factor,
          liquidationPrice: data?.liquidation_price,
          ltv: data?.ltv_ratio,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanSTokenPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // sTokens are Superposition's yield-bearing tokens
    const sTokenResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::stoken::') || r.type.includes('::s_token::'))
    );

    for (const resource of sTokenResources) {
      const balance = resource.data?.coin?.value || '0';
      if (balance === '0') continue;

      const underlyingAsset = this.extractUnderlyingAsset(resource.type);
      const decimals = this.getDecimals(underlyingAsset);
      const sTokenAmount = parseFloat(balance) / Math.pow(10, decimals);

      // Get exchange rate
      const exchangeRate =
        resource.data?.exchange_rate || resource.data?.conversion_rate || 1;
      const underlyingAmount = sTokenAmount * exchangeRate;

      const price = await this.getTokenPrice(underlyingAsset);
      const valueUSD = underlyingAmount * price;

      positions.push({
        id: this.createPositionId('superposition', 'stoken', resource.type),
        protocol: 'Superposition',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.LENDING_SUPPLY,
        address: walletAddress,
        assets: [
          {
            type: AssetType.SUPPLIED,
            tokenAddress: resource.type,
            symbol: `s${this.getTokenSymbol(underlyingAsset)}`,
            amount: sTokenAmount.toString(),
            valueUSD,
            metadata: {
              underlying: underlyingAsset,
              underlyingAmount: underlyingAmount.toString(),
              exchangeRate,
              isInterestBearing: true,
              totalSupply: resource.data?.total_supply,
              lastUpdateTime: resource.data?.last_update_time,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'sToken (Yield Bearing)',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanLiquidityPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Superposition may have liquidity provision features
    const liquidityResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::liquidity::') || r.type.includes('::pool::'))
    );

    for (const resource of liquidityResources) {
      const data = resource.data as any;
      const lpAmount = data?.lp_amount || data?.shares || '0';

      if (lpAmount === '0') continue;

      const poolId = resource.type;
      const decimals = 8; // Assuming 8 decimals for LP tokens
      const amount = parseFloat(lpAmount) / Math.pow(10, decimals);

      // Calculate LP value (would need pool reserves in production)
      const valueUSD = amount * 1; // Placeholder

      positions.push({
        id: this.createPositionId('superposition', 'liquidity', poolId),
        protocol: 'Superposition',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: poolId,
            symbol: 'SP-LP',
            amount: amount.toString(),
            valueUSD,
            metadata: {
              poolId,
              poolShare: data?.pool_share,
              totalPoolValue: data?.total_pool_value,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Liquidity Provision',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private extractAssetType(resourceType: string): string {
    const match = resourceType.match(/<([^,>]+)>/);
    if (match) {
      return match[1];
    }
    return '';
  }

  private extractUnderlyingAsset(sTokenType: string): string {
    const match = sTokenType.match(/stoken::SToken<([^>]+)>/);
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
    if (tokenAddress.includes('::weth::WETH')) return 'WETH';
    if (tokenAddress.includes('::wbtc::WBTC')) return 'WBTC';

    const match = tokenAddress.match(/::([^:]+)::([^>]+)$/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
