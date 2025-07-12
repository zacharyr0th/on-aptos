'use client';

import React, { useMemo, useState } from 'react';
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
import { trpc } from '@/lib/trpc/client';
import { usePortfolioHistoryV2 } from '@/hooks/usePortfolioHistoryV2';
import { usePortfolioNFTs } from '@/hooks/usePortfolioNFTs';
import { usePortfolioDeFi } from '@/hooks/usePortfolioDeFi';
import { usePortfolioAssets } from '@/hooks/usePortfolioAssets';
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
import { AssetsTable } from './AssetsTable';
import { NFTGrid } from './NFTGrid';
import { DeFiPositionsTable } from './DeFiPositionsTable';
import { AptPriceDisplay } from './AptPriceDisplay';
import { PerformanceChart } from './PerformanceChart';
import { ProtocolDetailsDialog } from './ProtocolDetailsDialog';
import { NFTDetailsDialog } from './NFTDetailsDialog';
import DeFiSummaryView from './DeFiSummaryView';
import { NFTSummaryView } from './NFTSummaryView';
import { NFT, SortField, SortDirection } from './types';
import { isPhantomAsset, getProtocolLogo, cleanProtocolName } from './utils';

export default function PortfolioPage() {
  const { connected, account, wallet } = useWallet();
  const { theme, resolvedTheme } = useTheme();
  const walletAddress = account?.address?.toString();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [nftPage, setNftPage] = useState(0);
  const [nftViewMode, setNftViewMode] = useState<'grid' | 'collection'>('grid');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [nftShuffle, setNftShuffle] = useState(0); // Trigger for shuffling NFTs
  const [hoveredCollection, setHoveredCollection] = useState<string | null>(
    null
  );
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedDeFiPosition, setSelectedDeFiPosition] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'performance' | 'transactions'>(
    'performance'
  );
  const [sidebarView, setSidebarView] = useState<'assets' | 'nfts' | 'defi'>(
    'assets'
  );
  const [defiSortBy, setDefiSortBy] = useState<'protocol' | 'type' | 'value'>(
    'value'
  );
  const [defiSortOrder, setDefiSortOrder] = useState<'asc' | 'desc'>('desc');
  const [protocolDetailsOpen, setProtocolDetailsOpen] = useState(false);
  const [nftDetailsOpen, setNftDetailsOpen] = useState(false);

  const [showAllAssets, setShowAllAssets] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portfolio-show-all-assets');
      return saved === null ? false : saved === 'true';
    }
    return false;
  });

  // Save preferences to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'portfolio-show-all-assets',
        showAllAssets.toString()
      );
    }
  }, [showAllAssets]);

  // Use REST API hook for assets to avoid tRPC timeout issues
  const { data: portfolioAssets, isLoading: portfolioLoading } =
    usePortfolioAssets(walletAddress, !showAllAssets);

  // Use REST API hooks for NFTs and DeFi to avoid tRPC complexity in production
  const { data: defiPositions, isLoading: defiPositionsLoading } =
    usePortfolioDeFi(walletAddress);

  const { data: nfts, isLoading: nftsLoading } = usePortfolioNFTs(
    walletAddress,
    30,
    nftPage * 30
  );

  // Shuffle NFTs when nftShuffle state changes
  const shuffledNFTs = useMemo(() => {
    if (!nfts || nftShuffle === 0) return nfts;

    const shuffled = [...nfts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [nfts, nftShuffle]);

  // Calculate pagination based on actual NFT data
  const currentPageNFTs = shuffledNFTs?.length || 0;
  const hasNextPage = currentPageNFTs === 30; // If we got a full page, there might be more
  const hasPrevPage = nftPage > 0;

  const { data: accountNames } =
    trpc.domains.blockchain.portfolio.getAccountNames.useQuery(
      { walletAddress: walletAddress || '' },
      { enabled: !!walletAddress }
    );

  const { data: portfolioHistory } = usePortfolioHistoryV2(
    walletAddress || null
  );

  // Filter assets based on preferences
  const filteredAssets = useMemo(() => {
    if (!portfolioAssets) return [];

    return portfolioAssets.filter(asset => {
      // If showing all assets, don't filter anything
      if (showAllAssets) return true;

      // Default filtering: remove scam tokens and assets with value < $0.1
      if (isPhantomAsset(asset.asset_type, asset.metadata)) return false;
      if (asset.isVerified === false) return false;
      if ((asset.value || 0) < 0.1) return false;

      return true;
    });
  }, [portfolioAssets, showAllAssets]);

  // Group DeFi positions
  const groupedDeFiPositions = useMemo(() => {
    if (!defiPositions) return [];

    const grouped = defiPositions.reduce((acc: any[], position: any) => {
      const existingGroup = acc.find(g => g.protocol === position.protocol);

      if (existingGroup) {
        existingGroup.positions.push(position);
        existingGroup.totalValue += position.totalValue || 0;
        existingGroup.protocolTypes.add(position.protocolType);
      } else {
        acc.push({
          protocol: position.protocol,
          positions: [position],
          totalValue: position.totalValue || 0,
          protocolTypes: new Set([position.protocolType]),
          protocolInfo: position.protocolInfo,
        });
      }

      return acc;
    }, []);

    return grouped;
  }, [defiPositions]);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    // Get all DeFi position addresses and tokens to avoid double counting
    const defiAddresses = new Set<string>();
    const defiTokens = new Set<string>();
    const defiProtocolAddresses = new Set<string>();

    // Add ALL protocol addresses from the registry to ensure comprehensive deduplication
    Object.values(PROTOCOLS).forEach(protocol => {
      protocol.addresses.forEach(address => {
        defiProtocolAddresses.add(address);
      });
    });

    defiPositions?.forEach(position => {
      if (position.address) {
        defiAddresses.add(position.address);
      }
      // Also track tokens that are in DeFi positions
      position.position.supplied?.forEach(supply => {
        if (supply.asset) {
          defiTokens.add(supply.asset);
        }
      });
      position.position.staked?.forEach(stake => {
        if (stake.asset) {
          defiTokens.add(stake.asset);
        }
      });
      position.position.liquidity?.forEach(lp => {
        if (lp.poolId) {
          defiTokens.add(lp.poolId);
        }
      });
    });

    // Filter out assets that are already counted in DeFi positions
    const nonDeFiAssets = filteredAssets.filter(asset => {
      // Check if this asset type contains any DeFi protocol address
      for (const protocolAddress of defiProtocolAddresses) {
        if (asset.asset_type.includes(protocolAddress)) {
          console.log(
            `Excluding ${asset.metadata?.symbol} from asset value calculation (protocol token in DeFi positions)`
          );
          return false;
        }
      }

      // Check if this asset is already counted as a DeFi token
      if (defiTokens.has(asset.asset_type)) {
        console.log(
          `Excluding ${asset.metadata?.symbol} from asset value calculation (already in DeFi)`
        );
        return false;
      }

      // Special handling for LP tokens that might be in DeFi positions
      const symbol = asset.metadata?.symbol?.toLowerCase() || '';
      if (
        (symbol.includes('lp') || symbol === 'mklp') &&
        defiPositions &&
        defiPositions.length > 0
      ) {
        // Check if this LP token is already in a DeFi position
        const isInDeFi = defiPositions.some(
          pos =>
            pos.position.supplied?.some(s => s.asset === asset.asset_type) ||
            pos.position.liquidity?.some(l => l.poolId === asset.asset_type)
        );
        if (isInDeFi) {
          console.log(
            `Excluding ${asset.metadata?.symbol} from asset value calculation (LP token in DeFi)`
          );
          return false;
        }
      }

      return true;
    });

    const assetValue = nonDeFiAssets.reduce(
      (sum, asset) => sum + (asset.value || 0),
      0
    );
    const defiValue = groupedDeFiPositions.reduce(
      (sum, pos) => sum + pos.totalValue,
      0
    );
    const totalValue = assetValue + defiValue;

    return { totalValue, assetValue, defiValue };
  }, [filteredAssets, groupedDeFiPositions, defiPositions]);

  const allDataLoaded =
    !portfolioLoading && !defiPositionsLoading && !nftsLoading;

  // Event handlers
  const handleAssetSelect = (asset: any) => {
    setSelectedAsset(asset);
    setSelectedDeFiPosition(null);
    setSelectedNFT(null);
    setActiveTab('performance');
  };

  const handleNFTSelect = (nft: NFT) => {
    setSelectedNFT(nft);
    setSelectedAsset(null);
    setSelectedDeFiPosition(null);
    setActiveTab('performance');
    
    // Open dialog on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setNftDetailsOpen(true);
    }
  };

  const handleDeFiPositionSelect = (position: any) => {
    setSelectedDeFiPosition(position);
    setSelectedAsset(null);
    setSelectedNFT(null);
    setActiveTab('performance');
    setProtocolDetailsOpen(true);
  };

  const handleClearSelection = () => {
    setSelectedAsset(null);
    setSelectedDeFiPosition(null);
    setSelectedNFT(null);
    setActiveTab('performance');
    // No need to change sidebarView - it stays on current section (tokens/nfts/defi)
  };

  const handleDeFiSortChange = (sortBy: string, order: 'asc' | 'desc') => {
    setDefiSortBy(sortBy as any);
    setDefiSortOrder(order);
  };

  if (!connected) {
    return <LandingSection />;
  }

  return (
    <div className={cn('min-h-screen flex flex-col', GeistMono.className)}>
      <div className="container-layout pt-6">
        <Header />
      </div>

      <main className="container-layout py-6 flex-1">
        {!allDataLoaded ? (
          <LoadingSkeleton />
        ) : (
          <>
            <PortfolioHeader
              totalValue={portfolioMetrics.totalValue}
              walletAddress={walletAddress}
              accountNames={accountNames || null}
            />

            <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-5">
              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-6 lg:col-span-2">
                {/* Sidebar Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-base">
                    <button
                      onClick={() => {
                        setSidebarView('assets');
                        handleClearSelection();
                      }}
                      className={`transition-colors ${
                        sidebarView === 'assets'
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tokens
                    </button>
                    <button
                      onClick={() => {
                        setSidebarView('nfts');
                        handleClearSelection();
                      }}
                      className={`transition-colors ${
                        sidebarView === 'nfts'
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      NFTs
                    </button>
                    <button
                      onClick={() => {
                        setSidebarView('defi');
                        handleClearSelection();
                      }}
                      className={`transition-colors ${
                        sidebarView === 'defi'
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      DeFi
                    </button>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex items-center gap-2">
                    {sidebarView === 'nfts' && (
                      <div className="hidden sm:flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNftShuffle(prev => prev + 1)}
                          title="Shuffle NFTs"
                        >
                          <Shuffle className="h-3 w-3" />
                        </Button>
                        <Button
                          variant={
                            nftViewMode === 'grid' ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => setNftViewMode('grid')}
                        >
                          <Grid className="h-3 w-3" />
                        </Button>
                        <Button
                          variant={
                            nftViewMode === 'collection' ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => setNftViewMode('collection')}
                        >
                          <List className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {sidebarView === 'assets' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAllAssets(!showAllAssets)}
                            className="p-2"
                          >
                            {showAllAssets ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {showAllAssets
                            ? 'Hide scam tokens, unverified tokens, and tokens under $0.10'
                            : 'Show all tokens including scam, unverified, and low value tokens'}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Content based on sidebar view */}
                {sidebarView === 'assets' && (
                  <AssetsTable
                    visibleAssets={filteredAssets}
                    selectedAsset={selectedAsset}
                    showOnlyVerified={!showAllAssets}
                    portfolioAssets={portfolioAssets || []}
                    onAssetSelect={handleAssetSelect}
                  />
                )}

                {sidebarView === 'nfts' && (
                  <>
                    <NFTGrid
                      nfts={shuffledNFTs || null}
                      nftsLoading={nftsLoading}
                      selectedNFT={selectedNFT}
                      onNFTSelect={handleNFTSelect}
                      viewMode={nftViewMode}
                    />
                    {/* NFT Pagination */}
                    {shuffledNFTs &&
                      shuffledNFTs.length > 0 &&
                      (hasPrevPage || hasNextPage) && (
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-muted-foreground">
                            Page {nftPage + 1} • {currentPageNFTs} NFTs
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!hasPrevPage}
                              onClick={() => setNftPage(0)}
                              title="First page"
                            >
                              <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!hasPrevPage}
                              onClick={() => setNftPage(nftPage - 1)}
                              title="Previous page"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!hasNextPage}
                              onClick={() => setNftPage(nftPage + 1)}
                              title="Next page"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!hasNextPage}
                              onClick={() => {
                                // Go to a reasonable "last" page - we'll increment until we hit a page with less than 30 items
                                let testPage = nftPage + 1;
                                while (testPage < 50) {
                                  // Reasonable upper limit
                                  testPage++;
                                }
                                setNftPage(testPage);
                              }}
                              title="Last page"
                            >
                              <ChevronsRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                  </>
                )}

                {sidebarView === 'defi' && (
                  <DeFiPositionsTable
                    groupedDeFiPositions={groupedDeFiPositions}
                    defiPositionsLoading={defiPositionsLoading}
                    selectedDeFiPosition={selectedDeFiPosition}
                    defiSortBy={defiSortBy}
                    defiSortOrder={defiSortOrder}
                    getProtocolLogo={getProtocolLogo}
                    onPositionSelect={handleDeFiPositionSelect}
                    onSortChange={handleDeFiSortChange}
                  />
                )}
              </div>

              {/* Main Content */}
              {
                <div
                  className="lg:col-span-3 tabs-container"
                  onClick={e => {
                    // Clear selection if clicking outside the details area
                    if (e.target === e.currentTarget) {
                      handleClearSelection();
                    }
                  }}
                >
                  <Tabs
                    value={activeTab}
                    onValueChange={value => setActiveTab(value as any)}
                    className="space-y-4 sm:space-y-6"
                  >
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger
                        value="performance"
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <span className="truncate">
                          {selectedAsset
                            ? `${selectedAsset.metadata?.symbol || 'Asset'} Details`
                            : selectedNFT
                              ? selectedNFT.token_name.length > 20
                                ? 'Selected NFT'
                                : `${selectedNFT.token_name} Details`
                              : selectedDeFiPosition
                                ? `${cleanProtocolName(selectedDeFiPosition.protocol)} Details`
                                : sidebarView === 'nfts'
                                  ? 'NFT Summary'
                                  : sidebarView === 'defi'
                                    ? 'DeFi Summary'
                                    : 'Performance'}
                        </span>
                        {!selectedAsset && !selectedNFT && !selectedDeFiPosition && sidebarView !== 'nfts' && sidebarView !== 'defi' && (
                          <span className="hidden sm:inline text-xs text-muted-foreground ml-1">
                            (APT only for now)
                          </span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="transactions"
                        className="text-xs sm:text-sm px-2 sm:px-3"
                        disabled
                      >
                        <span className="truncate">
                          {selectedNFT ? 'NFT Transfers' : 'Transactions'}
                        </span>
                        <span className="hidden sm:inline text-xs text-muted-foreground ml-1">
                          Coming Soon
                        </span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="performance" className="space-y-4">
                      {/* Individual Item Details */}
                      {selectedNFT ? (
                        <NFTAnalysis
                          nfts={shuffledNFTs || []}
                          nftsByCollection={{}}
                          selectedNFT={selectedNFT}
                          onClearSelection={handleClearSelection}
                        />
                      ) : selectedAsset ? (
                        <div className="bg-card border rounded-lg p-4 sm:p-6">
                          <div className="flex items-center gap-3 sm:gap-4 mb-4">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center flex-shrink-0">
                              <Image
                                src={getTokenLogoUrlWithFallback(
                                  selectedAsset.asset_type,
                                  selectedAsset.metadata
                                )}
                                alt={selectedAsset.metadata?.symbol || 'Asset'}
                                width={48}
                                height={48}
                                className={`rounded-full object-cover w-full h-full ${
                                  selectedAsset.metadata?.symbol?.toUpperCase() ===
                                    'APT' ||
                                  selectedAsset.asset_type.includes(
                                    'aptos_coin'
                                  )
                                    ? 'dark:invert'
                                    : ''
                                }`}
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-lg sm:text-xl font-semibold truncate">
                                {selectedAsset.metadata?.symbol || 'Unknown'}
                              </h3>
                              <p className="text-sm sm:text-base text-muted-foreground truncate">
                                {selectedAsset.metadata?.name ||
                                  'Unknown Token'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Balance
                              </p>
                              <p className="text-lg font-mono">
                                {formatTokenAmount(
                                  selectedAsset.balance || 0,
                                  undefined,
                                  { showSymbol: false }
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Value
                              </p>
                              <p className="text-lg font-mono">
                                {formatCurrency(selectedAsset.value || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Price (Panora)
                              </p>
                              <p className="text-lg font-mono">
                                {formatCurrency(selectedAsset.price || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Verification
                              </p>
                              <p className="text-sm">
                                {selectedAsset.isVerified
                                  ? '✅ Verified'
                                  : '⚠️ Unverified'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : selectedDeFiPosition ? (
                        <div className="bg-card border rounded-lg p-4 sm:p-6">
                          <div className="flex items-center gap-3 sm:gap-4 mb-4">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center flex-shrink-0">
                              <Image
                                src={getProtocolLogo(
                                  selectedDeFiPosition.protocol
                                )}
                                alt={selectedDeFiPosition.protocol}
                                width={48}
                                height={48}
                                className="rounded-full object-cover w-full h-full"
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-lg sm:text-xl font-semibold truncate">
                                {cleanProtocolName(selectedDeFiPosition.protocol)}
                              </h3>
                              <p className="text-sm sm:text-base text-muted-foreground truncate">
                                {Array.from(selectedDeFiPosition.protocolTypes)
                                  .map(type => {
                                    const typeStr = type as string;
                                    return typeStr === 'derivatives'
                                      ? 'Derivatives'
                                      : typeStr.charAt(0).toUpperCase() +
                                          typeStr.slice(1);
                                  })
                                  .join(', ')}
                              </p>
                              {selectedDeFiPosition.protocol ===
                                'Thala Farm' && (
                                <p className="text-xs text-blue-600 mt-1 italic">
                                  Deeper Thala Integration coming soon
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total Value
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-lg font-mono">
                                  {selectedDeFiPosition.protocol ===
                                  'Thala Farm'
                                    ? 'TBD'
                                    : formatCurrency(
                                        selectedDeFiPosition.totalValue || 0
                                      )}
                                </p>
                                {selectedDeFiPosition.protocol === 'Merkle' && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="text-xs text-muted-foreground cursor-help">
                                          ⓘ
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-sm">
                                          MKLP price is hardcoded to $1.05 for
                                          now
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Positions
                              </p>
                              <p className="text-lg">
                                {selectedDeFiPosition.positions.length}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              Position Details
                            </p>
                            <div className="space-y-2">
                              {/* Handle LP tokens with liquidity data */}
                              {selectedDeFiPosition.position?.liquidity &&
                                selectedDeFiPosition.position.liquidity.map(
                                  (lp: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="p-2 bg-muted/50 rounded"
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium">
                                          LP Token
                                        </span>
                                        <span className="text-sm font-mono">
                                          {lp.lpTokens} tokens
                                        </span>
                                      </div>
                                      <div className="text-xs text-muted-foreground space-y-1">
                                        <div className="flex justify-between">
                                          <span>
                                            Token 0:{' '}
                                            {lp.token0?.symbol || 'Unknown'}
                                          </span>
                                          <span>
                                            {lp.token0?.amount || 'TBD'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>
                                            Token 1:{' '}
                                            {lp.token1?.symbol || 'Unknown'}
                                          </span>
                                          <span>
                                            {lp.token1?.amount || 'TBD'}
                                          </span>
                                        </div>
                                        {selectedDeFiPosition.protocol ===
                                          'Thala Farm' && (
                                          <div className="text-xs text-blue-600 mt-1 italic">
                                            Deeper Thala Integration coming soon
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}

                              {/* Handle regular positions */}
                              {selectedDeFiPosition.positions &&
                                selectedDeFiPosition.positions.map(
                                  (pos: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center p-2 bg-muted/50 rounded"
                                    >
                                      <span className="text-sm">
                                        {pos.protocolType || 'Position'}
                                      </span>
                                      <span className="text-sm font-mono">
                                        {formatCurrency(pos.value || 0)}
                                      </span>
                                    </div>
                                  )
                                )}
                            </div>
                          </div>
                        </div>
                      ) : sidebarView === 'nfts' ? (
                        /* NFT Summary */
                        <NFTSummaryView
                          nfts={shuffledNFTs || []}
                          currentPageNFTs={currentPageNFTs}
                        />
                      ) : sidebarView === 'defi' ? (
                        /* Enhanced DeFi Summary */
                        <DeFiSummaryView
                          groupedDeFiPositions={groupedDeFiPositions}
                          totalDefiValue={portfolioMetrics.defiValue}
                          getProtocolLogo={getProtocolLogo}
                          onProtocolClick={handleDeFiPositionSelect}
                        />
                      ) : sidebarView === 'assets' ? (
                        /* Token Performance Chart */
                        <PerformanceChart walletAddress={walletAddress} />
                      ) : (
                        /* Default Portfolio Performance */
                        <PerformanceChart walletAddress={walletAddress} />
                      )}
                    </TabsContent>

                    <TabsContent value="transactions" className="space-y-4">
                      {selectedNFT ? (
                        <NFTTransferHistory
                          tokenDataId={selectedNFT.token_data_id}
                        />
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Transaction history coming soon...</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              }
            </div>
          </>
        )}
      </main>

      <Footer />

      {/* Protocol Details Dialog */}
      {selectedDeFiPosition && (
        <ProtocolDetailsDialog
          isOpen={protocolDetailsOpen}
          onClose={() => setProtocolDetailsOpen(false)}
          protocolName={selectedDeFiPosition.protocol}
          protocolLogo={getProtocolLogo(selectedDeFiPosition.protocol)}
          defiPosition={selectedDeFiPosition}
        />
      )}

      {/* NFT Details Dialog */}
      <NFTDetailsDialog
        isOpen={nftDetailsOpen}
        onClose={() => {
          setNftDetailsOpen(false);
          setSelectedNFT(null);
        }}
        nft={selectedNFT}
      />
    </div>
  );
}
