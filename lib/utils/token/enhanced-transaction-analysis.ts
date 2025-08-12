/**
 * Enhanced transaction analysis using comprehensive protocol registry and constants
 * Provides much better categorization and labeling than basic transaction parsing
 */

import { RWA_TOKENS } from "@/lib/constants";
import {
  STABLECOINS,
  LIQUID_STAKING_TOKENS,
  CEX_ADDRESSES,
} from "@/lib/constants";

import {
  getProtocolByAddress,
  getProtocolLabel,
  ProtocolType,
  type ProtocolInfo,
} from "@/lib/constants/protocols/protocol-registry";

import { logger } from "../core/logger";

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

export enum TransactionCategory {
  DEFI = "defi",
  TRANSFER = "transfer",
  CEX = "cex",
  NFT = "nft",
  STAKING = "staking",
  BRIDGE = "bridge",
  RWA = "rwa",
  SYSTEM = "system",
  UNKNOWN = "unknown",
}

export enum ActivityType {
  // DeFi activities
  SWAP = "swap",
  LIQUIDITY_ADD = "liquidity_add",
  LIQUIDITY_REMOVE = "liquidity_remove",
  LENDING_SUPPLY = "lending_supply",
  LENDING_WITHDRAW = "lending_withdraw",
  LENDING_BORROW = "lending_borrow",
  LENDING_REPAY = "lending_repay",
  FARMING_STAKE = "farming_stake",
  FARMING_UNSTAKE = "farming_unstake",
  FARMING_HARVEST = "farming_harvest",

  // Staking activities
  STAKE = "stake",
  UNSTAKE = "unstake",
  CLAIM_REWARDS = "claim_rewards",
  DELEGATE = "delegate",
  UNDELEGATE = "undelegate",

  // Transfer activities
  SEND = "send",
  RECEIVE = "receive",

  // CEX activities
  CEX_DEPOSIT = "cex_deposit",
  CEX_WITHDRAW = "cex_withdraw",

  // NFT activities
  NFT_MINT = "nft_mint",
  NFT_BUY = "nft_buy",
  NFT_SELL = "nft_sell",
  NFT_TRANSFER = "nft_transfer",

  // Bridge activities
  BRIDGE_IN = "bridge_in",
  BRIDGE_OUT = "bridge_out",

  // RWA activities
  RWA_BUY = "rwa_buy",
  RWA_SELL = "rwa_sell",
  RWA_REDEEM = "rwa_redeem",

  // System activities
  ACCOUNT_CREATION = "account_creation",
  COIN_REGISTER = "coin_register",

  // Unknown
  UNKNOWN = "unknown",
}

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
      direction: this.determineDirection(tx),
      activityType: ActivityType.UNKNOWN,
      description: "Unknown transaction",
      confidence: 0,
      assetInfo: this.analyzeAsset(tx.asset_type),
    };

    // Analyze in order of specificity (most specific first)
    const analyzed =
      this.analyzeProtocolInteraction(tx, analysis) ||
      this.analyzeRWAActivity(tx, analysis) ||
      this.analyzeCEXInteraction(tx, analysis) ||
      this.analyzeNFTActivity(tx, analysis) ||
      this.analyzeBridgeActivity(tx, analysis) ||
      this.analyzeSystemActivity(tx, analysis) ||
      this.analyzeBasicTransfer(tx, analysis);

    // Use the result to avoid unused variable warning
    if (!analyzed) {
      // All analyzers should return true, this is just a safeguard
      logger.debug("No analyzer matched for transaction", { tx });
    }

    // Final cleanup and description generation
    this.generateDescription(tx, analysis);
    this.adjustConfidence(tx, analysis);

    logger.debug("Transaction analysis result:", {
      version: tx.transaction_version,
      type: tx.type,
      category: analysis.category,
      activityType: analysis.activityType,
      confidence: analysis.confidence,
    });

    return analysis;
  }

  /**
   * Analyze protocol interactions (DeFi, Staking, etc.)
   */
  private static analyzeProtocolInteraction(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
  ): boolean {
    if (!tx.type) return false;

    const protocol = getProtocolByAddress(tx.type);
    if (!protocol) return false;

    analysis.protocol = protocol;
    analysis.protocolLabel = getProtocolLabel(tx.type) || undefined;
    analysis.confidence = this.CONFIDENCE_THRESHOLDS.HIGH;

    switch (protocol.type) {
      case ProtocolType.LIQUID_STAKING:
        return this.analyzeLiquidStaking(tx, analysis, protocol);

      case ProtocolType.LENDING:
        return this.analyzeLending(tx, analysis, protocol);

      case ProtocolType.DEX:
        return this.analyzeDEX(tx, analysis, protocol);

      case ProtocolType.FARMING:
        return this.analyzeFarming(tx, analysis, protocol);

      case ProtocolType.BRIDGE:
        return this.analyzeBridge(tx, analysis, protocol);

      case ProtocolType.DERIVATIVES:
        return this.analyzeDerivatives(tx, analysis, protocol);

      case ProtocolType.NFT_MARKETPLACE:
        return this.analyzeNFTMarketplace(tx, analysis, protocol);

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
    protocol: ProtocolInfo,
  ): boolean {
    analysis.category = TransactionCategory.STAKING;
    analysis.subcategory = protocol.name.toLowerCase();

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("stake") && !lowerType.includes("unstake")) {
      analysis.activityType = ActivityType.STAKE;
      analysis.displayName = `Stake with ${protocol.label}`;
      analysis.description = `Staked APT for ${protocol.label} liquid staking tokens`;
    } else if (
      lowerType.includes("unstake") ||
      lowerType.includes("withdraw")
    ) {
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
    protocol: ProtocolInfo,
  ): boolean {
    analysis.category = TransactionCategory.DEFI;
    analysis.subcategory = "lending";

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("supply") || lowerType.includes("deposit")) {
      analysis.activityType = ActivityType.LENDING_SUPPLY;
      analysis.displayName = `Supply to ${protocol.label}`;
      analysis.description = `Supplied assets to ${protocol.label} lending pool`;
    } else if (lowerType.includes("withdraw") || lowerType.includes("redeem")) {
      analysis.activityType = ActivityType.LENDING_WITHDRAW;
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
    protocol: ProtocolInfo,
  ): boolean {
    analysis.category = TransactionCategory.DEFI;
    analysis.subcategory = "dex";

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("swap") || lowerType.includes("exchange")) {
      analysis.activityType = ActivityType.SWAP;
      analysis.displayName = `Swap on ${protocol.label}`;
      analysis.description = `Token swap on ${protocol.label}`;
    } else if (
      lowerType.includes("add_liquidity") ||
      lowerType.includes("provide_liquidity")
    ) {
      analysis.activityType = ActivityType.LIQUIDITY_ADD;
      analysis.displayName = `Add Liquidity to ${protocol.label}`;
      analysis.description = `Added liquidity to ${protocol.label} pool`;
    } else if (
      lowerType.includes("remove_liquidity") ||
      lowerType.includes("withdraw_liquidity")
    ) {
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
    protocol: ProtocolInfo,
  ): boolean {
    analysis.category = TransactionCategory.DEFI;
    analysis.subcategory = "farming";

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("stake") || lowerType.includes("deposit")) {
      analysis.activityType = ActivityType.FARMING_STAKE;
      analysis.displayName = `Stake in ${protocol.label}`;
      analysis.description = `Staked tokens in ${protocol.label} farm`;
    } else if (
      lowerType.includes("unstake") ||
      lowerType.includes("withdraw")
    ) {
      analysis.activityType = ActivityType.FARMING_UNSTAKE;
      analysis.displayName = `Unstake from ${protocol.label}`;
      analysis.description = `Unstaked tokens from ${protocol.label} farm`;
    } else if (lowerType.includes("harvest") || lowerType.includes("claim")) {
      analysis.activityType = ActivityType.FARMING_HARVEST;
      analysis.displayName = `Harvest from ${protocol.label}`;
      analysis.description = `Harvested rewards from ${protocol.label} farm`;
    } else {
      analysis.activityType = ActivityType.FARMING_STAKE;
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
    protocol: ProtocolInfo,
  ): boolean {
    analysis.category = TransactionCategory.BRIDGE;
    analysis.subcategory = protocol.name.toLowerCase();
    analysis.activityType =
      analysis.direction === "incoming"
        ? ActivityType.BRIDGE_IN
        : ActivityType.BRIDGE_OUT;
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
    protocol: ProtocolInfo,
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
    protocol: ProtocolInfo,
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
  private static analyzeRWAActivity(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
  ): boolean {
    if (!tx.asset_type || !RWA_TOKEN_BY_ADDRESS[tx.asset_type]) return false;

    const rwaToken = RWA_TOKEN_BY_ADDRESS[tx.asset_type];
    analysis.category = TransactionCategory.RWA;
    analysis.subcategory = rwaToken.assetClass;
    analysis.confidence = this.CONFIDENCE_THRESHOLDS.HIGH;

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("buy") || lowerType.includes("mint")) {
      analysis.activityType = ActivityType.RWA_BUY;
      analysis.displayName = `Buy ${rwaToken.assetTicker}`;
      analysis.description = `Purchased ${rwaToken.assetName} (${rwaToken.assetTicker})`;
    } else if (lowerType.includes("sell") || lowerType.includes("burn")) {
      analysis.activityType = ActivityType.RWA_SELL;
      analysis.displayName = `Sell ${rwaToken.assetTicker}`;
      analysis.description = `Sold ${rwaToken.assetName} (${rwaToken.assetTicker})`;
    } else if (lowerType.includes("redeem")) {
      analysis.activityType = ActivityType.RWA_REDEEM;
      analysis.displayName = `Redeem ${rwaToken.assetTicker}`;
      analysis.description = `Redeemed ${rwaToken.assetName} (${rwaToken.assetTicker})`;
    } else {
      analysis.activityType = ActivityType.RWA_BUY;
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
    analysis: EnhancedTransactionInfo,
  ): boolean {
    if (!tx.sender) return false;

    const cexName = this.identifyCEX(tx.sender);
    if (!cexName) return false;

    analysis.category = TransactionCategory.CEX;
    analysis.subcategory = cexName.toLowerCase();
    analysis.confidence = this.CONFIDENCE_THRESHOLDS.HIGH;

    if (analysis.direction === "incoming") {
      analysis.activityType = ActivityType.CEX_WITHDRAW;
      analysis.displayName = `Withdraw from ${cexName}`;
      analysis.description = `Withdrew ${analysis.assetInfo?.displaySymbol || "tokens"} from ${cexName}`;
    } else {
      analysis.activityType = ActivityType.CEX_DEPOSIT;
      analysis.displayName = `Deposit to ${cexName}`;
      analysis.description = `Deposited ${analysis.assetInfo?.displaySymbol || "tokens"} to ${cexName}`;
    }

    return true;
  }

  /**
   * Analyze NFT activities
   */
  private static analyzeNFTActivity(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
  ): boolean {
    if (!tx.type) return false;

    const lowerType = tx.type.toLowerCase();

    // Check if it's an NFT-related transaction
    if (lowerType.includes("token") && lowerType.includes("mint")) {
      analysis.category = TransactionCategory.NFT;
      analysis.subcategory = "mint";
      analysis.activityType = ActivityType.NFT_MINT;
      analysis.displayName = "Mint NFT";
      analysis.description = "Minted a new NFT";
      analysis.confidence = this.CONFIDENCE_THRESHOLDS.MEDIUM;
      return true;
    }

    return false;
  }

  /**
   * Analyze bridge activities (generic)
   */
  private static analyzeBridgeActivity(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
  ): boolean {
    if (!tx.type) return false;

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("bridge") || lowerType.includes("cross_chain")) {
      analysis.category = TransactionCategory.BRIDGE;
      analysis.subcategory = "generic";
      analysis.activityType =
        analysis.direction === "incoming"
          ? ActivityType.BRIDGE_IN
          : ActivityType.BRIDGE_OUT;
      analysis.displayName = "Cross-chain Bridge";
      analysis.description = "Cross-chain bridge transaction";
      analysis.confidence = this.CONFIDENCE_THRESHOLDS.MEDIUM;
      return true;
    }

    return false;
  }

  /**
   * Analyze system-level activities
   */
  private static analyzeSystemActivity(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
  ): boolean {
    if (!tx.type) return false;

    const lowerType = tx.type.toLowerCase();

    if (lowerType.includes("account") && lowerType.includes("create")) {
      analysis.category = TransactionCategory.SYSTEM;
      analysis.subcategory = "account";
      analysis.activityType = ActivityType.ACCOUNT_CREATION;
      analysis.displayName = "Create Account";
      analysis.description = "Created new account";
      analysis.confidence = this.CONFIDENCE_THRESHOLDS.HIGH;
      return true;
    }

    if (lowerType.includes("coin") && lowerType.includes("register")) {
      analysis.category = TransactionCategory.SYSTEM;
      analysis.subcategory = "coin";
      analysis.activityType = ActivityType.COIN_REGISTER;
      analysis.displayName = "Register Coin";
      analysis.description = "Registered new coin type";
      analysis.confidence = this.CONFIDENCE_THRESHOLDS.HIGH;
      return true;
    }

    return false;
  }

  /**
   * Analyze basic transfers
   */
  private static analyzeBasicTransfer(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
  ): boolean {
    analysis.category = TransactionCategory.TRANSFER;
    analysis.subcategory = "basic";

    if (analysis.direction === "incoming") {
      analysis.activityType = ActivityType.RECEIVE;
      analysis.displayName = "Receive";
      analysis.description = `Received ${analysis.assetInfo?.displaySymbol || "tokens"}`;
    } else {
      analysis.activityType = ActivityType.SEND;
      analysis.displayName = "Send";
      analysis.description = `Sent ${analysis.assetInfo?.displaySymbol || "tokens"}`;
    }

    analysis.confidence = this.CONFIDENCE_THRESHOLDS.LOW;
    return true;
  }

  /**
   * Determine transaction direction based on amount
   */
  private static determineDirection(
    tx: Transaction,
  ): "incoming" | "outgoing" | "neutral" {
    const amount = parseFloat(tx.amount || "0");
    if (amount > 0) return "incoming";
    if (amount < 0) return "outgoing";
    return "neutral";
  }

  /**
   * Analyze asset information
   */
  private static analyzeAsset(
    assetType: string,
  ): EnhancedTransactionInfo["assetInfo"] {
    const isStablecoin = Object.values(STABLECOINS).includes(assetType as any);
    const isLST = Object.values(LIQUID_STAKING_TOKENS).includes(
      assetType as any,
    );
    const isRWA = !!RWA_TOKEN_BY_ADDRESS[assetType];

    let displaySymbol = "APT";

    if (isStablecoin) {
      displaySymbol =
        Object.entries(STABLECOINS).find(
          ([_, addr]) => addr === assetType,
        )?.[0] || "Stablecoin";
    } else if (isLST) {
      displaySymbol =
        Object.entries(LIQUID_STAKING_TOKENS).find(
          ([_, addr]) => addr === assetType,
        )?.[0] || "LST";
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
  private static generateDescription(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
  ): void {
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
  private static adjustConfidence(
    tx: Transaction,
    analysis: EnhancedTransactionInfo,
  ): void {
    // Start with existing confidence or medium if not set
    if (analysis.confidence === 0) {
      analysis.confidence = this.CONFIDENCE_THRESHOLDS.MEDIUM;
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
