"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Eye, EyeOff, Search, X } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";

import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";

import { usePortfolio, usePortfolioData, usePortfolioHistory } from "./hooks";
import { LandingSection } from "./LandingSection";
import { PortfolioMainContent } from "./PortfolioMainContent";
import { PortfolioSidebar } from "./PortfolioSidebar";
import { AssetsTable, DeFiPositionsTable } from "./PortfolioTables";
import { LoadingSkeleton } from "./shared/LoadingSkeletons";
import { NFTSummaryView } from "./SummaryViews";
import { getProtocolLogo } from "./shared/PortfolioMetrics";
import { WalletSummary } from "./WalletSummary";
import { YieldTable } from "./YieldTable";

export default function PortfolioPage() {
  const { connected, account } = useWallet();
  const { t } = useTranslation("common");

  // State for manual address entry
  const [manualAddress, setManualAddress] = useState<string>("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [addressError, setAddressError] = useState<string>("");

  // Normalize wallet address to ensure proper format
  const walletAddress = account?.address?.toString();

  // Determine which address to use (manual or connected wallet)
  const activeAddress = isManualMode ? manualAddress : walletAddress;

  // Ensure the address is in the correct format (66 characters, 0x prefixed)
  const normalizedAddress =
    activeAddress && !activeAddress.startsWith("0x")
      ? `0x${activeAddress}`
      : activeAddress;

  logger.debug({
    connected,
    account: account?.address,
    walletAddress,
    normalizedAddress,
    accountObject: account,
    isManualMode,
    manualAddress,
  });

  // Validate Aptos address format
  const validateAddress = (address: string) => {
    if (!address) {
      setAddressError(
        t("wallet.error_empty_address", "Please enter an address"),
      );
      return false;
    }

    const cleanAddress = address.startsWith("0x") ? address : `0x${address}`;
    const isValid = /^0x[a-fA-F0-9]{64}$/.test(cleanAddress);

    if (!isValid) {
      setAddressError(
        t("wallet.error_invalid_format", "Invalid address format"),
      );
      return false;
    }

    setAddressError("");
    return true;
  };

  // Handle manual address submission
  const handleAddressSubmit = () => {
    if (validateAddress(manualAddress)) {
      setIsManualMode(true);
    }
  };

  // Clear manual mode and return to wallet mode
  const clearManualMode = () => {
    setIsManualMode(false);
    setManualAddress("");
    setAddressError("");
  };

  // State for modals
  const [selectedTimeframe] = useState<
    "1h" | "12h" | "24h" | "7d" | "30d" | "90d" | "1y" | "all"
  >("1y");
  const [hideFilteredAssets, setHideFilteredAssets] = useState(true); // Start with eye closed (filtering enabled)
  const [protocolDetailsOpen, setProtocolDetailsOpen] = useState(false);

  // State for real-time APT price
  const [_aptPrice, setAptPrice] = useState<number | null>(null);

  // Fetch real-time APT price
  useEffect(() => {
    const fetchAptPrice = async () => {
      try {
        const response = await fetch(
          "/api/analytics/token-latest-price?address=0x1::aptos_coin::AptosCoin",
        );
        if (!response.ok) {
          throw new Error("Failed to fetch APT price");
        }
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          setAptPrice(data.data[0].price_usd);
        }
      } catch (error) {
        logger.error(
          `Failed to fetch APT price: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    fetchAptPrice();
    // Refresh every minute
    const interval = setInterval(fetchAptPrice, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Use consolidated hooks
  const {
    assets,
    nfts,
    defiPositions,
    transactions,
    isLoading: dataLoading,
    nftsLoading,
    defiLoading,
    transactionsLoading,
    hasMoreNFTs,
    isLoadingMore,
    loadMoreNFTs,
    error: dataError,
    totalNFTCount,
    allNFTs,
    nftCollectionStats,
  } = usePortfolioData(normalizedAddress || undefined, false);

  // Debug logging for portfolio data
  logger.debug({
    assetsCount: assets?.length || 0,
    nftsCount: nfts?.length || 0,
    defiCount: defiPositions?.length || 0,
    transactionsCount: transactions?.length || 0,
    dataLoading,
    transactionsLoading,
    dataError,
    assets: assets?.slice(0, 3), // Show first 3 assets for debugging
    nfts: nfts?.slice(0, 3), // Show first 3 NFTs for debugging
    transactions: transactions?.slice(0, 3), // Show first 3 transactions for debugging
  });

  const {
    data: history,
    isLoading: historyLoading,
    currentPrice,
    previousPrice,
    averageHistory,
    accountNames,
  } = usePortfolioHistory(normalizedAddress || undefined, {
    timeframe: selectedTimeframe,
  });

  // Group DeFi positions
  const groupedDeFiPositions = (() => {
    if (!defiPositions || !Array.isArray(defiPositions)) return [];

    const grouped = defiPositions.reduce(
      (acc, position) => {
        const protocol = position.protocol;
        if (!acc[protocol]) {
          acc[protocol] = {
            protocol,
            positions: [],
            totalValue: 0,
            protocolTypes: new Set(),
          };
        }
        acc[protocol].positions.push(position);
        acc[protocol].totalValue +=
          position.totalValueUSD ||
          position.totalValue ||
          position.tvl_usd ||
          0;
        const protocolType = position.protocolType || position.protocol_type;
        if (protocolType) {
          acc[protocol].protocolTypes.add(protocolType);
        }
        return acc;
      },
      {} as Record<
        string,
        {
          protocol: string;
          positions: typeof defiPositions;
          totalValue: number;
          protocolTypes: Set<string>;
        }
      >,
    );

    return Object.values(grouped);
  })();

  // Filter assets to exclude dust tokens (removed CELL and MKLP from default filter)
  const FILTERED_ADDRESSES = useMemo<string[]>(
    () => [
      // Removed CELL and MKLP from default filter to show all user tokens
    ],
    [],
  );

  const visibleAssets = useMemo(() => {
    if (!assets) return [];

    // When eye is open (hideFilteredAssets = false), show ALL assets including CELL
    if (!hideFilteredAssets) return assets;

    // When eye is closed (hideFilteredAssets = true), apply filters including hiding CELL
    return assets.filter((asset) => {
      // Always include APT regardless of value
      if (asset.asset_type === "0x1::aptos_coin::AptosCoin") return true;

      // Filter out CELL tokens
      const isCellToken =
        asset.asset_type ===
          "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12" ||
        asset.metadata?.symbol === "CELL";
      if (isCellToken) return false;

      // Filter out hardcoded addresses if any
      if (
        FILTERED_ADDRESSES.length > 0 &&
        FILTERED_ADDRESSES.includes(asset.asset_type)
      )
        return false;

      // Filter out assets under $0.01 (lowered threshold to show more tokens)
      return (asset.value || 0) >= 0.01;
    });
  }, [assets, FILTERED_ADDRESSES, hideFilteredAssets]);

  // Use consolidated state management hook
  const {
    // States
    selectedNFT,
    selectedAsset,
    selectedDeFiPosition,
    activeTab,
    sidebarView,
    defiSortBy,
    defiSortOrder,

    // Setters
    setSelectedNFT,
    setSidebarView,
    setActiveTab,

    // Handlers
    handleDeFiSort,
    handleAssetSelect,
    handleDeFiPositionSelect,

    // NFT Shuffle
    shuffledNFTs,

    // Metrics
    portfolioMetrics,
    pieChartData,
    pieChartColors,
  } = usePortfolio(nfts || undefined, {
    portfolioAssets: visibleAssets || undefined,
    defiPositions: defiPositions || undefined,
    groupedDeFiPositions: groupedDeFiPositions || undefined,
    history: history || undefined,
    averageHistory: averageHistory || undefined,
    currentPrice: currentPrice || undefined,
    previousPrice: previousPrice || undefined,
  });

  // Handle click outside to deselect items and return to chart view
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't deselect if clicking on sidebar tables or performance content
      if (
        target.closest(".asset-table-container") ||
        target.closest(".defi-table-container") ||
        target.closest(".nft-grid-container") ||
        target.closest(".dropdown-menu") ||
        target.closest("button") ||
        target.closest(".performance-content") ||
        target.closest('[role="tabpanel"]')
      ) {
        return;
      }

      // Clear all selections to return to default chart view
      if (selectedAsset || selectedDeFiPosition || selectedNFT) {
        handleAssetSelect(null);
        handleDeFiPositionSelect(null);
        setSelectedNFT(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    selectedAsset,
    selectedDeFiPosition,
    selectedNFT,
    handleAssetSelect,
    handleDeFiPositionSelect,
    setSelectedNFT,
  ]);

  // Show all NFTs (no pagination limit)
  const currentNFTs = shuffledNFTs || [];

  // Loading state
  const isLoading = dataLoading || historyLoading;

  // Show landing section if no wallet connected and no manual address
  if (!normalizedAddress) {
    return (
      <LandingSection
        onManualAddressSubmit={(address) => {
          setManualAddress(address);
          if (validateAddress(address)) {
            setIsManualMode(true);
          }
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col relative">
        {/* Background gradient - fixed to viewport */}
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

        <main className="w-full px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 flex-1 relative">
          {/* Address search skeleton */}
          <div className="mb-6">
            <div className="flex justify-center items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-background/80 backdrop-blur-md border border-border/40 rounded-lg shadow-sm">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex gap-6">
            {/* Left Sidebar */}
            <div className="w-80 xl:w-96 space-y-6">
              <Skeleton className="h-80 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Header with tabs skeleton */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-20 rounded-md" />
                  ))}
                </div>
              </div>

              {/* Content skeleton */}
              <div className="space-y-4">
                <LoadingSkeleton variant="asset-table" rows={8} />
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-6">
            {/* Portfolio header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-40" />
              </div>
              <Skeleton className="h-48 rounded-lg" />
            </div>

            {/* Tabs skeleton */}
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-16 rounded-md" />
              ))}
            </div>

            {/* Content skeleton */}
            <LoadingSkeleton variant="asset-table" rows={6} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

      <main className="w-full px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 flex-1 relative">
        {/* Minimal address search bar with indicator - only show when not connected or in manual mode */}
        {(!connected || isManualMode) && (
          <div className="mb-6">
            <div className="flex justify-center items-center gap-4">
              {!isManualMode && (
                <div className="relative w-full max-w-lg">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t(
                      "wallet.search_placeholder",
                      "View any wallet address...",
                    )}
                    value={manualAddress}
                    onChange={(e) => {
                      setManualAddress(e.target.value);
                      setAddressError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddressSubmit();
                      }
                    }}
                    className={cn(
                      "pl-10 pr-10 h-10 transition-all",
                      addressError &&
                        "border-destructive focus-visible:ring-destructive/50",
                    )}
                  />
                  {manualAddress && (
                    <button
                      onClick={clearManualMode}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {addressError && (
                    <p className="absolute -bottom-6 left-0 text-xs text-destructive">
                      {addressError}
                    </p>
                  )}
                </div>
              )}
              {isManualMode && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border border-border/50">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium font-mono">
                    {t("wallet.viewing_label", "Viewing")} {normalizedAddress}
                  </span>
                  <button
                    onClick={clearManualMode}
                    className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear viewing mode"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desktop layout remains the same */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-5 gap-6">
          <PortfolioSidebar
            sidebarView={sidebarView}
            setSidebarView={setSidebarView}
            visibleAssets={visibleAssets}
            selectedAsset={selectedAsset}
            handleAssetSelect={handleAssetSelect}
            assets={assets || []}
            nfts={nfts || []}
            dataLoading={dataLoading}
            nftsLoading={nftsLoading}
            defiLoading={defiLoading}
            hasMoreNFTs={hasMoreNFTs}
            isLoadingMore={isLoadingMore}
            loadMoreNFTs={loadMoreNFTs}
            selectedNFT={selectedNFT}
            setSelectedNFT={setSelectedNFT}
            accountNames={accountNames}
            groupedDeFiPositions={groupedDeFiPositions || []}
            selectedDeFiPosition={selectedDeFiPosition}
            defiSortBy={defiSortBy}
            defiSortOrder={defiSortOrder}
            getProtocolLogo={getProtocolLogo}
            handleDeFiPositionSelect={handleDeFiPositionSelect}
            handleDeFiSort={handleDeFiSort}
            totalValue={portfolioMetrics?.totalPortfolioValue || 0}
            walletAddress={normalizedAddress}
            hideFilteredAssets={hideFilteredAssets}
            setHideFilteredAssets={setHideFilteredAssets}
            pieChartData={pieChartData}
            pieChartColors={pieChartColors}
            totalNFTCount={totalNFTCount}
            nftCollectionStats={nftCollectionStats}
          />

          <PortfolioMainContent
            activeTab={activeTab}
            setActiveTab={(tab: string) =>
              setActiveTab(tab as "portfolio" | "transactions" | "yield")
            }
            selectedAsset={selectedAsset}
            handleAssetSelect={handleAssetSelect}
            selectedDeFiPosition={selectedDeFiPosition}
            handleDeFiPositionSelect={handleDeFiPositionSelect}
            selectedNFT={selectedNFT}
            setSelectedNFT={setSelectedNFT}
            sidebarView={sidebarView}
            setSidebarView={setSidebarView}
            nfts={nfts || []}
            currentNFTs={currentNFTs}
            normalizedAddress={normalizedAddress || ""}
            assets={visibleAssets}
            groupedDeFiPositions={groupedDeFiPositions || []}
            portfolioMetrics={portfolioMetrics}
            dataLoading={dataLoading}
            pieChartData={pieChartData}
            pieChartColors={pieChartColors}
            accountNames={accountNames}
            setHoveredCollection={(_collection: string | null) => {}}
            setProtocolDetailsOpen={setProtocolDetailsOpen}
            totalNFTCount={totalNFTCount}
            nftCollectionStats={nftCollectionStats}
            defiPositions={defiPositions || []}
            transactions={transactions}
            transactionsLoading={transactionsLoading}
          />
        </div>

        {/* Mobile layout - Single scroll with all content */}
        <div className="lg:hidden space-y-6">
          {/* Portfolio Chart */}
          <WalletSummary
            walletAddress={normalizedAddress}
            assets={visibleAssets || []}
            totalValue={portfolioMetrics?.totalPortfolioValue || 0}
            isLoading={dataLoading}
            selectedAsset={selectedAsset}
            onAssetSelect={handleAssetSelect}
            pieChartData={pieChartData}
            pieChartColors={pieChartColors}
            nfts={nfts || []}
            totalNFTCount={totalNFTCount}
            aptPrice={_aptPrice || undefined}
          />

          {/* Tokens Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Tokens ({visibleAssets?.length || 0})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideFilteredAssets(!hideFilteredAssets)}
                className="h-8 w-8 p-0 hover:bg-muted"
                title={
                  hideFilteredAssets
                    ? "Show all assets (including CELL tokens)"
                    : "Hide low-value and CELL tokens"
                }
              >
                {hideFilteredAssets ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <AssetsTable
              visibleAssets={visibleAssets}
              selectedItem={selectedAsset}
              showOnlyVerified={false}
              portfolioAssets={assets || []}
              onItemSelect={handleAssetSelect}
            />
          </div>

          {/* NFTs Section */}
          {(totalNFTCount !== null && totalNFTCount > 0) ||
          (nfts && nfts.length > 0) ? (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                NFTs (
                {totalNFTCount !== null ? totalNFTCount : (nfts?.length ?? 0)})
              </h3>
              <NFTSummaryView
                nfts={allNFTs || nfts || []}
                currentPageNFTs={nfts?.length || 0}
                onCollectionClick={() => {}}
                includeGrid={true}
                filteredNFTs={nfts || undefined}
                nftsLoading={nftsLoading}
                hasMoreNFTs={hasMoreNFTs}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMoreNFTs}
                selectedNFT={selectedNFT}
                onNFTSelect={(nft) => {
                  setSelectedNFT(nft);
                }}
              />
            </div>
          ) : null}

          {/* DeFi Positions Section */}
          {groupedDeFiPositions && groupedDeFiPositions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                DeFi Positions ({groupedDeFiPositions.length})
              </h3>
              <DeFiPositionsTable
                groupedDeFiPositions={groupedDeFiPositions}
                defiPositionsLoading={defiLoading}
                selectedItem={selectedDeFiPosition}
                defiSortBy={defiSortBy}
                defiSortOrder={defiSortOrder}
                getProtocolLogo={getProtocolLogo}
                onItemSelect={handleDeFiPositionSelect}
                onSortChange={handleDeFiSort}
              />
            </div>
          )}

          {/* Yield Opportunities Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Yield Opportunities</h3>
            <YieldTable walletAddress={normalizedAddress} />
          </div>
        </div>

      </main>

      {/* Footer */}
      <Footer className="relative" />
    </div>
  );
}
