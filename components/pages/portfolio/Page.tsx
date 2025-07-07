'use client';

import React, { useMemo, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { Briefcase, TrendingUp, TrendingDown, Coins, Image as ImageIcon, ArrowUpRight, ArrowDownRight, ExternalLink, Clock, Copy } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { formatCurrency, formatPercentage, formatTokenAmount } from '@/lib/utils/format';
import { getTokenLogoUrlWithFallback } from '@/lib/utils/token-logos';
import Image from 'next/image';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Filter, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Protocol logo mapping - Comprehensive coverage for all protocols
const getProtocolLogo = (protocol: string): string => {
  const protocolName = protocol.toLowerCase();
  const logoMap: Record<string, string> = {
    // Core Aptos Infrastructure
    'aptos framework': '/icons/apt.png',
    'digital assets': '/icons/apt.png',
    'aptos token v2': '/icons/apt.png',
    
    // Liquid Staking Protocols
    'amnis': '/icons/protocols/amnis.avif',
    'amnis finance': '/icons/protocols/amnis.avif',
    'thala liquid staking': '/icons/protocols/thala.avif',
    'trufin': '/icons/protocols/trufin.webp',
    
    // Lending Protocols
    'aries': '/icons/protocols/aries.avif',
    'aries markets': '/icons/protocols/aries.avif',
    'aptin': '/icons/protocols/aptin.webp',
    'aptin finance': '/icons/protocols/aptin.webp',
    'echelon': '/icons/protocols/echelon.avif',
    'echelon market': '/icons/protocols/echelon.avif',
    'echo': '/icons/protocols/echo.webp',
    'echo lending': '/icons/protocols/echo.webp',
    'meso': '/icons/protocols/meso.webp',
    'meso finance': '/icons/protocols/meso.webp',
    'joule': '/icons/protocols/joule.webp',
    'joule finance': '/icons/protocols/joule.webp',
    'superposition': '/icons/protocols/superposition.webp',
    'aave': '/placeholder.jpg', // No specific logo available
    'thala cdp': '/icons/protocols/thala.avif',
    
    // DEX Protocols
    'liquidswap': '/icons/protocols/liquidswap.webp',
    'pancakeswap': '/icons/protocols/pancake.webp',
    'pancake': '/icons/protocols/pancake.webp',
    'sushi': '/icons/protocols/sushi.webp',
    'sushiswap': '/icons/protocols/sushi.webp',
    'cellana': '/icons/protocols/cellana.webp',
    'cellana finance': '/icons/protocols/cellana.webp',
    'panora': '/icons/protocols/panora.webp',
    'panora exchange': '/icons/protocols/panora.webp',
    'kana': '/icons/protocols/kana.webp',
    'kanalabs': '/icons/protocols/kana.webp',
    'hyperion': '/icons/protocols/hyperion.webp',
    'econia': '/icons/protocols/econia.jpg',
    'vibrantx': '/icons/protocols/vibrantx.png',
    'uptos pump': '/icons/protocols/pump-uptos.jpg',
    'pump-uptos': '/icons/protocols/pump-uptos.jpg',
    'defy': '/placeholder.jpg', // No specific logo available
    'lucid finance': '/placeholder.jpg', // No specific logo available
    'pact labs': '/placeholder.jpg', // No specific logo available
    'thetis': '/icons/protocols/thetis.webp',
    'thetis market': '/icons/protocols/thetis.webp',
    
    // Derivatives & Trading
    'merkle': '/icons/protocols/merkle.webp',
    'merkle trade': '/icons/protocols/merkle.webp',
    
    // Farming Protocols
    'thala': '/icons/protocols/thala.avif',
    'thala farm': '/icons/protocols/thala.avif',
    'thala infrastructure': '/icons/protocols/thala.avif',
    
    // Bridge Protocols
    'layerzero': '/placeholder.jpg', // No specific logo available
    'wormhole': '/placeholder.jpg', // No specific logo available
    'celer': '/placeholder.jpg', // No specific logo available
    'celer bridge': '/placeholder.jpg', // No specific logo available
    
    // Other Protocols
    'agdex': '/icons/protocols/agdex.webp',
    'anqa': '/icons/protocols/anqa.webp',
    'emojicoin': '/icons/protocols/emojicoin.webp',
    'ichi': '/icons/protocols/ichi.jpg',
    'metamove': '/icons/protocols/metamove.png',
    'mirage': '/icons/protocols/mirage.webp',
    'moar': '/icons/protocols/moar.webp',
    'tapp': '/icons/protocols/tapp.jpg',
    'crossmint': '/icons/protocols/crossmint.jpeg',
    'eliza': '/icons/protocols/eliza.jpeg',
    'tradeport': '/icons/protocols/tradeport.jpg',
    
    // Stablecoin Protocols
    'usdc': '/icons/protocols/usdc.avif',
    'usde': '/icons/protocols/usde.avif',
    'usdt': '/icons/protocols/usdt.avif',
    
    // Additional protocol variations and aliases
    'kofi': '/icons/protocols/kofi.avif',
    'sushi finance': '/icons/protocols/sushi.webp',
    'pancake finance': '/icons/protocols/pancake.webp',
    'liquid swap': '/icons/protocols/liquidswap.webp',
    'merkle finance': '/icons/protocols/merkle.webp',
  };
  
  return logoMap[protocolName] || '/placeholder.jpg';
};
import { getProtocolLabel, isPhantomAsset as isPhantomAssetFromRegistry, getPhantomReason } from '@/lib/protocol-registry';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NFT {
  token_data_id: string;
  token_name: string;
  collection_name: string;
  token_uri: string;
  description?: string;
  property_version_v1: number;
  amount: number;
  cdn_image_uri?: string;
  cdn_animation_uri?: string;
  collection_description?: string;
  creator_address?: string;
  collection_uri?: string;
  last_transaction_version?: number;
  last_transaction_timestamp?: string;
}

const formatTimestamp = (timestamp: string) => {
  // Handle different timestamp formats
  let date: Date;
  if (timestamp.includes('-') || timestamp.includes('T')) {
    // ISO format timestamp
    date = new Date(timestamp);
  } else {
    // Unix timestamp (in microseconds for Aptos)
    date = new Date(Number(timestamp) / 1000);
  }
  return date.toLocaleString();
};

// Use the centralized protocol registry for phantom asset detection
const isPhantomAsset = (assetType: string, metadata?: any): boolean => {
  return isPhantomAssetFromRegistry(assetType, metadata);
};

type SortField = 'timestamp' | 'type' | 'amount' | 'asset';
type SortDirection = 'asc' | 'desc';

const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  } catch (err) {
    toast.error('Failed to copy to clipboard');
  }
};

export default function PortfolioPage() {
  const { connected, account, wallet } = useWallet();
  const walletAddress = account?.address?.toString();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [nftPage, setNftPage] = useState(0);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const NFT_LIMIT = 20;
  
  const handleAccountSwitch = async (accountAddress: string) => {
    try {
      // Account switching functionality would go here
      toast.info('Account switching not yet implemented');
    } catch (error) {
      toast.error('Failed to switch account');
    }
  };
  
  const [sidebarView, setSidebarView] = useState<'assets' | 'nfts'>('assets');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [transactionFilters, setTransactionFilters] = useState<{
    deposits: boolean;
    withdrawals: boolean;
    swaps: boolean;
    other: boolean;
  }>({
    deposits: true,
    withdrawals: true,
    swaps: true,
    other: true
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { data: portfolioAssets, isLoading: assetsLoading, error: assetsError } = trpc.domains.blockchain.portfolio.getWalletAssets.useQuery(
    { walletAddress: walletAddress || '' },
    { 
      enabled: !!walletAddress,
      refetchInterval: 30000,
      staleTime: 10000,
    }
  );
  

  const { data: transactionHistory, isLoading: transactionHistoryLoading } = trpc.domains.blockchain.portfolio.getWalletTransactions.useQuery(
    { walletAddress: walletAddress || '', limit: 50 },
    { 
      enabled: !!walletAddress,
      refetchInterval: 60000,
      staleTime: 30000,
    }
  );

  const { data: portfolioMetrics, isLoading: metricsLoading } = trpc.domains.blockchain.portfolio.getPortfolioMetrics.useQuery(
    { walletAddress: walletAddress || '' },
    { 
      enabled: !!walletAddress,
      refetchInterval: 30000,
      staleTime: 10000,
    }
  );

  const { data: portfolioHistory, isLoading: portfolioHistoryLoading } = trpc.domains.blockchain.portfolio.getPortfolioHistory.useQuery(
    { walletAddress: walletAddress || '', days: 30 },
    { 
      enabled: !!walletAddress,
      refetchInterval: 60000,
      staleTime: 30000,
    }
  );

  // ANS queries
  const { data: primaryName, isLoading: primaryNameLoading } = trpc.domains.blockchain.portfolio.getPrimaryName.useQuery(
    { walletAddress: walletAddress || '' },
    { 
      enabled: !!walletAddress,
      refetchInterval: 300000, // 5 minutes - ANS names don't change often
      staleTime: 180000, // 3 minutes
    }
  );

  const { data: accountNames, isLoading: accountNamesLoading } = trpc.domains.blockchain.portfolio.getAccountNames.useQuery(
    { walletAddress: walletAddress || '' },
    { 
      enabled: !!walletAddress,
      refetchInterval: 300000, // 5 minutes
      staleTime: 180000, // 3 minutes
    }
  );

  const { data: accountDomains, isLoading: accountDomainsLoading } = trpc.domains.blockchain.portfolio.getAccountDomains.useQuery(
    { walletAddress: walletAddress || '' },
    { 
      enabled: !!walletAddress,
      refetchInterval: 300000, // 5 minutes
      staleTime: 180000, // 3 minutes
    }
  );

  // DeFi positions query
  const { data: defiPositions, isLoading: defiPositionsLoading } = trpc.domains.blockchain.portfolio.getDeFiPositions.useQuery(
    { walletAddress: walletAddress || '' },
    { 
      enabled: !!walletAddress,
      refetchInterval: 60000, // 1 minute
      staleTime: 30000, // 30 seconds
    }
  );

  const { data: defiStats, isLoading: defiStatsLoading } = trpc.domains.blockchain.portfolio.getDeFiStats.useQuery(
    { walletAddress: walletAddress || '' },
    { 
      enabled: !!walletAddress,
      refetchInterval: 60000, // 1 minute
      staleTime: 30000, // 30 seconds
    }
  );

  // NFT query
  const { data: nfts, isLoading: nftsLoading, refetch: refetchNFTs } = trpc.domains.blockchain.portfolio.getWalletNFTs.useQuery(
    { 
      walletAddress: walletAddress || '', 
      limit: NFT_LIMIT, 
      offset: nftPage * NFT_LIMIT 
    },
    { 
      enabled: !!walletAddress && sidebarView === 'nfts',
      refetchInterval: 60000, // 1 minute
      staleTime: 30000,
    }
  );

  // Group NFTs by collection
  const nftsByCollection = useMemo(() => {
    if (!nfts || nfts.length === 0) return {};
    
    try {
      return nfts.reduce((acc, nft) => {
        if (!nft || typeof nft !== 'object') {
          console.warn('Invalid NFT object:', nft);
          return acc;
        }
        
        const collection = nft.collection_name || 'Unknown Collection';
        if (!acc[collection]) {
          acc[collection] = [];
        }
        acc[collection].push(nft);
        return acc;
      }, {} as Record<string, NFT[]>);
    } catch (error) {
      console.error('Error grouping NFTs by collection:', error);
      return {};
    }
  }, [nfts]);

  const assets = useMemo(() => {
    if (!portfolioAssets) return [];
    return portfolioAssets || [];
  }, [portfolioAssets]);

  const visibleAssets = useMemo(() => {
    return assets.filter(asset => 
      !isPhantomAsset(asset.asset_type, asset.metadata) && 
      (asset.value || 0) >= 0.10
    );
  }, [assets]);

  const phantomAssets = useMemo(() => {
    return assets.filter(asset => isPhantomAsset(asset.asset_type, asset.metadata));
  }, [assets]);

  const transactions = useMemo(() => {
    if (!transactionHistory) return [];
    
    const categorizedTransactions = transactionHistory.map(tx => {
      let category: 'deposit' | 'withdrawal' | 'swap' | 'other' = 'other';
      
      if (tx.type.includes('swap') || tx.type.includes('exchange')) {
        category = 'swap';
      } else if (tx.type.includes('deposit') || tx.type.includes('mint')) {
        category = 'deposit';
      } else if (tx.type.includes('withdraw') || tx.type.includes('burn')) {
        category = 'withdrawal';
      }
      
      return {
        ...tx,
        category
      };
    });
    
    return categorizedTransactions;
  }, [transactionHistory]);

  const { sortedTransactions, paginatedTransactions, totalPages } = useMemo(() => {
    const filtered = transactions.filter(tx => {
      if (tx.category === 'deposit' && !transactionFilters.deposits) return false;
      if (tx.category === 'withdrawal' && !transactionFilters.withdrawals) return false;
      if (tx.category === 'swap' && !transactionFilters.swaps) return false;
      if (tx.category === 'other' && !transactionFilters.other) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;
      
      switch (sortField) {
        case 'timestamp':
          compareValue = Number(a.transaction_timestamp) - Number(b.transaction_timestamp);
          break;
        case 'type':
          compareValue = a.type.localeCompare(b.type);
          break;
        case 'amount':
          const amountA = a.amount ? Number(a.amount) : 0;
          const amountB = b.amount ? Number(b.amount) : 0;
          compareValue = amountA - amountB;
          break;
        case 'asset':
          const assetA = a.asset_type || '';
          const assetB = b.asset_type || '';
          compareValue = assetA.localeCompare(assetB);
          break;
      }
      
      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedTransactions = sorted.slice(startIndex, endIndex);

    return {
      sortedTransactions: sorted,
      paginatedTransactions,
      totalPages,
      filteredCount: sorted.length
    };
  }, [transactions, sortField, sortDirection, transactionFilters, currentPage, ITEMS_PER_PAGE]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [transactionFilters]);

  const isLoading = assetsLoading || transactionHistoryLoading || metricsLoading || portfolioHistoryLoading || (sidebarView === 'nfts' && nftsLoading);
  const allDataLoaded = !isLoading;
  const isANSLoading = primaryNameLoading || accountNamesLoading || accountDomainsLoading;

  const portfolioValue30d = useMemo(() => {
    if (!portfolioHistory?.length) return null;
    
    const current = portfolioHistory[portfolioHistory.length - 1]?.totalValue || 0;
    const previous = portfolioHistory[0]?.totalValue || 0;
    const change = current - previous;
    const percentChange = previous > 0 ? (change / previous) * 100 : 0;
    return {
      current,
      previous,
      change,
      percentChange
    };
  }, [portfolioHistory]);

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
          <Header />
        </div>

        <main className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 flex-1 flex items-start justify-center">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
          
          <div className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            {/* Left Side - Big Text */}
            <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
              <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="block text-primary bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                  A Complete
                </span>
                <span className="block text-muted-foreground -mt-1 sm:-mt-2">
                  Overview
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 mb-6 sm:mb-8">
                Track all your assets, DeFi positions, and NFTs in real-time across the Aptos ecosystem
              </p>
              
              {/* CTA Button */}
              <div className="flex justify-center lg:justify-start">
                <WalletConnectButton />
              </div>
            </div>

            {/* Right Side - Logo with Text */}
            <div className="relative flex justify-center order-first lg:order-last">
              {/* Large APT Logo Background */}
              <div className="relative flex items-center justify-center">
                <div className="w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 opacity-15 dark:opacity-25">
                  <Image 
                    src="/icons/apt.png" 
                    alt="Aptos" 
                    width={320}
                    height={320}
                    className="object-contain dark:invert w-full h-full"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/placeholder.jpg';
                    }}
                  />
                </div>
                
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        <Header />
      </div>

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 flex-1">
        {!allDataLoaded ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center bg-card border rounded-lg py-3 sm:py-4 px-4 sm:px-6 gap-3 sm:gap-0">
              <div className="flex-grow">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <h1 className="text-xl sm:text-2xl font-bold">My Portfolio</h1>
                </div>
                <Skeleton className="h-3 sm:h-4 w-32 sm:w-48" />
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1">
                <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
                <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <Skeleton className="h-6 sm:h-8 w-full" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 sm:h-16 w-full" />
                  ))}
                </div>
              </div>
              
              <div className="lg:col-span-3">
                <div className="space-y-4 sm:space-y-6">
                  <Skeleton className="h-10 sm:h-12 w-full" />
                  <Skeleton className="h-64 sm:h-80 lg:h-96 w-full" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center bg-card border rounded-lg py-3 sm:py-4 px-4 sm:px-6 mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="flex-grow">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <h1 className="text-xl sm:text-2xl font-bold">My Portfolio</h1>
            </div>
            {walletAddress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Account:</span>
                <button
                  onClick={() => copyToClipboard(walletAddress, 'Account address')}
                  className="hover:text-foreground transition-all duration-200 flex items-center gap-1 group relative overflow-hidden"
                >
                  <span className="font-mono transition-all duration-200 group-hover:opacity-0 group-hover:absolute">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                  <span className="font-mono transition-all duration-200 opacity-0 group-hover:opacity-100 absolute group-hover:relative whitespace-nowrap">
                    {walletAddress}
                  </span>
                  <Copy className="h-3 w-3 ml-1 flex-shrink-0" />
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`https://explorer.aptoslabs.com/account/${walletAddress}?network=mainnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                      aria-label="View account on Aptos Explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View account on Aptos Explorer</p>
                  </TooltipContent>
                </Tooltip>
                {(accountNames && accountNames.length > 0) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs text-primary">
                          <span>{accountNames.length} ANS</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          <p className="font-medium mb-1">ANS Names ({accountNames.length}):</p>
                          <div className="space-y-1">
                            {accountNames.slice(0, 5).map((name, index) => (
                              <p key={index} className="text-xs font-mono">{name}</p>
                            ))}
                            {accountNames.length > 5 && (
                              <p className="text-xs text-muted-foreground">
                                +{accountNames.length - 5} more
                              </p>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-start sm:items-end gap-1">
            <div className="text-xl sm:text-2xl font-bold">
              {formatCurrency(portfolioMetrics?.totalValue || 0)}
            </div>
            {portfolioMetrics?.totalChangePercent24h !== undefined && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1 text-sm cursor-help",
                    portfolioMetrics.totalChangePercent24h >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {portfolioMetrics.totalChangePercent24h >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span>{formatPercentage(Math.abs(portfolioMetrics.totalChangePercent24h))}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>24-hour portfolio performance</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {wallet?.accounts && wallet.accounts.length > 1 && (
              <div className="mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-2"
                      aria-label="Switch account"
                      aria-haspopup="menu"
                    >
                      <span className="font-mono text-xs">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {wallet.accounts.map((acc, index) => (
                      <DropdownMenuItem
                        key={acc.address}
                        onClick={() => handleAccountSwitch(acc.address)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <span className="font-mono text-xs">
                            {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Account {index + 1}
                          </span>
                        </div>
                        {acc.address === walletAddress && (
                          <div className="h-2 w-2 bg-green-500 rounded-full" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2 mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-2 font-semibold text-lg sm:text-xl">
                  Assets
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={sidebarView === 'assets' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSidebarView('assets');
                        setNftPage(0);
                      }}
                      className="h-8"
                      aria-label="View assets"
                    >
                      <Coins className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View your fungible assets</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={sidebarView === 'nfts' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSidebarView('nfts');
                        setNftPage(0);
                      }}
                      className="h-8"
                      aria-label="View NFTs"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View your NFTs and collectibles</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1" aria-label="Filter assets">
                    <Filter className="h-3 w-3" />
                    <span className="hidden xs:inline">Filter</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter your assets by type or value</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {sidebarView === 'assets' ? (
              <div>
                {visibleAssets.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead className="hidden sm:table-cell">Amount</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleAssets.map((asset, index) => (
                        <TableRow key={`${asset.asset_type}-${index}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center">
                                <Image 
                                  src={getTokenLogoUrlWithFallback(asset.asset_type, asset.metadata)} 
                                  alt={asset.metadata?.symbol || 'Asset'} 
                                  width={32}
                                  height={32}
                                  className="rounded-full object-cover w-full h-full"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = '/placeholder.jpg';
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm sm:text-base truncate">
                                  {asset.metadata?.symbol || 'Unknown'}
                                </div>
                                <div className="text-xs text-muted-foreground sm:hidden">
                                  {formatTokenAmount(asset.amount, asset.metadata?.decimals || 8)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="text-sm">
                              {formatTokenAmount(asset.amount, asset.metadata?.decimals || 8)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium text-sm sm:text-base">
                              {formatCurrency(asset.value || 0)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No assets found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {nftsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                ) : nfts && nfts.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {Object.entries(nftsByCollection).map(([collectionName, collectionNfts]) => {
                        try {
                          return (
                            <div key={collectionName} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-muted-foreground">{collectionName}</h4>
                                <Badge variant="secondary" className="text-xs">{collectionNfts.length}</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {collectionNfts.map((nft, index) => {
                                  if (!nft || !nft.token_data_id) {
                                    console.warn('Invalid NFT data:', nft);
                                    return null;
                                  }
                                  return (
                        <div 
                          key={`${nft.token_data_id}-${index}`} 
                          className="relative group cursor-pointer"
                          onClick={() => setSelectedNFT(nft)}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors">
                            {(() => {
                              const imageUrl = nft.cdn_image_uri || nft.token_uri;
                              if (!imageUrl) {
                                return (
                                  <div className="relative w-full h-full">
                                    <Image
                                      src="/placeholder.jpg"
                                      alt={nft.token_name}
                                      fill
                                      sizes="(max-width: 768px) 50vw, 33vw"
                                      className="object-cover"
                                    />
                                  </div>
                                );
                              }
                              
                              // Check if URL is valid and starts with http/https
                              try {
                                const url = new URL(imageUrl);
                                if (!['http:', 'https:'].includes(url.protocol)) {
                                  throw new Error('Invalid protocol');
                                }
                                
                                return (
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={imageUrl}
                                      alt={nft.token_name}
                                      fill
                                      sizes="(max-width: 768px) 50vw, 33vw"
                                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                                      onError={(e) => {
                                        const img = e.currentTarget as HTMLImageElement;
                                        img.src = '/placeholder.jpg';
                                      }}
                                    />
                                  </div>
                                );
                              } catch (error) {
                                console.warn('Invalid NFT image URL:', imageUrl, error);
                                return (
                                  <div className="relative w-full h-full">
                                    <Image
                                      src="/placeholder.jpg"
                                      alt={nft.token_name}
                                      fill
                                      sizes="(max-width: 768px) 50vw, 33vw"
                                      className="object-cover"
                                    />
                                  </div>
                                );
                              }
                            })()}
                            {nft.amount > 1 && (
                              <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
                                x{nft.amount}
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium truncate">{nft.token_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{nft.collection_name}</p>
                          </div>
                        </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        } catch (error) {
                          console.error('Error rendering NFT collection:', collectionName, error);
                          return null;
                        }
                      })}
                    </div>
                    {nfts.length === NFT_LIMIT && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNftPage(Math.max(0, nftPage - 1))}
                          disabled={nftPage === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNftPage(nftPage + 1);
                            refetchNFTs();
                          }}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No NFTs found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <Tabs defaultValue="performance" className="space-y-4 sm:space-y-6">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
                <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
                <TabsTrigger value="defi" className="text-xs sm:text-sm">DeFi</TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="pb-2 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-lg sm:text-xl">Performance</CardTitle>
                      <div className="text-left sm:text-right">
                        <div className="text-sm text-muted-foreground">30d</div>
                        <div className="text-sm font-medium">
                          {portfolioValue30d ? (
                            <span className={cn(
                              "block sm:text-right",
                              portfolioValue30d.change >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              <span className="sm:hidden">{portfolioValue30d.change >= 0 ? '+' : ''}{formatCurrency(portfolioValue30d.change)}</span>
                              <span className="hidden sm:inline">{portfolioValue30d.change >= 0 ? '+' : ''}{formatCurrency(portfolioValue30d.change)} | {portfolioValue30d.percentChange >= 0 ? '+' : ''}{formatPercentage(portfolioValue30d.percentChange)}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 pb-4 sm:pb-6 px-4 sm:px-6">
                    {portfolioHistory && portfolioHistory.length > 0 ? (
                      <div className="w-full">
                        <ChartContainer
                          config={{
                            value: {
                              label: "Portfolio Value",
                              color: "hsl(var(--chart-1))",
                            },
                          }}
                          className="h-[200px] sm:h-[250px] lg:h-[300px] w-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={portfolioHistory}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                              dataKey="date" 
                              className="text-xs"
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis 
                              className="text-xs"
                              tickFormatter={(value) => {
                                if (value === 0) return '$0';
                                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                                if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
                                return `$${value.toFixed(2)}`;
                              }}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                              type="monotone"
                              dataKey="totalValue"
                              stroke="hsl(var(--chart-1))"
                              fillOpacity={1}
                              fill="url(#colorValue)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      </div>
                    ) : (
                      <div className="h-[200px] sm:h-[250px] lg:h-[300px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm sm:text-base">No performance data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="defi" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-lg sm:text-xl">DeFi Positions</CardTitle>
                    <CardDescription className="text-sm">
                      Your positions across DeFi protocols on Aptos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    {defiPositionsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : defiPositions && defiPositions.length > 0 ? (
                      <div className="space-y-4">
                        {/* DeFi Stats Summary */}
                        {defiStats && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                              <div className="text-xs sm:text-sm text-muted-foreground">Total Positions</div>
                              <div className="text-xl sm:text-2xl font-bold">{defiStats.totalPositions}</div>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                              <div className="text-xs sm:text-sm text-muted-foreground">Total Value Locked</div>
                              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(defiStats.totalValueLocked)}</div>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                              <div className="text-xs sm:text-sm text-muted-foreground">Top Protocol</div>
                              <div className="text-base sm:text-lg font-semibold">
                                {defiStats.topProtocols[0]?.protocol || 'None'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* DeFi Positions List */}
                        <div className="space-y-3">
                          {defiPositions.map((position, index) => (
                            <div key={`${position.protocol}-${index}`} className="border rounded-lg p-3 sm:p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-background border flex-shrink-0">
                                    <Image
                                      src={getProtocolLogo(position.protocol)}
                                      alt={`${position.protocol} logo`}
                                      fill
                                      className="object-cover"
                                      sizes="32px"
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        img.src = '/placeholder.jpg';
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-sm sm:text-base truncate">{position.protocol}</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                                      {position.protocolType.replace('_', ' ')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-medium text-sm sm:text-base">{formatCurrency(position.totalValue)}</div>
                                  <div className="text-xs text-muted-foreground">{position.protocolLabel}</div>
                                </div>
                              </div>

                              {/* Position Details */}
                              <div className="space-y-2">
                                {/* Supplied Assets */}
                                {position.position.supplied && position.position.supplied.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-1">Supplied</div>
                                    <div className="flex flex-wrap gap-2">
                                      {position.position.supplied.map((supply, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {supply.symbol}: {formatTokenAmount(supply.amount, 8)}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Borrowed Assets */}
                                {position.position.borrowed && position.position.borrowed.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-1">Borrowed</div>
                                    <div className="flex flex-wrap gap-2">
                                      {position.position.borrowed.map((borrow, idx) => (
                                        <Badge key={idx} variant="destructive" className="text-xs">
                                          {borrow.symbol}: {formatTokenAmount(borrow.amount, 8)}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Staked Assets */}
                                {position.position.staked && position.position.staked.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-1">Staked</div>
                                    <div className="flex flex-wrap gap-2">
                                      {position.position.staked.map((stake, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {stake.symbol}: {formatTokenAmount(stake.amount, 8)}
                                          {stake.rewards && (
                                            <span className="ml-1 text-green-600">
                                              +{formatTokenAmount(stake.rewards, 8)} rewards
                                            </span>
                                          )}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Liquidity Positions */}
                                {position.position.liquidity && position.position.liquidity.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-1">Liquidity</div>
                                    <div className="flex flex-wrap gap-2">
                                      {position.position.liquidity.map((lp, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          LP Tokens: {formatTokenAmount(lp.lpTokens, 8)}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Derivatives Positions */}
                                {position.position.derivatives && position.position.derivatives.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-1">Derivatives</div>
                                    <div className="flex flex-wrap gap-2">
                                      {position.position.derivatives.map((deriv, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {deriv.symbol}: {formatTokenAmount(deriv.amount, 8)} ({deriv.type})
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="h-8 w-8" />
                        </div>
                        <p className="text-lg font-medium mb-2">No DeFi Positions Found</p>
                        <p className="text-sm">
                          Connect to DeFi protocols on Aptos to see your positions here
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Transaction History</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 gap-1">
                            <Filter className="h-3 w-3" />
                            <span>Filter</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Transaction Types</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem
                            checked={transactionFilters.deposits}
                            onCheckedChange={(checked) => 
                              setTransactionFilters(prev => ({ ...prev, deposits: checked }))
                            }
                          >
                            Deposits
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={transactionFilters.withdrawals}
                            onCheckedChange={(checked) => 
                              setTransactionFilters(prev => ({ ...prev, withdrawals: checked }))
                            }
                          >
                            Withdrawals
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={transactionFilters.swaps}
                            onCheckedChange={(checked) => 
                              setTransactionFilters(prev => ({ ...prev, swaps: checked }))
                            }
                          >
                            Swaps
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={transactionFilters.other}
                            onCheckedChange={(checked) => 
                              setTransactionFilters(prev => ({ ...prev, other: checked }))
                            }
                          >
                            Other
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('timestamp')}
                            >
                              <div className="flex items-center gap-1">
                                Time
                                {sortField === 'timestamp' && (
                                  <span className="text-xs">
                                    {sortDirection === 'desc' ? '↓' : '↑'}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('type')}
                            >
                              <div className="flex items-center gap-1">
                                Type
                                {sortField === 'type' && (
                                  <span className="text-xs">
                                    {sortDirection === 'desc' ? '↓' : '↑'}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('asset')}
                            >
                              <div className="flex items-center gap-1">
                                Asset
                                {sortField === 'asset' && (
                                  <span className="text-xs">
                                    {sortDirection === 'desc' ? '↓' : '↑'}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('amount')}
                            >
                              <div className="flex items-center gap-1">
                                Amount
                                {sortField === 'amount' && (
                                  <span className="text-xs">
                                    {sortDirection === 'desc' ? '↓' : '↑'}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                {sortedTransactions.length === 0 
                                  ? "No transactions found" 
                                  : "No transactions match the selected filters"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedTransactions.map((tx, index) => {
                              const categoryColors = {
                                deposit: 'text-green-600',
                                withdrawal: 'text-red-600',
                                swap: 'text-blue-600',
                                other: 'text-gray-600'
                              };

                              const categoryLabels = {
                                deposit: 'Deposit',
                                withdrawal: 'Withdrawal',
                                swap: 'Swap',
                                other: 'Other'
                              };

                              return (
                                <TableRow key={tx.transaction_version || index}>
                                  <TableCell className="font-mono text-xs">
                                    {formatTimestamp(tx.transaction_timestamp)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant="outline" 
                                      className={cn("text-xs", categoryColors[tx.category])}
                                    >
                                      {categoryLabels[tx.category]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">
                                        {tx.asset_type.split('::').pop() || 'Unknown'}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {tx.amount ? (
                                      <span className="font-mono text-sm">
                                        {Number(tx.amount).toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={tx.is_transaction_success ? "default" : "destructive"} className="text-xs">
                                      {tx.is_transaction_success ? "Success" : "Failed"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <a
                                      href={`https://explorer.aptoslabs.com/txn/${tx.transaction_version}?network=mainnet`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-primary transition-colors"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                          {Math.min(currentPage * ITEMS_PER_PAGE, sortedTransactions.length)} of{' '}
                          {sortedTransactions.length} transactions
                        </p>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                className={cn(
                                  "cursor-pointer",
                                  currentPage === 1 && "pointer-events-none opacity-50"
                                )}
                              />
                            </PaginationItem>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNumber;
                              if (totalPages <= 5) {
                                pageNumber = i + 1;
                              } else if (currentPage <= 3) {
                                pageNumber = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNumber = totalPages - 4 + i;
                              } else {
                                pageNumber = currentPage - 2 + i;
                              }
                              
                              return (
                                <PaginationItem key={pageNumber}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(pageNumber)}
                                    isActive={currentPage === pageNumber}
                                    className="cursor-pointer"
                                  >
                                    {pageNumber}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            })}
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                className={cn(
                                  "cursor-pointer",
                                  currentPage === totalPages && "pointer-events-none opacity-50"
                                )}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Asset Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of your portfolio by asset value
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {visibleAssets.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        No assets to display
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {visibleAssets
                          .sort((a, b) => (b.value || 0) - (a.value || 0))
                          .slice(0, 10)
                          .map((asset, index) => {
                            const percentage = portfolioMetrics?.totalValue 
                              ? ((asset.value || 0) / portfolioMetrics.totalValue) * 100 
                              : 0;
                            
                            return (
                              <div key={`${asset.asset_type}-analytics-${index}`} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Image 
                                      src={getTokenLogoUrlWithFallback(asset.asset_type, asset.metadata)} 
                                      alt={asset.metadata?.symbol || 'Asset'} 
                                      width={24}
                                      height={24}
                                      className="rounded-full object-cover"
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        img.src = '/placeholder.jpg';
                                      }}
                                    />
                                    <span className="font-medium">
                                      {asset.metadata?.symbol || 'Unknown'}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">
                                      {formatCurrency(asset.value || 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {percentage.toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        </>
        )}
        </main>

      <Footer />
      
      {/* NFT Detail Dialog */}
      <Dialog open={!!selectedNFT} onOpenChange={(open) => !open && setSelectedNFT(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedNFT && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedNFT.token_name}</DialogTitle>
                <DialogDescription>{selectedNFT.collection_name}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* NFT Image */}
                <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  {(() => {
                    const imageUrl = selectedNFT.cdn_image_uri || selectedNFT.token_uri;
                    if (!imageUrl) return null;
                    
                    // Check if URL is valid and starts with http/https
                    try {
                      const url = new URL(imageUrl);
                      if (!['http:', 'https:'].includes(url.protocol)) {
                        throw new Error('Invalid protocol');
                      }
                      
                      return (
                        <Image
                          src={imageUrl}
                          alt={selectedNFT.token_name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            img.src = '/placeholder.jpg';
                          }}
                        />
                      );
                    } catch (error) {
                      console.warn('Invalid NFT image URL:', imageUrl, error);
                      return null;
                    }
                  })() || (
                    <Image
                      src="/placeholder.jpg"
                      alt={selectedNFT.token_name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                </div>
                
                {/* NFT Details */}
                <div className="space-y-4">
                  {selectedNFT.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedNFT.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Token Name</h4>
                      <p className="text-sm text-muted-foreground">{selectedNFT.token_name}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Collection</h4>
                      <p className="text-sm text-muted-foreground">{selectedNFT.collection_name}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Amount Owned</h4>
                      <p className="text-sm text-muted-foreground">{selectedNFT.amount}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Property Version</h4>
                      <p className="text-sm text-muted-foreground">v{selectedNFT.property_version_v1}</p>
                    </div>
                    
                    {selectedNFT.creator_address && (
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium mb-1">Creator</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground font-mono">
                            {selectedNFT.creator_address.slice(0, 8)}...{selectedNFT.creator_address.slice(-6)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(selectedNFT.creator_address!, 'Creator address')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {selectedNFT.last_transaction_timestamp && (
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium mb-1">Last Transaction</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(selectedNFT.last_transaction_timestamp)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Technical Details */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Technical Details</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Token Data ID:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {selectedNFT.token_data_id.slice(0, 20)}...
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(selectedNFT.token_data_id, 'Token Data ID')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {selectedNFT.token_uri && (
                        <div>
                          <span className="text-xs text-muted-foreground">Token URI:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <a 
                              href={selectedNFT.token_uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline truncate max-w-[300px]"
                            >
                              {selectedNFT.token_uri}
                            </a>
                            <ExternalLink className="h-3 w-3 text-primary" />
                          </div>
                        </div>
                      )}
                      
                      {selectedNFT.collection_uri && (
                        <div>
                          <span className="text-xs text-muted-foreground">Collection URI:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <a 
                              href={selectedNFT.collection_uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline truncate max-w-[300px]"
                            >
                              {selectedNFT.collection_uri}
                            </a>
                            <ExternalLink className="h-3 w-3 text-primary" />
                          </div>
                        </div>
                      )}
                      
                      {selectedNFT.last_transaction_version && (
                        <div>
                          <span className="text-xs text-muted-foreground">Transaction Version:</span>
                          <p className="text-xs font-mono mt-1">{selectedNFT.last_transaction_version}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

