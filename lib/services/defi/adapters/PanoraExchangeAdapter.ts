import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class PanoraExchangeAdapter extends BaseProtocolAdapter {
  readonly id = 'panora-exchange-adapter';
  readonly name = 'Panora Exchange Adapter';
  readonly protocolName = 'Panora Exchange';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x1c3206329806286fd2223647c9f9b130e66baeb6d7224a18c1f642ffe48f3b4c',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Panora Exchange adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for LP tokens
      await this.scanLPTokens(walletAddress, resources, positions);

      // Scan for limit orders
      await this.scanLimitOrders(walletAddress, resources, positions);

      // Scan for aggregator positions
      await this.scanAggregatorPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Panora Exchange positions', error);
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
        (r.type.includes('::pool::') || r.type.includes('::liquidity::'))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.lp_tokens || resource.data?.shares || '0';
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
        id: this.createPositionId('panora', 'lp', resource.type),
        protocol: 'Panora Exchange',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: resource.type,
            symbol: `${this.getTokenSymbol(poolInfo.tokens[0])}-${this.getTokenSymbol(poolInfo.tokens[1])} PANORA-LP`,
            amount: amount.toString(),
            valueUSD,
            metadata: {
              poolId: resource.type,
              poolTokens: poolInfo.tokens,
              poolType: 'Panora AMM',
              underlying: poolInfo.tokens,
              feesTier: resource.data?.fee_tier || '0.3%',
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'Panora Exchange',
          isAggregator: true,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanLimitOrders(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    const orderResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::order::') || r.type.includes('::limit::'))
    );

    for (const resource of orderResources) {
      const data = resource.data as any;
      const orderAmount = data?.amount || data?.size || '0';

      if (orderAmount === '0') continue;

      const tokenIn = data?.token_in || data?.sell_token;
      const tokenOut = data?.token_out || data?.buy_token;
      const decimals = this.getDecimals(tokenIn);
      const amount = parseFloat(orderAmount) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(tokenIn);
      const valueUSD = amount * price;

      positions.push({
        id: this.createPositionId('panora', 'order', resource.type),
        protocol: 'Panora Exchange',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIMIT_ORDER,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LOCKED,
            tokenAddress: tokenIn,
            symbol: this.getTokenSymbol(tokenIn),
            amount: amount.toString(),
            valueUSD,
            metadata: {
              orderType: 'Limit Order',
              tokenOut,
              targetPrice: data?.target_price,
              orderStatus: data?.status || 'Active',
              expirationTime: data?.expiration,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'Panora Exchange',
          feature: 'Limit Orders',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanAggregatorPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Panora is a DEX aggregator, so scan for routing positions
    const routingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        r.type.includes('::aggregator::')
    );

    for (const resource of routingResources) {
      const data = resource.data as any;
      const pendingAmount = data?.pending_amount || '0';

      if (pendingAmount === '0') continue;

      const tokenType = this.extractAssetType(resource.type);
      const decimals = this.getDecimals(tokenType);
      const amount = parseFloat(pendingAmount) / Math.pow(10, decimals);

      const price = await this.getTokenPrice(tokenType);
      const valueUSD = amount * price;

      positions.push({
        id: this.createPositionId('panora', 'aggregator', resource.type),
        protocol: 'Panora Exchange',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.PENDING,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LOCKED,
            tokenAddress: tokenType,
            symbol: this.getTokenSymbol(tokenType),
            amount: amount.toString(),
            valueUSD,
            metadata: {
              routingStatus: data?.status || 'Pending',
              sourceDex: data?.source_dex,
              targetDex: data?.target_dex,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'Panora Exchange',
          feature: 'DEX Aggregator',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private parseLPTokenType(resourceType: string): {
    tokens: string[];
  } | null {
    const match = resourceType.match(/::(?:pool|liquidity)::.*<(.+)>$/);
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

    const match = tokenAddress.match(/::([^:]+)::([^>]+)$/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
