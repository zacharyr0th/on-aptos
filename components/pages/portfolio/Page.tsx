'use client';

import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { usePortfolioHistoryV2 } from '@/hooks/usePortfolioHistoryV2';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import {
  getProtocolLabel,
  shouldShowProtocolBadge,
} from '@/lib/protocol-registry';
import { NFTAnalysis } from './NFTAnalysis';
import { NFTTransferHistory } from './NFTTransferHistory';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import { NFT, SortField, SortDirection } from './types';
import { isPhantomAsset, getProtocolLogo } from './utils';

export default function PortfolioPage() {
  const { connected, account, wallet } = useWallet();
  const { theme, resolvedTheme } = useTheme();
  const walletAddress = account?.address?.toString();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [nftPage, setNftPage] = useState(0);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedDeFiPosition, setSelectedDeFiPosition] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'performance' | 'transactions' | 'nft-analysis' | 'nft-transfers'>('performance');
  const [sidebarView, setSidebarView] = useState<'assets' | 'nfts' | 'defi'>('assets');
  const [defiSortBy, setDefiSortBy] = useState<'protocol' | 'type' | 'value'>('value');
  const [defiSortOrder, setDefiSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [showAllAssets, setShowAllAssets] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portfolio-show-all-assets');
      return saved === null ? false : saved === 'true';
    }
    return false;
  });
  
  const [showOnlyDeFiTVL, setShowOnlyDeFiTVL] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portfolio-show-only-defi-tvl');
      return saved === null ? false : saved === 'true';
    }
    return false;
  });

  // Save preferences to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolio-show-all-assets', showAllAssets.toString());
    }
  }, [showAllAssets]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolio-show-only-defi-tvl', showOnlyDeFiTVL.toString());
    }
  }, [showOnlyDeFiTVL]);

  // tRPC queries
  const { data: portfolioAssets, isLoading: portfolioLoading } = 
    trpc.domains.blockchain.portfolio.getWalletAssets.useQuery(
      { walletAddress: walletAddress || '' },
      { enabled: !!walletAddress }
    );

  const { data: defiPositions, isLoading: defiPositionsLoading } = 
    trpc.domains.blockchain.portfolio.getDeFiPositions.useQuery(
      { walletAddress: walletAddress || '' },
      { enabled: !!walletAddress }
    );

  const { data: nfts, isLoading: nftsLoading } = 
    trpc.domains.blockchain.portfolio.getWalletNFTs.useQuery(
      { walletAddress: walletAddress || '', offset: nftPage * 50, limit: 50 },
      { enabled: !!walletAddress }
    );

  const { data: accountNames } = 
    trpc.domains.blockchain.portfolio.getAccountNames.useQuery(
      { walletAddress: walletAddress || '' },
      { enabled: !!walletAddress }
    );

  const { data: portfolioHistory } = usePortfolioHistoryV2(walletAddress || null);

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

  // Group and filter DeFi positions
  const groupedDeFiPositions = useMemo(() => {
    if (!defiPositions) return [];
    
    const grouped = defiPositions.reduce((acc: any[], position: any) => {
      const existingGroup = acc.find(g => g.protocol === position.protocol);
      
      if (existingGroup) {
        existingGroup.positions.push(position);
        existingGroup.totalValue += position.value || 0;
        existingGroup.protocolTypes.add(position.protocolType);
      } else {
        acc.push({
          protocol: position.protocol,
          positions: [position],
          totalValue: position.value || 0,
          protocolTypes: new Set([position.protocolType]),
          protocolInfo: position.protocolInfo
        });
      }
      
      return acc;
    }, []);
    
    if (showOnlyDeFiTVL) {
      return grouped.filter(group => shouldShowProtocolBadge(group.protocol));
    }
    
    return grouped;
  }, [defiPositions, showOnlyDeFiTVL]);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const assetValue = filteredAssets.reduce((sum, asset) => sum + (asset.value || 0), 0);
    const defiValue = groupedDeFiPositions.reduce((sum, pos) => sum + pos.totalValue, 0);
    const totalValue = assetValue + defiValue;
    
    return { totalValue, assetValue, defiValue };
  }, [filteredAssets, groupedDeFiPositions]);

  const allDataLoaded = !portfolioLoading && !defiPositionsLoading && !nftsLoading;

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
    setActiveTab('nft-analysis');
  };

  const handleDeFiPositionSelect = (position: any) => {
    setSelectedDeFiPosition(position);
    setSelectedAsset(null);
    setSelectedNFT(null);
    setActiveTab('performance');
  };

  const handleDeFiSortChange = (sortBy: string, order: 'asc' | 'desc') => {
    setDefiSortBy(sortBy as any);
    setDefiSortOrder(order);
  };

  if (!connected) {
    return <LandingSection />;
  }

  return (
    <div className={cn("min-h-screen flex flex-col", GeistMono.className)}>
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

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Sidebar Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-base">
                    <button
                      onClick={() => setSidebarView('assets')}
                      className={`transition-colors ${
                        sidebarView === 'assets' 
                          ? 'text-foreground font-medium' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tokens
                    </button>
                    <button
                      onClick={() => setSidebarView('nfts')}
                      className={`transition-colors ${
                        sidebarView === 'nfts' 
                          ? 'text-foreground font-medium' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      NFTs
                    </button>
                    <button
                      onClick={() => setSidebarView('defi')}
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
                    {sidebarView === 'defi' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Filter className="h-3 w-3 mr-1" />
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuCheckboxItem
                            checked={showOnlyDeFiTVL}
                            onCheckedChange={setShowOnlyDeFiTVL}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            High TVL protocols only
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                        <TooltipContent className="max-w-xs">
                          {showAllAssets ? (
                            <div>
                              <p className="font-medium mb-2">Hide filtered tokens</p>
                              <p className="text-xs">Will apply these filters:</p>
                              <ul className="text-xs mt-1 space-y-1">
                                <li>• Phantom Asset Detection: Remove known scam/spam tokens</li>
                                <li>• Verification Status: Only show Panora Exchange verified tokens</li>
                                <li>• Minimum Value: Hide tokens worth less than $0.10</li>
                              </ul>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium mb-2">Show all tokens</p>
                              <p className="text-xs">Currently filtering out:</p>
                              <ul className="text-xs mt-1 space-y-1">
                                <li>• Phantom Asset Detection: Known scam/spam tokens</li>
                                <li>• Verification Status: Unverified tokens</li>
                                <li>• Minimum Value: Tokens worth less than $0.10</li>
                              </ul>
                            </div>
                          )}
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
                  <NFTGrid
                    nfts={nfts || null}
                    nftsLoading={nftsLoading}
                    selectedNFT={selectedNFT}
                    onNFTSelect={handleNFTSelect}
                  />
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
              <div className="lg:col-span-3 tabs-container">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as any)}
                  className="space-y-4 sm:space-y-6"
                >
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="performance" className="text-xs sm:text-sm">
                      {selectedAsset
                        ? `${selectedAsset.metadata?.symbol || 'Asset'} Details`
                        : selectedNFT
                        ? selectedNFT.token_name.length > 20
                          ? 'Selected NFT'
                          : `${selectedNFT.token_name} Details`
                        : sidebarView === 'defi'
                        ? selectedDeFiPosition
                          ? `${selectedDeFiPosition.protocol} Stats`
                          : 'Stats'
                        : 'Performance'}
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="text-xs sm:text-sm">
                      {selectedNFT ? 'NFT Transfers' : 'Transactions'}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="performance" className="space-y-4">
                    {selectedNFT ? (
                      <NFTAnalysis 
                        nfts={nfts || []} 
                        nftsByCollection={{}} 
                        selectedNFT={selectedNFT} 
                      />
                    ) : (
                      <PerformanceChart
                        walletAddress={walletAddress}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="transactions" className="space-y-4">
                    {selectedNFT ? (
                      <NFTTransferHistory tokenDataId={selectedNFT.token_data_id} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Transaction history coming soon...</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}