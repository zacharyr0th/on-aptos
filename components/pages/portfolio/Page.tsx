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

// Helper function to get detailed protocol information
const getDetailedProtocolInfo = (protocolName: string) => {
  const normalizedName = normalizeProtocolName(protocolName);
  return defiProtocols.find(protocol => 
    protocol.title === normalizedName ||
    protocol.title.toLowerCase() === protocolName.toLowerCase().trim() ||
    protocol.title.toLowerCase().includes(protocolName.toLowerCase().trim()) ||
    protocolName.toLowerCase().trim().includes(protocol.title.toLowerCase())
  );
};

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
  }, [selectedAsset, selectedDeFiPosition, selectedNFT, handleAssetSelect, handleDeFiPositionSelect, setSelectedNFT]);

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
    <div className="flex flex-col min-h-screen relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none z-0" />

      <div className="container-layout pt-6 pb-8 relative z-20">
        <Header />
        <PortfolioHeader
          totalValue={portfolioMetrics?.totalPortfolioValue || 0}
          walletAddress={normalizedAddress}
          accountNames={accountNames || null}
          terminalMode={terminalMode}
          onTerminalToggle={() => setTerminalMode(!terminalMode)}
        />
      </div>
      <div className="flex-1 relative z-10">
        <div className="container-layout">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6">
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


              {/* Content based on sidebar view */}
              {sidebarView === 'assets' && (
                <AssetsTable
                  visibleAssets={visibleAssets}
                  selectedItem={selectedAsset}
                  showOnlyVerified={false}
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
                        }}
                      />

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
            <div className="lg:col-span-3 space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={v => setActiveTab(v as any)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="portfolio" className="space-y-6">
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
                          <h3 className="text-lg font-semibold mb-6">DeFi Position Details</h3>
                          <div className="space-y-6">
                            {/* Protocol Header */}
                            <div className="flex items-start gap-6">
                              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-background border-2 border-border/20 flex-shrink-0">
                                <Image
                                  src={getProtocolLogo(selectedDeFiPosition.protocol)}
                                  alt={`${selectedDeFiPosition.protocol} logo`}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </div>
                              <div className="flex-1 space-y-3">
                                <div>
                                  <h4 className="text-xl font-semibold">{cleanProtocolName(selectedDeFiPosition.protocol)}</h4>
                                  <div className="flex gap-2 mt-2">
                                    {Array.from(selectedDeFiPosition.protocolTypes).map(type => (
                                      <Badge key={String(type)} variant="secondary" className="text-xs">
                                        {String(type) === 'derivatives' ? 'Perps' : String(type)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                {detailedProtocolInfo && (
                                  <div className="flex gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {detailedProtocolInfo.category}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {detailedProtocolInfo.subcategory}
                                    </Badge>
                                    {detailedProtocolInfo.security.auditStatus && (
                                      <Badge 
                                        variant={detailedProtocolInfo.security.auditStatus === 'Audited' ? 'default' : 'destructive'}
                                        className="text-xs"
                                      >
                                        {detailedProtocolInfo.security.auditStatus}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Position Value and Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Your Position Value</p>
                                <p className="text-2xl font-mono font-semibold">
                                  {selectedDeFiPosition.protocol === 'Thala Farm' 
                                    ? 'TBD' 
                                    : formatCurrency(selectedDeFiPosition.totalValue)
                                  }
                                </p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Active Positions</p>
                                <p className="text-xl font-semibold">
                                  {selectedDeFiPosition.positions.length}
                                </p>
                              </div>
                              {detailedProtocolInfo?.tvl?.current && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-muted-foreground">Protocol TVL</p>
                                  <p className="text-xl font-semibold">
                                    {detailedProtocolInfo.tvl.current}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Protocol Information */}
                            {detailedProtocolInfo && (
                              <div className="space-y-4">
                                <h5 className="font-semibold text-base">Protocol Information</h5>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {detailedProtocolInfo.token?.governanceToken && (
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium text-muted-foreground">Governance Token</p>
                                      <p className="text-sm font-mono">
                                        {detailedProtocolInfo.token.governanceTokenSymbol || detailedProtocolInfo.token.governanceToken}
                                      </p>
                                    </div>
                                  )}
                                  {detailedProtocolInfo.security.auditFirms && (
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium text-muted-foreground">Audit Firms</p>
                                      <div className="flex flex-wrap gap-1">
                                        {detailedProtocolInfo.security.auditFirms.map((firm, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {firm}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {detailedProtocolInfo.yields?.current && (
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium text-muted-foreground">Current APY</p>
                                      <p className="text-sm font-semibold text-green-600">
                                        {detailedProtocolInfo.yields.current.join(', ')}
                                      </p>
                                    </div>
                                  )}
                                  {detailedProtocolInfo.volume?.daily && (
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium text-muted-foreground">Daily Volume</p>
                                      <p className="text-sm font-semibold">
                                        {detailedProtocolInfo.volume.daily}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* External Links */}
                            {detailedProtocolInfo?.external?.socials && (
                              <div className="space-y-3">
                                <h5 className="font-semibold text-base">Links</h5>
                                <div className="flex gap-3">
                                  {detailedProtocolInfo.href && (
                                    <a
                                      href={detailedProtocolInfo.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                      <Globe className="h-4 w-4" />
                                      Website
                                    </a>
                                  )}
                                  {detailedProtocolInfo.external.socials.twitter && (
                                    <a
                                      href={detailedProtocolInfo.external.socials.twitter}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                      </svg>
                                      Twitter
                                    </a>
                                  )}
                                  {detailedProtocolInfo.external.socials.github && (
                                    <a
                                      href={detailedProtocolInfo.external.socials.github}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                      <Github className="h-4 w-4" />
                                      GitHub
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                  ) : selectedNFT ? (
                    /* Individual NFT Details */
                    <div className="bg-card border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-6">NFT Details</h3>
                      <div className="space-y-6">
                        <div className="flex items-start gap-6">
                          <div className="w-48 h-48 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={selectedNFT.cdn_image_uri || '/placeholder.jpg'}
                              alt={selectedNFT.token_name || 'NFT'}
                              width={192}
                              height={192}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div>
                              <h4 className="text-xl font-semibold">{selectedNFT.token_name || 'Unnamed NFT'}</h4>
                              <p className="text-lg text-muted-foreground mt-1">
                                {selectedNFT.collection_name || 'Unknown Collection'}
                              </p>
                            </div>
                            {selectedNFT.description && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                                <p className="text-sm">
                                  {selectedNFT.description}
                                </p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                              {selectedNFT.token_data_id && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Token ID</p>
                                  <p className="text-sm font-mono break-all">
                                    {selectedNFT.token_data_id.slice(0, 20)}...
                                  </p>
                                </div>
                              )}
                              {selectedNFT.collection_name && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Collection</p>
                                  <p className="text-sm">
                                    {selectedNFT.collection_name}
                                  </p>
                                </div>
                              )}
                            </div>
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
                    /* Default Wallet Summary View */
                    <WalletSummary
                      walletAddress={normalizedAddress}
                      assets={assets || []}
                      defiPositions={groupedDeFiPositions || []}
                      totalValue={portfolioMetrics?.totalPortfolioValue || 0}
                      isLoading={dataLoading}
                      pieChartData={pieChartData}
                      pieChartColors={pieChartColors}
                    />
                  )}
                </TabsContent>

                <TabsContent value="transactions" className="space-y-6">
                  <TransactionHistoryTable
                    walletAddress={normalizedAddress}
                    limit={50}
                  />
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


      <Footer className="relative z-20" />
    </div>
  );
}
