import { BaseProtocolAdapter } from '../base/BaseProtocolAdapter';
import { DeFiPosition, ProtocolType, PositionType, AssetType } from '../types';
import { PROTOCOLS, ProtocolInfo } from '@/lib/protocol-registry';

export class GenericTokenAdapter extends BaseProtocolAdapter {
  readonly id = 'generic-token-adapter';
  readonly name = 'Generic Token Adapter';
  readonly protocolName = 'Generic';
  readonly version = '1.0.0';
  readonly supportedProtocols: string[] = []; // Will match any protocol

  private protocolRegistry: Map<string, ProtocolInfo> = new Map();

  protected async onInitialize(): Promise<void> {
    // Load protocol registry from your existing system
    await this.loadProtocolRegistry();
    this.logger?.info('Generic token adapter initialized');
  }

  protected async scanProtocolPositions(
    walletAddress: string
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      // Get wallet assets (both FA and Coin standard)
      const [faAssets, coinAssets] = await Promise.all([
        this.getFungibleAssetBalances(walletAddress),
        this.getCoinBalances(walletAddress),
      ]);

      // Process FA assets
      for (const asset of faAssets) {
        const position = await this.createPositionFromFAAsset(
          walletAddress,
          asset
        );
        if (position) {
          positions.push(position);
        }
      }

      // Process Coin assets
      for (const asset of coinAssets) {
        const position = await this.createPositionFromCoinAsset(
          walletAddress,
          asset
        );
        if (position) {
          positions.push(position);
        }
      }

      return positions;
    } catch (error) {
      this.logger?.error('Error scanning token positions', error);
      return [];
    }
  }

  private async getFungibleAssetBalances(
    walletAddress: string
  ): Promise<any[]> {
    const graphqlUrl = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';

    const query = `
      query GetFABalances($owner: String!) {
        current_fungible_asset_balances(
          where: {
            owner_address: { _eq: $owner },
            amount: { _gt: "0" }
          }
        ) {
          amount
          asset_type
          metadata {
            name
            symbol
            decimals
            icon_uri
          }
        }
      }
    `;

    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.context?.apiKey
          ? { Authorization: `Bearer ${this.context.apiKey}` }
          : {}),
      },
      body: JSON.stringify({
        query,
        variables: { owner: walletAddress },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch FA balances: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.current_fungible_asset_balances || [];
  }

  private async getCoinBalances(walletAddress: string): Promise<any[]> {
    const graphqlUrl = 'https://indexer.mainnet.aptoslabs.com/v1/graphql';

    const query = `
      query GetCoinBalances($owner: String!) {
        current_coin_balances(
          where: {
            owner_address: { _eq: $owner },
            amount: { _gt: "0" }
          }
        ) {
          amount
          coin_type
          coin_info {
            name
            symbol
            decimals
          }
        }
      }
    `;

    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.context?.apiKey
          ? { Authorization: `Bearer ${this.context.apiKey}` }
          : {}),
      },
      body: JSON.stringify({
        query,
        variables: { owner: walletAddress },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch coin balances: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.current_coin_balances || [];
  }

  private async createPositionFromFAAsset(
    walletAddress: string,
    asset: any
  ): Promise<DeFiPosition | null> {
    const assetType = asset.asset_type;
    const protocolInfo = this.identifyProtocolFromAddress(assetType);

    // Skip if this is not a DeFi protocol token
    if (!protocolInfo || this.isCommonToken(assetType)) {
      return null;
    }

    const balance = parseFloat(asset.amount);
    const decimals = asset.metadata?.decimals || 8;
    const amount = balance / Math.pow(10, decimals);

    if (amount === 0) return null;

    const price = await this.getTokenPrice(assetType);
    const valueUSD = amount * price;

    // Skip dust amounts unless it's an LP token
    const isLP = this.isLPToken(asset);
    if (!isLP && valueUSD < 0.1) {
      return null;
    }

    return {
      id: this.createPositionId(protocolInfo.name, 'token-holding', assetType),
      protocol: protocolInfo.name,
      protocolType: protocolInfo.type,
      positionType: isLP
        ? PositionType.LIQUIDITY_POOL
        : PositionType.TOKEN_HOLDING,
      address: walletAddress,
      assets: [
        {
          type: isLP ? AssetType.LP_TOKEN : AssetType.SUPPLIED,
          tokenAddress: assetType,
          symbol: asset.metadata?.symbol || 'UNKNOWN',
          amount: amount.toString(),
          valueUSD,
          metadata: isLP
            ? {
                poolId: assetType,
                poolTokens: this.extractPoolTokens(assetType),
              }
            : undefined,
        },
      ],
      totalValueUSD: valueUSD,
      metadata: {
        tokenStandard: 'FA',
        decimals,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private async createPositionFromCoinAsset(
    walletAddress: string,
    asset: any
  ): Promise<DeFiPosition | null> {
    const coinType = asset.coin_type;
    const protocolInfo = this.identifyProtocolFromAddress(coinType);

    // Skip if this is not a DeFi protocol token
    if (!protocolInfo || this.isCommonToken(coinType)) {
      return null;
    }

    const balance = parseFloat(asset.amount);
    const decimals = asset.coin_info?.decimals || 8;
    const amount = balance / Math.pow(10, decimals);

    if (amount === 0) return null;

    const price = await this.getTokenPrice(coinType);
    const valueUSD = amount * price;

    // Skip dust amounts unless it's an LP token
    const isLP = this.isLPToken(asset);
    if (!isLP && valueUSD < 0.1) {
      return null;
    }

    return {
      id: this.createPositionId(protocolInfo.name, 'token-holding', coinType),
      protocol: protocolInfo.name,
      protocolType: protocolInfo.type,
      positionType: isLP
        ? PositionType.LIQUIDITY_POOL
        : PositionType.TOKEN_HOLDING,
      address: walletAddress,
      assets: [
        {
          type: isLP ? AssetType.LP_TOKEN : AssetType.SUPPLIED,
          tokenAddress: coinType,
          symbol: asset.coin_info?.symbol || 'UNKNOWN',
          amount: amount.toString(),
          valueUSD,
          metadata: isLP
            ? {
                poolId: coinType,
                poolTokens: this.extractPoolTokens(coinType),
              }
            : undefined,
        },
      ],
      totalValueUSD: valueUSD,
      metadata: {
        tokenStandard: 'Coin',
        decimals,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private identifyProtocolFromAddress(
    tokenAddress: string
  ): { name: string; type: ProtocolType } | null {
    // Check against known protocol addresses
    for (const [address, protocol] of this.protocolRegistry.entries()) {
      if (tokenAddress.toLowerCase().includes(address.toLowerCase())) {
        return {
          name: protocol.name,
          type: protocol.type as ProtocolType,
        };
      }
    }

    // Fallback pattern matching
    if (tokenAddress.includes('liquidswap') || tokenAddress.includes('hippo')) {
      return { name: 'LiquidSwap', type: ProtocolType.DEX };
    }

    if (tokenAddress.includes('pancakeswap')) {
      return { name: 'PancakeSwap', type: ProtocolType.DEX };
    }

    if (tokenAddress.includes('thala')) {
      return { name: 'Thala', type: ProtocolType.DEX };
    }

    if (tokenAddress.includes('aries')) {
      return { name: 'Aries', type: ProtocolType.LENDING };
    }

    return null;
  }

  private isCommonToken(tokenAddress: string): boolean {
    const commonTokens = [
      '0x1::aptos_coin::AptosCoin', // APT
      '::asset::USDC',
      '::asset::USDT',
      '::asset::WETH',
      '::asset::WBTC',
    ];

    // Exclude tokens that are handled by specific protocol adapters
    const protocolSpecificTokens = [
      '::house_lp::MKLP', // Merkle LP tokens - handled by MerkleTradeAdapter
    ];

    return commonTokens.some(token => tokenAddress.includes(token)) ||
           protocolSpecificTokens.some(token => tokenAddress.includes(token));
  }

  private isLPToken(asset: any): boolean {
    const symbol = asset.metadata?.symbol || asset.coin_info?.symbol || '';
    const name = asset.metadata?.name || asset.coin_info?.name || '';
    const tokenAddress = asset.asset_type || asset.coin_type || '';

    return (
      symbol.toLowerCase().includes('lp') ||
      symbol.toLowerCase().includes('pool') ||
      name.toLowerCase().includes('liquidity') ||
      tokenAddress.includes('::lp_coin::') ||
      tokenAddress.includes('::lp_token::') ||
      tokenAddress.includes('StablePoolToken') ||
      tokenAddress.includes('WeightedPoolToken')
    );
  }

  private extractPoolTokens(tokenAddress: string): string[] {
    // Try to extract underlying tokens from LP token address
    const match = tokenAddress.match(/<(.+)>/);
    if (match) {
      return match[1]
        .split(',')
        .map(t => t.trim())
        .filter(t => !t.includes('::base_pool::Null'));
    }
    return [];
  }

  private async loadProtocolRegistry(): Promise<void> {
    // Load from the actual protocol registry
    for (const protocol of Object.values(PROTOCOLS)) {
      for (const address of protocol.addresses) {
        this.protocolRegistry.set(address, protocol);
      }
    }
  }

  // Override isSupported to match any protocol
  isSupported(protocolAddress: string): boolean {
    return true; // This adapter can handle any protocol as a fallback
  }
}
