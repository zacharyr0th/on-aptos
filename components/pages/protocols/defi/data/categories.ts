import type { TranslatableString } from "./types";

// DeFi Category Definitions - Using translation keys and descriptions
export const categoryDefinitions = {
  Credit: {
    description: {
      en: "Protocols focused on lending, borrowing, and credit markets",
      es: "Protocolos enfocados en préstamos, empréstitos y mercados de crédito",
    } as TranslatableString,
    sortOrder: 1,
    subcategories: {
      Lending: {
        en: "Traditional lending and borrowing protocols",
        es: "Protocolos tradicionales de préstamos y empréstitos",
      } as TranslatableString,
      "RWA Lending": {
        en: "Real-world asset backed lending",
        es: "Préstamos respaldados por activos del mundo real",
      } as TranslatableString,
      "NFT Lending": {
        en: "NFT collateralized lending protocols",
        es: "Protocolos de préstamos con garantía NFT",
      } as TranslatableString,
      "Uncollateralized Lending": {
        en: "Lending without collateral requirements",
        es: "Préstamos sin requisitos de garantía",
      } as TranslatableString,
      CDP: {
        en: "Collateralized Debt Position protocols",
        es: "Protocolos de Posición de Deuda Colateralizada",
      } as TranslatableString,
    },
    subcategorySortOrder: {
      Lending: 1,
      "RWA Lending": 2,
      "NFT Lending": 3,
      "Uncollateralized Lending": 4,
      CDP: 5,
    },
  },
  Yield: {
    description: {
      en: "Protocols for earning yield on crypto assets",
      es: "Protocolos para obtener rendimiento en activos cripto",
    } as TranslatableString,
    sortOrder: 2,
    subcategories: {
      "Liquid Staking": {
        en: "Stake tokens while maintaining liquidity",
        es: "Hacer staking de tokens manteniendo liquidez",
      } as TranslatableString,
      Restaking: {
        en: "Stake already staked tokens for additional yield",
        es: "Hacer staking de tokens ya en staking para rendimiento adicional",
      } as TranslatableString,
      "Liquid Restaking": {
        en: "Liquid version of restaking protocols",
        es: "Versión líquida de protocolos de restaking",
      } as TranslatableString,
      "Liquidity Manager": {
        en: "Automated liquidity management protocols",
        es: "Protocolos de gestión automatizada de liquidez",
      } as TranslatableString,
      "Leveraged Farming": {
        en: "Yield farming with leverage",
        es: "Yield farming con apalancamiento",
      } as TranslatableString,
      "Yield Aggregator": {
        en: "Protocols that optimize yield across multiple platforms",
        es: "Protocolos que optimizan rendimiento en múltiples plataformas",
      } as TranslatableString,
    },
    subcategorySortOrder: {
      "Liquid Staking": 1,
      Restaking: 2,
      "Liquid Restaking": 3,
      "Liquidity Manager": 4,
      "Leveraged Farming": 5,
      "Yield Aggregator": 6,
    },
  },
  Trading: {
    description: {
      en: "Protocols for trading and exchanging assets",
      es: "Protocolos para comerciar e intercambiar activos",
    } as TranslatableString,
    sortOrder: 3,
    subcategories: {
      DEX: {
        en: "Decentralized exchanges for token trading",
        es: "Intercambios descentralizados para comercio de tokens",
      } as TranslatableString,
      "DEX Aggregator": {
        en: "Aggregators that find best prices across DEXs",
        es: "Agregadores que encuentran mejores precios en DEXs",
      } as TranslatableString,
      Perps: {
        en: "Perpetual futures trading protocols",
        es: "Protocolos de comercio de futuros perpetuos",
      } as TranslatableString,
      Options: {
        en: "Options trading protocols",
        es: "Protocolos de comercio de opciones",
      } as TranslatableString,
      "Prediction Market": {
        en: "Markets for predicting future events",
        es: "Mercados para predecir eventos futuros",
      } as TranslatableString,
      Launchpad: {
        en: "Token launch and fundraising platforms",
        es: "Plataformas de lanzamiento de tokens y recaudación de fondos",
      } as TranslatableString,
    },
    subcategorySortOrder: {
      DEX: 1,
      "DEX Aggregator": 2,
      Perps: 3,
      Options: 4,
      "Prediction Market": 5,
      Launchpad: 6,
    },
  },
  Multiple: {
    description: {
      en: "Protocols offering multiple DeFi services",
      es: "Protocolos que ofrecen múltiples servicios DeFi",
    } as TranslatableString,
    sortOrder: 4,
    subcategories: {},
    subcategorySortOrder: {},
  },
};

// Helper function to get sorted categories
export const getSortedCategories = () => {
  const allCategories = Object.keys(categoryDefinitions);
  const sorted = allCategories.sort((a, b) => {
    const aOrder = categoryDefinitions[a as keyof typeof categoryDefinitions]?.sortOrder || 999;
    const bOrder = categoryDefinitions[b as keyof typeof categoryDefinitions]?.sortOrder || 999;
    return aOrder - bOrder;
  });
  return ["All", ...sorted];
};

// Helper function to get sorted subcategories for a category
export const getSortedSubcategories = (category: string) => {
  const categoryDef = categoryDefinitions[category as keyof typeof categoryDefinitions];
  if (!categoryDef || !categoryDef.subcategories) return [];

  const subcategories = Object.keys(categoryDef.subcategories);
  const sortOrder = categoryDef.subcategorySortOrder as Record<string, number> | undefined;
  return subcategories.sort((a, b) => {
    const aOrder = sortOrder?.[a] || 999;
    const bOrder = sortOrder?.[b] || 999;
    return aOrder - bOrder;
  });
};

// Main categories for filtering (now dynamically sorted)
export const categories = getSortedCategories();

// Helper function to get category translation key
export const getCategoryTranslationKey = (category: string) => `defi:categories.${category}`;

// Helper function to get subcategory translation key
export const getSubcategoryTranslationKey = (category: string, subcategory: string) =>
  `defi:categories.${category}.subcategories.${subcategory}`;

// CategoryDefinition type is imported from types.ts
