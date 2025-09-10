/**
 * PancakeSwap Protocol Definition
 */

import { PositionType, type ProtocolDefinition, ProtocolType } from "../types";

export const PancakeSwapProtocol: ProtocolDefinition = {
  metadata: {
    id: "pancakeswap",
    name: "PancakeSwap",
    displayName: "PancakeSwap",
    type: ProtocolType.DEX,
    logo: "/icons/protocols/pancake.webp",
    website: "https://aptos.pancakeswap.finance",
    tags: ["dex", "amm", "swap", "farming"],
    riskLevel: "low",
    auditStatus: "audited",
  },

  addresses: [
    "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa",
    "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b",
  ],

  patterns: {
    resources: [
      {
        pattern: /pancake::pair::PairInfo</,
        positionType: PositionType.LP,
        priority: 100,
        extractAssets: (data) => [
          {
            address: (data as any).type,
            symbol: "CAKE-LP",
            decimals: 8,
            amount: (data as any)?.data?.balance || "0",
          },
        ],
      },
      {
        pattern: /pancake::masterchef::UserInfo</,
        positionType: PositionType.FARMING,
        priority: 90,
        extractAssets: (data) => [
          {
            address: (data as any).type,
            symbol: "CAKE-FARM",
            decimals: 8,
            amount: (data as any)?.data?.amount || "0",
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
      {
        pattern: /stake/,
        activity: "farm_stake",
        description: "Stake LP tokens",
      },
      {
        pattern: /harvest/,
        activity: "harvest",
        description: "Harvest rewards",
      },
    ],
  },

  version: "1.0.0",
  lastUpdated: "2024-01-20",
};
