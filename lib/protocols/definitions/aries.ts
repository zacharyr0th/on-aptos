/**
 * Aries Markets Protocol Definition
 */

import { ProtocolDefinition, ProtocolType, PositionType } from "../types";

export const AriesProtocol: ProtocolDefinition = {
  metadata: {
    id: "aries",
    name: "Aries Markets",
    displayName: "Aries",
    type: ProtocolType.LENDING,
    logo: "/icons/protocols/aries.avif",
    website: "https://ariesmarkets.xyz",
    tags: ["lending", "borrowing", "defi"],
    riskLevel: "medium",
    auditStatus: "audited",
  },

  addresses: [
    "0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3",
  ],

  patterns: {
    resources: [
      // Supplied positions
      {
        pattern: /::lending_pool::|::pool::UserReserve/,
        positionType: PositionType.LENDING_SUPPLY,
        priority: 100,
        extractAssets: (data) => {
          const amount = data?.supplied_amount || data?.deposit_amount || "0";
          if (amount === "0") return [];

          // Extract actual asset type from the resource type
          const assetMatch = data.type?.match(/<([^>]+)>/);
          const assetType = assetMatch ? assetMatch[1] : data.type;

          return [
            {
              address: assetType,
              symbol: extractSymbol(assetType),
              decimals: 8,
              amount,
            },
          ];
        },
        extractMetadata: (data) => ({
          supplyApy: data?.supply_apy
            ? parseFloat(data.supply_apy) / 100
            : undefined,
          totalSupplied: data?.supplied_amount,
          protocolName: "Aries Markets",
          positionType: "Lending Supply",
        }),
      },
      // Borrowed positions
      {
        pattern: /::lending_pool::|::pool::UserReserve/,
        positionType: PositionType.LENDING_BORROW,
        priority: 100,
        extractAssets: (data) => {
          const amount = data?.borrowed_amount || data?.debt_amount || "0";
          if (amount === "0") return [];

          // Extract actual asset type from the resource type
          const assetMatch = data.type?.match(/<([^>]+)>/);
          const assetType = assetMatch ? assetMatch[1] : data.type;

          return [
            {
              address: assetType,
              symbol: extractSymbol(assetType),
              decimals: 8,
              amount,
            },
          ];
        },
        extractMetadata: (data) => ({
          borrowApy: data?.borrow_apy
            ? parseFloat(data.borrow_apy) / 100
            : undefined,
          totalBorrowed: data?.borrowed_amount,
          healthFactor: data?.health_factor,
          protocolName: "Aries Markets",
          positionType: "Lending Borrow",
        }),
      },
    ],

    transactions: [
      {
        pattern: /supply|deposit/,
        activity: "supply",
        description: "Supply to Aries",
      },
      {
        pattern: /withdraw/,
        activity: "withdraw",
        description: "Withdraw from Aries",
      },
      {
        pattern: /borrow/,
        activity: "borrow",
        description: "Borrow from Aries",
      },
      { pattern: /repay/, activity: "repay", description: "Repay to Aries" },
      {
        pattern: /liquidate/,
        activity: "liquidation",
        description: "Liquidation on Aries",
      },
    ],
  },

  version: "1.0.0",
  lastUpdated: "2024-01-20",
};

// Helper to extract symbol from asset type
function extractSymbol(assetType: string) {
  const match = assetType.match(/::([^:]+)$/);
  return match ? match[1].toUpperCase() : "UNKNOWN";
}
