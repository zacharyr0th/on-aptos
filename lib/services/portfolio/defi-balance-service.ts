import { z } from "zod";

import { PROTOCOL_ADDRESSES, PROTOCOLS_BY_TYPE } from "@/lib/aptos-constants";
import { getEnvVar } from "@/lib/config/validate-env";
import {
  PROTOCOLS,
  ProtocolType,
  getProtocolByAddress,
} from "@/lib/protocol-registry";
import { graphQLRequest } from "@/lib/utils/fetch-utils";
import { convertRawTokenAmount } from "@/lib/utils/format";
import { logger } from "@/lib/utils/logger";

import { AssetService } from "./services/asset-service";

const INDEXER = "https://indexer.mainnet.aptoslabs.com/v1/graphql";
const APTOS_API_KEY = getEnvVar("APTOS_BUILD_SECRET");

// Token addresses for better parsing
const TOKEN_ADDRESSES = {
  APT: "0x1::aptos_coin::AptosCoin",
  USDC: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
  USDT: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
  THAPT:
    "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT",
  THL: "0x07fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL",
  MOD: "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD",
} as const;

export interface DeFiPosition {
  protocol: string;
  protocolLabel: string;
  protocolType: ProtocolType;
  address: string;
  position: {
    supplied?: {
      asset: string;
      symbol: string;
      amount: string;
      value?: number;
    }[];
    borrowed?: {
      asset: string;
      symbol: string;
      amount: string;
      value?: number;
    }[];
    liquidity?: {
      poolId: string;
      token0: { asset: string; symbol: string; amount: string };
      token1: { asset: string; symbol: string; amount: string };
      lpTokens: string;
      value?: number;
    }[];
    staked?: {
      asset: string;
      symbol: string;
      amount: string;
      rewards?: string;
      value?: number;
    }[];
    derivatives?: {
      asset: string;
      symbol: string;
      amount: string;
      type: "long" | "short" | "option";
      value?: number;
    }[];
  };
  totalValue: number;
}

// Query to get user's table item data for DeFi protocols
const DEFI_TABLE_ITEMS_QUERY = `
  query GetDeFiTableItems($ownerAddress: String!, $tableHandles: [String!]!) {
    table_items(
      where: {
        table_handle: { _in: $tableHandles },
        decoded_key: { _has_key: $ownerAddress }
      }
    ) {
      table_handle
      decoded_key
      decoded_value
      key
      write_set_change_index
      transaction_version
    }
  }
`;

// Query to get user's token balances in specific protocols
const PROTOCOL_BALANCES_QUERY = `
  query GetProtocolBalances($ownerAddress: String!, $protocolAddresses: [String!]!) {
    current_fungible_asset_balances(
      where: {
        owner_address: { _eq: $ownerAddress },
        amount: { _gt: "0" },
        asset_type: { _regex: $protocolAddresses }
      }
    ) {
      amount
      asset_type
      metadata {
        name
        symbol
        decimals
        icon_uri
      }
    }
  }
`;

// Query to get user's coin balances in specific protocols
const PROTOCOL_COIN_BALANCES_QUERY = `
  query GetProtocolCoinBalances($ownerAddress: String!, $protocolAddresses: [String!]!) {
    current_coin_balances(
      where: {
        owner_address: { _eq: $ownerAddress },
        amount: { _gt: "0" },
        coin_type: { _regex: $protocolAddresses }
      }
    ) {
      amount
      coin_type
      coin_info {
        name
        symbol
        decimals
      }
    }
  }
`;

// Query to get user's events related to DeFi protocols
const DEFI_EVENTS_QUERY = `
  query GetDeFiEvents($ownerAddress: String!, $protocolAddresses: [String!]!, $limit: Int!) {
    events(
      where: {
        account_address: { _in: $protocolAddresses },
        data: { _has_key: $ownerAddress }
      }
      order_by: { transaction_version: desc }
      limit: $limit
    ) {
      account_address
      creation_number
      data
      sequence_number
      type
      transaction_version
      transaction_block_height
    }
  }
`;

// Query to get user's resources at specific protocol addresses
const PROTOCOL_RESOURCES_QUERY = `
  query GetProtocolResources($ownerAddress: String!, $resourceTypes: [String!]!) {
    current_account_data(
      where: {
        address: { _eq: $ownerAddress }
      }
    ) {
      account_address
    }
    account_resources: current_account_data(
      where: {
        address: { _eq: $ownerAddress }
      }
    ) {
      account_address
    }
  }
`;

interface DetailedPosition {
  protocol: string;
  protocolAddress: string;
  type:
    | "liquidity"
    | "farming"
    | "lending"
    | "staking"
    | "nft"
    | "derivatives"
    | "other";
  description: string;
  tokens: Array<{
    symbol: string;
    address: string;
    balance: string;
    value?: string;
  }>;
  lpTokens: Array<{
    poolType: string;
    poolTokens: string[];
    balance: string;
    value?: string;
  }>;
  resources: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
  isActive: boolean;
}

interface ComprehensivePositionSummary {
  walletAddress: string;
  positions: DetailedPosition[];
  totalActivePositions: number;
  totalProtocols: number;
  protocolBreakdown: Record<string, number>;
  valueBreakdown: Record<string, string>;
  lastUpdated: string;
}

export class DeFiBalanceService {
  /**
   * Get all DeFi positions for a wallet address using comprehensive position checker
   */
  static async getDeFiPositions(
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    try {
      logger.info(
        `Fetching comprehensive DeFi positions for wallet: ${walletAddress}`,
      );

      // Use comprehensive position checker first (higher data quality)
      const comprehensivePositions =
        await this.getComprehensiveDeFiPositions(walletAddress);

      // Also check wallet assets for tokens that match protocol addresses
      const walletAssetPositions =
        await this.getWalletAssetDeFiPositions(walletAddress);

      // Simple deduplication: comprehensive positions take priority
      const seenKeys = new Set<string>();
      const allPositions: DeFiPosition[] = [];

      // Add comprehensive positions first (higher priority)
      for (const position of comprehensivePositions) {
        const key = `${position.protocol}-${position.address}`;
        seenKeys.add(key);
        allPositions.push(position);
      }

      // Add wallet asset positions only if not already seen
      for (const position of walletAssetPositions) {
        const key = `${position.protocol}-${position.address}`;
        if (!seenKeys.has(key)) {
          allPositions.push(position);
        }
      }

      // Filter out positions with total value less than $0.10 (dust amounts)
      // BUT always include LP tokens regardless of value
      const MIN_DEFI_VALUE_THRESHOLD = 0.1;
      const filteredPositions = allPositions.filter((position) => {
        // Always include LP tokens regardless of value
        if (this.isLPToken(position)) {
          logger.info(
            `Including LP token regardless of value: ${position.protocol} - ${position.position.supplied?.[0]?.symbol || "Unknown"}`,
          );
          return true;
        }

        if (position.totalValue < MIN_DEFI_VALUE_THRESHOLD) {
          logger.info(
            `Filtering out dust DeFi position in ${position.protocol}: $${position.totalValue.toFixed(4)}`,
          );
          return false;
        }
        return true;
      });

      logger.info(
        `Found ${filteredPositions.length} comprehensive DeFi positions (filtered from ${allPositions.length}) for wallet ${walletAddress}`,
      );
      return filteredPositions;
    } catch (error) {
      logger.error("Error fetching DeFi positions:", error);
      throw new Error(
        `Failed to fetch DeFi positions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get DeFi positions using comprehensive position checker
   */
  private static async getComprehensiveDeFiPositions(
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    try {
      const summary = await this.getComprehensivePositions(walletAddress);
      const positions: DeFiPosition[] = [];

      logger.info(
        `Processing ${summary.positions.length} comprehensive positions, ${summary.totalActivePositions} active`,
      );

      // Collect all unique token addresses for price lookup
      const allTokenAddresses = new Set<string>();
      for (const position of summary.positions) {
        if (position.isActive) {
          // Add token addresses and map them to their underlying assets
          position.tokens.forEach((token) => {
            if (token.address) {
              allTokenAddresses.add(token.address);

              // Map complex DeFi tokens to their underlying assets
              const underlyingAsset = this.mapDeFiTokenToUnderlyingAsset(
                token.address,
                token.symbol,
              );
              if (underlyingAsset) {
                allTokenAddresses.add(underlyingAsset);
              }
            }
          });

          // Add common token addresses based on protocol
          if (
            position.protocol.toLowerCase().includes("apt") ||
            position.protocol.toLowerCase().includes("aptos")
          ) {
            allTokenAddresses.add("0x1::aptos_coin::AptosCoin");
          }
        }
      }

      // Get real prices for all tokens
      const priceData = await AssetService.getAssetPrices(
        Array.from(allTokenAddresses),
      );
      const priceMap = new Map(
        priceData
          .filter((p) => p.price !== null)
          .map((p) => [p.assetType, p.price!]),
      );

      logger.info(
        `Fetched prices for ${priceData.length} tokens in DeFi positions`,
      );

      for (const position of summary.positions) {
        // Only include active positions
        if (!position.isActive) continue;

        // Convert comprehensive position to DeFi position format with real prices
        const defiPosition: DeFiPosition = {
          protocol: position.protocol,
          protocolLabel: position.description,
          protocolType: this.mapPositionTypeToProtocolType(position.type),
          address: position.protocolAddress,
          position: this.buildPositionDetailsWithPrices(
            position,
            priceMap || new Map(),
          ),
          totalValue: this.calculatePositionValueWithPrices(
            position,
            priceMap || new Map(),
          ),
        };

        // Include ALL active positions - don't filter by value
        // The comprehensive checker already filters for active positions
        positions.push(defiPosition);

        logger.info(
          `Added position: ${position.protocol} (${position.type}) - Value: $${defiPosition.totalValue.toFixed(2)}`,
        );
      }

      logger.info(`Returning ${positions.length} comprehensive DeFi positions`);
      return positions;
    } catch (error) {
      logger.error("Comprehensive position checker failed:", error);
      throw new Error(
        `Failed to fetch comprehensive DeFi positions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Map position type to protocol type
   */
  private static mapPositionTypeToProtocolType(type: string): ProtocolType {
    switch (type) {
      case "liquidity":
        return ProtocolType.DEX;
      case "farming":
        return ProtocolType.FARMING;
      case "lending":
        return ProtocolType.LENDING;
      case "staking":
        return ProtocolType.LIQUID_STAKING;
      case "nft":
        return ProtocolType.NFT_MARKETPLACE;
      case "derivatives":
        return ProtocolType.DERIVATIVES;
      default:
        return ProtocolType.INFRASTRUCTURE;
    }
  }

  /**
   * Map complex DeFi token addresses to their underlying assets for price lookup
   */
  private static mapDeFiTokenToUnderlyingAsset(
    tokenAddress: string,
    symbol: string,
  ): string | null {
    // Handle wrapped/vault tokens that represent underlying assets

    // APT variants
    if (symbol.toLowerCase().includes("apt")) {
      return "0x1::aptos_coin::AptosCoin";
    }

    // USDC variants
    if (symbol.toLowerCase().includes("usdc")) {
      return "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
    }

    // USDT variants
    if (symbol.toLowerCase().includes("usdt")) {
      return "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
    }

    // Handle specific token patterns
    if (
      tokenAddress.includes("::stapt_token::") ||
      tokenAddress.includes("::StakedApt")
    ) {
      return "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt";
    }

    if (
      tokenAddress.includes("::amapt_token::") ||
      tokenAddress.includes("::AmnisApt")
    ) {
      return "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt";
    }

    if (
      tokenAddress.includes("::thl_coin::") ||
      tokenAddress.includes("::THL")
    ) {
      return "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::thl_coin::THL";
    }

    if (
      tokenAddress.includes("::mod_coin::") ||
      tokenAddress.includes("::MOD")
    ) {
      return "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD";
    }

    // Handle Thala liquid staking tokens
    if (tokenAddress.includes("::staking::ThalaAPT")) {
      return "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT";
    }

    return null;
  }

  /**
   * Get token decimals for proper balance conversion
   */
  private static getTokenDecimals(
    tokenAddress: string,
    symbol: string,
  ): number {
    // Default to 8 decimals for most Aptos tokens
    const defaultDecimals = 8;

    // APT and APT-derived tokens
    if (symbol.toLowerCase().includes("apt")) {
      return 8;
    }

    // USDC and USDT
    if (
      symbol.toLowerCase().includes("usdc") ||
      symbol.toLowerCase().includes("usdt")
    ) {
      return 6;
    }

    // Handle specific token patterns
    if (
      tokenAddress.includes("::stapt_token::") ||
      tokenAddress.includes("::StakedApt")
    ) {
      return 8;
    }

    if (
      tokenAddress.includes("::amapt_token::") ||
      tokenAddress.includes("::AmnisApt")
    ) {
      return 8;
    }

    if (tokenAddress.includes("::aptos_coin::AptosCoin")) {
      return 8;
    }

    return defaultDecimals;
  }

  /**
   * Build position details from comprehensive position (legacy - without prices)
   */
  private static buildPositionDetails(position: any): DeFiPosition["position"] {
    return this.buildPositionDetailsWithPrices(position, new Map());
  }

  /**
   * Build position details from comprehensive position with real prices
   */
  private static buildPositionDetailsWithPrices(
    position: any,
    priceMap: Map<string, number>,
  ): DeFiPosition["position"] {
    const details: DeFiPosition["position"] = {};

    // Handle LP tokens as liquidity positions
    if (position.lpTokens && position.lpTokens.length > 0) {
      details.liquidity = position.lpTokens
        .filter((lp: any) => lp.balance && lp.balance !== "0")
        .map((lp: any) => {
          const balance = parseFloat(lp.balance || "0");
          const price = (priceMap.get(lp.poolTokens[0]) ?? null) || 0; // Use first token price as approximation
          const value = balance * price;

          return {
            poolId: `${lp.poolType}-${lp.poolTokens.join("-")}`,
            token0: {
              asset: lp.poolTokens[0] || "",
              symbol: lp.poolTokens[0] || "",
              amount: lp.balance || "0",
            },
            token1: {
              asset: lp.poolTokens[1] || "",
              symbol: lp.poolTokens[1] || "",
              amount: lp.balance || "0",
            },
            lpTokens: lp.balance || "0",
            value: value,
          };
        });
    }

    // Handle regular tokens based on position type
    if (position.tokens && position.tokens.length > 0) {
      const nonZeroTokens = position.tokens.filter(
        (token: any) => token.balance && token.balance !== "0",
      );

      if (nonZeroTokens.length > 0) {
        const tokenDetails = nonZeroTokens.map((token: any) => {
          const rawBalance = parseFloat(token.balance || "0");
          const decimals = this.getTokenDecimals(token.address, token.symbol);
          const balance = rawBalance / Math.pow(10, decimals);

          // Try to get price from direct address first, then try underlying asset
          let price = priceMap.get(token.address) ?? 0;
          if (price === 0) {
            const underlyingAsset = this.mapDeFiTokenToUnderlyingAsset(
              token.address,
              token.symbol,
            );
            if (underlyingAsset) {
              price = priceMap.get(underlyingAsset) ?? 0;
            }
          }

          const value = balance * price;

          return {
            asset: token.address,
            symbol: token.symbol,
            amount: balance.toString(),
            value: value,
          };
        });

        if (position.type === "staking") {
          details.staked = tokenDetails;
        } else if (position.type === "lending") {
          details.supplied = tokenDetails;
        } else if (position.type === "liquidity") {
          // For DEX positions without explicit LP tokens
          details.supplied = tokenDetails;
        } else {
          // For other position types, add as supplied
          details.supplied = tokenDetails;
        }
      }
    }

    // If no tokens or LP tokens, but position is active, add a placeholder
    if (
      !details.liquidity &&
      !details.staked &&
      !details.supplied &&
      position.isActive
    ) {
      details.supplied = [
        {
          asset: position.protocolAddress,
          symbol: position.protocol,
          amount: "1",
          value: 0.001, // Small value to indicate active position
        },
      ];
    }

    return details;
  }

  /**
   * Calculate position value (legacy - without prices)
   */
  private static calculatePositionValue(position: any): number {
    return this.calculatePositionValueWithPrices(position, new Map());
  }

  /**
   * Calculate position value with real prices
   */
  private static calculatePositionValueWithPrices(
    position: any,
    priceMap: Map<string, number>,
  ): number {
    let totalValue = 0;

    // Calculate value from regular tokens
    if (position.tokens && position.tokens.length > 0) {
      position.tokens.forEach((token: any) => {
        const rawBalance = parseFloat(token.balance || "0");
        const decimals = this.getTokenDecimals(token.address, token.symbol);
        const balance = rawBalance / Math.pow(10, decimals);

        // Try to get price from direct address first, then try underlying asset
        let price = priceMap.get(token.address) ?? 0;
        if (price === 0) {
          const underlyingAsset = this.mapDeFiTokenToUnderlyingAsset(
            token.address,
            token.symbol,
          );
          if (underlyingAsset) {
            price = priceMap.get(underlyingAsset) ?? 0;
          }
        }

        if (balance > 0 && price > 0) {
          totalValue += balance * price;
        }
      });
    }

    // Calculate value from LP tokens
    if (position.lpTokens && position.lpTokens.length > 0) {
      position.lpTokens.forEach((lp: any) => {
        const balance = parseFloat(lp.balance || "0");
        if (balance > 0) {
          // Use first token price as approximation for LP value
          const price = priceMap.get(lp.poolTokens[0]) ?? 0;
          if (price > 0) {
            totalValue += balance * price;
          }
        }
      });
    }

    // If no calculated value, return 0 (will be filtered out if below threshold)
    if (totalValue === 0) {
      return 0;
    }

    return totalValue;
  }

  /**
   * Get DeFi positions from wallet assets that match protocol addresses
   */
  private static async getWalletAssetDeFiPositions(
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    try {
      logger.info(
        `Checking wallet assets for DeFi positions: ${walletAddress}`,
      );

      // Import the getWalletAssets function
      const { AssetService } = await import("./services/asset-service");

      // Get wallet assets (including unverified ones to catch LP tokens)
      const walletAssets = await AssetService.getWalletAssets(walletAddress);
      const positions: DeFiPosition[] = [];

      // Check each asset to see if it matches any protocol addresses
      for (const asset of walletAssets) {
        const assetType = asset.asset_type;

        // Check if this asset type matches any protocol address
        for (const protocol of Object.values(PROTOCOLS)) {
          for (const address of protocol.addresses) {
            if (assetType === address || assetType.includes(address)) {
              // Found a protocol asset
              logger.info(
                `Found protocol asset: ${protocol.name} - ${assetType} (${asset.metadata?.symbol || "UNKNOWN"})`,
              );

              // Create a DeFi position for this asset
              const position: DeFiPosition = {
                protocol: protocol.name,
                protocolLabel: protocol.description || protocol.label,
                protocolType: this.mapProtocolTypeToDefiType(protocol.type),
                address: address,
                position: await this.buildLPTokenPosition(asset, assetType),
                totalValue: asset.value || 0,
              };

              positions.push(position);
              break; // Found a match, no need to check other addresses for this protocol
            }
          }
        }
      }

      logger.info(
        `Found ${positions.length} DeFi positions from wallet assets`,
      );
      return positions;
    } catch (error) {
      logger.error("Error checking wallet assets for DeFi positions:", error);
      throw new Error(
        `Failed to fetch wallet asset DeFi positions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Map ProtocolType to DeFi position type
   */
  private static mapProtocolTypeToDefiType(
    protocolType: ProtocolType,
  ): ProtocolType {
    return protocolType;
  }

  /**
   * Check if a position is an LP token based on symbol or protocol type
   */
  private static isLPToken(position: DeFiPosition): boolean {
    const symbol = position.position.supplied?.[0]?.symbol?.toLowerCase() || "";
    const protocol = position.protocol.toLowerCase();

    return (
      symbol.includes("lp") ||
      symbol.includes("pool") ||
      symbol.includes("thala-lp") ||
      symbol.includes("mklp") ||
      protocol.includes("farm") ||
      protocol.includes("liquidity") ||
      protocol.includes("pool")
    );
  }

  /**
   * Build position details for LP tokens, attempting to extract underlying assets
   */
  private static async buildLPTokenPosition(
    asset: any,
    assetType: string,
  ): Promise<DeFiPosition["position"]> {
    const symbol = asset.metadata?.symbol || "UNKNOWN";
    const isLPToken =
      symbol.toLowerCase().includes("lp") ||
      symbol.toLowerCase().includes("pool");

    if (isLPToken) {
      // Try to extract underlying assets from the LP token
      const underlyingAssets = await this.extractUnderlyingAssets(
        assetType,
        asset,
      );

      if (underlyingAssets.length > 0) {
        return {
          liquidity: [
            {
              poolId: assetType,
              token0: underlyingAssets[0] || {
                asset: "Unknown",
                symbol: "Unknown",
                amount: "0",
              },
              token1: underlyingAssets[1] || {
                asset: "Unknown",
                symbol: "Unknown",
                amount: "0",
              },
              lpTokens: asset.balance?.toString() || "0",
              value: asset.value || 0,
            },
          ],
        };
      }
    }

    // Fallback to regular supplied position
    return {
      supplied: [
        {
          asset: assetType,
          symbol: symbol,
          amount: asset.balance?.toString() || "0",
          value: asset.value || 0,
        },
      ],
    };
  }

  /**
   * Extract underlying assets from LP token (best effort)
   */
  private static async extractUnderlyingAssets(
    assetType: string,
    asset: any,
  ): Promise<Array<{ asset: string; symbol: string; amount: string }>> {
    // For Thala LP tokens, we can make educated guesses based on common patterns
    if (asset.metadata?.symbol === "THALA-LP") {
      // Try to get actual amounts from Thala protocol
      try {
        const underlyingAmounts = await this.getThalaLPTokenAmounts(
          assetType,
          asset.balance,
        );
        if (underlyingAmounts) {
          return underlyingAmounts;
        }
      } catch (error) {
        logger.warn("Failed to get Thala LP token amounts:", error);
      }

      // Fallback to showing the tokens but with TBD amounts
      return [
        { asset: "0x1::aptos_coin::AptosCoin", symbol: "APT", amount: "TBD" },
        {
          asset:
            "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
          symbol: "USDC",
          amount: "TBD",
        },
      ];
    }

    // For other LP tokens, we could parse the asset type or make API calls
    // This is a simplified implementation
    return [];
  }

  /**
   * Get actual underlying token amounts for Thala LP tokens
   */
  private static async getThalaLPTokenAmounts(
    lpTokenAddress: string,
    userLPBalance: number,
  ): Promise<Array<{ asset: string; symbol: string; amount: string }> | null> {
    try {
      // Query the Aptos indexer for the LP token's pool information
      const poolQuery = `
        query GetThalaPoolInfo($lpTokenAddress: String!) {
          current_fungible_asset_balances(
            where: {
              asset_type: { _eq: $lpTokenAddress }
              amount: { _gt: "0" }
            }
            limit: 1
          ) {
            metadata {
              name
              symbol
              decimals
            }
          }
        }
      `;

      // For now, we'll use a simplified approach since getting exact LP amounts
      // requires complex protocol-specific calculations involving:
      // 1. Total LP token supply
      // 2. Pool reserves for each token
      // 3. User's share calculation
      // 4. Proper decimal handling

      // This would require a more sophisticated implementation with direct
      // protocol contract queries or specialized APIs

      logger.info(
        `Attempting to get Thala LP amounts for ${lpTokenAddress}, user balance: ${userLPBalance}`,
      );

      // Return null to indicate we couldn't get exact amounts
      return null;
    } catch (error) {
      logger.warn("Error getting Thala LP token amounts:", error);
      return null;
    }
  }

  /**
   * Legacy method for DeFi positions (preserved for fallback)
   */
  private static async getLegacyDeFiPositions(
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    try {
      logger.info(
        `Fetching legacy DeFi positions for wallet: ${walletAddress}`,
      );

      const positions: DeFiPosition[] = [];

      // Get positions from different protocol types
      const [
        liquidStakingPositions,
        lendingPositions,
        dexPositions,
        farmingPositions,
        derivativesPositions,
        bridgePositions,
      ] = await Promise.allSettled([
        this.getLiquidStakingPositions(walletAddress),
        this.getLendingPositions(walletAddress),
        this.getDexPositions(walletAddress),
        this.getFarmingPositions(walletAddress),
        this.getDerivativesPositions(walletAddress),
        this.getBridgePositions(walletAddress),
      ]);

      // Collect successful results
      [
        liquidStakingPositions,
        lendingPositions,
        dexPositions,
        farmingPositions,
        derivativesPositions,
        bridgePositions,
      ].forEach((result, index) => {
        if (result.status === "fulfilled") {
          positions.push(...result.value);
        } else {
          const protocolTypes = [
            "liquid_staking",
            "lending",
            "dex",
            "farming",
            "derivatives",
            "bridge",
          ];
          logger.warn(
            `Failed to get ${protocolTypes[index]} positions:`,
            result.reason,
          );
        }
      });

      // Filter out positions with total value less than $0.10 (dust amounts)
      const MIN_DEFI_VALUE_THRESHOLD = 0.1;
      const filteredPositions = positions.filter((position) => {
        if (position.totalValue < MIN_DEFI_VALUE_THRESHOLD) {
          logger.debug(
            `Filtering out dust DeFi position in ${position.protocol}: $${position.totalValue.toFixed(4)}`,
          );
          return false;
        }
        return true;
      });

      logger.info(
        `Found ${filteredPositions.length} legacy DeFi positions (filtered from ${positions.length}) for wallet ${walletAddress}`,
      );
      return filteredPositions;
    } catch (error) {
      logger.error("Error fetching legacy DeFi positions:", error);
      throw new Error(
        `Failed to fetch legacy DeFi positions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get liquid staking positions (thAPT, amAPT, TruFin)
   */
  private static async getLiquidStakingPositions(
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];
    const lsProtocols = PROTOCOLS_BY_TYPE.LIQUID_STAKING;

    try {
      // Query for liquid staking token balances
      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
            icon_uri?: string;
          };
        }>;
      }>(
        INDEXER,
        {
          query: `
          query GetLiquidStakingBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                _or: [
                  { asset_type: { _like: "%${PROTOCOLS.THALA_LSD.addresses[0]}%" } },
                  { asset_type: { _like: "%${PROTOCOLS.AMNIS_FINANCE.addresses[0]}%" } },
                  { asset_type: { _like: "%${PROTOCOLS.TRUFIN.addresses[0]}%" } }
                ]
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
                icon_uri
              }
            }
          }
        `,
          variables: { ownerAddress: walletAddress },
        },
        APTOS_API_KEY
          ? {
              headers: {
                Authorization: `Bearer ${APTOS_API_KEY}`,
              },
            }
          : {},
      );

      // Process liquid staking positions
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.LIQUID_STAKING) {
          positions.push({
            protocol: protocol.name,
            protocolLabel: protocol.label,
            protocolType: protocol.type,
            address: balance.asset_type,
            position: {
              staked: [
                {
                  asset: balance.asset_type,
                  symbol: balance.metadata.symbol,
                  amount: balance.amount,
                },
              ],
            },
            totalValue: 0, // Will be calculated with price data
          });
        }
      }
    } catch (error) {
      logger.error("Error fetching liquid staking positions:", error);
    }

    return positions;
  }

  /**
   * Get lending positions (Aries, Aptin, Thala CDP, etc.)
   */
  private static async getLendingPositions(
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      // Query for lending protocol balances and table items
      const lendingAddresses = PROTOCOLS_BY_TYPE.LENDING;
      const addressPattern = lendingAddresses
        .map((addr) => `.*${addr}.*`)
        .join("|");

      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
          };
        }>;
      }>(INDEXER, {
        query: `
          query GetLendingBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                asset_type: { _regex: "${addressPattern}" }
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
              }
            }
          }
        `,
        variables: { ownerAddress: walletAddress },
      });

      // Process lending positions
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.LENDING) {
          const isCollateral =
            balance.metadata.symbol.toLowerCase().includes("a") ||
            balance.metadata.symbol.toLowerCase().includes("supply");
          const isDebt =
            balance.metadata.symbol.toLowerCase().includes("debt") ||
            balance.metadata.symbol.toLowerCase().includes("borrow");

          const position: DeFiPosition = {
            protocol: protocol.name,
            protocolLabel: protocol.label,
            protocolType: protocol.type,
            address: balance.asset_type,
            position: {},
            totalValue: 0,
          };

          if (isCollateral) {
            position.position.supplied = [
              {
                asset: balance.asset_type,
                symbol: balance.metadata.symbol,
                amount: balance.amount,
              },
            ];
          } else if (isDebt) {
            position.position.borrowed = [
              {
                asset: balance.asset_type,
                symbol: balance.metadata.symbol,
                amount: balance.amount,
              },
            ];
          }

          positions.push(position);
        }
      }
    } catch (error) {
      logger.error("Error fetching lending positions:", error);
    }

    return positions;
  }

  /**
   * Get DEX liquidity positions (PancakeSwap, LiquidSwap, etc.)
   */
  private static async getDexPositions(
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const dexAddresses = PROTOCOLS_BY_TYPE.DEX;
      const addressPattern = dexAddresses
        .map((addr) => `.*${addr}.*`)
        .join("|");

      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
          };
        }>;
      }>(INDEXER, {
        query: `
          query GetDexBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                asset_type: { _regex: "${addressPattern}" }
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
              }
            }
          }
        `,
        variables: { ownerAddress: walletAddress },
      });

      // Process DEX positions (LP tokens)
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.DEX) {
          const isLPToken =
            balance.metadata.symbol.toLowerCase().includes("lp") ||
            balance.metadata.symbol.toLowerCase().includes("cake") ||
            balance.metadata.name.toLowerCase().includes("liquidity");

          if (isLPToken) {
            positions.push({
              protocol: protocol.name,
              protocolLabel: protocol.label,
              protocolType: protocol.type,
              address: balance.asset_type,
              position: {
                liquidity: [
                  {
                    poolId: balance.asset_type,
                    token0: { asset: "", symbol: "", amount: "0" },
                    token1: { asset: "", symbol: "", amount: "0" },
                    lpTokens: balance.amount,
                  },
                ],
              },
              totalValue: 0,
            });
          }
        }
      }
    } catch (error) {
      logger.error("Error fetching DEX positions:", error);
    }

    return positions;
  }

  /**
   * Get farming positions (Thala Farm, etc.)
   */
  private static async getFarmingPositions(
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const farmingAddresses = PROTOCOLS_BY_TYPE.FARMING;
      const addressPattern = farmingAddresses
        .map((addr) => `.*${addr}.*`)
        .join("|");

      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
          };
        }>;
      }>(INDEXER, {
        query: `
          query GetFarmingBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                asset_type: { _regex: "${addressPattern}" }
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
              }
            }
          }
        `,
        variables: { ownerAddress: walletAddress },
      });

      // Process farming positions
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.FARMING) {
          positions.push({
            protocol: protocol.name,
            protocolLabel: protocol.label,
            protocolType: protocol.type,
            address: balance.asset_type,
            position: {
              staked: [
                {
                  asset: balance.asset_type,
                  symbol: balance.metadata.symbol,
                  amount: balance.amount,
                },
              ],
            },
            totalValue: 0,
          });
        }
      }
    } catch (error) {
      logger.error("Error fetching farming positions:", error);
    }

    return positions;
  }

  /**
   * Get derivatives positions (Merkle Trade, KanaLabs)
   */
  private static async getDerivativesPositions(
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const derivativesAddresses = PROTOCOLS_BY_TYPE.DERIVATIVES;
      const addressPattern = derivativesAddresses
        .map((addr) => `.*${addr}.*`)
        .join("|");

      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
          };
        }>;
      }>(INDEXER, {
        query: `
          query GetDerivativesBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                asset_type: { _regex: "${addressPattern}" }
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
              }
            }
          }
        `,
        variables: { ownerAddress: walletAddress },
      });

      // Process derivatives positions
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.DERIVATIVES) {
          positions.push({
            protocol: protocol.name,
            protocolLabel: protocol.label,
            protocolType: protocol.type,
            address: balance.asset_type,
            position: {
              derivatives: [
                {
                  asset: balance.asset_type,
                  symbol: balance.metadata.symbol,
                  amount: balance.amount,
                  type: "long", // Default, would need more analysis to determine
                },
              ],
            },
            totalValue: 0,
          });
        }
      }
    } catch (error) {
      logger.error("Error fetching derivatives positions:", error);
    }

    return positions;
  }

  /**
   * Get bridge positions (LayerZero, Wormhole, Celer)
   */
  private static async getBridgePositions(
    walletAddress: string,
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    try {
      const bridgeAddresses = PROTOCOLS_BY_TYPE.BRIDGE;
      const addressPattern = bridgeAddresses
        .map((addr) => `.*${addr}.*`)
        .join("|");

      const response = await graphQLRequest<{
        current_fungible_asset_balances: Array<{
          amount: string;
          asset_type: string;
          metadata: {
            name: string;
            symbol: string;
            decimals: number;
          };
        }>;
      }>(INDEXER, {
        query: `
          query GetBridgeBalances($ownerAddress: String!) {
            current_fungible_asset_balances(
              where: {
                owner_address: { _eq: $ownerAddress },
                amount: { _gt: "0" },
                asset_type: { _regex: "${addressPattern}" }
              }
            ) {
              amount
              asset_type
              metadata {
                name
                symbol
                decimals
              }
            }
          }
        `,
        variables: { ownerAddress: walletAddress },
      });

      // Process bridge positions (typically locked/wrapped tokens)
      for (const balance of response.current_fungible_asset_balances || []) {
        const protocol = getProtocolByAddress(balance.asset_type);
        if (protocol && protocol.type === ProtocolType.BRIDGE) {
          // Bridge tokens are usually considered phantom/locked assets
          // but we still track them for transparency
          positions.push({
            protocol: protocol.name,
            protocolLabel: protocol.label,
            protocolType: protocol.type,
            address: balance.asset_type,
            position: {
              supplied: [
                {
                  asset: balance.asset_type,
                  symbol: balance.metadata.symbol,
                  amount: balance.amount,
                },
              ],
            },
            totalValue: 0,
          });
        }
      }
    } catch (error) {
      logger.error("Error fetching bridge positions:", error);
    }

    return positions;
  }

  /**
   * Get aggregated DeFi statistics for a wallet
   */
  static async getDeFiStats(walletAddress: string): Promise<{
    totalPositions: number;
    totalValueLocked: number;
    protocolBreakdown: Record<ProtocolType, number>;
    topProtocols: Array<{
      protocol: string;
      value: number;
      percentage: number;
    }>;
  }> {
    try {
      const positions = await this.getDeFiPositions(walletAddress);

      const stats = {
        totalPositions: positions.length,
        totalValueLocked: positions.reduce(
          (sum, pos) => sum + pos.totalValue,
          0,
        ),
        protocolBreakdown: {} as Record<ProtocolType, number>,
        topProtocols: [] as Array<{
          protocol: string;
          value: number;
          percentage: number;
        }>,
      };

      // Calculate protocol breakdown
      for (const position of positions) {
        if (!stats.protocolBreakdown[position.protocolType]) {
          stats.protocolBreakdown[position.protocolType] = 0;
        }
        stats.protocolBreakdown[position.protocolType] += position.totalValue;
      }

      // Calculate top protocols
      const protocolValues = new Map<string, number>();
      for (const position of positions) {
        const current = protocolValues.get(position.protocol) || 0;
        protocolValues.set(position.protocol, current + position.totalValue);
      }

      stats.topProtocols = Array.from(protocolValues.entries())
        .map(([protocol, value]) => ({
          protocol,
          value,
          percentage:
            stats.totalValueLocked > 0
              ? (value / stats.totalValueLocked) * 100
              : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      return stats;
    } catch (error) {
      logger.error("Error calculating DeFi stats:", error);
      return {
        totalPositions: 0,
        totalValueLocked: 0,
        protocolBreakdown: {} as Record<ProtocolType, number>,
        topProtocols: [],
      };
    }
  }

  /**
   * Get comprehensive position analysis (integrated from ComprehensivePositionChecker)
   */
  private static async getComprehensivePositions(
    walletAddress: string,
  ): Promise<ComprehensivePositionSummary> {
    try {
      const resources = await this.fetchAccountResources(walletAddress);
      const positions: DetailedPosition[] = [];
      const protocolBreakdown: Record<string, number> = {};

      // Group resources by protocol
      const protocolResources = new Map<
        string,
        Array<{ type: string; data: Record<string, unknown> }>
      >();

      for (const resource of resources) {
        const identification = this.identifyProtocol(resource.type);

        if (identification.protocol !== "Unknown") {
          const key = `${identification.protocol}-${identification.type}`;

          if (!protocolResources.has(key)) {
            protocolResources.set(key, []);
          }

          protocolResources.get(key)!.push(resource);
        }
      }

      // Process each protocol position
      for (const [key, protocolResourceList] of protocolResources.entries()) {
        const [protocolName, positionType] = key.split("-");
        const firstResource = protocolResourceList[0];
        const identification = this.identifyProtocol(firstResource.type);

        const tokens: Array<{
          symbol: string;
          address: string;
          balance: string;
          value?: string;
        }> = [];
        const lpTokens: Array<{
          poolType: string;
          poolTokens: string[];
          balance: string;
          value?: string;
        }> = [];

        // Process each resource in this protocol
        for (const resource of protocolResourceList) {
          const lpInfo = this.parseLPToken(resource.type);

          if (lpInfo.isLPToken) {
            const balance = (resource.data as any)?.coin?.value || "0";
            const tokenSymbols = lpInfo.tokens.map((t) =>
              this.getTokenSymbol(t),
            );

            lpTokens.push({
              poolType: lpInfo.poolType,
              poolTokens: tokenSymbols,
              balance,
            });
          } else if (resource.type.includes("::coin::CoinStore<")) {
            // Regular token
            const balance = (resource.data as any)?.coin?.value || "0";
            const tokenMatch = resource.type.match(/CoinStore<(.+)>/);

            if (tokenMatch) {
              const tokenAddress = tokenMatch[1];
              const symbol = this.getTokenSymbol(tokenAddress);

              tokens.push({
                symbol,
                address: tokenAddress,
                balance,
              });
            }
          }
        }

        // Find the protocol address from the registry
        const protocolAddress =
          Object.keys(PROTOCOL_ADDRESSES).find((addr) =>
            protocolResourceList.some((r) => r.type.includes(addr)),
          ) || "";

        // Determine if position is active
        const isActive =
          tokens.some((t) => t.balance !== "0") ||
          lpTokens.some((lp) => lp.balance !== "0") ||
          protocolResourceList.some((r) => {
            const data = r.data as any;
            return data?.coin?.value !== "0" || Object.keys(data).length > 1;
          });

        positions.push({
          protocol: protocolName,
          protocolAddress,
          type: positionType as any,
          description: identification.description,
          tokens,
          lpTokens,
          resources: protocolResourceList,
          isActive,
        });

        if (isActive) {
          protocolBreakdown[protocolName] =
            (protocolBreakdown[protocolName] || 0) + 1;
        }
      }

      positions.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.protocol.localeCompare(b.protocol);
      });

      return {
        walletAddress,
        positions,
        totalActivePositions: positions.filter((p) => p.isActive).length,
        totalProtocols: Object.keys(protocolBreakdown).length,
        protocolBreakdown,
        valueBreakdown: {},
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error getting comprehensive positions:", error);
      return {
        walletAddress,
        positions: [],
        totalActivePositions: 0,
        totalProtocols: 0,
        protocolBreakdown: {},
        valueBreakdown: {},
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  private static async fetchAccountResources(
    address: string,
  ): Promise<Array<{ type: string; data: Record<string, unknown> }>> {
    try {
      const response = await fetch(
        `https://api.mainnet.aptoslabs.com/v1/accounts/${address}/resources`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(APTOS_API_KEY
              ? { Authorization: `Bearer ${APTOS_API_KEY}` }
              : {}),
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch account resources: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      logger.error("Error fetching account resources:", error);
      return [];
    }
  }

  private static parseLPToken(resourceType: string): {
    isLPToken: boolean;
    poolType: string;
    tokens: string[];
    protocol: string;
  } {
    const result = {
      isLPToken: false,
      poolType: "",
      tokens: [] as string[],
      protocol: "",
    };

    // Check for Thala LP tokens
    if (
      resourceType.includes("::stable_pool::StablePoolToken<") ||
      resourceType.includes("::weighted_pool::WeightedPoolToken<")
    ) {
      result.isLPToken = true;
      result.protocol = "Thala";
      result.poolType = resourceType.includes("::stable_pool::")
        ? "Stable Pool"
        : "Weighted Pool";

      const match = resourceType.match(/<(.+)>/);
      if (match) {
        const tokenTypes = match[1].split(",").map((t) => t.trim());
        result.tokens = tokenTypes.filter(
          (t) => !t.includes("::base_pool::Null"),
        );
      }
    }

    // Check for Liquidswap LP tokens
    if (
      resourceType.includes("liquidswap") ||
      resourceType.includes("::lp_coin::LP<")
    ) {
      result.isLPToken = true;
      result.protocol = "Liquidswap";
      result.poolType = "AMM Pool";

      const match = resourceType.match(/<(.+)>/);
      if (match) {
        result.tokens = match[1].split(",").map((t) => t.trim());
      }
    }

    // Check for PancakeSwap LP tokens
    if (
      resourceType.includes("pancakeswap") ||
      resourceType.includes("::lp_token::LP<")
    ) {
      result.isLPToken = true;
      result.protocol = "PancakeSwap";
      result.poolType = "AMM Pool";

      const match = resourceType.match(/<(.+)>/);
      if (match) {
        result.tokens = match[1].split(",").map((t) => t.trim());
      }
    }

    return result;
  }

  private static getTokenSymbol(tokenAddress: string): string {
    if (tokenAddress.includes("::aptos_coin::AptosCoin")) return "APT";
    if (tokenAddress.includes("::asset::USDC")) return "USDC";
    if (tokenAddress.includes("::asset::USDT")) return "USDT";
    if (tokenAddress.includes("::staking::ThalaAPT")) return "thAPT";
    if (tokenAddress.includes("::thl_coin::THL")) return "THL";
    if (tokenAddress.includes("::mod_coin::MOD")) return "MOD";

    const match = tokenAddress.match(/::([^:]+)::([^>]+)/);
    if (match) {
      return match[2].toUpperCase();
    }

    return tokenAddress.substring(0, 10) + "...";
  }

  private static identifyProtocol(resourceType: string): {
    protocol: string;
    type:
      | "liquidity"
      | "farming"
      | "lending"
      | "staking"
      | "nft"
      | "derivatives"
      | "other";
    description: string;
  } {
    // Check all protocol addresses from the registry
    for (const [address, protocolName] of Object.entries(PROTOCOL_ADDRESSES)) {
      if (resourceType.includes(address)) {
        const protocol = Object.values(PROTOCOLS).find(
          (p) => p.name === protocolName || p.addresses.includes(address),
        );

        if (protocol) {
          const type = this.mapProtocolTypeToPositionType(protocol.type);
          return {
            protocol: protocol.name,
            type,
            description:
              protocol.description || this.getDescriptionForType(type),
          };
        }
      }
    }

    // Fallback: check all protocols by their addresses
    for (const protocol of Object.values(PROTOCOLS)) {
      for (const address of protocol.addresses) {
        if (resourceType.includes(address)) {
          const type = this.mapProtocolTypeToPositionType(protocol.type);
          return {
            protocol: protocol.name,
            type,
            description:
              protocol.description || this.getDescriptionForType(type),
          };
        }
      }
    }

    return {
      protocol: "Unknown",
      type: "other",
      description: "Unknown Protocol",
    };
  }

  private static mapProtocolTypeToPositionType(
    protocolType: ProtocolType,
  ):
    | "liquidity"
    | "farming"
    | "lending"
    | "staking"
    | "nft"
    | "derivatives"
    | "other" {
    switch (protocolType) {
      case ProtocolType.DEX:
        return "liquidity";
      case ProtocolType.FARMING:
        return "farming";
      case ProtocolType.LENDING:
        return "lending";
      case ProtocolType.LIQUID_STAKING:
        return "staking";
      case ProtocolType.NFT_MARKETPLACE:
        return "nft";
      case ProtocolType.DERIVATIVES:
        return "derivatives";
      default:
        return "other";
    }
  }

  private static getDescriptionForType(
    type:
      | "liquidity"
      | "farming"
      | "lending"
      | "staking"
      | "nft"
      | "derivatives"
      | "other",
  ): string {
    switch (type) {
      case "liquidity":
        return "DEX/Liquidity Pool";
      case "farming":
        return "Yield Farming";
      case "lending":
        return "Lending/Borrowing";
      case "staking":
        return "Liquid Staking";
      case "nft":
        return "NFT Platform";
      case "derivatives":
        return "Derivatives Trading";
      default:
        return "Other Protocol";
    }
  }
}
