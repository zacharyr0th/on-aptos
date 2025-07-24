'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { GeistMono } from 'geist/font/mono';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { logger } from '@/lib/utils/logger';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Filter,
  ChevronDown,
  Grid,
  List,
  Shuffle,
  Globe,
  Github,
  Monitor,
} from 'lucide-react';
import { usePortfolio, usePortfolioData, usePortfolioHistory } from './hooks';
import {
  formatCurrency,
  formatPercentage,
  formatTokenAmount,
} from '@/lib/utils/format';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getTokenLogoUrlWithFallback } from '@/lib/utils/token-logos';
import { cn } from '@/lib/utils';
import {
  getProtocolLabel,
  shouldShowProtocolBadge,
  PROTOCOLS,
} from '@/lib/protocol-registry';
import { NFTAnalysis } from './NFTAnalysis';
import { NFTTransferHistory } from './NFTTransferHistory';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

// Import extracted components
import { LandingSection } from './LandingSection';
import { LoadingSkeleton } from './LoadingSkeleton';
import { PortfolioHeader } from './PortfolioHeader';
import { AssetsTable, DeFiPositionsTable } from './PortfolioTables';
import { NFTGrid } from './NFTGrid';
import { EnhancedNFTGrid } from './EnhancedNFTGrid';
import { NFTDetailView } from './NFTDetailView';
import { WalletSummary } from './WalletSummary';
import { ProtocolDetailsDialog } from './Dialogs';
import { DeFiSummaryView, NFTSummaryView } from './SummaryViews';
import { NFT, SortField, SortDirection } from './types';
import {
  isPhantomAsset,
  getProtocolLogo,
  cleanProtocolName,
  getDetailedProtocolInfo,
} from './utils';
import { defiProtocols } from '@/components/pages/defi/data';
import { normalizeProtocolName } from '@/lib/constants';
import { TransactionHistoryTable } from './TransactionHistoryTable';
import { PerformanceSummary } from './PerformanceSummary';
import { BloombergTerminal } from './BloombergTerminal';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { PortfolioSidebar } from './PortfolioSidebar';
import { PortfolioMainContent } from './PortfolioMainContent';

export default function PortfolioPage() {
  const { connected, account, wallet } = useWallet();
  const { theme, resolvedTheme } = useTheme();

  // Normalize wallet address to ensure proper format
  const walletAddress = account?.address?.toString();

  // For development/testing: use test wallet if no wallet connected
  const testWalletAddress =
    '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c11c4cddf7e522';

  // Ensure the address is in the correct format (66 characters, 0x prefixed)
  const normalizedAddress = walletAddress
    ? walletAddress.startsWith('0x')
      ? walletAddress
      : `0x${walletAddress}`
    : testWalletAddress;

  logger.debug('[PortfolioPage] Wallet info:', {
    connected,
    account: account?.address,
    walletAddress,
    normalizedAddress,
    accountObject: account,
  });

  // State for modals
  const [protocolDetailsOpen, setProtocolDetailsOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    '1h' | '12h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all'
  >('1y');
  const [terminalMode, setTerminalMode] = useState(false);

  // Use consolidated hooks
  const {
    assets,
    nfts,
    defiPositions,
    isLoading: dataLoading,
    error: dataError,
    refetch: refetchData,
  } = usePortfolioData(normalizedAddress, false);

  // Debug logging for portfolio data
  logger.debug('[PortfolioPage] Portfolio data:', {
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
    refetch: refetchHistory,
    currentPrice,
    previousPrice,
    averageHistory,
    accountNames,
  } = usePortfolioHistory(normalizedAddress, { timeframe: selectedTimeframe });

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
        acc[protocol].protocolTypes.add(
          position.protocolType || position.protocol_type
        );
        return acc;
      },
      {} as Record<string, any>
    );

    return Object.values(grouped);
  })();

  // Filter assets to exclude CELL tokens, MKLP tokens, and dust
  const FILTERED_ADDRESSES = useMemo(() => [
    '0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12', // CELL token
    '0x5ae6789dd2fec1a9ec9cccfb3acaf12e93d432f0a3a42c92fe1a9d490b7bbc06::house_lp::MKLP', // MKLP tokens
  ], []);

  const visibleAssets = useMemo(() => {
    if (!assets) return [];

    return assets.filter(asset => {
      // Always include APT regardless of value
      if (asset.asset_type === '0x1::aptos_coin::AptosCoin') return true;

      // Filter out hardcoded addresses (like CELL) and MKLP tokens
      if (FILTERED_ADDRESSES.includes(asset.asset_type)) return false;
      if (
        asset.asset_type.includes('::house_lp::MKLP') ||
        asset.asset_type.includes('::mklp::MKLP')
      )
        return false;

      // Filter out assets under $0.1
      return (asset.value || 0) >= 0.1;
    });
  }, [assets, FILTERED_ADDRESSES]);

  // Use consolidated state management hook
  const {
    // States
    showAccountSwitcher,
    nftViewMode,
    selectedNFT,
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

    // Setters
    setShowAccountSwitcher,
    setNftViewMode,
    setSelectedNFT,
    setHoveredCollection,
    setSidebarView,
    setActiveTab,
    setFilterBySymbol,
    setFilterByProtocol,
    setNftSortField,
    setNftSortDirection,

    // Handlers
    handleDeFiSort,
    handleAssetSelect,
    handleDeFiPositionSelect,

    // NFT Shuffle
    shuffledNFTs,
    shuffleNFTs,

    // Metrics
    portfolioMetrics,
    chartData,
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
        target.closest('.asset-table-container') ||
        target.closest('.defi-table-container') ||
        target.closest('.nft-grid-container') ||
        target.closest('[role="dialog"]') ||
        target.closest('.dropdown-menu') ||
        target.closest('button') ||
        target.closest('.performance-content') ||
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  const totalNFTPages = 1; // Always 1 page since we show all NFTs

  // Get detailed protocol info for selected DeFi position
  const detailedProtocolInfo = selectedDeFiPosition
    ? getDetailedProtocolInfo(selectedDeFiPosition.protocol)
    : null;

  // Loading state
  const isLoading = dataLoading || historyLoading;

  // For testing: show portfolio even if not connected (using test wallet)
  // if (!connected) {
  //   return <LandingSection />;
  // }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // If terminal mode is enabled, render the Bloomberg terminal
  if (terminalMode) {
    return (
      <BloombergTerminal
        totalValue={portfolioMetrics?.totalPortfolioValue || 0}
        walletAddress={normalizedAddress}
        assets={visibleAssets}
        defiPositions={defiPositions || []}
        nfts={nfts || []}
        performanceData={history}
        accountNames={accountNames || null}
        onBackClick={() => setTerminalMode(false)}
      />
    );
  }

  return (
    <PageLayout>
      <div className="space-y-12">
        {/* Total Portfolio Value Header - Mobile Only */}
        <div className="lg:hidden mb-6">
          {/* Mobile: Total value at top */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Total Portfolio Value
            </p>
            <p className="text-3xl font-bold font-mono">
              {formatCurrency(portfolioMetrics?.totalPortfolioValue || 0)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <PortfolioSidebar
            sidebarView={sidebarView}
            setSidebarView={setSidebarView}
            visibleAssets={visibleAssets}
            selectedAsset={selectedAsset}
            handleAssetSelect={handleAssetSelect}
            assets={assets || []}
            nfts={nfts || []}
            dataLoading={dataLoading}
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
          />

          <PortfolioMainContent
            activeTab={activeTab}
            setActiveTab={(tab: string) =>
              setActiveTab(tab as 'portfolio' | 'transactions')
            }
            selectedAsset={selectedAsset}
            handleAssetSelect={handleAssetSelect}
            selectedDeFiPosition={selectedDeFiPosition}
            handleDeFiPositionSelect={handleDeFiPositionSelect}
            selectedNFT={selectedNFT}
            setSelectedNFT={setSelectedNFT}
            sidebarView={sidebarView}
            nfts={nfts || []}
            currentNFTs={currentNFTs}
            normalizedAddress={normalizedAddress || ''}
            assets={visibleAssets}
            groupedDeFiPositions={groupedDeFiPositions || []}
            portfolioMetrics={portfolioMetrics}
            dataLoading={dataLoading}
            pieChartData={pieChartData}
            pieChartColors={pieChartColors}
            accountNames={accountNames}
            setHoveredCollection={setHoveredCollection}
            setProtocolDetailsOpen={setProtocolDetailsOpen}
          />
        </div>
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
    </PageLayout>
  );
}
