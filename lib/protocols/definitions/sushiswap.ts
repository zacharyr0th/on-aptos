/**
 * SushiSwap Protocol Definition
 */

import { PositionType, type ProtocolDefinition, ProtocolType } from "../types";

export const SushiSwapProtocol: ProtocolDefinition = {
  metadata: {
    id: "sushiswap",
    name: "SushiSwap",
    displayName: "SushiSwap",
    type: ProtocolType.DEX,
    logo: "/icons/protocols/sushi.webp",
    website: "https://sushi.com",
    tags: ["dex", "amm", "swap"],
    riskLevel: "low",
    auditStatus: "audited",
  },

  addresses: ["0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c"],

  patterns: {
    resources: [
      {
        pattern: /sushiswap::swap::LPToken</,
        positionType: PositionType.LP,
        priority: 100,
        extractAssets: (data) => [
          {
            address: (data as any).type,
            symbol: "SUSHI-LP",
            decimals: 8,
            amount: (data as any)?.data?.value || "0",
          },
        ],
      },
    ],

    transactions: [
      { pattern: /swap/, activity: "swap", description: "Token swap" },
      {
        pattern: /add_liquidity/,
        activity: "liquidity_add",
        description: "Add liquidity",
      },
      {
        pattern: /remove_liquidity/,
        activity: "liquidity_remove",
        description: "Remove liquidity",
      },
    ],
  },

  version: "1.0.0",
  lastUpdated: "2024-01-20",
};
