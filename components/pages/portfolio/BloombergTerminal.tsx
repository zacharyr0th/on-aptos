'use client';

import { GeistMono } from 'geist/font/mono';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Briefcase,
  BarChart3,
  Globe,
  Clock,
  Users,
  Zap,
  Target,
  PieChart,
  TrendingUpIcon,
  AlertCircle,
  Shield,
  Wallet,
  Database,
  Monitor,
  Settings,
  Bell,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Minus,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Link,
  Code,
  Hash,
  Info,
  ArrowLeft,
} from 'lucide-react';
import Image from 'next/image';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  formatPercentage,
  formatTokenAmount,
} from '@/lib/utils/format';


interface BloombergTerminalProps {
  totalValue: number;
  walletAddress?: string;
  assets?: any[];
  defiPositions?: any[];
  nfts?: any[];
  performanceData?: any;
  accountNames?: any;
  onBackClick?: () => void;
}

const TERMINAL_COLORS = {
  primary: '#FFFFFF',
  secondary: '#000000',
  success: '#00FF88',
  danger: '#FF4444',
  warning: '#FFAA00',
  muted: '#666666',
  background: '#000000',
  surface: '#0A0A0A',
  border: '#1A1A1A',
  text: '#FFFFFF',
  textMuted: '#999999',
  accent: '#0066CC',
  positive: '#00FF88',
  negative: '#FF4444',
  neutral: '#FFAA00',
};

const StatusIndicator = ({ status }: { status: 'up' | 'down' | 'neutral' }) => {
  const colors = {
    up: 'bg-neutral-300 shadow-neutral-300/30',
    down: 'bg-neutral-600 shadow-neutral-600/30',
    neutral: 'bg-neutral-500 shadow-neutral-500/30',
  };

  return (
    <div
      className={`w-2 h-2 rounded-full ${colors[status]} animate-pulse shadow-lg`}
    />
  );
};

const CopyableAddress = ({
  address,
  label,
  className = '',
}: {
  address: string;
  label: string;
  className?: string;
}) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const shortenAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <code className="text-xs font-mono bg-neutral-950 border border-neutral-900 px-2 py-1 rounded text-neutral-400 flex-1 hover:bg-neutral-900 transition-colors">
        {shortenAddress(address)}
      </code>
      <button
        onClick={() => copyToClipboard(address)}
        className="text-neutral-600 hover:text-neutral-300 transition-all duration-200 hover:scale-110"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
};

const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border border-neutral-900 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-neutral-950 hover:bg-neutral-900 transition-all duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className="h-4 w-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
          )}
          <span className="text-sm font-medium text-neutral-400 group-hover:text-white transition-colors">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-neutral-600 group-hover:text-white transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-600 group-hover:text-white transition-colors" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 bg-black space-y-2 border-t border-neutral-900">
          {children}
        </div>
      )}
    </div>
  );
};

const TerminalHeader = ({
  walletAddress,
  totalValue,
  accountNames,
  onBackClick,
}: {
  walletAddress?: string;
  totalValue: number;
  accountNames?: any;
  onBackClick?: () => void;
}) => {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    timeZone: 'UTC',
  });

  return (
    <div className="bg-black border-b border-neutral-900 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            {onBackClick && (
              <Button
                size="sm"
                variant="outline"
                onClick={onBackClick}
                className="h-8 px-3 bg-black border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="w-7 h-7 bg-gradient-to-br from-white to-neutral-200 rounded-sm flex items-center justify-center shadow-lg">
              <span className="text-black text-sm font-bold tracking-tight">
                T
              </span>
            </div>
            <span className="text-white font-semibold text-lg tracking-wider">
              TERMINAL
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <StatusIndicator status="up" />
              <span className="text-neutral-300 font-medium">LIVE</span>
            </div>
            <div className="text-neutral-600 font-mono">{currentTime} UTC</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-neutral-600 uppercase tracking-wide mb-1">
              Portfolio Value
            </div>
            <div className="text-2xl font-mono font-bold text-white tracking-tight">
              {formatCurrency(totalValue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MarketDataTicker = () => {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchPanoraData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/prices/panora');
        if (!response.ok) throw new Error('Failed to fetch Panora data');

        const result = await response.json();
        const prices = result.data || [];

        // Filter for top Aptos assets by market presence and sort by price
        const topAssets = prices
          .filter((token: any) => token.usdPrice > 0.01) // Filter out very low value tokens
          .sort((a: any, b: any) => b.usdPrice - a.usdPrice) // Sort by price descending
          .slice(0, 6) // Take top 6 assets
          .map((token: any) => ({
            symbol: token.symbol,
            price: token.usdPrice,
            change: 0, // Panora doesn't provide change data
            status: 'neutral' as const,
            name: token.name,
          }));

        setMarketData(topAssets);
      } catch (error) {
        console.error('Failed to fetch Panora data:', error);
        // Fallback to APT only with placeholder data
        setMarketData([
          {
            symbol: 'APT',
            price: 0,
            change: 0,
            status: 'neutral' as const,
            name: 'Aptos',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPanoraData();
    // Refresh every 2 minutes
    const interval = setInterval(fetchPanoraData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-neutral-950 border-b border-neutral-900 px-6 py-3">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-neutral-800 animate-pulse rounded" />
            <div className="w-16 h-4 bg-neutral-800 animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-950 border-b border-neutral-900 px-6 py-3">
      <div className="flex items-center gap-10 overflow-x-auto scrollbar-hide">
        {marketData.map(data => (
          <div
            key={data.symbol}
            className="flex items-center gap-4 flex-shrink-0 group hover:bg-neutral-900/20 px-3 py-1 rounded-lg transition-all duration-200"
            title={data.name}
          >
            <span className="text-white font-mono font-bold text-sm tracking-wide">
              {data.symbol}
            </span>
            <span className="text-neutral-300 font-mono text-sm">
              {data.price > 0 ? formatCurrency(data.price) : 'Loading...'}
            </span>
            {data.change !== 0 && (
              <span
                className={`flex items-center gap-1 text-sm font-mono transition-colors ${
                  data.status === 'up'
                    ? 'text-emerald-400'
                    : data.status === 'down'
                      ? 'text-red-400'
                      : 'text-neutral-500'
                }`}
              >
                {data.status === 'up' ? (
                  <ChevronUp className="h-3 w-3" />
                ) : data.status === 'down' ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {formatPercentage(Math.abs(data.change))}%
              </span>
            )}
          </div>
        ))}
        {marketData.length === 0 && !loading && (
          <div className="text-neutral-500 text-sm font-mono">
            No Aptos assets available
          </div>
        )}
      </div>
    </div>
  );
};

const PortfolioOverview = ({
  totalValue,
  assets = [],
  defiPositions = [],
  nfts = [],
}: {
  totalValue: number;
  assets?: any[];
  defiPositions?: any[];
  nfts?: any[];
}) => {
  const metrics = useMemo(() => {
    // Filter assets worth more than $0.1
    const filteredAssets = assets.filter(asset => (asset.value || 0) > 0.1);

    // Filter DeFi positions worth more than $0.1
    const filteredDefiPositions = defiPositions.filter(
      pos => (pos.totalValue || 0) > 0.1
    );

    const assetValue = filteredAssets.reduce(
      (sum, asset) => sum + (asset.value || 0),
      0
    );
    const defiValue = filteredDefiPositions.reduce(
      (sum, pos) => sum + (pos.totalValue || 0),
      0
    );
    const nftValue = nfts.reduce(
      (sum, nft) => sum + (nft.estimatedValue || 0),
      0
    );

    // Get unique protocols and their addresses
    const protocols = filteredDefiPositions.reduce((acc, pos) => {
      if (!acc[pos.protocol]) {
        acc[pos.protocol] = {
          name: pos.protocol,
          positions: [],
          addresses: new Set(),
          totalValue: 0,
        };
      }
      acc[pos.protocol].positions.push(pos);
      acc[pos.protocol].totalValue += pos.totalValue || 0;

      // Extract contract addresses from positions
      if (pos.contract_address)
        acc[pos.protocol].addresses.add(pos.contract_address);
      if (pos.pool_address) acc[pos.protocol].addresses.add(pos.pool_address);
      if (pos.token_address) acc[pos.protocol].addresses.add(pos.token_address);
      if (pos.position_address)
        acc[pos.protocol].addresses.add(pos.position_address);

      return acc;
    }, {});

    // Get unique asset types and their addresses
    const assetTypes = filteredAssets.reduce((acc, asset) => {
      const type = asset.metadata?.symbol || 'Unknown';
      if (!acc[type]) {
        acc[type] = {
          symbol: type,
          assets: [],
          addresses: new Set(),
          totalValue: 0,
          totalBalance: 0,
        };
      }
      acc[type].assets.push(asset);
      acc[type].totalValue += asset.value || 0;
      acc[type].totalBalance += asset.balance || 0;

      if (asset.asset_type) acc[type].addresses.add(asset.asset_type);
      if (asset.token_address) acc[type].addresses.add(asset.token_address);

      return acc;
    }, {});

    // Get unique NFT collections
    const nftCollections = nfts.reduce((acc, nft) => {
      const collection = nft.collection_name || 'Unknown';
      if (!acc[collection]) {
        acc[collection] = {
          name: collection,
          items: [],
          addresses: new Set(),
          totalValue: 0,
        };
      }
      acc[collection].items.push(nft);
      acc[collection].totalValue += nft.estimatedValue || 0;

      if (nft.collection_address)
        acc[collection].addresses.add(nft.collection_address);
      if (nft.token_address) acc[collection].addresses.add(nft.token_address);
      if (nft.creator_address)
        acc[collection].addresses.add(nft.creator_address);

      return acc;
    }, {});

    return {
      assets: {
        value: assetValue,
        count: filteredAssets.length,
        types: assetTypes,
      },
      defi: {
        value: defiValue,
        count: filteredDefiPositions.length,
        protocols,
      },
      nfts: {
        value: nftValue,
        count: nfts.length,
        collections: nftCollections,
      },
    };
  }, [assets, defiPositions, nfts]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* ASSETS CARD */}
      <Card className="bg-neutral-950 border-neutral-900 hover:border-neutral-800 transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2 uppercase tracking-wide">
            <Wallet className="h-4 w-4 text-neutral-700" />
            Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="text-3xl font-mono font-bold text-white tracking-tight animate-in fade-in duration-500">
              {formatCurrency(metrics.assets.value)}
            </div>
            <div className="text-xs text-neutral-600 space-y-1">
              <div>
                {metrics.assets.count} positions •{' '}
                {Object.keys(metrics.assets.types).length} types
              </div>
              <div className="text-neutral-400 font-medium">
                {formatPercentage((metrics.assets.value / totalValue) * 100)} of
                portfolio
              </div>
            </div>
          </div>

          <CollapsibleSection title="Asset Breakdown" icon={FileText}>
            <div className="space-y-3">
              {Object.values(metrics.assets.types).map((type: any) => (
                <div key={type.symbol} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono text-neutral-400">
                      {type.symbol}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {formatCurrency(type.totalValue)}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-600">
                    Balance: {formatTokenAmount(type.totalBalance)} •{' '}
                    {type.assets.length} position(s)
                  </div>
                  {type.addresses.size > 0 && (
                    <CollapsibleSection
                      title={`Addresses (${type.addresses.size})`}
                      icon={Hash}
                    >
                      <div className="space-y-2">
                        {Array.from(type.addresses).map(addr => (
                          <CopyableAddress
                            key={addr as string}
                            address={addr as string}
                            label={`${type.symbol} Address`}
                          />
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </CardContent>
      </Card>

      {/* DEFI CARD */}
      <Card className="bg-neutral-950 border-neutral-900 hover:border-neutral-800 transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2 uppercase tracking-wide">
            <TrendingUp className="h-4 w-4 text-neutral-700" />
            DeFi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="text-3xl font-mono font-bold text-white tracking-tight animate-in fade-in duration-500">
              {formatCurrency(metrics.defi.value)}
            </div>
            <div className="text-xs text-neutral-600 space-y-1">
              <div>
                {metrics.defi.count} positions •{' '}
                {Object.keys(metrics.defi.protocols).length} protocols
              </div>
              <div className="text-neutral-400 font-medium">
                {formatPercentage((metrics.defi.value / totalValue) * 100)} of
                portfolio
              </div>
            </div>
          </div>

          <CollapsibleSection title="Protocol Breakdown" icon={Code}>
            <div className="space-y-3">
              {Object.values(metrics.defi.protocols).map((protocol: any) => (
                <div key={protocol.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono text-neutral-400">
                      {protocol.name}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {formatCurrency(protocol.totalValue)}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-600">
                    {protocol.positions.length} position(s)
                  </div>
                  {protocol.addresses.size > 0 && (
                    <CollapsibleSection
                      title={`Contract Addresses (${protocol.addresses.size})`}
                      icon={Hash}
                    >
                      <div className="space-y-2">
                        {Array.from(protocol.addresses).map(addr => (
                          <CopyableAddress
                            key={addr as string}
                            address={addr as string}
                            label={`${protocol.name} Contract`}
                          />
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </CardContent>
      </Card>

      {/* NFTS CARD */}
      <Card className="bg-neutral-950 border-neutral-900 hover:border-neutral-800 transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2 uppercase tracking-wide">
            <PieChart className="h-4 w-4 text-neutral-700" />
            NFTs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="text-3xl font-mono font-bold text-white tracking-tight animate-in fade-in duration-500">
              {formatCurrency(metrics.nfts.value)}
            </div>
            <div className="text-xs text-neutral-600 space-y-1">
              <div>
                {metrics.nfts.count} items •{' '}
                {Object.keys(metrics.nfts.collections).length} collections
              </div>
              <div className="text-neutral-400 font-medium">
                {formatPercentage((metrics.nfts.value / totalValue) * 100)} of
                portfolio
              </div>
            </div>
          </div>

          <CollapsibleSection title="Collection Breakdown" icon={FileText}>
            <div className="space-y-3">
              {Object.values(metrics.nfts.collections).map(
                (collection: any) => (
                  <div key={collection.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-mono text-neutral-400">
                        {collection.name}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatCurrency(collection.totalValue)}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600">
                      {collection.items.length} item(s)
                    </div>
                    {collection.addresses.size > 0 && (
                      <CollapsibleSection
                        title={`Addresses (${collection.addresses.size})`}
                        icon={Hash}
                      >
                        <div className="space-y-2">
                          {Array.from(collection.addresses).map(addr => (
                            <CopyableAddress
                              key={addr as string}
                              address={addr as string}
                              label={`${collection.name} Address`}
                            />
                          ))}
                        </div>
                      </CollapsibleSection>
                    )}
                  </div>
                )
              )}
            </div>
          </CollapsibleSection>
        </CardContent>
      </Card>
    </div>
  );
};

const TerminalTable = ({
  title,
  data,
  columns,
  icon: Icon,
}: {
  title: string;
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  icon: React.ComponentType<{ className?: string }>;
}) => {
  return (
    <Card className="bg-black/90 backdrop-blur-sm border-neutral-900/50 hover:border-gray-700/50 transition-all duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2 uppercase tracking-wide">
          <Icon className="h-4 w-4 text-neutral-700" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-900 hover:bg-neutral-900/30 transition-colors">
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className="text-xs text-neutral-600 font-mono uppercase tracking-wider py-3"
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((row, index) => (
              <TableRow
                key={index}
                className="border-neutral-900/50 hover:bg-neutral-900/20 transition-all duration-200 group"
              >
                {columns.map(col => (
                  <TableCell
                    key={col.key}
                    className="text-xs text-neutral-300 font-mono py-3 group-hover:text-white transition-colors"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export const BloombergTerminal: React.FC<BloombergTerminalProps> = ({
  totalValue,
  walletAddress,
  assets = [],
  defiPositions = [],
  nfts = [],
  performanceData,
  accountNames,
  onBackClick,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const assetColumns = [
    {
      key: 'symbol',
      label: 'SYMBOL',
      render: (value: string, row: any) => {
        const symbol = row.metadata?.symbol || row.symbol || 'UNKNOWN';
        return (
          <div className="flex items-center gap-2">
            <Image
              src={`/icons/tokens/${symbol?.toLowerCase()}.png`}
              alt={`${symbol} token icon`}
              width={16}
              height={16}
              className="rounded-full"
              onError={e => {
                (e.target as HTMLImageElement).src = '/placeholder.jpg';
              }}
            />
            <span className="font-bold">{symbol}</span>
          </div>
        );
      },
    },
    {
      key: 'balance',
      label: 'BALANCE',
      render: (value: number) => formatTokenAmount(value),
    },
    {
      key: 'value',
      label: 'VALUE',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'change',
      label: 'CHANGE',
      render: (value: number) => {
        if (isNaN(value) || value === null || value === undefined) {
          return <span className="text-neutral-600">-</span>;
        }
        return (
          <span
            className={`font-medium ${value >= 0 ? 'text-neutral-300' : 'text-neutral-500'}`}
          >
            {value >= 0 ? '+' : ''}
            {formatPercentage(value)}
          </span>
        );
      },
    },
  ];

  const defiColumns = [
    {
      key: 'protocol',
      label: 'PROTOCOL',
      render: (value: string) => <span className="font-bold">{value}</span>,
    },
    { key: 'type', label: 'TYPE' },
    {
      key: 'totalValue',
      label: 'VALUE',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'apy',
      label: 'APY',
      render: (value: number) => {
        if (isNaN(value) || value === null || value === undefined) {
          return <span className="text-neutral-600">-</span>;
        }
        return (
          <span className="text-neutral-300 font-medium">
            {formatPercentage(value)}
          </span>
        );
      },
    },
  ];

  // Filter assets and DeFi positions worth more than $0.1
  const filteredAssets = useMemo(
    () =>
      assets
        .filter(asset => (asset.value || 0) > 0.1)
        .map(asset => ({
          ...asset,
          symbol: asset.metadata?.symbol || asset.symbol || 'UNKNOWN',
        })),
    [assets]
  );

  const filteredDefiPositions = useMemo(
    () => defiPositions.filter(pos => (pos.totalValue || 0) > 0.1),
    [defiPositions]
  );

  return (
    <div
      className={`min-h-screen bg-black text-white ${GeistMono.className} animate-in fade-in duration-700 relative`}
    >
      {/* Subtle scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/10 to-transparent animate-pulse" />
      </div>

      <TerminalHeader
        walletAddress={walletAddress}
        totalValue={totalValue}
        accountNames={accountNames}
        onBackClick={onBackClick}
      />
      <MarketDataTicker />

      <div className="p-6 relative z-10">
        <PortfolioOverview
          totalValue={totalValue}
          assets={filteredAssets}
          defiPositions={filteredDefiPositions}
          nfts={nfts}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5 bg-neutral-950 border border-neutral-900">
            <TabsTrigger
              value="overview"
              className="text-xs uppercase tracking-wide font-medium data-[state=active]:bg-black data-[state=active]:text-white transition-all duration-200"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="assets"
              className="text-xs uppercase tracking-wide font-medium data-[state=active]:bg-black data-[state=active]:text-white transition-all duration-200"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger
              value="defi"
              className="text-xs uppercase tracking-wide font-medium data-[state=active]:bg-black data-[state=active]:text-white transition-all duration-200"
            >
              DeFi
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="text-xs uppercase tracking-wide font-medium data-[state=active]:bg-black data-[state=active]:text-white transition-all duration-200"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="text-xs uppercase tracking-wide font-medium data-[state=active]:bg-black data-[state=active]:text-white transition-all duration-200"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TerminalTable
                title="TOP ASSETS"
                data={filteredAssets.sort(
                  (a, b) => (b.value || 0) - (a.value || 0)
                )}
                columns={assetColumns}
                icon={Database}
              />
              <TerminalTable
                title="DEFI POSITIONS"
                data={filteredDefiPositions.sort(
                  (a, b) => (b.totalValue || 0) - (a.totalValue || 0)
                )}
                columns={defiColumns}
                icon={TrendingUp}
              />
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <TerminalTable
              title="ALL ASSETS"
              data={filteredAssets.sort(
                (a, b) => (b.value || 0) - (a.value || 0)
              )}
              columns={assetColumns}
              icon={Briefcase}
            />
          </TabsContent>

          <TabsContent value="defi" className="space-y-4">
            <TerminalTable
              title="DEFI POSITIONS"
              data={filteredDefiPositions.sort(
                (a, b) => (b.totalValue || 0) - (a.totalValue || 0)
              )}
              columns={defiColumns}
              icon={TrendingUp}
            />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-neutral-900 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-neutral-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-mono font-bold text-white tracking-tight">
                    Transactions
                  </h3>
                  <p className="text-neutral-500 font-mono text-sm">
                    (Coming Soon)
                  </p>
                  <p className="text-neutral-600 text-xs max-w-md mx-auto">
                    Transaction history and detailed activity tracking will be
                    available in a future update.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-neutral-950 border-neutral-900 hover:border-neutral-800 transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm text-neutral-600 uppercase tracking-wide flex items-center gap-2">
                    <Shield className="h-4 w-4 text-neutral-700" />
                    Risk Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">
                        Volatility
                      </span>
                      <span className="text-sm text-amber-400 font-mono font-medium">
                        12.4%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">
                        Sharpe Ratio
                      </span>
                      <span className="text-sm text-neutral-300 font-mono font-medium">
                        1.23
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">
                        Max Drawdown
                      </span>
                      <span className="text-sm text-neutral-600 font-mono font-medium">
                        -15.2%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-950 border-neutral-900 hover:border-neutral-800 transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm text-neutral-600 uppercase tracking-wide flex items-center gap-2">
                    <TrendingUpIcon className="h-4 w-4 text-neutral-700" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">
                        24h Change
                      </span>
                      <span className="text-sm text-neutral-300 font-mono font-medium">
                        +2.34%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">
                        7d Change
                      </span>
                      <span className="text-sm text-neutral-300 font-mono font-medium">
                        +12.1%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">
                        30d Change
                      </span>
                      <span className="text-sm text-neutral-600 font-mono font-medium">
                        -5.2%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-950 border-neutral-900 hover:border-neutral-800 transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm text-neutral-600 uppercase tracking-wide flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-neutral-700" />
                    Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">
                        Liquid Assets
                      </span>
                      <span className="text-sm text-white font-mono font-medium">
                        78.5%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">
                        DeFi Positions
                      </span>
                      <span className="text-sm text-white font-mono font-medium">
                        19.2%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">NFTs</span>
                      <span className="text-sm text-white font-mono font-medium">
                        2.3%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
