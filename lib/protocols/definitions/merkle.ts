/**
 * Merkle Trade Protocol Definition
 */

import { PositionType, type ProtocolDefinition, ProtocolType } from "../types";

export const MerkleProtocol: ProtocolDefinition = {
  metadata: {
    id: "merkle",
    name: "Merkle Trade",
    displayName: "Merkle",
    type: ProtocolType.DERIVATIVES,
    logo: "/icons/protocols/merkle.webp",
    website: "https://merkle.trade",
    tags: ["derivatives", "perp", "trading"],
    riskLevel: "high",
    auditStatus: "audited",
  },

  addresses: ["0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06"],

  patterns: {
    resources: [
      // House LP positions (MKLP tokens)
      {
        pattern: /::house_lp::MKLP</,
        positionType: PositionType.LP,
        priority: 110,
        extractAssets: (data) => {
          // MKLP tokens are fungible assets, need separate query
          return [];
        },
        extractMetadata: (data) => ({
          lpType: "house_lp",
          protocolName: "Merkle Trade",
          requiresFungibleAssetQuery: true,
          faAddress: (data as any).type, // Store the FA address for later query
          positionType: "Liquidity Provider",
          protocol: "Merkle",
          isDerivatives: true,
        }),
      },
      // User withdraw info
      {
        pattern: /::house_lp::UserWithdrawInfo/,
        positionType: PositionType.LP,
        priority: 105,
        extractAssets: (data) => {
          const withdrawAmount = (data as any)?.withdraw_amount || "0";
          if (withdrawAmount === "0") return [];

          // Extract the underlying asset from the type
          const typeMatch = (data as any).type?.match(/MKLP<([^>]+)>/);
          const underlyingAsset = typeMatch
            ? typeMatch[1]
            : "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";

          return [
            {
              address: underlyingAsset,
              symbol: "USDC", // Pending withdrawals are in USDC
              decimals: 6,
              amount: (parseFloat(withdrawAmount) / 10 ** 6).toString(), // Convert from raw to decimal
            },
          ];
        },
        extractMetadata: (data) => ({
          withdrawPending: true,
          withdrawAmount: (data as any)?.withdraw_amount || "0",
          withdrawLimit: (data as any)?.withdraw_limit || "0",
          lastResetTimestamp: (data as any)?.last_withdraw_reset_timestamp,
          withdrawAvailable: (data as any)?.withdraw_amount || "0",
          protocolName: "Merkle Trade",
          positionType: "Pending Withdrawal",
          timeUntilWithdraw: calculateTimeUntilWithdraw(
            (data as any)?.last_withdraw_reset_timestamp
          ),
        }),
      },
      // Protocol rewards
      {
        pattern: /::protocol_reward::UserRewardInfo/,
        positionType: PositionType.FARMING,
        priority: 100,
        extractAssets: (data) => {
          // Protocol rewards need additional queries to get claimable amounts
          return [];
        },
        extractMetadata: (data) => ({
          rewardType: "protocol_reward",
          claimedEpochs: (data as any)?.claimed_epoch || [],
          requiresRewardQuery: true,
          lastClaimedEpoch: (data as any)?.claimed_epoch?.slice(-1)[0],
          protocolName: "Merkle Trade",
          positionType: "Rewards",
        }),
      },
      // Original LP pool pattern (keeping for backward compatibility)
      {
        pattern: /merkle_trade::lp_pool::LPCoin/,
        positionType: PositionType.DERIVATIVE,
        priority: 90,
        extractAssets: (data) => [
          {
            address:
              "0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06::merkle_trade::MKLP",
            symbol: "MKLP",
            decimals: 8,
            amount: (data as any)?.data?.value || "0",
          },
        ],
      },
    ],

    transactions: [
      {
        pattern: /open_position/,
        activity: "open_position",
        description: "Open position",
      },
      {
        pattern: /close_position/,
        activity: "close_position",
        description: "Close position",
      },
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

// Helper function for withdrawal time calculation
function calculateTimeUntilWithdraw(lastResetTimestamp?: string) {
  if (!lastResetTimestamp) return null;
  const resetTime = parseInt(lastResetTimestamp) * 1000;
  const now = Date.now();
  const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
  const timeRemaining = resetTime + cooldownPeriod - now;
  return timeRemaining > 0 ? timeRemaining : 0;
}
