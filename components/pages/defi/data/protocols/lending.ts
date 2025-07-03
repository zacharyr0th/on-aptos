import type { DefiProtocol } from '../types';
import { LendingImplementation } from '../types';

// Credit/Lending protocols
export const lendingProtocols: DefiProtocol[] = [
  {
    title: 'Aries',
    href: 'https://ariesmarkets.xyz',
    description: 'defi:protocol_descriptions.Aries',
    category: 'Credit',
    subcategory: 'Lending',
    implementation: LendingImplementation.MONEY_MARKET,
    status: 'Active',
    color: 'from-red-500 to-pink-500',
    logo: '/icons/protocols/aries.avif',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Audited',
    },
    tvl: {
      current: 'Real-time',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/AriesMarkets',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/Aries-Markets'],
    },
  },
  {
    title: 'Superposition',
    href: 'https://superposition.finance',
    description: 'defi:protocol_descriptions.Superposition',
    category: 'Credit',
    subcategory: 'Lending',
    implementation: LendingImplementation.MONEY_MARKET,
    status: 'Active',
    color: 'from-cyan-500 to-blue-500',
    logo: '/icons/protocols/superposition.webp',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Unaudited',
    },
    tvl: {
      current: 'N/A',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/superp_fi',
      },
    },
    integration: {
      smartContractLinks: [
        'https://github.com/zxk0029/superposition-finance-aptos-sdk',
      ],
    },
  },
  {
    title: 'Joule',
    href: 'https://joule.finance',
    description: 'defi:protocol_descriptions.Joule',
    category: 'Credit',
    subcategory: 'Lending',
    implementation: LendingImplementation.ISOLATED_POOLS,
    status: 'Active',
    color: 'from-orange-500 to-red-500',
    logo: '/icons/protocols/joule.webp',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Unaudited',
    },
    tvl: {
      current: 'N/A',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/JouleFinance',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/joule-labs'],
    },
  },
  {
    title: 'Echelon',
    href: 'https://echelon.market',
    description: 'defi:protocol_descriptions.Echelon',
    category: 'Credit',
    subcategory: 'Lending',
    implementation: LendingImplementation.ISOLATED_POOLS,
    status: 'Active',
    color: 'from-indigo-500 to-blue-500',
    logo: '/icons/protocols/echelon.avif',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Audited',
    },
    tvl: {
      current: '$270M',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/EchelonMarket',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/EchelonMarket'],
        },
  },
  {
    title: 'Meso',
    href: 'https://meso.finance',
    description: 'defi:protocol_descriptions.Meso',
    category: 'Credit',
    subcategory: 'Lending',
    implementation: LendingImplementation.MONEY_MARKET,
    status: 'Active',
    color: 'from-violet-500 to-purple-500',
    logo: '/icons/protocols/meso.webp',
    networks: ['mainnet'],
    security: {
      auditStatus: 'Unaudited',
    },
    tvl: {
      current: 'N/A',
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/Meso_Finance',
      },
    },
    integration: {
      smartContractLinks: ['https://github.com/MesoFinance'],
    },
  },
];
