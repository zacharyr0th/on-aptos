import { DEFI_PROTOCOL_COLORS } from "@/lib/constants/ui/colors";
import type { DefiProtocol } from "../types";
import {
  LeveragedFarmingImplementation,
  LiquidityManagerImplementation,
  LiquidStakingImplementation,
  YieldAggregatorImplementation,
} from "../types";

// Yield farming and staking protocols
export const yieldProtocols: DefiProtocol[] = [
  // LIQUID STAKING
  {
    title: "TruFin",
    href: "https://www.trufin.io",
    description: "defi:protocol_descriptions.TruFin",
    category: "Yield",
    subcategory: "Liquid Staking",
    implementation: LiquidStakingImplementation.VALIDATOR_DELEGATED,
    status: "Active",
    color: DEFI_PROTOCOL_COLORS.yield,
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
    color: DEFI_PROTOCOL_COLORS.yield,
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
    color: DEFI_PROTOCOL_COLORS.yield,
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
    color: DEFI_PROTOCOL_COLORS.yield,
    logo: "/icons/protocols/ichi.webp",
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
  {
    title: "Goblin",
    href: "https://linktr.ee/goblin_official",
    description: "defi:protocol_descriptions.GoblinFinance",
    category: "Yield",
    subcategory: "Liquidity Manager",
    implementation: LiquidityManagerImplementation.RANGE_ORDERS,
    status: "Active",
    color: DEFI_PROTOCOL_COLORS.yield,
    logo: "/icons/protocols/goblin.webp",
    networks: ["mainnet"],
    security: {
      auditStatus: "In Progress",
    },
    tvl: {
      current: "N/A",
    },
    external: {
      socials: {
        twitter: "https://twitter.com/the_goblin_fi",
      },
    },
  },

  // YIELD AGGREGATOR

  // LEVERAGED FARMING
  {
    title: "Moar",
    href: "https://moar.market",
    description: "defi:protocol_descriptions.Moar",
    category: "Yield",
    subcategory: "Leveraged Farming",
    implementation: LeveragedFarmingImplementation.BORROWING_BASED,
    status: "Active",
    color: DEFI_PROTOCOL_COLORS.yield,
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
