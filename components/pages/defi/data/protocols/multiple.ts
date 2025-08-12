import type { DefiProtocol } from "../types";
import { MultipleImplementation } from "../types";

// Multi-category protocols (Protocol suites offering multiple DeFi services)
export const multipleProtocols: DefiProtocol[] = [
  {
    title: "Thala",
    href: "https://app.thala.fi",
    description: "defi:protocol_descriptions.Thala",
    category: "Multiple",
    subcategory: "DEX, LST, CDP",
    categoryBreakdown: "defi:protocol_category_breakdown.Thala",
    implementation: MultipleImplementation.PROTOCOL_SUITE,
    status: "Active",
    color: "from-blue-500 to-cyan-500",
    logo: "/icons/protocols/thala.avif",
    networks: ["mainnet"],
    security: {
      auditStatus: "Audited",
    },
    tvl: {
      current: "$50M+",
    },
    token: {
      governanceToken: "THL",
      governanceTokenSymbol: "THL",
    },
    external: {
      socials: {
        twitter: "https://twitter.com/ThalaLabs",
      },
    },
    integration: {
      smartContractLinks: ["https://github.com/ThalaLabs"],
    },
  },
  {
    title: "Thetis",
    href: "https://thetis.market",
    description: "defi:protocol_descriptions.Thetis",
    category: "Multiple",
    subcategory: "DEX Aggregator, Perps",
    categoryBreakdown: "defi:protocol_category_breakdown.Thetis",
    implementation: MultipleImplementation.PROTOCOL_SUITE,
    status: "Active",
    color: "from-purple-500 to-pink-500",
    logo: "/icons/protocols/thetis.webp",
    networks: ["mainnet"],
    security: {
      auditStatus: "Unaudited",
    },
    tvl: {
      current: "N/A",
    },
    external: {
      socials: {
        twitter: "https://twitter.com/ThetisMarket",
      },
    },
  },
];
