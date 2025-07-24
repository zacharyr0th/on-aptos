import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class JouleFinanceAdapter extends BaseProtocolAdapter {
  readonly id = 'joule-finance-adapter';
  readonly name = 'Joule Finance Adapter';
  readonly protocolName = 'Joule Finance';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6',
    '0x3b90501eae5cdc53c507d53b4ddc5a37e620743ef0b53a6aa4f711118890d1e5',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Joule Finance adapter initialized');
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

      // Scan for jToken positions (Joule's receipt tokens)
      await this.scanJTokenPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Joule Finance positions', error);
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
        (r.type.includes('::lending::') || r.type.includes('::market::'))
    );

    for (const resource of lendingResources) {
      const data = resource.data as any;

      const depositAmount = data?.deposited || data?.supplied_amount || '0';
      const rewardsEarned = data?.rewards_earned || '0';

      if (depositAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const amount = parseFloat(depositAmount) / Math.pow(10, decimals);
      const rewards = parseFloat(rewardsEarned) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(assetType);
      const valueUSD = amount * price;
      const rewardsValueUSD = rewards * price;

      const apy = data?.supply_apy || data?.deposit_rate || undefined;

      positions.push({
        id: this.createPositionId('joule', 'lending', assetType),
        protocol: 'Joule Finance',
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
              rewards: rewards.toString(),
              rewardsValueUSD,
              underlying: assetType,
              lastRewardClaim: data?.last_reward_claim,
            },
          },
        ],
        totalValueUSD: valueUSD + rewardsValueUSD,
        metadata: {
          protocolFeature: 'Lending',
          totalRewards: rewardsValueUSD,
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

      const borrowAmount = data?.borrowed || data?.debt_amount || '0';
      const accruedInterest = data?.accrued_interest || '0';
      const originationFee = data?.origination_fee || '0';

      if (borrowAmount === '0') continue;

      const assetType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(assetType);
      const principal = parseFloat(borrowAmount) / Math.pow(10, decimals);
      const interest = parseFloat(accruedInterest) / Math.pow(10, decimals);
      const fee = parseFloat(originationFee) / Math.pow(10, decimals);
      const totalDebt = principal + interest + fee;

      const price = await this.getTokenPrice(assetType);
      const valueUSD = totalDebt * price;

      const apy = data?.borrow_apy || data?.interest_rate || undefined;

      positions.push({
        id: this.createPositionId('joule', 'borrow', assetType),
        protocol: 'Joule Finance',
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
              originationFee: fee.toString(),
              borrowType: data?.is_fixed_rate ? 'Fixed' : 'Variable',
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'Borrowing',
          healthFactor: data?.health_factor,
          collateralRatio: data?.collateral_ratio,
          maxBorrowAmount: data?.max_borrow_amount,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanJTokenPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // jTokens are Joule's receipt tokens
    const jTokenResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::jtoken::') || r.type.includes('::j_token::'))
    );

    for (const resource of jTokenResources) {
      const balance = resource.data?.coin?.value || '0';
      if (balance === '0') continue;

      const underlyingAsset = this.extractUnderlyingAsset(resource.type);
      const decimals = this.getDecimals(underlyingAsset);
      const jTokenAmount = parseFloat(balance) / Math.pow(10, decimals);

      // Get conversion rate
      const conversionRate =
        resource.data?.conversion_rate || resource.data?.exchange_rate || 1;
      const underlyingAmount = jTokenAmount * conversionRate;

      const price = await this.getTokenPrice(underlyingAsset);
      const valueUSD = underlyingAmount * price;

      positions.push({
        id: this.createPositionId('joule', 'jtoken', resource.type),
        protocol: 'Joule Finance',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.LENDING_SUPPLY,
        address: walletAddress,
        assets: [
          {
            type: AssetType.SUPPLIED,
            tokenAddress: resource.type,
            symbol: `j${this.getTokenSymbol(underlyingAsset)}`,
            amount: jTokenAmount.toString(),
            valueUSD,
            metadata: {
              underlying: underlyingAsset,
              underlyingAmount: underlyingAmount.toString(),
              conversionRate,
              isInterestBearing: true,
              totalSupply: resource.data?.total_supply,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'jToken (Receipt Token)',
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

  private extractUnderlyingAsset(jTokenType: string): string {
    const match = jTokenType.match(/jtoken::JToken<([^>]+)>/);
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
