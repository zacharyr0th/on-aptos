'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { GeistMono } from 'geist/font/mono';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
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
import { isPhantomAsset, getProtocolLogo, cleanProtocolName } from './utils';
import { defiProtocols } from '@/components/pages/defi/data';
import { normalizeProtocolName } from '@/lib/aptos-constants';
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

  // Ensure the address is in the correct format (66 characters, 0x prefixed)
  const normalizedAddress = walletAddress
    ? walletAddress.startsWith('0x')
      ? walletAddress
      : `0x${walletAddress}`
    : undefined;

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
  const groupedDeFiPositions = useMemo(() => {
    if (!defiPositions) return null;

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
          position.totalValue || position.tvl_usd || 0;
        acc[protocol].protocolTypes.add(
          position.protocolType || position.protocol_type
        );
        return acc;
      },
      {} as Record<string, any>
    );

    return Object.values(grouped);
  }, [defiPositions]);

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
    portfolioAssets: assets || undefined,
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
  const currentNFTs = useMemo(() => {
    return shuffledNFTs || [];
  }, [shuffledNFTs]);

  const totalNFTPages = 1; // Always 1 page since we show all NFTs

  // Filter assets - show only tokens with balance > $0.1
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter(asset => {
      // Filter by minimum balance value ($0.1)
      if ((asset.value || 0) <= 0.1) return false;
      if (
        filterBySymbol.length > 0 &&
        !filterBySymbol.includes(asset.metadata?.symbol || '')
      )
        return false;
      if (
        filterByProtocol.length > 0 &&
        asset.protocolInfo &&
        !filterByProtocol.includes(asset.protocolInfo.protocol)
      )
        return false;
      return true;
    });
  }, [assets, filterBySymbol, filterByProtocol]);

  const visibleAssets = filteredAssets;

  // Get detailed protocol info for selected DeFi position
  const detailedProtocolInfo = selectedDeFiPosition
    ? getDetailedProtocolInfo(selectedDeFiPosition.protocol)
    : null;

  // Loading state
  const isLoading = dataLoading || historyLoading;

  if (!connected) {
    return <LandingSection />;
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // If terminal mode is enabled, render the Bloomberg terminal
  if (terminalMode) {
    return (
      <BloombergTerminal
        totalValue={portfolioMetrics?.totalPortfolioValue || 0}
        walletAddress={normalizedAddress}
        assets={assets || []}
        defiPositions={defiPositions || []}
        nfts={nfts || []}
        performanceData={history}
        accountNames={accountNames || null}
        onBackClick={() => setTerminalMode(false)}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none z-0" />
      
      <div className="container-layout pt-6 relative">
        <Header />
      </div>
      
      <main className="container-layout py-6 flex-1 relative">
        <PortfolioHeader
          totalValue={portfolioMetrics?.totalPortfolioValue || 0}
          walletAddress={normalizedAddress}
          accountNames={accountNames || null}
          terminalMode={terminalMode}
          onTerminalToggle={() => setTerminalMode(!terminalMode)}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
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
            groupedDeFiPositions={groupedDeFiPositions || []}
            selectedDeFiPosition={selectedDeFiPosition}
            defiSortBy={defiSortBy}
            defiSortOrder={defiSortOrder}
            getProtocolLogo={getProtocolLogo}
            handleDeFiPositionSelect={handleDeFiPositionSelect}
            handleDeFiSort={handleDeFiSort}
          />

          <PortfolioMainContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedAsset={selectedAsset}
            selectedDeFiPosition={selectedDeFiPosition}
            selectedNFT={selectedNFT}
            sidebarView={sidebarView}
            nfts={nfts || []}
            currentNFTs={currentNFTs}
            normalizedAddress={normalizedAddress}
            assets={assets || []}
            groupedDeFiPositions={groupedDeFiPositions || []}
            portfolioMetrics={portfolioMetrics}
            dataLoading={dataLoading}
            pieChartData={pieChartData}
            pieChartColors={pieChartColors}
            setHoveredCollection={setHoveredCollection}
            setProtocolDetailsOpen={setProtocolDetailsOpen}
          />
        </div>
      </main>

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

      <Footer className="relative z-10" />
    </div>
  );
}
