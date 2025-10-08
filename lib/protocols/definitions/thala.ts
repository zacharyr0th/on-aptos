/**
 * Thala Protocol Definition
 */

import { ProtocolType } from "@/lib/types/defi";
import { PositionType, type ProtocolDefinition } from "../types";

export const ThalaProtocol: ProtocolDefinition = {
  metadata: {
    id: "thala",
    name: "Thala",
    displayName: "Thala Labs",
    type: ProtocolType.DEX,
    logo: "/icons/protocols/thala.avif",
    website: "https://www.thala.fi",
    docs: "https://docs.thala.fi",
    twitter: "https://twitter.com/ThalaLabs",
    tags: ["dex", "amm", "stable-pool", "weighted-pool", "cdp", "mod"],
    riskLevel: "low",
    auditStatus: "audited",
  },

  addresses: [
    // Main DEX contracts
    "0x48271d39d0b05bd6efca2278f22277d6fcc375504f9839fd73f74ace240861af",
    "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01",
    // Infrastructure
    "0x007730cd28ee1cdc9e999336cbc430f99e7c44397c0aa77516f6f23a78559bb5",
    "0x60955b957956d79bc80b096d3e41bad525dd400d8ce957cdeb05719ed1e4fc26",
    // Farm contracts
    "0x6b3720cd988adeaf721ed9d4730da4324d52364871a68eac62b46d21e4d2fa99",
    "0x3c4a58b4a8dffe6d14448072efcdd5a0e0089a22c6837b94f1d7e8bb1552137f",
  ],

  patterns: {
    resources: [
      // Farming positions
      {
        pattern: /::farming::Staker/,
        positionType: PositionType.FARMING,
        priority: 110,
        extractAssets: (data) => {
          // Farming positions require additional queries to get actual balances
          // Return empty array if no direct balance available
          if (!(data as any)?.pool_info) return [];
          return [];
        },
        extractMetadata: (data) => ({
          farmingPosition: true,
          poolHandle: (data as any)?.pool_info?.handle,
          poolId: (data as any)?.pool_info?.id,
          requiresAdditionalQuery: true,
          protocolName: "Thala Labs",
          positionType: "Farm",
        }),
      },
      // Farming vesting positions
      {
        pattern: /::farming_vesting::VestingBeneficiary/,
        positionType: PositionType.FARMING,
        priority: 105,
        extractAssets: (data) => {
          const escrowValue = (data as any)?.escrow?.value || "0";
          if (escrowValue === "0" || !escrowValue) return [];
          return [
            {
              address:
                "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD",
              symbol: "MOD",
              decimals: 8,
              amount: escrowValue,
            },
          ];
        },
        extractMetadata: (data) => ({
          vestingPosition: true,
          claimIds: (data as any)?.claim_ids || [],
          escrowValue: (data as any)?.escrow?.value || "0",
          claimableAmount: (data as any)?.claimable_amount || "0",
          nextClaimTime: (data as any)?.next_claim_time,
          protocolName: "Thala Labs",
          positionType: "Vesting",
        }),
      },
      // Stable pools
      {
        pattern: /::stable_pool::StablePoolToken</,
        positionType: PositionType.LP,
        priority: 100,
        extractAssets: (data) => [
          {
            address: (data as any).type,
            symbol: "THALA-STABLE-LP",
            decimals: 8,
            amount: (data as any)?.coin?.value || "0",
          },
        ],
      },
      // Weighted pools
      {
        pattern: /::weighted_pool::WeightedPoolToken</,
        positionType: PositionType.LP,
        priority: 100,
        extractAssets: (data) => [
          {
            address: (data as any).type,
            symbol: "THALA-WEIGHTED-LP",
            decimals: 8,
            amount: (data as any)?.coin?.value || "0",
          },
        ],
      },
      // MOD stablecoin (CDP)
      {
        pattern: /mod_coin::MOD>/,
        positionType: PositionType.LENDING_BORROW,
        priority: 90,
        extractAssets: (data) => [
          {
            address:
              "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD",
            symbol: "MOD",
            decimals: 8,
            amount: (data as any)?.coin?.value || "0",
          },
        ],
        extractMetadata: (data) => ({
          isStablecoin: true,
          cdpPosition: true,
        }),
      },
      // THL token
      {
        pattern: /thala_coin::ThalaAPT>/,
        positionType: PositionType.TOKEN,
        priority: 80,
        extractAssets: (data) => [
          {
            address: (data as any).type,
            symbol: "THL",
            decimals: 8,
            amount: (data as any)?.coin?.value || "0",
          },
        ],
      },
    ],

    transactions: [
      {
        pattern: /add_liquidity/,
        activity: "liquidity_add",
        description: "Add liquidity to Thala pool",
      },
      {
        pattern: /remove_liquidity/,
        activity: "liquidity_remove",
        description: "Remove liquidity from Thala pool",
      },
      { pattern: /swap/, activity: "swap", description: "Swap on Thala" },
      {
        pattern: /mint_mod/,
        activity: "mint",
        description: "Mint MOD stablecoin",
      },
      {
        pattern: /burn_mod/,
        activity: "burn",
        description: "Burn MOD stablecoin",
      },
      { pattern: /stake/, activity: "stake", description: "Stake THL tokens" },
      {
        pattern: /claim/,
        activity: "claim_rewards",
        description: "Claim Thala rewards",
      },
    ],
  },

  version: "1.0.0",
  lastUpdated: "2024-01-20",
};
