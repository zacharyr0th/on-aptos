/**
 * Cellana Finance Protocol Definition
 */

import { ProtocolDefinition, ProtocolType, PositionType } from "../types";

export const CellanaProtocol: ProtocolDefinition = {
  metadata: {
    id: "cellana",
    name: "Cellana Finance",
    displayName: "Cellana",
    type: ProtocolType.DEX,
    logo: "/icons/protocols/cellana.webp",
    website: "https://cellana.finance",
    tags: ["dex", "amm", "swap", "launchpad"],
    riskLevel: "medium",
    auditStatus: "audited",
  },

  addresses: [
    "0x488c73a7f27a2917b47f251eb358a0aec19d66a1a32e80a7b7ceaabb00b942dc",
  ],

  patterns: {
    resources: [
      {
        pattern: /cellana::pool::Pool</,
        positionType: PositionType.LP,
        priority: 100,
        extractAssets: (data) => [
          {
            address: data.type,
            symbol: "CELL-LP",
            decimals: 8,
            amount: data?.data?.lp_amount || "0",
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
