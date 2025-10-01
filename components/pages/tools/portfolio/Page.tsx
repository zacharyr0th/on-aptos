"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useSearchParams } from "next/navigation";
import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";

import { AddressBar } from "./components/AddressBar";
import { PortfolioLoadingSkeleton } from "./components/PortfolioLoadingSkeleton";
import { PortfolioProvider, usePortfolioContext } from "./context/PortfolioContext";
import { LandingSection } from "./LandingSection";

// Lazy load heavy components
const PortfolioLayout = lazy(() =>
  import("./components/PortfolioLayout").then((m) => ({ default: m.PortfolioLayout }))
);

import { useAddressValidation } from "@/lib/hooks/portfolio/useAddressValidation";
import { useAptPrice } from "@/lib/hooks/portfolio/useAptPrice";
import { useSimplifiedPortfolio } from "@/lib/hooks/portfolio/useSimplifiedPortfolio";
import { logger } from "@/lib/utils/core/logger";

function PortfolioPageContent() {
  const { connected, account } = useWallet();
  const searchParams = useSearchParams();
  const { state, dispatch, selectItem, toggleFilteredAssets, setDeFiSort } = usePortfolioContext();
  const { validateAddress, normalizeAddress, addressError, setAddressError, clearError } =
    useAddressValidation();
  const { aptPrice } = useAptPrice();

  const [selectedTimeframe] = useState<"1h" | "12h" | "24h" | "7d" | "30d" | "90d" | "1y" | "all">(
    "1y"
  );

  // Handle URL wallet parameter
  useEffect(() => {
    const walletParam = searchParams?.get("wallet");
    if (walletParam) {
      // Simple validation without triggering state updates
      const cleanAddress = walletParam.startsWith("0x") ? walletParam : `0x${walletParam}`;
      const isValid = /^0x[a-fA-F0-9]{64}$/.test(cleanAddress);

      if (isValid) {
        dispatch({ type: "SET_MANUAL_ADDRESS", payload: cleanAddress });
        dispatch({ type: "SET_MANUAL_MODE", payload: true });
      }
    }
  }, [searchParams, dispatch]);

  // Get wallet address
  const walletAddress = account?.address?.toString();
  const activeAddress = state.isManualMode ? state.manualAddress : walletAddress;
  const normalizedAddress = normalizeAddress(activeAddress);

  logger.debug("[PortfolioPage] State:", {
    connected,
    walletAddress,
    activeAddress,
    normalizedAddress,
    isManualMode: state.isManualMode,
    manualAddress: state.manualAddress,
  });
  logger.debug(
    `Portfolio page state - connected: ${connected}, walletAddress: ${walletAddress}, normalizedAddress: ${normalizedAddress}, isManualMode: ${state.isManualMode}, manualAddress: ${state.manualAddress}`
  );

  // Fetch portfolio data
  const {
    visibleAssets,
    nfts,
    groupedDeFiPositions,
    transactions,
    portfolioMetrics,
    pieChartData,
    pieChartColors,
    totalNFTCount,
    allNFTs,
    nftCollectionStats,
    accountNames,
    isLoading,
    dataLoading,
    nftsLoading,
    defiLoading,
    transactionsLoading,
    hasMoreNFTs,
    hasMoreTransactions,
    isLoadingMore,
    loadMoreNFTs,
    loadMoreTransactions,
    assets,
    defiPositions,
  } = useSimplifiedPortfolio({
    walletAddress: normalizedAddress,
    hideFilteredAssets: state.hideFilteredAssets,
    selectedTimeframe,
  });

  logger.debug("[PortfolioPage] Data from useSimplifiedPortfolio:", {
    visibleAssets: visibleAssets?.length || 0,
    nfts: nfts?.length || 0,
    defiPositions: defiPositions?.length || 0,
    transactions: transactions?.length || 0,
    isLoading,
    dataLoading,
    normalizedAddress,
  });

  // Update APT price in context
  useEffect(() => {
    if (aptPrice !== null) {
      dispatch({ type: "SET_APT_PRICE", payload: aptPrice });
    }
  }, [aptPrice, dispatch]);

  // Handle manual address submission
  const handleAddressSubmit = useCallback(() => {
    if (validateAddress(state.manualAddress)) {
      dispatch({ type: "SET_MANUAL_MODE", payload: true });
    }
  }, [state.manualAddress, validateAddress, dispatch]);

  // Clear manual mode
  const clearManualMode = useCallback(() => {
    dispatch({ type: "RESET_MANUAL_MODE" });
    clearError();
  }, [dispatch, clearError]);

  // Handle item selection
  const handleItemSelect = useCallback(
    (type: "asset" | "nft" | "defi" | null, data: any) => {
      selectItem(type, data);
    },
    [selectItem]
  );

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

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

      if (state.selectedItem) {
        selectItem(null, null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [state.selectedItem, selectItem]);

  // Show landing section if no wallet connected and no manual address
  if (!normalizedAddress) {
    logger.debug("[PortfolioPage] Showing landing section - no address");
    return (
      <LandingSection
        onManualAddressSubmit={(address) => {
          dispatch({ type: "SET_MANUAL_ADDRESS", payload: address });
          if (validateAddress(address)) {
            dispatch({ type: "SET_MANUAL_MODE", payload: true });
          }
        }}
      />
    );
  }

  if (isLoading) {
    return <PortfolioLoadingSkeleton />;
  }

  return (
    <div className="portfolio-single-viewport flex flex-col relative h-full overflow-hidden">
      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-1 sm:py-2 flex-1 relative z-10 flex flex-col overflow-hidden min-h-0">
        <div className="flex-none mb-2">
          <AddressBar
            manualAddress={state.manualAddress}
            setManualAddress={(address) => {
              dispatch({ type: "SET_MANUAL_ADDRESS", payload: address });
              setAddressError("");
            }}
            isManualMode={state.isManualMode}
            normalizedAddress={normalizedAddress}
            addressError={addressError}
            onSubmit={handleAddressSubmit}
            onClear={clearManualMode}
            connected={connected}
          />
        </div>


        <div className="flex-1 overflow-hidden min-h-0" style={{ paddingTop: '0px' }}>
          <Suspense fallback={<PortfolioLoadingSkeleton />}>
            <PortfolioLayout
              normalizedAddress={normalizedAddress || ""}
              visibleAssets={visibleAssets}
              assets={assets || []}
              nfts={nfts}
              groupedDeFiPositions={groupedDeFiPositions}
              portfolioMetrics={portfolioMetrics}
              pieChartData={pieChartData}
              pieChartColors={pieChartColors}
              dataLoading={dataLoading}
              nftsLoading={nftsLoading}
              defiLoading={defiLoading}
              transactionsLoading={transactionsLoading}
              hasMoreNFTs={hasMoreNFTs}
              hasMoreTransactions={hasMoreTransactions}
              isLoadingMore={isLoadingMore}
              loadMoreNFTs={loadMoreNFTs}
              loadMoreTransactions={loadMoreTransactions}
              totalNFTCount={totalNFTCount}
              nftCollectionStats={nftCollectionStats}
              allNFTs={allNFTs}
              defiPositions={defiPositions}
              transactions={transactions}
              accountNames={accountNames}
              aptPrice={state.aptPrice}
              selectedItem={state.selectedItem}
              activeTab={state.activeTab}
              sidebarView={state.sidebarView}
              hideFilteredAssets={state.hideFilteredAssets}
              defiSortBy={state.defiSortBy}
              defiSortOrder={state.defiSortOrder}
              onItemSelect={handleItemSelect}
              onTabChange={(tab) => dispatch({ type: "SET_ACTIVE_TAB", payload: tab as any })}
              onSidebarViewChange={(view) =>
                dispatch({ type: "SET_SIDEBAR_VIEW", payload: view as any })
              }
              onToggleFilteredAssets={toggleFilteredAssets}
              onDeFiSort={setDeFiSort}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <PortfolioProvider>
      <PortfolioPageContent />
    </PortfolioProvider>
  );
}
