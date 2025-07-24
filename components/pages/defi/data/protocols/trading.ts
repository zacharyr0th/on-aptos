import type { DefiProtocol } from '../types';
import {
  DexAggregatorImplementation,
  DexImplementation,
  PerpsImplementation,
  LaunchpadImplementation,
} from '../types';

// Trading protocols - DEX, DEX Aggregators, Perps, and Launchpads
export const tradingProtocols: DefiProtocol[] = [
  // DEX AGGREGATORS
  {
    title: 'Panora',
    href: 'https://panora.exchange',
    description: 'defi:protocol_descriptions.Panora',
    category: 'Trading',
    subcategory: 'DEX Aggregator',
    categoryBreakdown: undefined,
    implementation: DexAggregatorImplementation.ROUTE_OPTIMIZATION,
    status: 'Active',
    launchDate: undefined,
    color: 'from-blue-500 to-cyan-500',
    logo: '/icons/protocols/panora.webp',
    lastUpdated: undefined,
    tags: undefined,
    networks: ['mainnet'],
    blockchainSupported: undefined,
    isOpenSource: undefined,
    security: {
      auditStatus: 'Unaudited',
      auditFirms: undefined,
      metrics: undefined,
    },
    tvl: {
      current: 'N/A',
      change7d: undefined,
      change30d: undefined,
      lastUpdated: undefined,
      source: undefined,
      breakdown: undefined,
      historical: undefined,
    },
    volume: undefined,
    financials: undefined,
    yields: undefined,
    token: undefined,
    pools: undefined,
    users: undefined,
    feeStructure: undefined,
    integration: {
      smartContractLinks: ['https://github.com/PanoraExchange'],
      deploymentAddresses: undefined,
      deployerAddress: undefined,
      apiEndpoints: undefined,
      sdkLanguages: undefined,
      docs: undefined,
      integrations: undefined,
      description: undefined,
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/PanoraExchange',
      },
      notableBackers: undefined,
    },
  },
  {
    title: 'Kana',
    href: 'https://kanalabs.io',
    description: 'defi:protocol_descriptions.Kana',
    category: 'Trading',
    subcategory: 'DEX Aggregator',
    categoryBreakdown: undefined,
    implementation: DexAggregatorImplementation.CROSS_CHAIN,
    status: 'Active',
    launchDate: undefined,
    color: 'from-green-500 to-blue-500',
    logo: '/icons/protocols/kana.webp',
    lastUpdated: undefined,
    tags: undefined,
    networks: ['mainnet'],
    blockchainSupported: undefined,
    isOpenSource: undefined,
    security: {
      auditStatus: 'Unaudited',
      auditFirms: undefined,
      metrics: undefined,
    },
    tvl: {
      current: 'N/A',
      change7d: undefined,
      change30d: undefined,
      lastUpdated: undefined,
      source: undefined,
      breakdown: undefined,
      historical: undefined,
    },
    volume: undefined,
    financials: undefined,
    yields: undefined,
    token: undefined,
    pools: undefined,
    users: undefined,
    feeStructure: undefined,
    integration: {
      smartContractLinks: ['https://github.com/kanalabs'],
      deploymentAddresses: undefined,
      deployerAddress: undefined,
      apiEndpoints: undefined,
      sdkLanguages: undefined,
      docs: undefined,
      integrations: undefined,
      description: undefined,
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/kanalabs',
      },
      notableBackers: undefined,
    },
  },
  {
    title: 'Anqa',
    href: 'https://anqa.ag',
    description: 'defi:protocol_descriptions.Anqa',
    category: 'Trading',
    subcategory: 'DEX Aggregator',
    implementation: DexAggregatorImplementation.GAS_OPTIMIZATION,
    status: 'Active',
    color: 'from-orange-500 to-red-500',
    logo: '/icons/protocols/anqa.webp',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Unaudited',
    },
    tvl: {
      current: 'N/A',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/anqa_apt',
      },
    },
  },

  // DEXes
  {
    title: 'LiquidSwap',
    href: 'https://liquidswap.com',
    description: 'defi:protocol_descriptions.LiquidSwap',
    category: 'Trading',
    subcategory: 'DEX',
    implementation: DexImplementation.AMM,
    status: 'Active',
    color: 'from-purple-500 to-pink-500',
    logo: '/icons/protocols/liquidswap.webp',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Audited',
    },
    tvl: {
      current: '$30M+',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/liquidswap',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/pontem-network/liquidswap'],
    },
  },
  {
    title: 'Cellana',
    href: 'https://cellana.finance',
    description: 'defi:protocol_descriptions.Cellana',
    category: 'Trading',
    subcategory: 'DEX',
    implementation: DexImplementation.AMM,
    status: 'Active',
    color: 'from-green-500 to-emerald-500',
    logo: '/icons/protocols/cellana.webp',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Unaudited',
    },
    tvl: {
      current: '$25M+',
    },
    token: {
      governanceToken: 'CELL',
      governanceTokenSymbol: 'CELL',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/CellanaFinance',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/Cellana-Finance'],
    },
  },
  {
    title: 'PancakeSwap',
    href: 'https://pancakeswap.finance',
    description: 'defi:protocol_descriptions.PancakeSwap',
    category: 'Trading',
    subcategory: 'DEX',
    implementation: DexImplementation.AMM,
    status: 'Active',
    color: 'from-yellow-500 to-orange-500',
    logo: '/icons/protocols/pancake.webp',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Audited',
    },
    tvl: {
      current: '$40M+',
    },
    token: {
      governanceToken: 'CAKE',
      governanceTokenSymbol: 'CAKE',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/PancakeSwap',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/pancakeswap'],
    },
  },
  {
    title: 'SushiSwap',
    href: 'https://sushi.com',
    description: 'defi:protocol_descriptions.SushiSwap',
    category: 'Trading',
    subcategory: 'DEX',
    implementation: DexImplementation.AMM,
    status: 'Active',
    color: 'from-pink-500 to-red-500',
    logo: '/icons/protocols/sushi.webp',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Audited',
    },
    tvl: {
      current: 'N/A',
    },
    token: {
      governanceToken: 'SUSHI',
      governanceTokenSymbol: 'SUSHI',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/SushiSwap',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/sushiswap'],
    },
  },
  {
    title: 'Hyperion',
    href: 'https://hyperfluid.xyz',
    description: 'defi:protocol_descriptions.Hyperion',
    category: 'Trading',
    subcategory: 'DEX',
    implementation: DexImplementation.HYBRID,
    status: 'Active',
    color: 'from-cyan-500 to-blue-500',
    logo: '/icons/protocols/hyperion.webp',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Unaudited',
    },
    tvl: {
      current: 'N/A',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/hyperion_xyz',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/hyperfluid-solutions'],
    },
  },
  {
    title: 'Tapp',
    href: 'https://testnet.tapp.exchange',
    description: 'defi:protocol_descriptions.Tapp',
    category: 'Trading',
    subcategory: 'DEX',
    implementation: DexImplementation.AMM,
    status: 'Active',
    color: 'from-pink-500 to-purple-500',
    logo: '/icons/protocols/tapp.jpg',
    networks: ['testnet'],
    security: {
      auditStatus: 'Unaudited',
    },
    tvl: {
      current: 'N/A',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/TappExchange',
      },
    },
  },

  // PERPS
  {
    title: 'Merkle',
    href: 'https://merkle.trade',
    description: 'defi:protocol_descriptions.Merkle',
    category: 'Trading',
    subcategory: 'Perps',
    implementation: PerpsImplementation.CLOB,
    status: 'Active',
    color: 'from-indigo-500 to-purple-500',
    logo: '/icons/protocols/merkle.webp',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Audited',
    },
    tvl: {
      current: 'N/A',
    },
    volume: {
      total: '$20B+',
    },
    token: {
      governanceToken: 'MKL',
      governanceTokenSymbol: 'MKL',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/Merkle_Trade',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/merkle-trade'],
    },
  },
  {
    title: 'AGDEX',
    href: 'https://agdex.finance',
    description: 'defi:protocol_descriptions.AGDEX',
    category: 'Trading',
    subcategory: 'Perps',
    implementation: PerpsImplementation.CROSS_MARGIN,
    status: 'Active',
    color: 'from-blue-500 to-indigo-500',
    logo: '/icons/protocols/agdex.webp',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Unaudited',
    },
    tvl: {
      current: 'N/A',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/agdex_io',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/agdex-io'],
    },
  },
];
