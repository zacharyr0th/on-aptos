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
  Eye,
  EyeOff,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Shuffle,
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
import { PerformanceChart } from './PerformanceChart';
import { NFTDetailsDialog, ProtocolDetailsDialog } from './Dialogs';
import { DeFiSummaryView, NFTSummaryView } from './SummaryViews';
import { NFT, SortField, SortDirection } from './types';
import { isPhantomAsset, getProtocolLogo, cleanProtocolName } from './utils';
import { TransactionHistoryTable } from './TransactionHistoryTable';
import { PerformanceSummary } from './PerformanceSummary';

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
  const [nftDetailsOpen, setNftDetailsOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    '1h' | '12h' | '24h' | '7d' | '30d' | '90d' | '1y' | 'all'
  >('1y');

  // Local storage for preferences - default to showing all assets
  const [showAllAssets, setShowAllAssets] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portfolio-show-all-assets');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });

  // Use consolidated hooks
  const {
    assets,
    nfts,
    defiPositions,
    isLoading: dataLoading,
    error: dataError,
    refetch: refetchData,
  } = usePortfolioData(normalizedAddress, false); // Always show all assets for now

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
        acc[protocol].totalValue += position.totalValue || position.tvl_usd || 0;
        acc[protocol].protocolTypes.add(position.protocolType || position.protocol_type);
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
    nftPage,
    nftViewMode,
    selectedNFT,
    hoveredCollection,
    selectedAsset,
    selectedDeFiPosition,
    activeTab,
    sidebarView,
    defiSortBy,
    defiSortOrder,
    showOnlyVerified,
    filterBySymbol,
    filterByProtocol,
    nftSortField,
    nftSortDirection,

    // Setters
    setShowAccountSwitcher,
    setNftPage,
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

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'portfolio-show-all-assets',
        showAllAssets.toString()
      );
    }
  }, [showAllAssets]);

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
  }, [selectedAsset, selectedDeFiPosition, selectedNFT, handleAssetSelect, handleDeFiPositionSelect, setSelectedNFT]);

  // Current NFTs for pagination
  const currentNFTs = useMemo(() => {
    if (!shuffledNFTs) return [];
    const start = nftPage * 30;
    const end = start + 30;
    return shuffledNFTs.slice(start, end);
  }, [shuffledNFTs, nftPage]);

  const totalNFTPages = Math.ceil((shuffledNFTs?.length || 0) / 30);

  // Filter assets - use showAllAssets instead of showOnlyVerified
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter(asset => {
      if (!showAllAssets && asset.isVerified === false) return false;
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
  }, [assets, showAllAssets, filterBySymbol, filterByProtocol]);

  const visibleAssets = filteredAssets;

  // Loading state
  const isLoading = dataLoading || historyLoading;

  if (!connected) {
    return <LandingSection />;
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

      <div className="container-layout pt-6 pb-8 relative z-10">
        <Header />
        <PortfolioHeader
          totalValue={portfolioMetrics?.totalPortfolioValue || 0}
          walletAddress={normalizedAddress}
          accountNames={accountNames || null}
        />
      </div>
      <div className="flex-1 relative z-10">
        <div className="container-layout">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* View Selector */}
              <div className="flex gap-2">
                <Button
                  variant={sidebarView === 'assets' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSidebarView('assets')}
                  className="flex-1"
                >
                  <Briefcase className="h-4 w-4 mr-1" />
                  Assets
                </Button>
                <Button
                  variant={sidebarView === 'nfts' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSidebarView('nfts')}
                  className="flex-1"
                >
                  <Grid className="h-4 w-4 mr-1" />
                  NFTs
                </Button>
                <Button
                  variant={sidebarView === 'defi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSidebarView('defi')}
                  className="flex-1"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  DeFi
                </Button>
              </div>

              {/* Filters */}
              {sidebarView === 'assets' && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllAssets(!showAllAssets)}
                    className="gap-2"
                  >
                    {showAllAssets ? (
                      <>
                        <Eye className="h-4 w-4" />
                        Showing all tokens
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Verified tokens only
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Content based on sidebar view */}
              {sidebarView === 'assets' && (
                <AssetsTable
                  visibleAssets={visibleAssets}
                  selectedItem={selectedAsset}
                  showOnlyVerified={!showAllAssets}
                  portfolioAssets={assets || []}
                  onItemSelect={handleAssetSelect}
                />
              )}

              {sidebarView === 'nfts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant={nftViewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNftViewMode('grid')}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={
                          nftViewMode === 'collection' ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setNftViewMode('collection')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={shuffleNFTs}>
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </div>

                  {nftViewMode === 'grid' ? (
                    <>
                      <NFTGrid
                        nfts={currentNFTs}
                        nftsLoading={dataLoading}
                        selectedNFT={selectedNFT}
                        viewMode={nftViewMode}
                        onNFTSelect={nft => {
                          setSelectedNFT(nft);
                          setNftDetailsOpen(true);
                        }}
                      />

                      {/* Pagination */}
                      {totalNFTPages > 1 && (
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setNftPage(0)}
                              disabled={nftPage === 0}
                            >
                              <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setNftPage(nftPage - 1)}
                              disabled={nftPage === 0}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Page {nftPage + 1} of {totalNFTPages}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setNftPage(nftPage + 1)}
                              disabled={nftPage >= totalNFTPages - 1}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setNftPage(totalNFTPages - 1)}
                              disabled={nftPage >= totalNFTPages - 1}
                            >
                              <ChevronsRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <NFTSummaryView
                      nfts={shuffledNFTs || []}
                      currentPageNFTs={currentNFTs.length}
                      onCollectionClick={collection => {
                        setHoveredCollection(collection);
                      }}
                    />
                  )}
                </div>
              )}

              {sidebarView === 'defi' && (
                <DeFiPositionsTable
                  groupedDeFiPositions={groupedDeFiPositions}
                  defiPositionsLoading={dataLoading}
                  selectedItem={selectedDeFiPosition}
                  defiSortBy={defiSortBy}
                  defiSortOrder={defiSortOrder}
                  getProtocolLogo={getProtocolLogo}
                  onItemSelect={handleDeFiPositionSelect}
                  onSortChange={handleDeFiSort}
                />
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={v => setActiveTab(v as any)}
              >
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="performance">Portfolio</TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="space-y-6">
                  {/* SINGLE CARD AREA - Only one thing at a time */}
                  
                  {/* Individual Asset Details */}
                  {selectedAsset ? (
                    <div className="bg-card border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Asset Details</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Image
                            src={getTokenLogoUrlWithFallback(
                              selectedAsset.asset_type,
                              selectedAsset.metadata
                            )}
                            alt={selectedAsset.metadata?.symbol || 'Asset'}
                            width={48}
                            height={48}
                            className={`rounded-full ${
                              selectedAsset.metadata?.symbol?.toUpperCase() === 'APT' ||
                              selectedAsset.asset_type.includes('aptos_coin')
                                ? 'dark:invert'
                                : ''
                            }`}
                          />
                          <div>
                            <h4 className="font-semibold">
                              {selectedAsset.metadata?.symbol || 'Unknown'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedAsset.metadata?.name || 'Unknown Asset'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Balance</p>
                            <p className="text-lg font-mono">
                              {formatTokenAmount(selectedAsset.balance || 0)}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Value</p>
                            <p className="text-lg font-mono">
                              {formatCurrency(selectedAsset.value || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : selectedDeFiPosition ? (
                    /* Individual DeFi Position Details */
                    <div className="bg-card border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">DeFi Position Details</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-background border">
                            <Image
                              src={getProtocolLogo(selectedDeFiPosition.protocol)}
                              alt={`${selectedDeFiPosition.protocol} logo`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div>
                            <h4 className="font-semibold">{cleanProtocolName(selectedDeFiPosition.protocol)}</h4>
                            <div className="flex gap-2 mt-1">
                              {Array.from(selectedDeFiPosition.protocolTypes).map(type => (
                                <Badge key={String(type)} variant="secondary" className="text-xs">
                                  {String(type) === 'derivatives' ? 'Perps' : String(type)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                          <p className="text-lg font-mono">
                            {selectedDeFiPosition.protocol === 'Thala Farm' 
                              ? 'TBD' 
                              : formatCurrency(selectedDeFiPosition.totalValue)
                            }
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Positions</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedDeFiPosition.positions.length} position{selectedDeFiPosition.positions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : selectedNFT ? (
                    /* Individual NFT Details */
                    <div className="bg-card border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">NFT Details</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={selectedNFT.cdn_image_uri || '/placeholder.jpg'}
                              alt={selectedNFT.token_name || 'NFT'}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{selectedNFT.token_name || 'Unnamed NFT'}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedNFT.collection_name || 'Unknown Collection'}
                            </p>
                            {selectedNFT.description && (
                              <p className="text-sm mt-2 line-clamp-3">
                                {selectedNFT.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : sidebarView === 'defi' && groupedDeFiPositions ? (
                    /* DeFi Summary View */
                    <DeFiSummaryView
                      groupedDeFiPositions={groupedDeFiPositions}
                      totalDefiValue={portfolioMetrics?.totalDefiValue || 0}
                      getProtocolLogo={getProtocolLogo}
                      onProtocolClick={position => {
                        handleDeFiPositionSelect(position);
                      }}
                    />
                  ) : sidebarView === 'nfts' && nfts && nfts.length > 0 ? (
                    /* NFT Summary View */
                    <NFTSummaryView
                      nfts={nfts}
                      currentPageNFTs={currentNFTs.length}
                      onCollectionClick={collection => {
                        setHoveredCollection(collection);
                      }}
                    />
                  ) : (
                    /* Default Chart View (Assets tab or fallback) */
                    <>
                      {/* Timeframe Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Period:</span>
                        <div className="flex gap-1 flex-wrap">
                          {(['1h', '12h', '24h', '7d', '30d', '90d', '1y', 'all'] as const).map((tf) => (
                            <Button
                              key={tf}
                              variant={selectedTimeframe === tf ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedTimeframe(tf)}
                              className="px-3"
                            >
                              {tf}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Performance Chart */}
                      <PerformanceChart
                        key={selectedTimeframe}
                        walletAddress={normalizedAddress}
                        timeframe={selectedTimeframe}
                      />

                    </>
                  )}
                </TabsContent>

              </Tabs>
            </div>
          </div>
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

      {selectedNFT && (
        <NFTDetailsDialog
          isOpen={nftDetailsOpen}
          onClose={() => setNftDetailsOpen(false)}
          nft={selectedNFT}
        />
      )}

      <Footer className="relative z-10" />
    </div>
  );
}
