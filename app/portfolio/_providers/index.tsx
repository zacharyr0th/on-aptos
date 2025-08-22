"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";

import { usePortfolioData, usePortfolioHistory } from "@/app/portfolio/_hooks";

// ============================================================================
// Portfolio Context
// ============================================================================
interface PortfolioContextType {
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

const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined,
);

// ============================================================================
// Selection Context
// ============================================================================
interface SelectionContextType {
  selectedAsset: Record<string, unknown> | null;
  selectedNFT: Record<string, unknown> | null;
  selectedDeFiPosition: Record<string, unknown> | null;
  activeTab: "portfolio" | "transactions" | "yield";
  sidebarView: "assets" | "nfts" | "defi";

  setSelectedAsset: (asset: Record<string, unknown> | null) => void;
  setSelectedNFT: (nft: Record<string, unknown> | null) => void;
  setSelectedDeFiPosition: (position: Record<string, unknown> | null) => void;
  setActiveTab: (tab: "portfolio" | "transactions" | "yield") => void;
  setSidebarView: (view: "assets" | "nfts" | "defi") => void;

  clearAllSelections: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined,
);

// ============================================================================
// Filter Context
// ============================================================================
interface FilterContextType {
  hideFilteredAssets: boolean;
  showOnlyVerified: boolean;
  searchQuery: string;
  defiSortBy: "value" | "protocol" | "type";
  defiSortOrder: "asc" | "desc";

  setHideFilteredAssets: (value: boolean) => void;
  setShowOnlyVerified: (value: boolean) => void;
  setSearchQuery: (query: string) => void;
  setDeFiSort: (
    by: "value" | "protocol" | "type",
    order: "asc" | "desc",
  ) => void;

  filterAssets: (assets: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
  filterNFTs: (nfts: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

// ============================================================================
// Combined Provider
// ============================================================================
interface PortfolioProvidersProps {
  children: ReactNode;
  address: string | undefined;
  timeframe?: "1h" | "12h" | "24h" | "7d" | "30d" | "90d" | "1y" | "all";
}

export function PortfolioProviders({
  children,
  address,
  timeframe = "1y",
}: PortfolioProvidersProps) {
  // Portfolio data
  const {
    assets,
    nfts,
    defiPositions,
    transactions,
    isLoading,
    nftsLoading,
    defiLoading,
    transactionsLoading,
    hasMoreNFTs,
    hasMoreTransactions,
    isLoadingMore,
    loadMoreNFTs,
    error,
    totalNFTCount,
    totalTransactionCount,
    allNFTs,
    nftCollectionStats,
  } = usePortfolioData(address, false);

  const {
    data: history,
    isLoading: historyLoading,
    currentPrice,
    previousPrice,
    averageHistory,
    accountNames,
  } = usePortfolioHistory(address, { timeframe });

  // Selection state
  const [selectedAsset, setSelectedAsset] = useState<Record<string, unknown> | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<Record<string, unknown> | null>(null);
  const [selectedDeFiPosition, setSelectedDeFiPosition] = useState<Record<string, unknown> | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "portfolio" | "transactions" | "yield"
  >("portfolio");
  const [sidebarView, setSidebarView] = useState<"assets" | "nfts" | "defi">(
    "assets",
  );

  const clearAllSelections = () => {
    setSelectedAsset(null);
    setSelectedNFT(null);
    setSelectedDeFiPosition(null);
  };

  // Filter state
  const [hideFilteredAssets, setHideFilteredAssets] = useState(true);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [defiSortBy, setDefiSortBy] = useState<"value" | "protocol" | "type">(
    "value",
  );
  const [defiSortOrder, setDefiSortOrder] = useState<"asc" | "desc">("desc");

  const setDeFiSort = (
    by: "value" | "protocol" | "type",
    order: "asc" | "desc",
  ) => {
    setDefiSortBy(by);
    setDefiSortOrder(order);
  };

  const filterAssets = useMemo(() => {
    return (assets: Array<Record<string, unknown>>) => {
      if (!assets) return [];

      let filtered = [...assets];

      if (hideFilteredAssets) {
        filtered = filtered.filter((asset) => {
          // Always include APT
          if (asset.asset_type === "0x1::aptos_coin::AptosCoin") return true;

          // Filter out CELL tokens
          const isCellToken =
            asset.asset_type ===
              "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12" ||
            asset.metadata?.symbol === "CELL";
          if (isCellToken) return false;

          // Filter out low value assets
          return (asset.value || 0) >= 0.01;
        });
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (asset) =>
            asset.metadata?.symbol?.toLowerCase().includes(query) ||
            asset.metadata?.name?.toLowerCase().includes(query),
        );
      }

      if (showOnlyVerified) {
        filtered = filtered.filter((asset) => asset.metadata?.verified);
      }

      return filtered;
    };
  }, [hideFilteredAssets, searchQuery, showOnlyVerified]);

  const filterNFTs = useMemo(() => {
    return (nfts: Array<Record<string, unknown>>) => {
      if (!nfts) return [];

      if (!searchQuery) return nfts;

      const query = searchQuery.toLowerCase();
      return nfts.filter(
        (nft) =>
          nft.current_token_data?.token_name?.toLowerCase().includes(query) ||
          nft.current_token_data?.collection_name
            ?.toLowerCase()
            .includes(query),
      );
    };
  }, [searchQuery]);

  // Context values
  const portfolioValue: PortfolioContextType = {
    address,
    assets: assets || [],
    nfts: nfts || [],
    defiPositions: defiPositions || [],
    transactions: transactions || [],
    isLoading,
    nftsLoading,
    defiLoading,
    transactionsLoading,
    hasMoreNFTs,
    hasMoreTransactions,
    isLoadingMore,
    loadMoreNFTs,
    error,
    totalNFTCount,
    totalTransactionCount,
    allNFTs: allNFTs || [],
    nftCollectionStats,
    history,
    historyLoading,
    currentPrice: currentPrice ?? undefined,
    previousPrice: previousPrice ?? undefined,
    averageHistory,
    accountNames: accountNames || [],
  };

  const selectionValue: SelectionContextType = {
    selectedAsset,
    selectedNFT,
    selectedDeFiPosition,
    activeTab,
    sidebarView,
    setSelectedAsset,
    setSelectedNFT,
    setSelectedDeFiPosition,
    setActiveTab,
    setSidebarView,
    clearAllSelections,
  };

  const filterValue: FilterContextType = {
    hideFilteredAssets,
    showOnlyVerified,
    searchQuery,
    defiSortBy,
    defiSortOrder,
    setHideFilteredAssets,
    setShowOnlyVerified,
    setSearchQuery,
    setDeFiSort,
    filterAssets,
    filterNFTs,
  };

  return (
    <PortfolioContext.Provider value={portfolioValue}>
      <SelectionContext.Provider value={selectionValue}>
        <FilterContext.Provider value={filterValue}>
          {children}
        </FilterContext.Provider>
      </SelectionContext.Provider>
    </PortfolioContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================
export function usePortfolioContext() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error(
      "usePortfolioContext must be used within PortfolioProviders",
    );
  }
  return context;
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelection must be used within PortfolioProviders");
  }
  return context;
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within PortfolioProviders");
  }
  return context;
}

// Re-export the old provider names for backward compatibility
export const PortfolioProvider = PortfolioProviders;
export const SelectionProvider = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);
export const FilterProvider = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);
