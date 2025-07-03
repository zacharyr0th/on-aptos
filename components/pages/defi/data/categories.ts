import type { TranslatableString } from './types';

// DeFi Category Definitions - Using translation keys and descriptions
export const categoryDefinitions = {
  Credit: {
    description: {
      en: 'Protocols focused on lending, borrowing, and credit markets',
      es: 'Protocolos enfocados en préstamos, empréstitos y mercados de crédito',
    } as TranslatableString,
    subcategories: {
      Lending: {
        en: 'Traditional lending and borrowing protocols',
        es: 'Protocolos tradicionales de préstamos y empréstitos',
      } as TranslatableString,
      'RWA Lending': {
        en: 'Real-world asset backed lending',
        es: 'Préstamos respaldados por activos del mundo real',
      } as TranslatableString,
      'NFT Lending': {
        en: 'NFT collateralized lending protocols',
        es: 'Protocolos de préstamos con garantía NFT',
      } as TranslatableString,
      'Uncollateralized Lending': {
        en: 'Lending without collateral requirements',
        es: 'Préstamos sin requisitos de garantía',
      } as TranslatableString,
      CDP: {
        en: 'Collateralized Debt Position protocols',
        es: 'Protocolos de Posición de Deuda Colateralizada',
      } as TranslatableString,
    },
  },
  Yield: {
    description: {
      en: 'Protocols for earning yield on crypto assets',
      es: 'Protocolos para obtener rendimiento en activos cripto',
    } as TranslatableString,
    subcategories: {
      'Liquid Staking': {
        en: 'Stake tokens while maintaining liquidity',
        es: 'Hacer staking de tokens manteniendo liquidez',
      } as TranslatableString,
      Restaking: {
        en: 'Stake already staked tokens for additional yield',
        es: 'Hacer staking de tokens ya en staking para rendimiento adicional',
      } as TranslatableString,
      'Liquid Restaking': {
        en: 'Liquid version of restaking protocols',
        es: 'Versión líquida de protocolos de restaking',
      } as TranslatableString,
      'Liquidity Manager': {
        en: 'Automated liquidity management protocols',
        es: 'Protocolos de gestión automatizada de liquidez',
      } as TranslatableString,
      'Leveraged Farming': {
        en: 'Yield farming with leverage',
        es: 'Yield farming con apalancamiento',
      } as TranslatableString,
      'Yield Aggregator': {
        en: 'Protocols that optimize yield across multiple platforms',
        es: 'Protocolos que optimizan rendimiento en múltiples plataformas',
      } as TranslatableString,
    },
  },
  Trading: {
    description: {
      en: 'Protocols for trading and exchanging assets',
      es: 'Protocolos para comerciar e intercambiar activos',
    } as TranslatableString,
    subcategories: {
      DEX: {
        en: 'Decentralized exchanges for token trading',
        es: 'Intercambios descentralizados para comercio de tokens',
      } as TranslatableString,
      'DEX Aggregator': {
        en: 'Aggregators that find best prices across DEXs',
        es: 'Agregadores que encuentran mejores precios en DEXs',
      } as TranslatableString,
      Perps: {
        en: 'Perpetual futures trading protocols',
        es: 'Protocolos de comercio de futuros perpetuos',
      } as TranslatableString,
      Options: {
        en: 'Options trading protocols',
        es: 'Protocolos de comercio de opciones',
      } as TranslatableString,
      'Prediction Market': {
        en: 'Markets for predicting future events',
        es: 'Mercados para predecir eventos futuros',
      } as TranslatableString,
      Launchpad: {
        en: 'Token launch and fundraising platforms',
        es: 'Plataformas de lanzamiento de tokens y recaudación de fondos',
      } as TranslatableString,
    },
  },
  Multiple: {
    description: {
      en: 'Protocols offering multiple DeFi services',
      es: 'Protocolos que ofrecen múltiples servicios DeFi',
    } as TranslatableString,
    subcategories: {},
  },
};

// Main categories for filtering
export const categories = ['All', 'Credit', 'Yield', 'Trading', 'Multiple'];

// Helper function to get category translation key
export const getCategoryTranslationKey = (category: string) =>
  `defi:categories.${category}`;

// Helper function to get subcategory translation key
export const getSubcategoryTranslationKey = (
  category: string,
  subcategory: string
) => `defi:categories.${category}.subcategories.${subcategory}`;

// CategoryDefinition type is imported from types.ts
