import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';

export class ThalaAdapter extends BaseProtocolAdapter {
  readonly id = 'thala-adapter';
  readonly name = 'Thala Protocol Adapter';
  readonly protocolName = 'Thala';
  readonly version = '1.0.0';
  readonly supportedProtocols = [
    // Thala Infrastructure (DEX)
    '0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af',
    '0x007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5',
    '0x60955b957956d79bc80b096d3e41bad525dd400d8ce957cdeb05719ed1e4fc26',
    // Thala CDP
    '0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01',
    // Thala Farm
    '0x6b3720cd988adeaf721ed9d4730da4324d52364871a68eac62b46d21e4d2fa99',
    '0x3c4a58b4a8dffe6d14448072efcdd5a0e0089a22c6837b94f1d7e8bb1552137f',
    '0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d',
  ];

  protected async onInitialize(): Promise<void> {
    this.logger?.info('Thala adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      // Fetch account resources
      const resources = await this.fetchAccountResources(walletAddress);

      // Process only DEX and farming positions (no LST)
      await Promise.all([
        this.scanLiquidityPoolPositions(walletAddress, resources, positions),
        this.scanFarmingPositions(walletAddress, resources, positions),
        this.scanCDPPositions(walletAddress, resources, positions),
      ]);

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning Thala positions', error);
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

  private async scanLiquidityPoolPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Look for LP token positions
    const lpResources = resources.filter(
      r =>
        r.type.includes('::stable_pool::StablePoolToken<') ||
        r.type.includes('::weighted_pool::WeightedPoolToken<')
    );

    for (const resource of lpResources) {
      const balance = resource.data?.coin?.value || '0';
      if (balance === '0') continue;

      // Parse pool type and tokens
      const poolInfo = this.parseLPTokenType(resource.type);
      if (!poolInfo) continue;

      const price = await this.estimateLPTokenPrice(poolInfo.tokens);
      const amount = parseFloat(balance) / Math.pow(10, 8);
      const valueUSD = amount * price;

      positions.push({
        id: this.createPositionId('thala', 'liquidity', resource.type),
        protocol: 'Thala',
        protocolType: ProtocolType.DEX,
        positionType: PositionType.LIQUIDITY_POOL,
        address: walletAddress,
        assets: [
          {
            type: AssetType.LP_TOKEN,
            tokenAddress: resource.type,
            symbol: `${poolInfo.poolType} LP`,
            amount: amount.toString(),
            valueUSD,
            metadata: {
              poolId: resource.type,
              poolTokens: poolInfo.tokens,
              underlying: poolInfo.tokens,
            },
          },
        ],
        totalValueUSD: valueUSD,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanFarmingPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Look for farming/gauge positions - Thala Farm addresses
    const farmAddresses = [
      '0x6b3720cd988adeaf721ed9d4730da4324d52364871a68eac62b46d21e4d2fa99',
      '0x3c4a58b4a8dffe6d14448072efcdd5a0e0089a22c6837b94f1d7e8bb1552137f',
      '0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d',
    ];

    const farmResources = resources.filter(
      r =>
        farmAddresses.some(addr => r.type.includes(addr)) &&
        (r.type.includes('::farming::') ||
          r.type.includes('::gauge::') ||
          r.type.includes('::farm::'))
    );

    // Also check for staked LP tokens in farms
    const stakedLPResources = resources.filter(
      r =>
        farmAddresses.some(addr => r.type.includes(addr)) &&
        r.type.includes('CoinStore<')
    );

    for (const resource of stakedLPResources) {
      const balance = resource.data?.coin?.value || '0';
      if (balance === '0') continue;

      // Extract token type from CoinStore<...>
      const tokenMatch = resource.type.match(/CoinStore<(.+)>/);
      if (!tokenMatch) continue;

      const tokenAddress = tokenMatch[1];
      const amount = parseFloat(balance) / Math.pow(10, 8);

      // Try to identify if it's an LP token
      const poolInfo = this.parseLPTokenType(tokenAddress);
      const isLP = (poolInfo?.tokens?.length || 0) > 0;

      positions.push({
        id: this.createPositionId('thala', 'farming', tokenAddress),
        protocol: 'Thala Farm',
        protocolType: ProtocolType.FARMING,
        positionType: PositionType.FARMING,
        address: walletAddress,
        assets: [
          {
            type: AssetType.STAKED,
            tokenAddress,
            symbol: isLP ? 'Staked LP' : 'Staked Token',
            amount: amount.toString(),
            valueUSD: 0, // Would need pool reserve calculations
            metadata: {
              poolTokens: poolInfo?.tokens || [],
              farmType: 'Thala Farm',
            },
          },
        ],
        totalValueUSD: 0,
        metadata: {
          protocolFeature: 'Yield Farming',
        },
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private async scanCDPPositions(
    walletAddress: string,
    resources: any[],
    positions: DeFiPosition[]
  ): Promise<void> {
    // Look for CDP (Collateralized Debt Position) resources
    const cdpResources = resources.filter(
      r =>
        r.type.includes(
          '0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01'
        ) &&
        (r.type.includes('::vault::') || r.type.includes('::cdp::'))
    );

    // Also check for MOD token holdings (CDP stablecoin)
    const modResources = resources.filter(r =>
      r.type.includes(
        'CoinStore<0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD>'
      )
    );

    // Process MOD holdings as CDP-related positions
    for (const resource of modResources) {
      const balance = resource.data?.coin?.value || '0';
      if (balance === '0') continue;

      const tokenAddress =
        '0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD';
      const price = await this.getTokenPrice(tokenAddress);
      const amount = parseFloat(balance) / Math.pow(10, 8); // MOD has 8 decimals
      const valueUSD = amount * price;

      positions.push({
        id: this.createPositionId('thala', 'cdp-mod', tokenAddress),
        protocol: 'Thala',
        protocolType: ProtocolType.LENDING,
        positionType: PositionType.LENDING_BORROW,
        address: walletAddress,
        assets: [
          {
            type: AssetType.BORROWED,
            tokenAddress,
            symbol: 'MOD',
            amount: amount.toString(),
            valueUSD,
            metadata: {
              underlying: ['Collateralized Debt Position'],
            },
          },
        ],
        totalValueUSD: valueUSD,
        metadata: {
          protocolFeature: 'CDP',
        },
        lastUpdated: new Date().toISOString(),
      });
    }

    // Process actual CDP vault positions
    for (const resource of cdpResources) {
      this.logger?.debug('Processing CDP resource', { type: resource.type });
      // Would need specific CDP data structure parsing here
    }
  }

  private parseLPTokenType(resourceType: string): {
    poolType: string;
    tokens: string[];
  } | null {
    // Parse Thala LP token types
    if (resourceType.includes('::stable_pool::StablePoolToken<')) {
      const match = resourceType.match(/StablePoolToken<(.+)>/);
      if (match) {
        const tokens = match[1]
          .split(',')
          .map(t => t.trim())
          .filter(t => !t.includes('::base_pool::Null'));
        return {
          poolType: 'Stable Pool',
          tokens,
        };
      }
    }

    if (resourceType.includes('::weighted_pool::WeightedPoolToken<')) {
      const match = resourceType.match(/WeightedPoolToken<(.+)>/);
      if (match) {
        const tokens = match[1]
          .split(',')
          .map(t => t.trim())
          .filter(t => !t.includes('::base_pool::Null'));
        return {
          poolType: 'Weighted Pool',
          tokens,
        };
      }
    }

    return null;
  }

  private async estimateLPTokenPrice(tokens: string[]): Promise<number> {
    if (tokens.length === 0) return 0;

    try {
      // Simple estimation: use the price of the first token
      // In practice, you'd want to calculate based on pool reserves
      const prices = await this.getTokenPrices(tokens);
      const firstTokenPrice = prices.get(tokens[0]) || 0;

      // This is a very rough estimation - actual implementation would need
      // to query pool reserves and calculate proper LP token value
      return firstTokenPrice * 0.5; // Assuming roughly half the value
    } catch (error) {
      this.logger?.warn('Failed to estimate LP token price', error);
      return 0;
    }
  }

  private getTokenSymbol(tokenAddress: string): string {
    if (tokenAddress.includes('::aptos_coin::AptosCoin')) return 'APT';
    if (tokenAddress.includes('::asset::USDC')) return 'USDC';
    if (tokenAddress.includes('::asset::USDT')) return 'USDT';
    if (tokenAddress.includes('::staking::ThalaAPT')) return 'thAPT';
    if (tokenAddress.includes('::thl_coin::THL')) return 'THL';

    // Extract token name from address
    const match = tokenAddress.match(/::([^:]+)::([^>]+)/);
    if (match) {
      return match[2].toUpperCase();
    }

    return 'UNKNOWN';
  }
}
