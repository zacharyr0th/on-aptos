import { useState, useMemo } from "react";

import type { NFT, SortDirection, ViewMode } from "@/lib/types/consolidated";

export interface PortfolioState {
  // View states
  showAccountSwitcher: boolean;
  nftViewMode: ViewMode | "collection";
  selectedNFT: NFT | null;
  nftShuffle: number;
  nftPage: number;
  hoveredCollection: string | null;
  selectedAsset: any;
  selectedDeFiPosition: any;
  activeTab: "portfolio" | "transactions" | "yield";
  sidebarView: "assets" | "nfts" | "defi";

  // Sort states
  defiSortBy: "protocol" | "type" | "value";
  defiSortOrder: SortDirection;

  // Filter states
  filterBySymbol: string[];
  filterByProtocol: string[];
  nftSortField: string;
  nftSortDirection: SortDirection;

  // UI states
  isDialogOpen: boolean;
  selectedDialogProtocol: string | null;
}

interface UsePortfolioMetricsProps {
  portfolioAssets?: any[];
  defiPositions?: any[];
  groupedDeFiPositions?: any[];
  history?: any[];
  averageHistory?: any[];
  currentPrice?: number;
  previousPrice?: number;
}

export const usePortfolio = (
  nfts?: NFT[],
  metricsProps?: UsePortfolioMetricsProps,
) => {
  // State management
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [nftViewMode, setNftViewMode] = useState<ViewMode | "collection">(
    "grid",
  );
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [nftShuffle, setNftShuffle] = useState(0);
  const [nftPage, setNftPage] = useState(0);
  const [hoveredCollection, setHoveredCollection] = useState<string | null>(
    null,
  );
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedDeFiPosition, setSelectedDeFiPosition] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "portfolio" | "transactions" | "yield"
  >("portfolio");
  const [sidebarView, setSidebarView] = useState<"assets" | "nfts" | "defi">(
    "assets",
  );
  const [defiSortBy, setDefiSortBy] = useState<"protocol" | "type" | "value">(
    "value",
  );
  const [defiSortOrder, setDefiSortOrder] = useState<SortDirection>("desc");
  const [filterBySymbol, setFilterBySymbol] = useState<string[]>([]);
  const [filterByProtocol, setFilterByProtocol] = useState<string[]>([]);
  const [nftSortField, setNftSortField] = useState<string>("name");
  const [nftSortDirection, setNftSortDirection] =
    useState<SortDirection>("asc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDialogProtocol, setSelectedDialogProtocol] = useState<
    string | null
  >(null);

  // NFT Shuffle logic
  const shuffleNFTs = () => {
    setNftShuffle((prev) => prev + 1);
  };

  const shuffledNFTs = useMemo(() => {
    if (!nfts || nfts.length === 0) return [];

    const shuffled = [...nfts];
    let currentIndex = shuffled.length;
    let randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[currentIndex],
      ];
    }

    return shuffled;
  }, [nfts, nftShuffle]);

  // Portfolio metrics calculations
  const portfolioMetrics = useMemo(() => {
    if (!metricsProps) return null;

    const {
      portfolioAssets,
      groupedDeFiPositions,
      history,
      currentPrice,
      previousPrice,
    } = metricsProps;

    const totalAssetsValue =
      portfolioAssets?.reduce((sum, asset) => sum + (asset.value || 0), 0) || 0;

    const totalDefiValue =
      groupedDeFiPositions?.reduce(
        (sum, position) => sum + (position.totalValue || 0),
        0,
      ) || 0;

    const totalPortfolioValue = totalAssetsValue + totalDefiValue;

    const priceChange24h =
      currentPrice && previousPrice
        ? ((currentPrice - previousPrice) / previousPrice) * 100
        : 0;

    const last24hValue =
      history && history.length > 0
        ? history[history.length - 1]?.total_balance || 0
        : 0;

    const firstValue =
      history && history.length > 0 ? history[0]?.total_balance || 0 : 0;

    const portfolioChange24h =
      firstValue > 0 ? ((last24hValue - firstValue) / firstValue) * 100 : 0;

    return {
      totalAssetsValue,
      totalDefiValue,
      totalPortfolioValue,
      priceChange24h,
      portfolioChange24h,
      last24hValue,
      firstValue,
    };
  }, [metricsProps]);

  const chartData = useMemo(() => {
    if (
      !metricsProps?.averageHistory ||
      metricsProps.averageHistory.length === 0
    )
      return [];

    return metricsProps.averageHistory
      .map((item: any) => ({
        time: new Date(item.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: item.timestamp,
        value: item.total_balance,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [metricsProps?.averageHistory]);

  const pieChartData = useMemo(() => {
    if (
      !metricsProps?.portfolioAssets ||
      metricsProps.portfolioAssets.length === 0
    )
      return [];

    const aggregatedAssets = metricsProps.portfolioAssets.reduce(
      (acc: any, asset) => {
        const symbol = asset.metadata?.symbol || "Unknown";
        if (!acc[symbol]) {
          acc[symbol] = {
            symbol,
            value: 0,
            percentage: 0,
          };
        }
        acc[symbol].value += asset.value || 0;
        return acc;
      },
      {},
    );

    const totalValue = Object.values(aggregatedAssets).reduce(
      (sum: number, asset: any) => sum + Number(asset.value || 0),
      0,
    );

    return Object.values(aggregatedAssets)
      .map((asset: any) => ({
        ...asset,
        percentage:
          Number(totalValue) > 0
            ? (Number(asset.value) / Number(totalValue)) * 100
            : 0,
      }))
      .sort((a: any, b: any) => Number(b.value) - Number(a.value))
      .slice(0, 8);
  }, [metricsProps?.portfolioAssets]);

  const pieChartColors = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#f43f5e",
    "#6366f1",
  ];

  // Handlers
  const handleDeFiSort = (sortBy: string, order: "asc" | "desc") => {
    setDefiSortBy(sortBy as "protocol" | "type" | "value");
    setDefiSortOrder(order);
  };

  const handleAssetSelect = (asset: any) => {
    setSelectedAsset(asset);
    setSidebarView("assets");
  };

  const handleDeFiPositionSelect = (position: any) => {
    setSelectedDeFiPosition(position);
    setSidebarView("defi");
  };

  const resetSelections = () => {
    setSelectedAsset(null);
    setSelectedDeFiPosition(null);
    setSelectedNFT(null);
  };

  const handleSidebarViewChange = (view: "assets" | "nfts" | "defi") => {
    // Clear selections when switching views to prevent overlapping content
    if (view === "nfts") {
      setSelectedAsset(null);
      setSelectedDeFiPosition(null);
    } else if (view === "assets") {
      setSelectedNFT(null);
      setSelectedDeFiPosition(null);
    } else if (view === "defi") {
      setSelectedAsset(null);
      setSelectedNFT(null);
    }
    setSidebarView(view);
  };

  return {
    // States
    showAccountSwitcher,
    nftViewMode,
    selectedNFT,
    nftShuffle,
    nftPage,
    hoveredCollection,
    selectedAsset,
    selectedDeFiPosition,
    activeTab,
    sidebarView,
    defiSortBy,
    defiSortOrder,
    filterBySymbol,
    filterByProtocol,
    nftSortField,
    nftSortDirection,
    isDialogOpen,
    selectedDialogProtocol,

    // Setters
    setShowAccountSwitcher,
    setNftViewMode,
    setSelectedNFT,
    setNftShuffle,
    setNftPage,
    setHoveredCollection,
    setSelectedAsset,
    setSelectedDeFiPosition,
    setActiveTab,
    setSidebarView,
    setDefiSortBy,
    setDefiSortOrder,
    setFilterBySymbol,
    setFilterByProtocol,
    setNftSortField,
    setNftSortDirection,
    setIsDialogOpen,
    setSelectedDialogProtocol,

    // Handlers
    handleDeFiSort,
    handleAssetSelect,
    handleDeFiPositionSelect,
    resetSelections,
    handleSidebarViewChange,

    // NFT Shuffle
    shuffledNFTs,
    shuffleNFTs,

    // Metrics
    portfolioMetrics,
    chartData,
    pieChartData,
    pieChartColors,
  };
};
