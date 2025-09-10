/**
 * Enhanced transaction analysis using comprehensive protocol registry and constants
 * Provides much better categorization and labeling than basic transaction parsing
 */

import { CEX_ADDRESSES, LIQUID_STAKING_TOKEN_SET, RWA_TOKENS, STABLECOINS } from "@/lib/constants";
import { ActivityType, TransactionCategory } from "@/lib/types/consolidated";
import { logger } from "@/lib/utils/core/logger";

import {
  getProtocolByAddress,
  getProtocolLabel,
  type ProtocolInfo,
  ProtocolType,
} from "../constants/protocols/protocol-registry";

// Create lookup for backward compatibility
const RWA_TOKEN_BY_ADDRESS = Object.fromEntries(RWA_TOKENS.map((token) => [token.address, token]));

export interface Transaction {
  transaction_version: string;
  transaction_timestamp: string;
  type: string;
  amount: string;
  asset_type: string;
  success: boolean;
  function?: string;
  gas_fee?: string;
  events?: unknown[];
  sender?: string;
}

export interface EnhancedTransactionInfo {
  category: TransactionCategory;
  subcategory: string;
  displayName: string;
  protocol?: ProtocolInfo;
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
  confidence: number; // 0-100, how confident we are in the categorization
}

// Re-export from consolidated types
export { ActivityType, TransactionCategory } from "@/lib/types/consolidated";

// Constants for mapped ActivityTypes to avoid repetition
const MAPPED_ACTIVITY_TYPES = {
  // Farming activities -> DeFi staking
  FARMING_STAKE: ActivityType.STAKE,
  FARMING_UNSTAKE: ActivityType.UNSTAKE,
  FARMING_HARVEST: ActivityType.CLAIM_REWARDS,

  // Bridge activities
  BRIDGE_IN: ActivityType.BRIDGE_DEPOSIT,
  BRIDGE_OUT: ActivityType.BRIDGE_WITHDRAW,

  // RWA activities
  RWA_BUY: ActivityType.RWA_PURCHASE,
  RWA_SELL: ActivityType.RWA_PURCHASE, // No sell in consolidated, use purchase
  RWA_REDEEM: ActivityType.RWA_REDEEM,

  // CEX activities
  CEX_WITHDRAW: ActivityType.CEX_WITHDRAWAL,
  CEX_DEPOSIT: ActivityType.CEX_DEPOSIT,

  // Transfer activities
  RECEIVE: ActivityType.TRANSFER_IN,
  SEND: ActivityType.TRANSFER_OUT,

  // System activities
  COIN_REGISTER: ActivityType.SCRIPT_EXECUTION,

  // Lending activities (some might need mapping)
  LENDING_WITHDRAW: ActivityType.LENDING_SUPPLY, // Map to existing type
} as const;

/**
 * Enhanced transaction analyzer that uses protocol registry and constants
 */
export class EnhancedTransactionAnalyzer {
  private static readonly CONFIDENCE_THRESHOLDS = {
    HIGH: 90,
    MEDIUM: 70,
    LOW: 50,
  };

  /**
   * Analyze a transaction and provide enhanced categorization
   */
  static analyzeTransaction(tx: Transaction): EnhancedTransactionInfo {
    const analysis: EnhancedTransactionInfo = {
      category: TransactionCategory.UNKNOWN,
      subcategory: "unknown",
      displayName: "Transaction",
      direction: EnhancedTransactionAnalyzer.determineDirection(tx),
      activityType: ActivityType.UNKNOWN,
      description: "Unknown transaction",
      confidence: 0,
      assetInfo: EnhancedTransactionAnalyzer.analyzeAsset(tx.asset_type),
    };

    // Analyze in order of specificity (most specific first)
    const analyzed =
      EnhancedTransactionAnalyzer.analyzeProtocolInteraction(tx, analysis) ||
      EnhancedTransactionAnalyzer.analyzeRWAActivity(tx, analysis) ||
      EnhancedTransactionAnalyzer.analyzeCEXInteraction(tx, analysis) ||
      EnhancedTransactionAnalyzer.analyzeNFTActivity(tx, analysis) ||
      EnhancedTransactionAnalyzer.analyzeBridgeActivity(tx, analysis) ||
      EnhancedTransactionAnalyzer.analyzeSystemActivity(tx, analysis) ||
      EnhancedTransactionAnalyzer.analyzeBasicTransfer(tx, analysis);

    // Use the result to avoid unused variable warning
    if (!analyzed) {
      // All analyzers should return true, this is just a safeguard
      logger.debug({ tx }, "No analyzer matched for transaction");
    }

    // Final cleanup and description generation
    EnhancedTransactionAnalyzer.generateDescription(tx, analysis);
    EnhancedTransactionAnalyzer.adjustConfidence(tx, analysis);

    logger.debug(
      {
        version: tx.transaction_version,
        type: tx.type,
        category: analysis.category,
        activityType: analysis.activityType,
        confidence: analysis.confidence,
      },
      "Transaction analysis result"
    );

    return analysis;
  }

  /**
   * Analyze protocol interactions (DeFi, Staking, etc.)
   */
  private static analyzeProtocolInteraction(
    tx: Transaction,
    analysis: EnhancedTransactionInfo
  ): boolean {
    if (!tx.type) return false;

    const protocol = getProtocolByAddress(tx.type);
    if (!protocol) return false;

    analysis.protocol = protocol;
    analysis.protocolLabel = getProtocolLabel(tx.type) || undefined;
    analysis.confidence = EnhancedTransactionAnalyzer.CONFIDENCE_THRESHOLDS.HIGH;

    switch (protocol.type) {
      case ProtocolType.LIQUID_STAKING:
        return EnhancedTransactionAnalyzer.analyzeLiquidStaking(tx, analysis, protocol);

      case ProtocolType.LENDING:
        return EnhancedTransactionAnalyzer.analyzeLending(tx, analysis, protocol);

      case ProtocolType.DEX:
        return EnhancedTransactionAnalyzer.analyzeDEX(tx, analysis, protocol);

      case ProtocolType.FARMING:
        return EnhancedTransactionAnalyzer.analyzeFarming(tx, analysis, protocol);

      case ProtocolType.BRIDGE:
        return EnhancedTransactionAnalyzer.analyzeBridge(tx, analysis, protocol);

      case ProtocolType.DERIVATIVES:
        return EnhancedTransactionAnalyzer.analyzeDerivatives(tx, analysis, protocol);

      case ProtocolType.NFT:
        return EnhancedTransactionAnalyzer.analyzeNFTMarketplace(tx, analysis, protocol);

      default:
        analysis.category = TransactionCategory.DEFI;
        analysis.subcategory = protocol.name.toLowerCase();
        analysis.displayName = `${protocol.label} Transaction`;
        return true;
    }
  }

  /**
   * Analyze liquid staking activities
   */
  private static analyzeLiquidStaking(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
    protocol: ProtocolInfo
  ): boolean {
    analysis.category = TransactionCategory.STAKING;
    analysis.subcategory = protocol.name.toLowerCase();

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("stake") && !lowerType.includes("unstake")) {
      analysis.activityType = ActivityType.STAKE;
      analysis.displayName = `Stake with ${protocol.label}`;
      analysis.description = `Staked APT for ${protocol.label} liquid staking tokens`;
    } else if (lowerType.includes("unstake") || lowerType.includes("withdraw")) {
      analysis.activityType = ActivityType.UNSTAKE;
      analysis.displayName = `Unstake from ${protocol.label}`;
      analysis.description = `Unstaked ${protocol.label} tokens for APT`;
    } else if (lowerType.includes("claim") || lowerType.includes("harvest")) {
      analysis.activityType = ActivityType.CLAIM_REWARDS;
      analysis.displayName = `Claim from ${protocol.label}`;
      analysis.description = `Claimed rewards from ${protocol.label}`;
    } else {
      analysis.activityType = ActivityType.STAKE;
      analysis.displayName = `${protocol.label} Staking`;
      analysis.description = `Liquid staking activity with ${protocol.label}`;
    }

    return true;
  }

  /**
   * Analyze lending protocol activities
   */
  private static analyzeLending(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
    protocol: ProtocolInfo
  ): boolean {
    analysis.category = TransactionCategory.DEFI;
    analysis.subcategory = "lending";

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("supply") || lowerType.includes("deposit")) {
      analysis.activityType = ActivityType.LENDING_SUPPLY;
      analysis.displayName = `Supply to ${protocol.label}`;
      analysis.description = `Supplied assets to ${protocol.label} lending pool`;
    } else if (lowerType.includes("withdraw") || lowerType.includes("redeem")) {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.LENDING_WITHDRAW;
      analysis.displayName = `Withdraw from ${protocol.label}`;
      analysis.description = `Withdrew assets from ${protocol.label} lending pool`;
    } else if (lowerType.includes("borrow")) {
      analysis.activityType = ActivityType.LENDING_BORROW;
      analysis.displayName = `Borrow from ${protocol.label}`;
      analysis.description = `Borrowed assets from ${protocol.label}`;
    } else if (lowerType.includes("repay")) {
      analysis.activityType = ActivityType.LENDING_REPAY;
      analysis.displayName = `Repay to ${protocol.label}`;
      analysis.description = `Repaid borrowed assets to ${protocol.label}`;
    } else {
      analysis.activityType = ActivityType.LENDING_SUPPLY;
      analysis.displayName = `${protocol.label} Lending`;
      analysis.description = `Lending activity on ${protocol.label}`;
    }

    return true;
  }

  /**
   * Analyze DEX activities
   */
  private static analyzeDEX(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
    protocol: ProtocolInfo
  ): boolean {
    analysis.category = TransactionCategory.DEFI;
    analysis.subcategory = "dex";

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("swap") || lowerType.includes("exchange")) {
      analysis.activityType = ActivityType.SWAP;
      analysis.displayName = `Swap on ${protocol.label}`;
      analysis.description = `Token swap on ${protocol.label}`;
    } else if (lowerType.includes("add_liquidity") || lowerType.includes("provide_liquidity")) {
      analysis.activityType = ActivityType.LIQUIDITY_ADD;
      analysis.displayName = `Add Liquidity to ${protocol.label}`;
      analysis.description = `Added liquidity to ${protocol.label} pool`;
    } else if (lowerType.includes("remove_liquidity") || lowerType.includes("withdraw_liquidity")) {
      analysis.activityType = ActivityType.LIQUIDITY_REMOVE;
      analysis.displayName = `Remove Liquidity from ${protocol.label}`;
      analysis.description = `Removed liquidity from ${protocol.label} pool`;
    } else {
      analysis.activityType = ActivityType.SWAP;
      analysis.displayName = `${protocol.label} DEX`;
      analysis.description = `DEX activity on ${protocol.label}`;
    }

    return true;
  }

  /**
   * Analyze farming activities
   */
  private static analyzeFarming(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
    protocol: ProtocolInfo
  ): boolean {
    analysis.category = TransactionCategory.DEFI;
    analysis.subcategory = "farming";

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("stake") || lowerType.includes("deposit")) {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.FARMING_STAKE;
      analysis.displayName = `Stake in ${protocol.label}`;
      analysis.description = `Staked tokens in ${protocol.label} farm`;
    } else if (lowerType.includes("unstake") || lowerType.includes("withdraw")) {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.FARMING_UNSTAKE;
      analysis.displayName = `Unstake from ${protocol.label}`;
      analysis.description = `Unstaked tokens from ${protocol.label} farm`;
    } else if (lowerType.includes("harvest") || lowerType.includes("claim")) {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.FARMING_HARVEST;
      analysis.displayName = `Harvest from ${protocol.label}`;
      analysis.description = `Harvested rewards from ${protocol.label} farm`;
    } else {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.FARMING_STAKE;
      analysis.displayName = `${protocol.label} Farm`;
      analysis.description = `Farming activity on ${protocol.label}`;
    }

    return true;
  }

  /**
   * Analyze bridge activities
   */
  private static analyzeBridge(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
    protocol: ProtocolInfo
  ): boolean {
    analysis.category = TransactionCategory.BRIDGE;
    analysis.subcategory = protocol.name.toLowerCase();
    analysis.activityType =
      analysis.direction === "incoming"
        ? MAPPED_ACTIVITY_TYPES.BRIDGE_IN
        : MAPPED_ACTIVITY_TYPES.BRIDGE_OUT;
    analysis.displayName = `${protocol.label} Bridge`;
    analysis.description = `Cross-chain bridge via ${protocol.label}`;
    return true;
  }

  /**
   * Analyze derivatives activities
   */
  private static analyzeDerivatives(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
    protocol: ProtocolInfo
  ): boolean {
    analysis.category = TransactionCategory.DEFI;
    analysis.subcategory = "derivatives";
    analysis.displayName = `${protocol.label} Trading`;
    analysis.description = `Derivatives trading on ${protocol.label}`;
    return true;
  }

  /**
   * Analyze NFT marketplace activities
   */
  private static analyzeNFTMarketplace(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
    protocol: ProtocolInfo
  ): boolean {
    analysis.category = TransactionCategory.NFT;
    analysis.subcategory = protocol.name.toLowerCase();

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("buy") || lowerType.includes("purchase")) {
      analysis.activityType = ActivityType.NFT_BUY;
      analysis.displayName = `Buy NFT on ${protocol.label}`;
    } else if (lowerType.includes("sell") || lowerType.includes("list")) {
      analysis.activityType = ActivityType.NFT_SELL;
      analysis.displayName = `Sell NFT on ${protocol.label}`;
    } else {
      analysis.activityType = ActivityType.NFT_TRANSFER;
      analysis.displayName = `NFT Activity on ${protocol.label}`;
    }

    analysis.description = `NFT marketplace activity on ${protocol.label}`;
    return true;
  }

  /**
   * Analyze RWA token activities
   */
  private static analyzeRWAActivity(tx: Transaction, analysis: EnhancedTransactionInfo): boolean {
    if (!tx.asset_type || !RWA_TOKEN_BY_ADDRESS[tx.asset_type]) return false;

    const rwaToken = RWA_TOKEN_BY_ADDRESS[tx.asset_type];
    analysis.category = TransactionCategory.RWA;
    analysis.subcategory = rwaToken.assetClass;
    analysis.confidence = EnhancedTransactionAnalyzer.CONFIDENCE_THRESHOLDS.HIGH;

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("buy") || lowerType.includes("mint")) {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.RWA_BUY;
      analysis.displayName = `Buy ${rwaToken.assetTicker}`;
      analysis.description = `Purchased ${rwaToken.assetName} (${rwaToken.assetTicker})`;
    } else if (lowerType.includes("sell") || lowerType.includes("burn")) {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.RWA_SELL;
      analysis.displayName = `Sell ${rwaToken.assetTicker}`;
      analysis.description = `Sold ${rwaToken.assetName} (${rwaToken.assetTicker})`;
    } else if (lowerType.includes("redeem")) {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.RWA_REDEEM;
      analysis.displayName = `Redeem ${rwaToken.assetTicker}`;
      analysis.description = `Redeemed ${rwaToken.assetName} (${rwaToken.assetTicker})`;
    } else {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.RWA_BUY;
      analysis.displayName = `${rwaToken.assetTicker} Transaction`;
      analysis.description = `RWA transaction: ${rwaToken.assetName}`;
    }

    return true;
  }

  /**
   * Analyze CEX interactions
   */
  private static analyzeCEXInteraction(
    tx: Transaction,
    analysis: EnhancedTransactionInfo
  ): boolean {
    if (!tx.sender) return false;

    const cexName = EnhancedTransactionAnalyzer.identifyCEX(tx.sender);
    if (!cexName) return false;

    analysis.category = TransactionCategory.CEX;
    analysis.subcategory = cexName.toLowerCase();
    analysis.confidence = EnhancedTransactionAnalyzer.CONFIDENCE_THRESHOLDS.HIGH;

    if (analysis.direction === "incoming") {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.CEX_WITHDRAW;
      analysis.displayName = `Withdraw from ${cexName}`;
      analysis.description = `Withdrew ${analysis.assetInfo?.displaySymbol || "tokens"} from ${cexName}`;
    } else {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.CEX_DEPOSIT;
      analysis.displayName = `Deposit to ${cexName}`;
      analysis.description = `Deposited ${analysis.assetInfo?.displaySymbol || "tokens"} to ${cexName}`;
    }

    return true;
  }

  /**
   * Analyze NFT activities
   */
  private static analyzeNFTActivity(tx: Transaction, analysis: EnhancedTransactionInfo): boolean {
    if (!tx.type) return false;

    const lowerType = tx.type.toLowerCase();

    // Check if it's an NFT-related transaction
    if (lowerType.includes("token") && lowerType.includes("mint")) {
      analysis.category = TransactionCategory.NFT;
      analysis.subcategory = "mint";
      analysis.activityType = ActivityType.NFT_MINT;
      analysis.displayName = "Mint NFT";
      analysis.description = "Minted a new NFT";
      analysis.confidence = EnhancedTransactionAnalyzer.CONFIDENCE_THRESHOLDS.MEDIUM;
      return true;
    }

    return false;
  }

  /**
   * Analyze bridge activities (generic)
   */
  private static analyzeBridgeActivity(
    tx: Transaction,
    analysis: EnhancedTransactionInfo
  ): boolean {
    if (!tx.type) return false;

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("bridge") || lowerType.includes("cross_chain")) {
      analysis.category = TransactionCategory.BRIDGE;
      analysis.subcategory = "generic";
      analysis.activityType =
        analysis.direction === "incoming"
          ? MAPPED_ACTIVITY_TYPES.BRIDGE_IN
          : MAPPED_ACTIVITY_TYPES.BRIDGE_OUT;
      analysis.displayName = "Cross-chain Bridge";
      analysis.description = "Cross-chain bridge transaction";
      analysis.confidence = EnhancedTransactionAnalyzer.CONFIDENCE_THRESHOLDS.MEDIUM;
      return true;
    }

    return false;
  }

  /**
   * Analyze system-level activities
   */
  private static analyzeSystemActivity(
    tx: Transaction,
    analysis: EnhancedTransactionInfo
  ): boolean {
    if (!tx.type) return false;

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("account") && lowerType.includes("create")) {
      analysis.category = TransactionCategory.SYSTEM;
      analysis.subcategory = "account";
      analysis.activityType = ActivityType.ACCOUNT_CREATION;
      analysis.displayName = "Create Account";
      analysis.description = "Created new account";
      analysis.confidence = EnhancedTransactionAnalyzer.CONFIDENCE_THRESHOLDS.HIGH;
      return true;
    }

    if (lowerType.includes("coin") && lowerType.includes("register")) {
      analysis.category = TransactionCategory.SYSTEM;
      analysis.subcategory = "coin";
      analysis.activityType = MAPPED_ACTIVITY_TYPES.COIN_REGISTER;
      analysis.displayName = "Register Coin";
      analysis.description = "Registered new coin type";
      analysis.confidence = EnhancedTransactionAnalyzer.CONFIDENCE_THRESHOLDS.HIGH;
      return true;
    }

    return false;
  }

  /**
   * Analyze basic transfers
   */
  private static analyzeBasicTransfer(tx: Transaction, analysis: EnhancedTransactionInfo): boolean {
    analysis.category = TransactionCategory.TRANSFER;
    analysis.subcategory = "basic";

    if (analysis.direction === "incoming") {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.RECEIVE;
      analysis.displayName = "Receive";
      analysis.description = `Received ${analysis.assetInfo?.displaySymbol || "tokens"}`;
    } else {
      analysis.activityType = MAPPED_ACTIVITY_TYPES.SEND;
      analysis.displayName = "Send";
      analysis.description = `Sent ${analysis.assetInfo?.displaySymbol || "tokens"}`;
    }

    analysis.confidence = EnhancedTransactionAnalyzer.CONFIDENCE_THRESHOLDS.LOW;
    return true;
  }

  /**
   * Determine transaction direction based on amount
   */
  private static determineDirection(tx: Transaction): "incoming" | "outgoing" | "neutral" {
    const amount = parseFloat(tx.amount || "0");
    if (amount > 0) return "incoming";
    if (amount < 0) return "outgoing";
    return "neutral";
  }

  /**
   * Analyze asset information
   */
  private static analyzeAsset(assetType: string): EnhancedTransactionInfo["assetInfo"] {
    const isStablecoin = Object.values(STABLECOINS).includes(assetType as any);
    const isLST = LIQUID_STAKING_TOKEN_SET.has(assetType);
    const isRWA = !!RWA_TOKEN_BY_ADDRESS[assetType];

    let displaySymbol = "APT";

    if (isStablecoin) {
      displaySymbol =
        Object.entries(STABLECOINS).find(([addr]) => addr === assetType)?.[0] || "Stablecoin";
    } else if (isLST) {
      displaySymbol = "LST"; // Generic LST label since we use a Set now
    } else if (isRWA) {
      displaySymbol = RWA_TOKEN_BY_ADDRESS[assetType].assetTicker;
    } else if (assetType !== "APT") {
      // Try to extract symbol from asset type
      const parts = assetType.split("::");
      displaySymbol = parts[parts.length - 1] || assetType;
    }

    return {
      isStablecoin,
      isLST,
      isRWA,
      displaySymbol,
    };
  }

  /**
   * Identify CEX from address
   */
  private static identifyCEX(address: string): string | null {
    for (const [cexName, addresses] of Object.entries(CEX_ADDRESSES)) {
      if ((addresses as unknown as string[]).includes(address)) {
        return cexName.charAt(0).toUpperCase() + cexName.slice(1).toLowerCase();
      }
    }
    return null;
  }

  /**
   * Generate human-readable description
   */
  private static generateDescription(tx: Transaction, analysis: EnhancedTransactionInfo): void {
    // Description is already set in specific analyzers, just add amount info if available
    if (tx.amount && parseFloat(tx.amount) !== 0) {
      const amount = parseFloat(tx.amount);
      const formattedAmount = Math.abs(amount).toLocaleString();
      const symbol = analysis.assetInfo?.displaySymbol || "tokens";

      if (!analysis.description.includes(symbol)) {
        analysis.description += ` (${formattedAmount} ${symbol})`;
      }
    }
  }

  /**
   * Adjust confidence based on various factors
   */
  private static adjustConfidence(tx: Transaction, analysis: EnhancedTransactionInfo): void {
    // Start with existing confidence or medium if not set
    if (analysis.confidence === 0) {
      analysis.confidence = EnhancedTransactionAnalyzer.CONFIDENCE_THRESHOLDS.MEDIUM;
    }

    // Boost confidence for protocol matches
    if (analysis.protocol) {
      analysis.confidence = Math.min(100, analysis.confidence + 20);
    }

    // Boost confidence for known asset types
    if (
      analysis.assetInfo?.isStablecoin ||
      analysis.assetInfo?.isLST ||
      analysis.assetInfo?.isRWA
    ) {
      analysis.confidence = Math.min(100, analysis.confidence + 10);
    }

    // Reduce confidence for unknown transaction types
    if (tx.type === "Transaction" || !tx.type) {
      analysis.confidence = Math.max(10, analysis.confidence - 30);
    }

    // Boost confidence for successful transactions
    if (tx.success) {
      analysis.confidence = Math.min(100, analysis.confidence + 5);
    } else {
      analysis.confidence = Math.max(10, analysis.confidence - 20);
    }
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
