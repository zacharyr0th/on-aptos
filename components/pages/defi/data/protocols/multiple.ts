import type { DefiProtocol } from '../types';
import { MultipleImplementation } from '../types';

// Multi-category protocols (Protocol suites offering multiple DeFi services)
export const multipleProtocols: DefiProtocol[] = [
  {
    title: 'Thala',
    href: 'https://app.thala.fi',
    description: 'defi:protocol_descriptions.Thala',
    category: 'Multiple',
    subcategory: 'DEX, LST, CDP',
    categoryBreakdown: 'defi:protocol_category_breakdown.Thala',
    implementation: MultipleImplementation.PROTOCOL_SUITE,
    status: 'Active',
    color: 'from-blue-500 to-cyan-500',
    logo: '/icons/protocols/thala.avif',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Audited',
    },
    tvl: {
      current: '$50M+',
    },
    token: {
      governanceToken: 'THL',
      governanceTokenSymbol: 'THL',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/ThalaLabs',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/ThalaLabs'],
    },
  },
];
