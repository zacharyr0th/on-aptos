/**
 * Service for fetching fungible asset balances from Aptos
 */

import { serviceLogger } from "@/lib/utils/core/logger";

const APTOS_GRAPHQL_ENDPOINT = "https://api.mainnet.aptoslabs.com/v1/graphql";

interface FungibleAssetBalance {
  asset_type: string;
  amount: number;
  metadata?: {
    symbol: string;
    name: string;
    decimals: number;
    asset_type: string;
  };
}

export class FungibleAssetService {
  /**
   * Fetch fungible asset balances for a wallet
   */
  static async getBalances(walletAddress: string): Promise<FungibleAssetBalance[]> {
    const query = `
      query GetFungibleAssetBalances($owner_address: String!) {
        current_fungible_asset_balances(
          where: {
            owner_address: {_eq: $owner_address}
            amount: {_gt: 0}
          }
        ) {
          asset_type
          amount
          metadata {
            symbol
            name
            decimals
            asset_type
          }
        }
      }
    `;

    try {
      const response = await fetch(APTOS_GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.APTOS_BUILD_SECRET && {
            Authorization: `Bearer ${process.env.APTOS_BUILD_SECRET}`,
          }),
        },
        body: JSON.stringify({
          query,
          variables: { owner_address: walletAddress },
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      return result.data?.current_fungible_asset_balances || [];
    } catch (error) {
      serviceLogger.error("Failed to fetch fungible asset balances", {
        walletAddress,
        error,
      });
      return [];
    }
  }

  /**
   * Get balance for a specific fungible asset
   */
  static async getBalance(
    walletAddress: string,
    assetType: string
  ): Promise<FungibleAssetBalance | null> {
    const balances = await FungibleAssetService.getBalances(walletAddress);
    return balances.find((b) => b.asset_type === assetType) || null;
  }

  /**
   * Get MKLP balances specifically
   */
  static async getMKLPBalances(walletAddress: string): Promise<FungibleAssetBalance[]> {
    const balances = await FungibleAssetService.getBalances(walletAddress);
    return balances.filter(
      (b) => b.asset_type.includes("house_lp::MKLP") || b.asset_type.includes("mklp::MKLP")
    );
  }

  /**
   * Extract FA address from resource type
   */
  static extractFAAddress(resourceType: string): string | null {
    // Extract the FA address from patterns like:
    // 0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06::house_lp::MKLP<...>
    const match = resourceType.match(/(0x[a-f0-9]+::[^<]+)/);
    return match ? match[1] : null;
  }
}
