/**
 * Amnis Finance Protocol Definition
 */

import { ProtocolType } from "@/lib/types/defi";
import { PositionType, type ProtocolDefinition } from "../types";

export const AmnisProtocol: ProtocolDefinition = {
  metadata: {
    id: "amnis",
    name: "Amnis Finance",
    displayName: "Amnis",
    type: ProtocolType.LIQUID_STAKING,
    logo: "/icons/protocols/amnis.avif",
    website: "https://amnis.finance",
    tags: ["liquid-staking", "staking", "lst"],
    riskLevel: "low",
    auditStatus: "audited",
  },

  addresses: [
    "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a",
    "0x7e783b349d3e89cf5931af376ebeadbfab855b3fa239b7ada8f5a92fbea6b387",
    "0x6f09bf7a232a2159ce8b0af83d641d7bdeda0921f724764e94e4f9b2d7e0d261",
    "0x7893a5d6cd60610f2bad22bb29668e596d14245b682d508a0794ce69613bcaab",
  ],

  patterns: {
    resources: [
      {
        pattern: /amnis::stapt_token::StakedApt/,
        positionType: PositionType.STAKING,
        priority: 100,
        extractAssets: (data) => [
          {
            address:
              "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt",
            symbol: "amAPT",
            decimals: 8,
            amount: (data as any)?.(data as any)?.balance || "0",
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
