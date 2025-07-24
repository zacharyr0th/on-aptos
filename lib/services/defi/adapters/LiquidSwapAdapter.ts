import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class LiquidSwapAdapter extends BaseProtocolAdapter {
  readonly id = 'liquidswap-adapter';
  readonly name = 'LiquidSwap Adapter';
  readonly protocolName = 'LiquidSwap';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12',
    '0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e',
    '0x61d2c22a6cb7831bee0f48363b0eec92369357aece0d1142062f7d5d85c7bef8',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('LiquidSwap adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const resources = await this.fetchAccountResources(walletAddress);

      // Scan for LP tokens
      await this.scanLPTokens(walletAddress, resources, positions);

      // Scan for staked positions
      await this.scanStakedPositions(walletAddress, resources, positions);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning LiquidSwap positions', error);
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
    // Look for LiquidSwap LP tokens
    const lpResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::lp::LP<') || r.type.includes('::lp_coin::LP<'))
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || '0';
      if (balance === '0') continue;

      // Parse LP token type
      const poolInfo = this.parseLPTokenType(resource.type);
      if (!poolInfo || poolInfo.tokens.length < 2) continue;

      const amount = parseFloat(balance) / Math.pow(10, 8);

      // Calculate LP value based on underlying tokens
      const tokenPrices = await this.getTokenPrices(poolInfo.tokens);
      let valueUSD = 0;

      // Simple estimation: assume 50/50 pool
      if (tokenPrices.size > 0) {
        const avgPrice =
          Array.from(tokenPrices.values()).reduce((a, b) => a + b, 0) /
          tokenPrices.size;
        valueUSD = amount * avgPrice; // Rough estimation
      }

      positions.push({
        id: this.createPositionId('liquidswap', 'lp', resource.type),
        protocol: 'LiquidSwap',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: resource.type,
            symbol: `${this.getTokenSymbol(poolInfo.tokens[0])}-${this.getTokenSymbol(poolInfo.tokens[1])} LP`,
            amount: amount.toString(),
            valueUSD,
            metadata: {
              poolId: resource.type,
              poolTokens: poolInfo.tokens,
              poolType: poolInfo.poolType,
              underlying: poolInfo.tokens,
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          dex: 'LiquidSwap',
          poolVersion: poolInfo.version,
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanStakedPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Look for staked LP tokens or farming positions
    const stakingResources = resources.filter(
      r =>
        this.supportedProtocols.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::stake::') || r.type.includes('::farming::'))
    );

    for (const resource of stakingResources) {
      const data = resource.data as any;
      if (!data || !data.amount || data.amount === '0') continue;

      // Extract staking details
      const amount = parseFloat(data.amount) / Math.pow(10, 8);

      positions.push({
        id: this.createPositionId('liquidswap', 'staking', resource.type),
        protocol: 'LiquidSwap',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.FARMING,
        address: walletAddress,
        assets: [
          {
            type: AssetType.STAKED,
            tokenAddress: resource.type,
            symbol: 'Staked LP',
            amount: amount.toString(),
            valueUSD: 0, // Would need to calculate based on LP value
            metadata: {
              stakingType: 'LP Farming',
            },
          },
        ],
        totalValueUSD: 0,
        metadata: {
          dex: 'LiquidSwap',
          feature: 'Yield Farming',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private parseLPTokenType(resourceType: string): {
    poolType: string;
    tokens: string[];
    version: string;
  } | null {
    // Parse LiquidSwap LP token types
    const match = resourceType.match(/::lp(?:_coin)?::LP<(.+)>/);
    if (!match) return null;

    const innerTypes = match[1];
    // Split by comma but handle nested generics
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

    // Determine pool type and version
    let poolType = 'Standard AMM';
    let version = 'v1';

    if (resourceType.includes('::curves::Stable')) {
      poolType = 'Stable Pool';
    } else if (resourceType.includes('::curves::Uncorrelated')) {
      poolType = 'Uncorrelated Pool';
    }

    if (
      resourceType.includes(
        '0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e'
      )
    ) {
      version = 'v2';
    }

    return {
      poolType,
      tokens,
      version,
    };
  }

  private getTokenSymbol(tokenAddress: string): string {
    if (tokenAddress.includes('::aptos_coin::AptosCoin')) return 'APT';
    if (tokenAddress.includes('::usdc::USDC')) return 'USDC';
    if (tokenAddress.includes('::usdt::USDT')) return 'USDT';
    if (tokenAddress.includes('::weth::WETH')) return 'WETH';
    if (tokenAddress.includes('::btc::BTC')) return 'BTC';

    const match = tokenAddress.match(/::([^:]+)::([^>]+)/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
