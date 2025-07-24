import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class EchelonAdapter extends BaseProtocolAdapter {
  readonly id = 'echelon-adapter';
  readonly name = 'Echelon Adapter';
  readonly protocolName = 'Echelon';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0xc6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba',
    '0x024c90c44edf46aa02c3e370725b918a59c52b5aa551388feb258bd5a1e82271',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Echelon adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for lending positions
      await this.scanSuppliedPositions(walletAddress, resources, positions);

      // Scan for borrowing positions
      await this.scanBorrowedPositions(walletAddress, resources, positions);

      // Scan for yield-bearing tokens
      await this.scanYieldTokens(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Echelon positions', error);
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
    const lendingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::lending::') ||
          r.type.includes('::market::') ||
          r.type.includes('::supply::'))
    );

    for (const resource of lendingResources) {
      const data = resource.data as any;

      const suppliedAmount =
        data?.supplied || data?.deposit_amount || data?.balance || '0';
      if (suppliedAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const amount = parseFloat(suppliedAmount) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(assetType);
      const valueUSD = amount * price;

      const apy = data?.supply_apy || data?.apy || undefined;

      positions.push({
        id: this.createPositionId('echelon', 'supply', assetType),
        protocol: 'Echelon',
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
    const borrowResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::borrow::') ||
          r.type.includes('::debt::') ||
          r.type.includes('::loan::'))
    );

    for (const resource of borrowResources) {
      const data = resource.data as any;

      const borrowedAmount =
        data?.borrowed || data?.debt_amount || data?.loan_amount || '0';
      if (borrowedAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const amount = parseFloat(borrowedAmount) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(assetType);
      const valueUSD = amount * price;

      const apy = data?.borrow_apy || data?.interest_rate || undefined;

      positions.push({
        id: this.createPositionId('echelon', 'borrow', assetType),
        protocol: 'Echelon',
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
              borrowType: data?.is_stable ? 'Stable' : 'Variable',
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

  private async scanYieldTokens(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const yieldTokenResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::yield_token::') || r.type.includes('::e_token::'))
    );

    for (const resource of yieldTokenResources) {
      const balance = resource.data?.coin?.value || '0';
      if (balance === '0') continue;

      const underlyingAsset = this.extractUnderlyingAsset(resource.type);
      const decimals = this.getDecimals(underlyingAsset);
      const amount = parseFloat(balance) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(underlyingAsset);
      const valueUSD = amount * price;

      positions.push({
        id: this.createPositionId('echelon', 'yield-token', resource.type),
        protocol: 'Echelon',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.LENDING_SUPPLY,
        address: walletAddress,
        assets: [
          {
            type: AssetType.SUPPLIED,
            tokenAddress: resource.type,
            symbol: `e${this.getTokenSymbol(underlyingAsset)}`,
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
          protocolFeature: 'Yield Token',
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

  private extractUnderlyingAsset(yieldTokenType: string): string {
    const match = yieldTokenType.match(/yield_token::YieldToken<([^>]+)>/);
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
