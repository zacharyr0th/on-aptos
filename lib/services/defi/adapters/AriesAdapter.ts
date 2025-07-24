import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class AriesAdapter extends BaseProtocolAdapter {
  readonly id = 'aries-adapter';
  readonly name = 'Aries Markets Adapter';
  readonly protocolName = 'Aries';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Aries adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for lending positions (supplied assets)
      await this.scanSuppliedPositions(walletAddress, resources, positions);

      // Scan for borrowing positions
      await this.scanBorrowedPositions(walletAddress, resources, positions);

      // Scan for aTokens (interest-bearing tokens)
      await this.scanATokens(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Aries positions', error);
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

  private async scanSuppliedPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Look for Aries lending pool positions
    const lendingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::lending_pool::') ||
          r.type.includes('::pool::UserReserve'))
    );

    for (const resource of lendingResources) {
      const data = resource.data as any;

      // Check for supplied amount
      const suppliedAmount =
        data?.supplied_amount || data?.deposit_amount || '0';
      if (suppliedAmount === '0') continue;

      // Extract asset info
      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const amount = parseFloat(suppliedAmount) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(assetType);
      const valueUSD = amount * price;

      // Get APY if available
      const apy = data?.current_apy || data?.supply_apy || undefined;

      positions.push({
        id: this.createPositionId('aries', 'supply', assetType),
        protocol: 'Aries',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.LENDING_SUPPLY,
        address: walletAddress,
        assets: [
          {
            type: AssetType.SUPPLIED,
            tokenAddress: assetType,
            symbol: this.getTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD,
            metadata: {
              apy: apy ? parseFloat(apy) / 100 : undefined,
              underlying: assetType,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Lending',
          healthFactor: data?.health_factor,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanBorrowedPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Look for borrowed positions
    const borrowResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::borrow::') || r.type.includes('::debt::'))
    );

    for (const resource of borrowResources) {
      const data = resource.data as any;

      const borrowedAmount = data?.borrowed_amount || data?.debt_amount || '0';
      if (borrowedAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const amount = parseFloat(borrowedAmount) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(assetType);
      const valueUSD = amount * price;

      // Get borrow APY
      const apy = data?.borrow_apy || data?.current_borrow_rate || undefined;

      positions.push({
        id: this.createPositionId('aries', 'borrow', assetType),
        protocol: 'Aries',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.LENDING_BORROW,
        address: walletAddress,
        assets: [
          {
            type: AssetType.BORROWED,
            tokenAddress: assetType,
            symbol: this.getTokenSymbol(assetType),
            amount: amount.toString(),
            valueUSD,
            metadata: {
              apy: apy ? parseFloat(apy) / 100 : undefined,
              borrowType: data?.is_variable ? 'Variable' : 'Stable',
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Borrowing',
          healthFactor: data?.health_factor,
          liquidationThreshold: data?.liquidation_threshold,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanATokens(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Look for aToken balances (interest-bearing tokens)
    const aTokenResources = resources.filter(
      r =>
        (this.supportedProtocols.some(addr => r.type.includes(addr)) &&
          r.type.includes('::atoken::')) ||
        r.type.includes('::a_token::')
    );

    for (const resource of aTokenResources) {
      const balance = resource.data?.coin?.value || '0';
      if (balance === '0') continue;

      // Extract underlying asset
      const underlyingAsset = this.extractUnderlyingAsset(resource.type);
      const decimals = this.getDecimals(underlyingAsset);
      const amount = parseFloat(balance) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(underlyingAsset);
      const valueUSD = amount * price;

      positions.push({
        id: this.createPositionId('aries', 'atoken', resource.type),
        protocol: 'Aries',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.LENDING_SUPPLY,
        address: walletAddress,
        assets: [
          {
            type: AssetType.SUPPLIED,
            tokenAddress: resource.type,
            symbol: `a${this.getTokenSymbol(underlyingAsset)}`,
            amount: amount.toString(),
            valueUSD,
            metadata: {
              underlying: underlyingAsset,
              isInterestBearing: true,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Interest-bearing Token',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private extractAssetType(resourceType: string): string {
    // Extract the asset type from resource type
    const match = resourceType.match(/<([^,>]+)>/);
    if (match) {
      return match[1];
    }
    return '';
  }

  private extractUnderlyingAsset(aTokenType: string): string {
    // Extract underlying asset from aToken type
    const match = aTokenType.match(/atoken::AToken<([^>]+)>/);
    if (match) {
      return match[1];
    }
    return '';
  }

  private getDecimals(tokenAddress: string): number {
    if (tokenAddress.includes('::aptos_coin::AptosCoin')) return 8;
    if (tokenAddress.includes('::usdc::') || tokenAddress.includes('::usdt::'))
      return 6;
    return 8; // Default
  }

  private getTokenSymbol(tokenAddress: string): string {
    if (tokenAddress.includes('::aptos_coin::AptosCoin')) return 'APT';
    if (tokenAddress.includes('::usdc::USDC')) return 'USDC';
    if (tokenAddress.includes('::usdt::USDT')) return 'USDT';
    if (tokenAddress.includes('::weth::WETH')) return 'WETH';
    if (tokenAddress.includes('::wbtc::WBTC')) return 'WBTC';

    const match = tokenAddress.match(/::([^:]+)::([^>]+)/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
