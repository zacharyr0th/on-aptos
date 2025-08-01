import type { DefiProtocol } from "../types";
import {
  YieldAggregatorImplementation,
  LiquidStakingImplementation,
  LeveragedFarmingImplementation,
  LiquidityManagerImplementation,
} from "../types";

// Yield farming and staking protocols
export const yieldProtocols: DefiProtocol[] = [
  // LIQUID STAKING
  {
    title: "TruFin",
    href: "https://trufin.io",
    description: "defi:protocol_descriptions.TruFin",
    category: "Yield",
    subcategory: "Liquid Staking",
    implementation: LiquidStakingImplementation.VALIDATOR_DELEGATED,
    status: "Active",
    color: "from-blue-500 to-indigo-500",
    logo: "/icons/protocols/trufin.webp",
    networks: ["mainnet"],
    security: {
      auditStatus: "Audited",
    },
    tvl: {
      current: "$72M",
    },
    yields: {
      current: ["7-10%"],
    },
    external: {
      socials: {
        twitter: "https://twitter.com/TruFinProtocol",
      },
    },
    integration: {
      smartContractLinks: ["https://github.com/TruFin-io"],
    },
  },
  {
    title: "Amnis",
    href: "https://amnis.finance",
    description: "defi:protocol_descriptions.Amnis",
    category: "Yield",
    subcategory: "Liquid Staking",
    implementation: LiquidStakingImplementation.VALIDATOR_DELEGATED,
    status: "Active",
    color: "from-teal-500 to-cyan-500",
    logo: "/icons/protocols/amnis.avif",
    networks: ["mainnet"],
    security: {
      auditStatus: "Audited",
    },
    tvl: {
      current: "$35M+",
    },
    yields: {
      current: ["8.5%"],
    },
    external: {
      socials: {
        twitter: "https://twitter.com/AmnisFinance",
      },
    },
    integration: {
      smartContractLinks: ["https://github.com/amnis-finance"],
    },
  },
  {
    title: "Kofi",
    href: "https://kofi.finance",
    description: "defi:protocol_descriptions.Kofi",
    category: "Yield",
    subcategory: "Liquid Staking",
    implementation: LiquidStakingImplementation.VALIDATOR_DELEGATED,
    status: "Active",
    color: "from-teal-500 to-cyan-500",
    logo: "/icons/protocols/kofi.avif",
    networks: ["mainnet"],
    security: {
      auditStatus: "Unaudited",
    },
    tvl: {
      current: "N/A",
    },
    external: {
      socials: {
        twitter: "https://twitter.com/kofi_finance",
      },
    },
    integration: {
      smartContractLinks: ["https://github.com/kofifinance"],
    },
  },

  // LIQUIDITY MANAGER
  {
    title: "Ichi",
    href: "https://ichi.org",
    description: "defi:protocol_descriptions.Ichi",
    category: "Yield",
    subcategory: "Liquidity Manager",
    implementation: LiquidityManagerImplementation.RANGE_ORDERS,
    status: "Active",
    color: "from-yellow-500 to-orange-500",
    logo: "/icons/protocols/ichi.jpg",
    networks: ["mainnet"],
    security: {
      auditStatus: "Audited",
    },
    tvl: {
      current: "N/A",
    },
    token: {
      governanceToken: "ICHI",
      governanceTokenSymbol: "ICHI",
    },
    external: {
      socials: {
        twitter: "https://twitter.com/ICHIFoundation",
      },
    },
    integration: {
      smartContractLinks: ["https://github.com/ichifarm"],
    },
  },

  // YIELD AGGREGATOR
  {
    title: "Vibrant X",
    href: "https://vibrantx.finance",
    description: "defi:protocol_descriptions.VibrantX",
    category: "Yield",
    subcategory: "Yield Aggregator",
    implementation: YieldAggregatorImplementation.MULTI_PROTOCOL,
    status: "Active",
    color: "from-green-500 to-yellow-500",
    logo: "/icons/protocols/vibrantx.png",
    networks: ["mainnet"],
    security: {
      auditStatus: "Unaudited",
    },
    tvl: {
      current: "N/A",
    },
    external: {
      socials: {
        twitter: "https://twitter.com/VibrantXFinance",
      },
    },
  },

  // LEVERAGED FARMING
  {
    title: "Moar",
    href: "https://moar.market",
    description: "defi:protocol_descriptions.Moar",
    category: "Yield",
    subcategory: "Leveraged Farming",
    implementation: LeveragedFarmingImplementation.BORROWING_BASED,
    status: "Active",
    color: "from-yellow-500 to-green-500",
    logo: "/icons/protocols/moar.webp",
    networks: ["mainnet"],
    security: {
      auditStatus: "Unaudited",
    },
    tvl: {
      current: "N/A",
    },
    external: {
      socials: {
        twitter: "https://twitter.com/MoarMarket",
      },
    },
    integration: {
      smartContractLinks: ["https://github.com/moar-market"],
    },
  },
];
