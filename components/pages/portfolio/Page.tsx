"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Image from "next/image";
import React, { useState, useEffect, useMemo } from "react";

import { Footer } from "@/components/layout/Footer";
import { formatCurrency } from "@/lib/utils/format";
import { logger } from "@/lib/utils/logger";
import { cn } from "@/lib/utils";

import { ProtocolDetailsDialog } from "./Dialogs";
import { usePortfolio, usePortfolioData, usePortfolioHistory } from "./hooks";
import { LandingSection } from "./LandingSection";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { PortfolioMainContent } from "./PortfolioMainContent";
import { PortfolioSidebar } from "./PortfolioSidebar";
import { WalletSummary } from "./WalletSummary";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getProtocolLogo, getDetailedProtocolInfo } from "./utils";
import { AssetsTable, DeFiPositionsTable } from "./PortfolioTables";
import { NFTSummaryView } from "./SummaryViews";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";

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
  const normalizedAddress = activeAddress
    ? activeAddress.startsWith("0x")
      ? activeAddress
      : `0x${activeAddress}`
    : null;

  logger.debug("[PortfolioPage] Wallet info:", {
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
      setAddressError(t("wallet.error_empty_address", "Please enter an address"));
      return false;
    }

    const cleanAddress = address.startsWith("0x") ? address : `0x${address}`;
    
    // Aptos addresses are 64 hex characters (plus 0x prefix = 66 total)
    const isValidFormat = /^0x[a-fA-F0-9]{64}$/.test(cleanAddress);
    
    if (!isValidFormat) {
      setAddressError(t("wallet.error_invalid_format", "Invalid address format"));
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
  const [protocolDetailsOpen, setProtocolDetailsOpen] = useState(false);
  const [selectedTimeframe] = useState<
    "1h" | "12h" | "24h" | "7d" | "30d" | "90d" | "1y" | "all"
  >("1y");
  const [hideFilteredAssets, setHideFilteredAssets] = useState(true);

  // State for real-time APT price
  const [aptPrice, setAptPrice] = useState<number | null>(null);

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
        logger.error("Failed to fetch APT price:", error);
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
    isLoading: dataLoading,
    nftsLoading,
    defiLoading,
    hasMoreNFTs,
    isLoadingMore,
    loadMoreNFTs,
    error: dataError,
    refetch: _refetchData,
    totalNFTCount,
    allNFTs,
    nftCollectionStats,
  } = usePortfolioData(normalizedAddress || undefined, false);

  // Debug logging for portfolio data
  logger.debug("[PortfolioPage] Portfolio data:", {
    assetsCount: assets?.length || 0,
    nftsCount: nfts?.length || 0,
    defiCount: defiPositions?.length || 0,
    dataLoading,
    dataError,
    assets: assets?.slice(0, 3), // Show first 3 assets for debugging
    nfts: nfts?.slice(0, 3), // Show first 3 NFTs for debugging
  });

  const {
    data: history,
    isLoading: historyLoading,
    refetch: _refetchHistory,
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

  // Filter assets to exclude CELL tokens, MKLP tokens, and dust
  const FILTERED_ADDRESSES = useMemo(
    () => [
      "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12", // CELL token
      "0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06::house_lp::MKLP", // MKLP tokens
    ],
    [],
  );

  const visibleAssets = useMemo(() => {
    if (!assets) return [];

    // When eye is open (hideFilteredAssets = false), show ALL assets
    if (!hideFilteredAssets) return assets;

    // When eye is closed (hideFilteredAssets = true), apply filters
    return assets.filter((asset) => {
      // Always include APT regardless of value
      if (asset.asset_type === "0x1::aptos_coin::AptosCoin") return true;

      // Filter out hardcoded addresses (like CELL) and MKLP tokens
      if (FILTERED_ADDRESSES.includes(asset.asset_type)) return false;
      if (
        asset.asset_type.includes("::house_lp::MKLP") ||
        asset.asset_type.includes("::mklp::MKLP")
      )
        return false;

      // Filter out assets under $0.1
      return (asset.value || 0) >= 0.1;
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

      // Don't deselect if clicking on sidebar tables, performance content, or dialogs
      if (
        target.closest(".asset-table-container") ||
        target.closest(".defi-table-container") ||
        target.closest(".nft-grid-container") ||
        target.closest('[role="dialog"]') ||
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

  // Get detailed protocol info for selected DeFi position
  const _detailedProtocolInfo = selectedDeFiPosition
    ? getDetailedProtocolInfo(selectedDeFiPosition.protocol)
    : null;

  // Loading state
  const isLoading = dataLoading || historyLoading;

  // Show landing section if no wallet connected and no manual address
  if (!normalizedAddress) {
    return <LandingSection onManualAddressSubmit={(address) => {
      setManualAddress(address);
      if (validateAddress(address)) {
        setIsManualMode(true);
      }
    }} />;
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

      <main className="container-layout py-6 flex-1 relative">
        {/* Minimal address search bar with indicator - only show when not connected or in manual mode */}
        {(!connected || isManualMode) && (
          <div className="mb-6">
            <div className="flex justify-center items-center gap-4">
              {!isManualMode && (
                <div className="relative w-full max-w-lg">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t("wallet.search_placeholder", "View any wallet address...")}
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
                      addressError && "border-destructive focus-visible:ring-destructive/50"
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
                    <p className="absolute -bottom-6 left-0 text-xs text-destructive">{addressError}</p>
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
        {/* Mobile: Show portfolio value at top */}
        <div className="md:hidden mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm text-muted-foreground">{t("wallet.portfolio_value", "Portfolio Value")}</h2>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold font-mono">
              {formatCurrency(portfolioMetrics?.totalPortfolioValue || 0)}
            </p>
            {aptPrice && (
              <div className="flex items-center gap-1.5">
                <Image
                  src="/icons/apt.png"
                  alt="APT"
                  width={16}
                  height={16}
                  className="object-contain dark:invert"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = "/placeholder.jpg";
                  }}
                />
                <span className="text-sm text-muted-foreground font-mono">
                  {formatCurrency(aptPrice)}
                </span>
              </div>
            )}
          </div>
        </div>

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
              setActiveTab(tab as "portfolio" | "transactions")
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
          />
        </div>

        {/* Mobile layout with integrated tabs */}
        <div className="lg:hidden space-y-6">
          {/* Mobile tabs above everything */}
          <Tabs
            value={sidebarView}
            onValueChange={(v) => setSidebarView(v as any)}
            className="w-full"
          >
            <div className="flex justify-between items-end w-full border-b border-neutral-200 dark:border-neutral-800">
              <TabsList className="flex justify-start gap-8 rounded-none bg-transparent p-0 h-auto border-none">
                <TabsTrigger
                  value="assets"
                  className="rounded-none px-0 pb-3 pt-3 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
                >
                  {t("labels.tokens", "Tokens")} ({visibleAssets?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="nfts"
                  className="rounded-none px-0 pb-3 pt-3 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
                >
                  NFTs{" "}
                  {totalNFTCount !== null
                    ? `(${totalNFTCount})`
                    : (nfts?.length ?? 0) > 0
                      ? `(${nfts?.length}+)`
                      : ""}
                </TabsTrigger>
                <TabsTrigger
                  value="defi"
                  className="rounded-none px-0 pb-3 pt-3 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
                >
                  {t("navigation.defi", "DeFi")} ({groupedDeFiPositions?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Eye button for tokens tab */}
              {sidebarView === "assets" && (
                <div className="flex items-center pb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHideFilteredAssets(!hideFilteredAssets)}
                    className="h-8 w-8 p-0 hover:bg-muted"
                    title={
                      hideFilteredAssets
                        ? "Show filtered assets"
                        : "Hide filtered assets"
                    }
                  >
                    {hideFilteredAssets ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Conditional content based on selected tab */}
            <TabsContent value="assets" className="mt-6 p-0">
              {/* Show WalletSummary with chart on Tokens tab */}
              <div className="space-y-6">
                <WalletSummary
                  walletAddress={normalizedAddress}
                  assets={visibleAssets || []}
                  defiPositions={groupedDeFiPositions || []}
                  totalValue={portfolioMetrics?.totalPortfolioValue || 0}
                  isLoading={dataLoading}
                  selectedAsset={selectedAsset}
                  onAssetSelect={handleAssetSelect}
                  pieChartData={pieChartData}
                  pieChartColors={pieChartColors}
                  nfts={nfts || []}
                  totalNFTCount={totalNFTCount}
                />
                <AssetsTable
                  visibleAssets={visibleAssets}
                  selectedItem={selectedAsset}
                  showOnlyVerified={false}
                  portfolioAssets={assets || []}
                  onItemSelect={handleAssetSelect}
                />
              </div>
            </TabsContent>

            <TabsContent value="nfts" className="mt-6 p-0">
              {/* NFT content with treemap, grid, and stats */}
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
            </TabsContent>

            <TabsContent value="defi" className="mt-6 p-0">
              {/* DeFi content */}
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        {selectedDeFiPosition && (
          <ProtocolDetailsDialog
            isOpen={protocolDetailsOpen}
            onClose={() => setProtocolDetailsOpen(false)}
            protocolName={selectedDeFiPosition.protocol}
            protocolLogo={getProtocolLogo(selectedDeFiPosition.protocol)}
            defiPosition={selectedDeFiPosition}
          />
        )}
      </main>

      {/* Footer */}
      <Footer className="relative" />
    </div>
  );
}
