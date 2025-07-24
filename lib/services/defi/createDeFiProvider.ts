import { DeFiPositionProvider } from './DeFiPositionProvider';
import { AdapterContext } from './interfaces/adapter';
import { ADAPTER_REGISTRY } from './adapters';
import { DefaultPriceService } from './services/DefaultPriceService';

interface CreateDeFiProviderOptions {
  apiKey?: string;
  enabledAdapters?: string[];
  logger?: Console;
}

/**
 * Create a DeFi position provider with all adapters pre-registered
 */
export async function createDeFiProvider(
  options: CreateDeFiProviderOptions = {}
): Promise<DeFiPositionProvider> {
  // Create price service
  const priceService = new DefaultPriceService();

  // Create context (walletAddress will be set when scanning positions)
  const context: AdapterContext = {
    walletAddress: '', // Will be set during scanning
    indexerUrl: 'https://indexer.mainnet.aptoslabs.com/v1/graphql',
    priceService,
    apiKey: options.apiKey,
    logger: options.logger || console,
  };

  // Create provider
  const provider = new DeFiPositionProvider(context);

  // Register all adapters
  const adapterIds = options.enabledAdapters || Object.keys(ADAPTER_REGISTRY);

  for (const adapterId of adapterIds) {
    const AdapterClass =
      ADAPTER_REGISTRY[adapterId as keyof typeof ADAPTER_REGISTRY];
    if (AdapterClass) {
      const adapter = new AdapterClass();
      provider.registerAdapter(adapter);
    }
  }

  // Initialize all adapters
  await provider.initializeAllAdapters();

  return provider;
}

/**
 * List all available adapter IDs
 */
export function getAvailableAdapters(): string[] {
  return Object.keys(ADAPTER_REGISTRY);
}

/**
 * Fully integrated protocols list
 */
export const FULLY_INTEGRATED_PROTOCOLS = [
  // DEX Protocols
  {
    name: 'Thala',
    type: 'DEX & Farming',
    features: ['Liquidity Pools', 'Farming', 'CDP (MOD stablecoin)'],
    adapterId: 'thala-adapter',
  },
  {
    name: 'LiquidSwap',
    type: 'DEX',
    features: ['Liquidity Pools', 'Farming'],
    adapterId: 'liquidswap-adapter',
  },
  {
    name: 'PancakeSwap',
    type: 'DEX',
    features: ['Liquidity Pools', 'MasterChef Farming', 'CAKE Staking'],
    adapterId: 'pancakeswap-adapter',
  },
  {
    name: 'Cellana Finance',
    type: 'DEX',
    features: ['Liquidity Pools', 'Farming'],
    adapterId: 'cellana-adapter',
  },
  {
    name: 'SushiSwap',
    type: 'DEX',
    features: ['Liquidity Pools', 'MasterChef/MiniChef Farming'],
    adapterId: 'sushiswap-adapter',
  },
  {
    name: 'VibrantX',
    type: 'DEX',
    features: ['Liquidity Pools', 'Staking', 'Farming'],
    adapterId: 'vibrantx-adapter',
  },
  {
    name: 'Kana Labs',
    type: 'DEX & Perps',
    features: ['Liquidity Pools', 'Perpetual Trading', 'Staking'],
    adapterId: 'kana-labs-adapter',
  },
  {
    name: 'Hyperion',
    type: 'DEX',
    features: ['AMM Pools', 'LP Staking'],
    adapterId: 'hyperion-adapter',
  },
  {
    name: 'Panora Exchange',
    type: 'DEX Aggregator',
    features: ['Liquidity Pools', 'Limit Orders', 'DEX Aggregation'],
    adapterId: 'panora-exchange-adapter',
  },
  {
    name: 'Uptos Pump',
    type: 'Meme Coin Launcher',
    features: ['Meme Coin Liquidity', 'Bonding Curves', 'Creator Allocations'],
    adapterId: 'uptos-pump-adapter',
  },
  {
    name: 'Thetis Market',
    type: 'DEX',
    features: ['Liquidity Pools', 'Staking', 'Yield Vaults'],
    adapterId: 'thetis-market-adapter',
  },
  // Lending Protocols
  {
    name: 'Aries Markets',
    type: 'Lending',
    features: [
      'Supply Positions',
      'Borrow Positions',
      'Interest-bearing Tokens (aTokens)',
    ],
    adapterId: 'aries-adapter',
  },
  {
    name: 'Echelon',
    type: 'Lending',
    features: ['Supply/Borrow', 'Yield Tokens', 'Health Factor Tracking'],
    adapterId: 'echelon-adapter',
  },
  {
    name: 'Echo Lending',
    type: 'Lending',
    features: ['Lending Pools', 'Borrowing', 'Collateral Management'],
    adapterId: 'echo-lending-adapter',
  },
  {
    name: 'Meso Finance',
    type: 'Lending',
    features: ['Supply/Borrow', 'mTokens', 'Stable/Variable Rates'],
    adapterId: 'meso-finance-adapter',
  },
  {
    name: 'Joule Finance',
    type: 'Lending',
    features: ['Lending Markets', 'jTokens', 'Rewards System'],
    adapterId: 'joule-finance-adapter',
  },
  {
    name: 'Superposition',
    type: 'Lending',
    features: ['Lending/Borrowing', 'sTokens', 'Liquidity Provision'],
    adapterId: 'superposition-adapter',
  },
  // Derivatives
  {
    name: 'Merkle Trade',
    type: 'Derivatives',
    features: ['MKLP Liquidity', 'Trading Positions', 'Staked MKLP'],
    adapterId: 'merkle-trade-adapter',
  },
  // Fallback
  {
    name: 'Generic Tokens',
    type: 'Fallback',
    features: ['Any protocol tokens not covered by specific adapters'],
    adapterId: 'generic-token-adapter',
  },
];
