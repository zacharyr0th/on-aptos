/**
 * Thala Liquid Staking Protocol Definition
 */

import { ProtocolType } from "@/lib/types/defi";
import { PositionType, type ProtocolDefinition } from "../types";

export const ThalaLSDProtocol: ProtocolDefinition = {
  metadata: {
    id: "thala-lsd",
    name: "Thala Liquid Staking",
    displayName: "Thala LSD",
    type: ProtocolType.LIQUID_STAKING,
    logo: "/icons/protocols/thala.avif",
    website: "https://app.thala.fi/liquid-staking",
    tags: ["liquid-staking", "staking", "lst"],
    riskLevel: "low",
    auditStatus: "audited",
  },

  addresses: ["0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6"],

  patterns: {
    resources: [
      {
        pattern: /thala_lsd::staking::ThalaAPT/,
        positionType: PositionType.STAKING,
        priority: 100,
        extractAssets: (data) => [
          {
            address:
              "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT",
            symbol: "thAPT",
            decimals: 8,
            amount: (data as any)?.data?.balance || "0",
          },
        ],
      },
    ],

    transactions: [
      { pattern: /stake/, activity: "stake", description: "Stake APT" },
      { pattern: /unstake/, activity: "unstake", description: "Unstake APT" },
      {
        pattern: /claim/,
        activity: "claim_rewards",
        description: "Claim rewards",
      },
    ],
  },

  version: "1.0.0",
  lastUpdated: "2024-01-20",
};
