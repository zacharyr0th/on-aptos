import type { DefiProtocol } from '../types';
import { PerpsImplementation } from '../types';

// Derivatives and Perpetuals protocols
export const derivativesProtocols: DefiProtocol[] = [
  {
    title: 'Mirage',
    href: 'https://mirage.trade',
    description: 'protocols.mirage.description',
    subcategory: 'Perps',
    categoryBreakdown: 'protocols.mirage.categoryBreakdown',
    status: 'Active',
    launchDate: '2025-01-01T00:00:00Z',
    color: '#6366f1',
    logo: '/icons/protocols/mirage.jpg',
    lastUpdated: '2025-07-08T00:00:00Z',
    category: 'Trading',
    implementation: PerpsImplementation.CLOB,
    tags: {
      en: [
        'perpetuals',
        'derivatives',
        'leverage',
        'trading',
        'perps',
        'musd',
        'stablecoin',
        'defi',
      ],
    },
    networks: ['mainnet'],
    blockchainSupported: ['Aptos'],
    isOpenSource: true,
    security: {
      auditStatus: 'In Progress',
      auditFirms: [],
      metrics: {
        auditScore: 85,
        decentralizationScore: 80,
        transparencyScore: 90,
      },
    },
    tvl: {
      current: '$0',
      lastUpdated: '2025-07-08T00:00:00Z',
      source: {
        provider: 'Custom API',
        endpoint: 'https://api.mirage.trade/tvl',
        lastUpdated: '2025-07-08T00:00:00Z',
      },
    },
    volume: {
      daily: '$0',
      total: '$0',
      change24h: '0%',
      change7d: '0%',
      lastUpdated: '2025-07-08T00:00:00Z',
      source: {
        provider: 'Custom API',
        endpoint: 'https://api.mirage.trade/volume',
        lastUpdated: '2025-07-08T00:00:00Z',
      },
    },
    token: {
      governanceToken: 'MIRA',
      governanceTokenSymbol: 'MIRA',
      addresses: {
        aptos: '0x0', // To be updated when available
      },
      lastUpdated: '2025-07-08T00:00:00Z',
      source: {
        provider: 'Custom API',
        lastUpdated: '2025-07-08T00:00:00Z',
      },
    },
    users: '0',
    feeStructure: { en: 'protocols.mirage.feeStructure' },
    integration: {
      smartContractLinks: [],
      deploymentAddresses: [],
      docs: 'https://docs.mirage.trade',
      description: { en: 'protocols.mirage.integration.description' },
    },
    external: {
      socials: {
        twitter: 'https://twitter.com/mirage_protocol',
        discord: 'https://discord.gg/mirage',
        telegram: 'https://t.me/mirage_protocol',
        website: 'https://mirage.trade',
      },
      notableBackers: ['desertstars'],
    },
  },
];
