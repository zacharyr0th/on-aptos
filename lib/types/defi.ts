/**
 * Centralized DeFi and protocol type definitions
 * Comprehensive types for DeFi protocol dashboard and portfolio management
 */

// === Basic Protocol Types ===
export type ProtocolStatus = "Active" | "Deprecated";
export type AuditStatus = "Audited" | "Unaudited" | "In Progress" | undefined;
export type NetworkType = "mainnet" | "testnet" | "devnet";
export type ApyType = "Fixed" | "Variable" | "Projected";

// === Date Handling ===
export type ISODateString = string; // For JSON API compatibility

// === Localization Types ===
export type SupportedLanguage =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "ja"
  | "ko"
  | "zh-CN"
  | "pt"
  | "ru"
  | "ar"
  | "hi"
  | "ha";

export type Translatable<T = string> = {
  en: T; // English is required as the base language
} & Partial<Record<Exclude<SupportedLanguage, "en">, T>>;

// Utility type for when we need simple string translations
export type TranslatableString = Translatable<string>;

// Utility type for when we need array translations (like tags)
export type TranslatableStringArray = Translatable<string[]>;

// === Utility Types ===
export type LargeNumberString = string; // Runtime validation with zod or similar

// === Legacy Types for Compatibility ===
// Legacy DeFi position for specific portfolio service compatibility
export interface LegacyDeFiPosition {
  protocol: string;
  protocolType: string;
  poolName: string;
  positionType: string;
  suppliedAssets: Array<{
    asset: string;
    amount: number;
    value: number;
    apy?: number;
  }>;
  borrowedAssets: Array<{
    asset: string;
    amount: number;
    value: number;
    apy?: number;
  }>;
  totalValueUSD: number;
  healthFactor?: number;
  claimableRewards?: Array<{
    asset: string;
    amount: number;
    value: number;
  }>;
}

// === Data Source Types ===
export type DataProvider = "DefiLlama" | "CoinGecko" | "Aptos Indexer" | "Custom API";

export interface DataSource {
  provider: DataProvider;
  endpoint?: string;
  lastUpdated?: ISODateString;
}

// Protocol types enum - comprehensive list
export enum ProtocolType {
  // Core DeFi
  LENDING = "LENDING",
  DEX = "DEX",
  YIELD = "YIELD",
  FARMING = "FARMING",
  DERIVATIVES = "DERIVATIVES",
  CDP = "CDP",
  LIQUID_STAKING = "LIQUID_STAKING",

  // Additional types that were missing
  ORACLE = "ORACLE",
  GAMING = "GAMING",
  SOCIAL = "SOCIAL",

  // Infrastructure
  BRIDGE = "BRIDGE",
  LAUNCHPAD = "LAUNCHPAD",
  AGGREGATOR = "AGGREGATOR",
  INFRASTRUCTURE = "INFRASTRUCTURE",

  // Other
  NFT = "NFT",
  NFT_MARKETPLACE = "NFT_MARKETPLACE",
  UNKNOWN = "UNKNOWN",
}

// === Implementation Types - Only Used Ones ===

// Credit Category Implementations
export enum LendingImplementation {
  MONEY_MARKET = "Money Market",
  ISOLATED_POOLS = "Isolated Pools",
}

// Yield Category Implementations
export enum LiquidStakingImplementation {
  VALIDATOR_DELEGATED = "Validator Delegated",
}

export enum LiquidityManagerImplementation {
  RANGE_ORDERS = "Range Orders",
}

export enum LeveragedFarmingImplementation {
  BORROWING_BASED = "Borrowing-based",
}

export enum YieldAggregatorImplementation {
  MULTI_PROTOCOL = "Multi-protocol",
}

// Trading Category Implementations
export enum DexImplementation {
  AMM = "AMM",
  CLOB = "CLOB",
  HYBRID = "Hybrid",
}

export enum DexAggregatorImplementation {
  ROUTE_OPTIMIZATION = "Route Optimization",
  GAS_OPTIMIZATION = "Gas Optimization",
  CROSS_CHAIN = "Cross-chain",
}

export enum PerpsImplementation {
  CLOB = "CLOB",
  CROSS_MARGIN = "Cross-margin",
}

export enum LaunchpadImplementation {
  FAIR_LAUNCH = "Fair Launch",
}

// Multiple Category Implementation
export enum MultipleImplementation {
  PROTOCOL_SUITE = "Protocol Suite",
}

// === Combined Implementation Types ===
export type CreditImplementation = LendingImplementation;

export type YieldImplementation =
  | LiquidStakingImplementation
  | LiquidityManagerImplementation
  | LeveragedFarmingImplementation
  | YieldAggregatorImplementation;

export type TradingImplementation =
  | DexImplementation
  | DexAggregatorImplementation
  | PerpsImplementation
  | LaunchpadImplementation;

// === Security & Metrics ===
export interface SecurityMetrics {
  auditScore?: number;
  decentralizationScore?: number;
  transparencyScore?: number;
}

// === Pool Data ===
export interface PoolData {
  poolId: string;
  poolName: TranslatableString;
  apy: string;
  apyType?: ApyType; // Added for better yield data clarity
  tvl: string;
  tvlBreakdown?: Record<string, string>; // Added for TVL composition clarity
  tokens: string[];
  chain: string;
  apyPrediction?: string;
  rewards?: string[];
  source?: DataSource;
  description?: TranslatableString; // Pool-specific description
}

// === Category Definition ===
export interface CategoryDefinition {
  description: TranslatableString;
  subcategories?: Record<string, TranslatableString>;
  implementation?: string;
  sortOrder?: number;
  subcategorySortOrder?: Record<string, number>;
}

// === Main Protocol Interface ===
interface BaseDefiProtocol {
  // === Core Information ===
  title: string; // Keep title as string since it's usually a proper noun
  href: string;
  description: string; // i18n key for protocol description
  subcategory: string;
  categoryBreakdown?: string; // i18n key for category breakdown
  status: ProtocolStatus;
  launchDate?: ISODateString;
  color: string;
  logo?: string;
  lastUpdated?: ISODateString; // When this protocol data was last updated

  // === Search & Filter ===
  tags?: TranslatableStringArray; // Translatable keywords for search/filter

  // === Network & Technical ===
  networks: NetworkType[];
  blockchainSupported?: string[];
  isOpenSource?: boolean;

  // === Security & Audit ===
  security: {
    auditStatus: AuditStatus;
    auditFirms?: string[];
    metrics?: SecurityMetrics;
  };

  // === TVL Data ===
  tvl: {
    current: string;
    defiLlama?: string; // Optional DeFi Llama TVL value for protocols listed there
    change7d?: string;
    change30d?: string;
    lastUpdated?: ISODateString; // When TVL data was last updated
    source?: DataSource; // Data source tracking
    breakdown?: {
      byToken?: Record<string, string>;
      byChain?: Record<string, string>;
    };
    historical?: Array<{
      date: ISODateString;
      value: string;
    }>;
  };

  // === Volume Data ===
  volume?: {
    daily?: string;
    total?: string;
    change24h?: string;
    change7d?: string;
    volume7d?: string;
    volume30d?: string;
    lastUpdated?: ISODateString; // When volume data was last updated
    source?: DataSource; // Data source tracking
    // Protocol-specific volumes
    dex?: string; // DEX trading volume
    options?: string; // Options trading volume
    derivatives?: string; // Derivatives/perps volume
    optionsChange24h?: string; // Options volume 24h change
    openInterest?: string; // Open interest for derivatives
  };

  // === Revenue & Fees ===
  financials?: {
    lastUpdated?: ISODateString; // When financial data was last updated
    source?: DataSource; // Data source tracking
    fees?: {
      daily?: string;
      weekly?: string;
      monthly?: string;
      change24h?: string;
    };
    revenue?: {
      daily?: string;
      weekly?: string;
      monthly?: string;
      change24h?: string;
      revenueToProtocol?: string; // Revenue that goes to the protocol treasury
      revenueToLPs?: string; // Revenue that goes to liquidity providers/suppliers
    };
  };

  // === Yields & APY ===
  yields?: {
    average?: string;
    max?: string;
    min?: string;
    current?: string[];
    pools?: Array<{
      poolId: string;
      symbol: string;
      apy: number;
      apyBase?: number; // Base APY from trading fees
      apyReward?: number; // APY from rewards
      tvlUsd: number;
      underlyingTokens?: string[];
      rewardTokens?: string[];
      ilRisk?: boolean; // Impermanent loss risk
    }>;
    lastUpdated?: ISODateString; // When yield data was last updated
    source?: DataSource; // Data source tracking
  };

  // === Token Information ===
  token?: {
    governanceToken?: string;
    governanceTokenSymbol?: string; // Added symbol field
    addresses?: Record<string, string>; // Contract addresses per chain
    price?: string;
    priceChange24h?: string;
    priceChange7d?: string; // 7-day price change
    marketCap?: string;
    fdv?: string; // Fully diluted valuation
    ath?: string; // All-time high price
    atl?: string; // All-time low price
    lastUpdated?: ISODateString; // When token data was last updated
    source?: DataSource; // Data source tracking
    supply?: {
      total?: string;
      circulating?: string;
      staked?: string; // Staked tokens
    };
  };

  // === Pools & Staking ===
  pools?: PoolData[];

  // === Lending/Borrowing Metrics ===
  lending?: {
    borrowRates?: Array<{
      symbol: string;
      apyBorrow: number;
      apyBaseBorrow?: number;
      totalBorrowUsd: number;
      ltv?: number;
    }>;
    supplyRates?: Array<{
      symbol: string;
      apyBase: number;
      apyReward?: number;
      totalSupplyUsd: number;
    }>;
    utilization?: number; // Overall utilization rate
    totalSupplied?: string;
    totalBorrowed?: string;
  };

  // === Stablecoin Metrics ===
  stablecoins?: {
    exposure?: string; // Total stablecoin exposure
    breakdown?: Record<string, string>; // Breakdown by stablecoin
    dominance?: number; // Stablecoin dominance percentage
  };

  // === User & Usage Data ===
  users?: LargeNumberString; // Using utility type for large numbers
  feeStructure?: TranslatableString; // Translatable fee structure explanation

  // === Technical Integration ===
  integration?: {
    smartContractLinks?: string[];
    deploymentAddresses?: string[];
    deployerAddress?: string;
    apiEndpoints?: {
      rest?: string;
      graphql?: string;
      websocket?: string;
    };
    sdkLanguages?: string[];
    docs?: string;
    integrations?: string[];
    description?: TranslatableString; // Translatable integration description
  };

  // === External Links & Social ===
  external: {
    socials?: Record<string, string>;
    notableBackers?: string[];
  };
}

// === Protocol Type Definitions ===
export type CreditProtocol = BaseDefiProtocol & {
  category: "Credit";
  implementation: CreditImplementation; // Now required
};

export type YieldProtocol = BaseDefiProtocol & {
  category: "Yield";
  implementation: YieldImplementation; // Now required
};

export type TradingProtocol = BaseDefiProtocol & {
  category: "Trading";
  implementation: TradingImplementation; // Now required
};

export type MultipleProtocol = BaseDefiProtocol & {
  category: "Multiple";
  implementation: MultipleImplementation; // Now required
};

// === Main Union Type ===
export type DefiProtocol = CreditProtocol | YieldProtocol | TradingProtocol | MultipleProtocol;

// === Localization Helpers ===
export type LocalizationHelpers = {
  // Get translated text with fallback to English
  getText: (translatable: TranslatableString, locale: SupportedLanguage) => string;
  // Get translated array with fallback to English
  getArray: (translatable: TranslatableStringArray, locale: SupportedLanguage) => string[];
  // Check if translation exists for a specific locale
  hasTranslation: (
    translatable: TranslatableString | TranslatableStringArray,
    locale: SupportedLanguage
  ) => boolean;
};

// Protocol category - maintain backward compatibility with existing portfolio types
export type ProtocolCategory =
  | "lending"
  | "dex"
  | "yield"
  | "derivatives"
  | "cdp"
  | "liquid-staking"
  | "oracle"
  | "gaming"
  | "social"
  | "bridge"
  | "launchpad"
  | "aggregator"
  | "nft";

// Base DeFi position - existing interface for portfolio compatibility
export interface DeFiPosition {
  // Required fields
  positionId: string; // Was missing in some places
  protocol: string;
  protocolType: string;
  totalValue: number;
  address: string;

  // Backward compatibility fields
  totalValueUSD?: number; // Alias for totalValue
  protocol_type?: string; // Alias for protocolType
  tvl_usd?: number; // Alternative name for totalValue
  id?: string; // Alternative name for positionId
  type?: string; // Position type
  assets?: any[]; // Position assets
  metadata?: any; // Additional metadata

  // Position details
  position: {
    supplied?: Array<{
      asset: string;
      amount: string;
      value: number;
      apy?: number;
    }>;
    borrowed?: Array<{
      asset: string;
      amount: string;
      value: number;
      apy?: number;
    }>;
    staked?: Array<{
      asset: string;
      amount: string;
      value: number;
      apy?: number;
    }>;
    liquidity?: Array<{
      poolId: string;
      lpTokens: string;
      value?: number;
      token0?: {
        symbol: string;
        amount: string;
        value?: number;
      };
      token1?: {
        symbol: string;
        amount: string;
        value?: number;
      };
      apy?: number;
    }>;
    rewards?: Array<{
      asset: string;
      amount: string;
      value: number;
    }>;
  };

  // Protocol metadata
  protocolInfo?: {
    name: string;
    category: string;
    logo?: string;
    website?: string;
    tvl?: number;
  };

  // Risk metrics
  risk?: {
    level: "low" | "medium" | "high";
    factors?: string[];
  };

  // Health metrics
  health?: {
    ratio?: number;
    status?: "healthy" | "warning" | "danger";
  };
}

// Grouped DeFi position for UI
export interface GroupedDeFiPosition {
  protocol: string;
  protocolLabel: string;
  protocolType: string;
  positions: DeFiPosition[];
  totalValue: number;
  logo?: string;
  apy?: number;
  health?: {
    ratio?: number;
    status?: "healthy" | "warning" | "danger";
  };
}

// Protocol info
export interface ProtocolInfo {
  id: string;
  name: string;
  category: ProtocolCategory;
  logo?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  tvl?: number;
  volume24h?: number;
  users?: number;
  chains?: string[];
  description?: string;
  audits?: string[];
  isVerified?: boolean;
}

// APY/APR info
export interface YieldInfo {
  apy?: number;
  apr?: number;
  rewards?: Array<{
    token: string;
    apy: number;
  }>;
  isCompounding?: boolean;
  frequency?: "daily" | "weekly" | "monthly" | "continuous";
}

// Pool info for DEXes
export interface PoolInfo {
  poolId: string;
  token0: {
    address: string;
    symbol: string;
    decimals: number;
    reserve: string;
  };
  token1: {
    address: string;
    symbol: string;
    decimals: number;
    reserve: string;
  };
  lpTokenAddress?: string;
  totalSupply?: string;
  fee?: number;
  volume24h?: number;
  tvl?: number;
  apy?: number;
}

// Lending market info
export interface LendingMarket {
  asset: string;
  symbol: string;
  totalSupplied: string;
  totalBorrowed: string;
  supplyApy: number;
  borrowApy: number;
  utilizationRate: number;
  availableLiquidity: string;
  collateralFactor?: number;
  liquidationThreshold?: number;
}

// CDP/Vault info
export interface VaultInfo {
  vaultId: string;
  collateral: {
    asset: string;
    amount: string;
    value: number;
  };
  debt: {
    asset: string;
    amount: string;
    value: number;
  };
  collateralizationRatio: number;
  liquidationPrice?: number;
  availableToBorrow?: string;
  stabilityFee?: number;
}

// Type guards
export function isDeFiPosition(obj: any): obj is DeFiPosition {
  return (
    obj &&
    typeof obj.protocol === "string" &&
    typeof obj.protocolType === "string" &&
    typeof obj.totalValue === "number" &&
    typeof obj.address === "string" &&
    obj.position !== undefined
  );
}

export function hasHealthStatus(position: DeFiPosition): boolean {
  return !!position.health?.status;
}

export function hasRewards(position: DeFiPosition): boolean {
  return !!(position.position.rewards && position.position.rewards.length > 0);
}

// Helper functions
export function getProtocolTypeLabel(type: ProtocolType | string): string {
  const labels: Record<string, string> = {
    [ProtocolType.LENDING]: "Lending",
    [ProtocolType.DEX]: "DEX",
    [ProtocolType.YIELD]: "Yield",
    [ProtocolType.FARMING]: "Farming",
    [ProtocolType.DERIVATIVES]: "Derivatives",
    [ProtocolType.CDP]: "CDP",
    [ProtocolType.LIQUID_STAKING]: "Liquid Staking",
    [ProtocolType.ORACLE]: "Oracle",
    [ProtocolType.GAMING]: "Gaming",
    [ProtocolType.SOCIAL]: "Social",
    [ProtocolType.BRIDGE]: "Bridge",
    [ProtocolType.LAUNCHPAD]: "Launchpad",
    [ProtocolType.AGGREGATOR]: "Aggregator",
    [ProtocolType.NFT]: "NFT",
  };
  return labels[type] || type;
}

export function calculateHealthRatio(supplied: number, borrowed: number): number {
  if (borrowed === 0) return 100;
  return (supplied / borrowed) * 100;
}

export function getHealthStatus(ratio: number): "healthy" | "warning" | "danger" {
  if (ratio >= 150) return "healthy";
  if (ratio >= 120) return "warning";
  return "danger";
}
