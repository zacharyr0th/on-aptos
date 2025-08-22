// ============================================================================
// Core Portfolio Types
// ============================================================================

// Re-export types from consolidated types
export type {
  NFT,
  FungibleAsset,
  DeFiPosition,
  Transaction as TransactionData,
  PortfolioData as PortfolioSummary,
} from "@/lib/types/consolidated";

// ============================================================================
// UI State Types
// ============================================================================

export type ViewMode = "dashboard" | "simple" | "legacy";
export type SidebarView = "assets" | "nfts" | "defi";
export type ActiveTab = "portfolio" | "transactions" | "yield";
export type SortField =
  | "timestamp"
  | "type"
  | "amount"
  | "asset"
  | "value"
  | "protocol";
export type SortDirection = "asc" | "desc";
export type Timeframe =
  | "1h"
  | "12h"
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "1y"
  | "all";

// ============================================================================
// Filter Types
// ============================================================================

export interface FilterOptions {
  hideFilteredAssets: boolean;
  showOnlyVerified: boolean;
  searchQuery: string;
  defiSortBy: "value" | "protocol" | "type";
  defiSortOrder: SortDirection;
}

// ============================================================================
// Selection Types
// ============================================================================

export interface SelectionState {
  selectedAsset: Record<string, unknown> | null;
  selectedNFT: Record<string, unknown> | null;
  selectedDeFiPosition: Record<string, unknown> | null;
  activeTab: ActiveTab;
  sidebarView: SidebarView;
}

// ============================================================================
// Portfolio Context Types
// ============================================================================

export interface PortfolioContextData {
  address: string | undefined;
  assets: Array<Record<string, unknown>>;
  nfts: Array<Record<string, unknown>>;
  defiPositions: Array<Record<string, unknown>>;
  transactions: Array<Record<string, unknown>>;
  isLoading: boolean;
  nftsLoading: boolean;
  defiLoading: boolean;
  transactionsLoading: boolean;
  hasMoreNFTs: boolean;
  hasMoreTransactions: boolean;
  isLoadingMore: boolean;
  loadMoreNFTs: () => void;
  error: Error | unknown;
  totalNFTCount: number | null;
  totalTransactionCount: number | null;
  allNFTs: Array<Record<string, unknown>>;
  nftCollectionStats: unknown;
  history: unknown;
  historyLoading: boolean;
  currentPrice: number | undefined;
  previousPrice: number | undefined;
  averageHistory: unknown;
  accountNames: string[];
}

// ============================================================================
// Chart Types
// ============================================================================

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface ChartConfig {
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  color?: string;
  height?: number;
}

// ============================================================================
// Table Types
// ============================================================================

export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableConfig {
  columns: TableColumn[];
  pageSize?: number;
  showPagination?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
}

// ============================================================================
// Widget Types
// ============================================================================

export interface WidgetData {
  title: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  trend?: "up" | "down" | "neutral";
  icon?: React.ComponentType;
  color?: string;
}

// ============================================================================
// NFT Types (imported from consolidated types)
// ============================================================================

// NFTCollection and NFTMetadata imported from @/lib/types/consolidated

// ============================================================================
// Transaction Types
// ============================================================================

export interface TransactionSummary {
  hash: string;
  type: string;
  timestamp: number;
  status: "success" | "failed" | "pending";
  from: string;
  to?: string;
  amount?: number;
  fee?: number;
  asset?: string;
}

// ============================================================================
// DeFi Types
// ============================================================================

export interface DeFiProtocol {
  name: string;
  logo?: string;
  tvl?: number;
  apy?: number;
  risk?: "low" | "medium" | "high";
}

export interface DeFiPool {
  protocol: string;
  poolName: string;
  assets: string[];
  tvl: number;
  apy: number;
  userShare?: number;
  userValue?: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface PortfolioMetrics {
  totalValue: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  assetCount: number;
  nftCount: number;
  defiPositionCount: number;
  topGainer?: {
    asset: string;
    changePercent: number;
  };
  topLoser?: {
    asset: string;
    changePercent: number;
  };
}

export interface AssetAllocation {
  asset: string;
  value: number;
  percentage: number;
  color?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  timestamp: number;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export interface PortfolioError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
}

// ============================================================================
// Form Types
// ============================================================================

export interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}
