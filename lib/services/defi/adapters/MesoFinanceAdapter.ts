import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class MesoFinanceAdapter extends BaseProtocolAdapter {
  readonly id = 'meso-finance-adapter';
  readonly name = 'Meso Finance Adapter';
  readonly protocolName = 'Meso Finance';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x68476f9d437e3f32fd262ba898b5e3ee0a23a1d586a6cf29a28add35f253f6f7',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Meso Finance adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for supply positions
      await this.scanSupplyPositions(walletAddress, resources, positions);

      // Scan for borrow positions
      await this.scanBorrowPositions(walletAddress, resources, positions);

      // Scan for mToken positions (Meso's yield tokens)
      await this.scanMTokenPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Meso Finance positions', error);
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

  private async scanSupplyPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const supplyResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::supply::') || r.type.includes('::deposit::'))
    );

    for (const resource of supplyResources) {
      const data = resource.data as any;

      const suppliedAmount = data?.supplied_amount || data?.balance || '0';
      const earnedInterest = data?.earned_interest || '0';

      if (suppliedAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const principal = parseFloat(suppliedAmount) / Math.pow(10, decimals);
      const interest = parseFloat(earnedInterest) / Math.pow(10, decimals);
      const totalAmount = principal + interest;

      const price = await this.getTokenPrice(assetType);
      const valueUSD = totalAmount * price;

      const apy = data?.supply_apy || data?.lending_rate || undefined;

      positions.push({
        id: this.createPositionId('meso', 'supply', assetType),
        protocol: 'Meso Finance',
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
              earnedInterest: interest.toString(),
              underlying: assetType,
              utilization: data?.utilization_rate,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Lending Market',
          marketStatus: data?.market_status || 'Active',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanBorrowPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const borrowResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::borrow::') || r.type.includes('::loan::'))
    );

    for (const resource of borrowResources) {
      const data = resource.data as any;

      const borrowedAmount = data?.borrowed_amount || data?.principal || '0';
      const accruedInterest =
        data?.accrued_interest || data?.interest_owed || '0';

      if (borrowedAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const principal = parseFloat(borrowedAmount) / Math.pow(10, decimals);
      const interest = parseFloat(accruedInterest) / Math.pow(10, decimals);
      const totalDebt = principal + interest;

      const price = await this.getTokenPrice(assetType);
      const valueUSD = totalDebt * price;

      const apy = data?.borrow_apy || data?.interest_rate || undefined;
      const isStableRate = data?.rate_mode === 'stable' || data?.is_stable_rate;

      positions.push({
        id: this.createPositionId('meso', 'borrow', assetType),
        protocol: 'Meso Finance',
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
              borrowType: isStableRate ? 'Stable' : 'Variable',
              maturityDate: data?.maturity_date,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Borrowing',
          healthFactor: data?.health_factor,
          liquidationThreshold: data?.liquidation_threshold,
          ltv: data?.loan_to_value,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanMTokenPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // mTokens are Meso's interest-bearing tokens
    const mTokenResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::mtoken::') || r.type.includes('::m_token::'))
    );

    for (const resource of mTokenResources) {
      const balance = resource.data?.coin?.value || '0';
      if (balance === '0') continue;

      const underlyingAsset = this.extractUnderlyingAsset(resource.type);
      const decimals = this.getDecimals(underlyingAsset);
      const mTokenAmount = parseFloat(balance) / Math.pow(10, decimals);

      // Get exchange rate to calculate underlying amount
      const exchangeRate = resource.data?.exchange_rate || 1;
      const underlyingAmount = mTokenAmount * exchangeRate;

      const price = await this.getTokenPrice(underlyingAsset);
      const valueUSD = underlyingAmount * price;

      positions.push({
        id: this.createPositionId('meso', 'mtoken', resource.type),
        protocol: 'Meso Finance',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.LENDING_SUPPLY,
        address: walletAddress,
        assets: [
          {
            type: AssetType.SUPPLIED,
            tokenAddress: resource.type,
            symbol: `m${this.getTokenSymbol(underlyingAsset)}`,
            amount: mTokenAmount.toString(),
            valueUSD,
            metadata: {
              underlying: underlyingAsset,
              underlyingAmount: underlyingAmount.toString(),
              exchangeRate,
              isInterestBearing: true,
              lastAccrualTime: resource.data?.last_accrual_time,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'mToken (Interest Bearing)',
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

  private extractUnderlyingAsset(mTokenType: string): string {
    const match = mTokenType.match(/mtoken::MToken<([^>]+)>/);
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
