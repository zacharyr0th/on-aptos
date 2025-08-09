import type { DefiProtocol } from "../types";
import { LaunchpadImplementation } from "../types";

// Launchpad protocols
export const launchpadProtocols: DefiProtocol[] = [
  {
    title: "Pump",
    href: "https://pump.uptos.xyz",
    description: "defi:protocol_descriptions.Pump",
    category: "Trading",
    subcategory: "Launchpad",
    implementation: LaunchpadImplementation.FAIR_LAUNCH,
    status: "Active",
    color: "from-purple-500 to-violet-500",
    logo: "/icons/protocols/pump-uptos.webp",
    networks: ["mainnet"],
    security: {
      auditStatus: "Unaudited",
    },
    tvl: {
      current: "N/A",
    },
    external: {
      socials: {
        twitter: "https://twitter.com/UPTOS_APT",
      },
    },
  },
];
