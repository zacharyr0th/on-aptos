/**
 * LiquidSwap Protocol Definition
 */

import { ProtocolDefinition, ProtocolType, PositionType } from "../types";

export const LiquidSwapProtocol: ProtocolDefinition = {
  metadata: {
    id: "liquidswap",
    name: "LiquidSwap",
    displayName: "LiquidSwap",
    type: ProtocolType.DEX,
    logo: "/icons/protocols/liquidswap.webp",
    website: "https://liquidswap.com",
    tags: ["dex", "amm", "swap"],
    riskLevel: "low",
    auditStatus: "audited",
  },

  addresses: [
    "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12",
    "0x163df34fccbf003ce219d3f1d9e70d140b60622cb9dd47599c25fb2f797ba6e",
  ],

  patterns: {
    resources: [
      {
        pattern: /liquidswap::liquidity_pool::LiquidityPool</,
        positionType: PositionType.LP,
        priority: 100,
        extractAssets: (data) => {
          const typeMatch = data.type.match(/<(.+), (.+)>/);
          const [token0, token1] = typeMatch
            ? [typeMatch[1], typeMatch[2]]
            : ["", ""];
          return [
            {
              address: data.type,
              symbol: `LP-${token0.split("::").pop()}-${token1.split("::").pop()}`,
              decimals: 8,
              amount: data?.data?.coin_x_reserve || "0",
            },
          ];
        },
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
