/**
 * Aries Markets Protocol Definition
 */

import { PositionType, type ProtocolDefinition, ProtocolType } from "../types";

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

  addresses: ["0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3"],

  patterns: {
    resources: [
      // Supplied positions
      {
        pattern: /::lending_pool::|::pool::UserReserve/,
        positionType: PositionType.LENDING_SUPPLY,
        priority: 100,
        extractAssets: (data) => {
          const amount = (data as any)?.supplied_amount || (data as any)?.deposit_amount || "0";
          if (amount === "0") return [];

          // Extract actual asset type from the resource type
          const assetMatch = (data as any).type?.match(/<([^>]+)>/);
          const assetType = assetMatch ? assetMatch[1] : (data as any).type;

          return [
            {
              address: assetType,
              symbol: extractSymbol(assetType),
              decimals: 8,
              amount: String(amount),
            },
          ];
        },
        extractMetadata: (data) => ({
          supplyApy: (data as any)?.supply_apy
            ? parseFloat(String((data as any).supply_apy)) / 100
            : undefined,
          totalSupplied: (data as any)?.supplied_amount,
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
          const amount = (data as any)?.borrowed_amount || (data as any)?.debt_amount || "0";
          if (amount === "0") return [];

          // Extract actual asset type from the resource type
          const assetMatch = (data as any).type?.match(/<([^>]+)>/);
          const assetType = assetMatch ? assetMatch[1] : (data as any).type;

          return [
            {
              address: assetType,
              symbol: extractSymbol(assetType),
              decimals: 8,
              amount: String(amount),
            },
          ];
        },
        extractMetadata: (data) => ({
          borrowApy: (data as any)?.borrow_apy
            ? parseFloat(String((data as any).borrow_apy)) / 100
            : undefined,
          totalBorrowed: (data as any)?.borrowed_amount,
          healthFactor: (data as any)?.health_factor,
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
