import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class EchoLendingAdapter extends BaseProtocolAdapter {
  readonly id = 'echo-lending-adapter';
  readonly name = 'Echo Lending Adapter';
  readonly protocolName = 'Echo Lending';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0xeab7ea4d635b6b6add79d5045c4a45d8148d88287b1cfa1c3b6a4b56f46839ed',
    '0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Echo Lending adapter initialized');
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

      // Scan for collateral positions
      await this.scanCollateralPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Echo Lending positions', error);
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
        (r.type.includes('::lending_pool::') || r.type.includes('::deposits::'))
    );

    for (const resource of lendingResources) {
      const data = resource.data as any;

      const depositAmount = data?.deposit_amount || data?.principal || '0';
      const interestEarned = data?.interest_earned || '0';

      if (depositAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const principal = parseFloat(depositAmount) / Math.pow(10, decimals);
      const interest = parseFloat(interestEarned) / Math.pow(10, decimals);
      const totalAmount = principal + interest;

      const price = await this.getTokenPrice(assetType);
      const valueUSD = totalAmount * price;

      const apy = data?.current_apy || data?.supply_rate || undefined;

      positions.push({
        id: this.createPositionId('echo', 'lending', assetType),
        protocol: 'Echo Lending',
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
              interestEarned: interest.toString(),
              underlying: assetType,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Lending Pool',
          lastUpdateTime: data?.last_update_time,
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
        (r.type.includes('::loans::') || r.type.includes('::borrowing::'))
    );

    for (const resource of borrowResources) {
      const data = resource.data as any;

      const borrowAmount = data?.borrow_amount || data?.principal || '0';
      const accruedInterest = data?.accrued_interest || '0';

      if (borrowAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const principal = parseFloat(borrowAmount) / Math.pow(10, decimals);
      const interest = parseFloat(accruedInterest) / Math.pow(10, decimals);
      const totalDebt = principal + interest;

      const price = await this.getTokenPrice(assetType);
      const valueUSD = totalDebt * price;

      const apy = data?.borrow_rate || data?.interest_rate || undefined;

      positions.push({
        id: this.createPositionId('echo', 'borrow', assetType),
        protocol: 'Echo Lending',
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
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Borrowing',
          healthFactor: data?.health_factor,
          liquidationRisk: data?.liquidation_risk,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanCollateralPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const collateralResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        r.type.includes('::collateral::')
    );

    for (const resource of collateralResources) {
      const data = resource.data as any;

      const collateralAmount = data?.amount || '0';
      if (collateralAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const amount = parseFloat(collateralAmount) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(assetType);
      const valueUSD = amount * price;

      positions.push({
        id: this.createPositionId('echo', 'collateral', assetType),
        protocol: 'Echo Lending',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.COLLATERAL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.COLLATERAL,
            tokenAddress: assetType,
            symbol: this.getTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD,
            metadata: {
              isLocked: true,
              collateralFactor: data?.collateral_factor || 0.75,
              liquidationThreshold: data?.liquidation_threshold || 0.85,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Collateral',
          borrowingPower: valueUSD * (data?.collateral_factor || 0.75),
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
