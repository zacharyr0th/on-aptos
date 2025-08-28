/**
 * Optimized Transaction Analysis V2 - Using new protocol system
 * Fully compatible with existing portfolio components
 */

import { RWA_TOKENS } from "@/lib/constants";
import {
  STABLECOINS,
  LIQUID_STAKING_TOKEN_SET,
  CEX_ADDRESSES,
} from "@/lib/constants";
import { analyzeTransaction as analyzeWithNewSystem } from "@/lib/protocols/adapters/portfolio-adapter";
import { TransactionCategory, ActivityType } from "@/lib/types/consolidated";

// Removed unused logger import

// Create lookup for backward compatibility
const RWA_TOKEN_BY_ADDRESS = Object.fromEntries(
  RWA_TOKENS.map((token) => [token.address, token]),
);

export interface Transaction {
  transaction_version: string;
  transaction_timestamp: string;
  type: string;
  amount: string;
  asset_type: string;
  success: boolean;
  function?: string;
  gas_fee?: string;
  events?: any[];
  sender?: string;
}

export interface OptimizedTransactionInfo {
  category: TransactionCategory;
  subcategory: string;
  displayName: string;
  protocol?: any;
  protocolLabel?: string;
  assetInfo?: {
    isStablecoin: boolean;
    isLST: boolean;
    isRWA: boolean;
    displaySymbol: string;
  };
  direction: "incoming" | "outgoing" | "neutral";
  activityType: ActivityType;
  description: string;
  confidence: number;
}

// Map legacy activity types to consolidated ones
const MAPPED_ACTIVITY_TYPES = {
  FARMING_STAKE: ActivityType.FARMING_STAKE,
  FARMING_UNSTAKE: ActivityType.FARMING_UNSTAKE,
  FARMING_HARVEST: ActivityType.FARMING_HARVEST,
  LENDING_WITHDRAW: ActivityType.LENDING_WITHDRAW,
  BRIDGE_IN: ActivityType.BRIDGE_DEPOSIT,
  BRIDGE_OUT: ActivityType.BRIDGE_WITHDRAW,
  RWA_BUY: ActivityType.RWA_PURCHASE,
  RWA_SELL: ActivityType.RWA_PURCHASE, // No sell in consolidated
  RWA_REDEEM: ActivityType.RWA_REDEEM,
  CEX_WITHDRAW: ActivityType.CEX_WITHDRAWAL,
  COIN_REGISTER: ActivityType.COIN_REGISTER,
  RECEIVE: ActivityType.RECEIVE,
  SEND: ActivityType.SEND,
} as const;

/**
 * Optimized transaction analyzer using new protocol system
 */
export class OptimizedTransactionAnalyzer {
  private static readonly CONFIDENCE_THRESHOLDS = {
    HIGH: 90,
    MEDIUM: 70,
    LOW: 50,
  };

  /**
   * Analyze a transaction with new protocol system
   */
  static async analyzeTransaction(
    tx: Transaction,
  ): Promise<OptimizedTransactionInfo> {
    const direction = this.determineDirection(tx);
    const assetInfo = this.analyzeAsset(tx.asset_type);

    // Try new protocol system first
    const protocolAnalysis = await analyzeWithNewSystem(tx);

    if (protocolAnalysis.protocol) {
      const activityType = this.mapActivityToType(protocolAnalysis.activity);

      return {
        category: this.mapToCategory(protocolAnalysis.category),
        subcategory: protocolAnalysis.protocol.id,
        displayName: protocolAnalysis.displayName,
        protocol: protocolAnalysis.protocol,
        protocolLabel: protocolAnalysis.protocol.label,
        assetInfo,
        direction,
        activityType,
        description: this.generateDescription(
          tx,
          protocolAnalysis.displayName,
          assetInfo,
        ),
        confidence: protocolAnalysis.confidence,
      };
    }

    // Fallback to basic analysis
    return this.analyzeBasic(tx, direction, assetInfo);
  }

  /**
   * Synchronous version for backward compatibility
   */
  static analyzeTransactionSync(tx: Transaction): OptimizedTransactionInfo {
    const direction = this.determineDirection(tx);
    const assetInfo = this.analyzeAsset(tx.asset_type);

    // Basic analysis without protocol detection
    return this.analyzeBasic(tx, direction, assetInfo);
  }

  /**
   * Basic analysis without protocol system
   */
  private static analyzeBasic(
    tx: Transaction,
    direction: "incoming" | "outgoing" | "neutral",
    assetInfo: any,
  ): OptimizedTransactionInfo {
    // Check for RWA
    if (tx.asset_type && RWA_TOKEN_BY_ADDRESS[tx.asset_type]) {
      return this.analyzeRWAActivity(tx, direction, assetInfo);
    }

    // Check for CEX
    if (tx.sender && this.identifyCEX(tx.sender)) {
      return this.analyzeCEXInteraction(tx, direction, assetInfo);
    }

    // Check for system activities
    const systemAnalysis = this.analyzeSystemActivity(tx);
    if (systemAnalysis) {
      return { ...systemAnalysis, direction, assetInfo };
    }

    // Default to transfer
    return this.analyzeBasicTransfer(tx, direction, assetInfo);
  }

  /**
   * Map activity string to ActivityType
   */
  private static mapActivityToType(activity: string): ActivityType {
    const activityMap: Record<string, ActivityType> = {
      swap: ActivityType.SWAP,
      liquidity_add: ActivityType.LIQUIDITY_ADD,
      liquidity_remove: ActivityType.LIQUIDITY_REMOVE,
      supply: ActivityType.LENDING_SUPPLY,
      withdraw: MAPPED_ACTIVITY_TYPES.LENDING_WITHDRAW,
      borrow: ActivityType.LENDING_BORROW,
      repay: ActivityType.LENDING_REPAY,
      stake: ActivityType.STAKE,
      unstake: ActivityType.UNSTAKE,
      claim_rewards: ActivityType.CLAIM_REWARDS,
      farm_stake: MAPPED_ACTIVITY_TYPES.FARMING_STAKE,
      farm_unstake: MAPPED_ACTIVITY_TYPES.FARMING_UNSTAKE,
      harvest: MAPPED_ACTIVITY_TYPES.FARMING_HARVEST,
      send: MAPPED_ACTIVITY_TYPES.SEND,
      receive: MAPPED_ACTIVITY_TYPES.RECEIVE,
      bridge_in: MAPPED_ACTIVITY_TYPES.BRIDGE_IN,
      bridge_out: MAPPED_ACTIVITY_TYPES.BRIDGE_OUT,
      nft_mint: ActivityType.NFT_MINT,
      nft_buy: ActivityType.NFT_BUY,
      nft_sell: ActivityType.NFT_SELL,
    };

    return activityMap[activity] || ActivityType.UNKNOWN;
  }

  /**
   * Map category string to TransactionCategory
   */
  private static mapToCategory(category: string): TransactionCategory {
    const categoryMap: Record<string, TransactionCategory> = {
      defi: TransactionCategory.DEFI,
      transfer: TransactionCategory.TRANSFER,
      cex: TransactionCategory.CEX,
      nft: TransactionCategory.NFT,
      staking: TransactionCategory.STAKING,
      bridge: TransactionCategory.BRIDGE,
      rwa: TransactionCategory.RWA,
      system: TransactionCategory.SYSTEM,
      gaming: TransactionCategory.GAMING,
    };

    return categoryMap[category] || TransactionCategory.UNKNOWN;
  }

  /**
   * Analyze RWA activities
   */
  private static analyzeRWAActivity(
    tx: Transaction,
    direction: "incoming" | "outgoing" | "neutral",
    assetInfo: any,
  ): OptimizedTransactionInfo {
    const rwaToken = RWA_TOKEN_BY_ADDRESS[tx.asset_type];
    const lowerType = tx.type.toLowerCase();

    let activityType: ActivityType = MAPPED_ACTIVITY_TYPES.RWA_BUY;
    let displayName = `Buy ${rwaToken.assetTicker}`;

    if (lowerType.includes("sell")) {
      activityType = MAPPED_ACTIVITY_TYPES.RWA_SELL;
      displayName = `Sell ${rwaToken.assetTicker}`;
    } else if (lowerType.includes("redeem")) {
      activityType = MAPPED_ACTIVITY_TYPES.RWA_REDEEM;
      displayName = `Redeem ${rwaToken.assetTicker}`;
    }

    return {
      category: TransactionCategory.RWA,
      subcategory: rwaToken.assetClass,
      displayName,
      direction,
      activityType,
      description: `${displayName} - ${rwaToken.assetName}`,
      confidence: this.CONFIDENCE_THRESHOLDS.HIGH,
      assetInfo,
    };
  }

  /**
   * Analyze CEX interactions
   */
  private static analyzeCEXInteraction(
    tx: Transaction,
    direction: "incoming" | "outgoing" | "neutral",
    assetInfo: any,
  ): OptimizedTransactionInfo {
    const cexName = this.identifyCEX(tx.sender!);

    return {
      category: TransactionCategory.CEX,
      subcategory: cexName?.toLowerCase() || "cex",
      displayName:
        direction === "incoming" ? `From ${cexName}` : `To ${cexName}`,
      direction,
      activityType:
        direction === "incoming"
          ? MAPPED_ACTIVITY_TYPES.CEX_WITHDRAW
          : ActivityType.CEX_DEPOSIT,
      description: `${direction === "incoming" ? "Withdrew from" : "Deposited to"} ${cexName}`,
      confidence: this.CONFIDENCE_THRESHOLDS.HIGH,
      assetInfo,
    };
  }

  /**
   * Analyze system activities
   */
  private static analyzeSystemActivity(
    tx: Transaction,
  ): OptimizedTransactionInfo | null {
    if (!tx.type) return null;

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("account") && lowerType.includes("create")) {
      return {
        category: TransactionCategory.SYSTEM,
        subcategory: "account",
        activityType: ActivityType.ACCOUNT_CREATION,
        displayName: "Create Account",
        description: "Created new account",
        confidence: this.CONFIDENCE_THRESHOLDS.HIGH,
        direction: "neutral",
        assetInfo: undefined,
      };
    }

    if (lowerType.includes("coin") && lowerType.includes("register")) {
      return {
        category: TransactionCategory.SYSTEM,
        subcategory: "coin",
        activityType: MAPPED_ACTIVITY_TYPES.COIN_REGISTER,
        displayName: "Register Coin",
        description: "Registered new coin type",
        confidence: this.CONFIDENCE_THRESHOLDS.HIGH,
        direction: "neutral",
        assetInfo: undefined,
      };
    }

    return null;
  }

  /**
   * Analyze basic transfers
   */
  private static analyzeBasicTransfer(
    tx: Transaction,
    direction: "incoming" | "outgoing" | "neutral",
    assetInfo: any,
  ): OptimizedTransactionInfo {
    return {
      category: TransactionCategory.TRANSFER,
      subcategory: "basic",
      displayName: direction === "incoming" ? "Receive" : "Send",
      direction,
      activityType:
        direction === "incoming"
          ? MAPPED_ACTIVITY_TYPES.RECEIVE
          : MAPPED_ACTIVITY_TYPES.SEND,
      description: `${direction === "incoming" ? "Received" : "Sent"} ${assetInfo?.displaySymbol || "tokens"}`,
      confidence: this.CONFIDENCE_THRESHOLDS.LOW,
      assetInfo,
    };
  }

  /**
   * Helper methods
   */
  private static determineDirection(
    tx: Transaction,
  ): "incoming" | "outgoing" | "neutral" {
    const amount = parseFloat(tx.amount || "0");
    if (amount > 0) return "incoming";
    if (amount < 0) return "outgoing";
    return "neutral";
  }

  private static analyzeAsset(
    assetType: string,
  ): OptimizedTransactionInfo["assetInfo"] {
    const isStablecoin = Object.values(STABLECOINS).includes(assetType as any);
    const isLST = LIQUID_STAKING_TOKEN_SET.has(assetType);
    const isRWA = !!RWA_TOKEN_BY_ADDRESS[assetType];

    let displaySymbol = "APT";

    if (isStablecoin) {
      displaySymbol =
        Object.entries(STABLECOINS).find(
          ([_, addr]) => addr === assetType,
        )?.[0] || "Stablecoin";
    } else if (isLST) {
      displaySymbol = "LST"; // Generic LST label since we don't have reverse lookup anymore
    } else if (isRWA) {
      displaySymbol = RWA_TOKEN_BY_ADDRESS[assetType].assetTicker;
    }

    return {
      isStablecoin,
      isLST,
      isRWA,
      displaySymbol,
    };
  }

  private static identifyCEX(address: string): string | null {
    for (const [cexName, addresses] of Object.entries(CEX_ADDRESSES)) {
      if ((addresses as unknown as string[]).includes(address)) {
        return cexName.charAt(0).toUpperCase() + cexName.slice(1).toLowerCase();
      }
    }
    return null;
  }

  private static generateDescription(
    tx: Transaction,
    baseDescription: string,
    assetInfo: any,
  ): string {
    if (tx.amount && parseFloat(tx.amount) !== 0) {
      const amount = parseFloat(tx.amount);
      const formattedAmount = Math.abs(amount).toLocaleString();
      const symbol = assetInfo?.displaySymbol || "tokens";
      return `${baseDescription} (${formattedAmount} ${symbol})`;
    }
    return baseDescription;
  }

  /**
   * Get category display name
   */
  static getCategoryDisplayName(category: TransactionCategory): string {
    const displayNames: Record<TransactionCategory, string> = {
      [TransactionCategory.DEFI]: "DeFi",
      [TransactionCategory.TRANSFER]: "Transfer",
      [TransactionCategory.CEX]: "CEX",
      [TransactionCategory.NFT]: "NFT",
      [TransactionCategory.STAKING]: "Staking",
      [TransactionCategory.BRIDGE]: "Bridge",
      [TransactionCategory.RWA]: "RWA",
      [TransactionCategory.SYSTEM]: "System",
      [TransactionCategory.GAMING]: "Gaming",
      [TransactionCategory.UNKNOWN]: "Unknown",
    };

    return displayNames[category];
  }

  /**
   * Get activity type display name
   */
  static getActivityTypeDisplayName(activityType: ActivityType): string {
    return activityType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}

// Export for backward compatibility
export const analyzeTransaction = (tx: Transaction) =>
  OptimizedTransactionAnalyzer.analyzeTransactionSync(tx);

// Also export as EnhancedTransactionAnalyzer for full backward compatibility
export { OptimizedTransactionAnalyzer as EnhancedTransactionAnalyzer };
export type { OptimizedTransactionInfo as EnhancedTransactionInfo };

// Export types for components
export { TransactionCategory, ActivityType } from "@/lib/types/consolidated";
