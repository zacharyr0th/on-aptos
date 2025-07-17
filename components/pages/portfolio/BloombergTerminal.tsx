'use client';

import React, { useState, useMemo } from 'react';
import { GeistMono } from 'geist/font/mono';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  formatCurrency,
  formatPercentage,
  formatTokenAmount,
} from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';

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
  primary: '#FFFFFF', // White
  secondary: '#000000', // Black
  success: '#FFFFFF', // White
  danger: '#000000', // Black
  warning: '#666666', // Gray
  muted: '#888888', // Gray
  background: '#000000', // Black
  surface: '#111111', // Dark black
  border: '#333333', // Dark gray border
  text: '#FFFFFF', // White text
  textMuted: '#CCCCCC', // Light gray text
};

const StatusIndicator = ({ status }: { status: 'up' | 'down' | 'neutral' }) => {
  const colors = {
    up: 'bg-white',
    down: 'bg-gray-500',
    neutral: 'bg-gray-400',
  };

  return (
    <div className={`w-2 h-2 rounded-full ${colors[status]} animate-pulse`} />
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
      <code className="text-xs font-mono bg-gray-800 px-2 py-1 rounded text-gray-300 flex-1">
        {shortenAddress(address)}
      </code>
      <button
        onClick={() => copyToClipboard(address)}
        className="text-gray-400 hover:text-white transition-colors"
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
    <div className="border border-gray-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
          <span className="text-sm font-medium text-gray-200">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-white" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white" />
        )}
      </button>
      {isOpen && <div className="p-3 bg-gray-900 space-y-2">{children}</div>}
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
    <div className="bg-black border-b border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            {onBackClick && (
              <Button
                size="sm"
                variant="outline"
                onClick={onBackClick}
                className="h-8 px-3 bg-black border-gray-600 text-white hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <span className="text-black text-xs font-bold">T</span>
            </div>
            <span className="text-white font-semibold">TERMINAL</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <StatusIndicator status="up" />
              <span className="text-white">LIVE</span>
            </div>
            <div className="text-gray-400">{currentTime} UTC</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-400">PORTFOLIO VALUE</div>
            <div className="text-xl font-mono font-bold text-white">
              {formatCurrency(totalValue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MarketDataTicker = () => {
  const marketData = [
    { symbol: 'APT', price: 4.87, change: -5.74, status: 'down' as const },
    { symbol: 'BTC', price: 94267.23, change: +2.34, status: 'up' as const },
    { symbol: 'ETH', price: 3456.78, change: +1.23, status: 'up' as const },
    { symbol: 'SOL', price: 187.45, change: -0.45, status: 'down' as const },
  ];

  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-2">
      <div className="flex items-center gap-8 overflow-x-auto">
        {marketData.map(data => (
          <div
            key={data.symbol}
            className="flex items-center gap-3 flex-shrink-0"
          >
            <span className="text-white font-mono font-bold text-sm">
              {data.symbol}
            </span>
            <span className="text-white font-mono text-sm">
              {formatCurrency(data.price)}
            </span>
            <span
              className={`flex items-center gap-1 text-sm font-mono ${
                data.status === 'up' ? 'text-white' : 'text-gray-400'
              }`}
            >
              {data.status === 'up' ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {formatPercentage(Math.abs(data.change))}%
            </span>
          </div>
        ))}
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* ASSETS CARD */}
      <Card className="bg-black border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            ASSETS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-2xl font-mono font-bold text-white">
              {formatCurrency(metrics.assets.value)}
            </div>
            <div className="text-xs text-gray-400">
              {metrics.assets.count} positions •{' '}
              {Object.keys(metrics.assets.types).length} types
            </div>
            <div className="text-xs text-white">
              {formatPercentage((metrics.assets.value / totalValue) * 100)}% of
              portfolio
            </div>
          </div>

          <CollapsibleSection title="Asset Breakdown" icon={FileText}>
            <div className="space-y-3">
              {Object.values(metrics.assets.types).map((type: any) => (
                <div key={type.symbol} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono text-gray-300">
                      {type.symbol}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatCurrency(type.totalValue)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
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
      <Card className="bg-black border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            DEFI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-2xl font-mono font-bold text-white">
              {formatCurrency(metrics.defi.value)}
            </div>
            <div className="text-xs text-gray-400">
              {metrics.defi.count} positions •{' '}
              {Object.keys(metrics.defi.protocols).length} protocols
            </div>
            <div className="text-xs text-white">
              {formatPercentage((metrics.defi.value / totalValue) * 100)}% of
              portfolio
            </div>
          </div>

          <CollapsibleSection title="Protocol Breakdown" icon={Code}>
            <div className="space-y-3">
              {Object.values(metrics.defi.protocols).map((protocol: any) => (
                <div key={protocol.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono text-gray-300">
                      {protocol.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatCurrency(protocol.totalValue)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
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
      <Card className="bg-black border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            NFTS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-2xl font-mono font-bold text-white">
              {formatCurrency(metrics.nfts.value)}
            </div>
            <div className="text-xs text-gray-400">
              {metrics.nfts.count} items •{' '}
              {Object.keys(metrics.nfts.collections).length} collections
            </div>
            <div className="text-xs text-white">
              {formatPercentage((metrics.nfts.value / totalValue) * 100)}% of
              portfolio
            </div>
          </div>

          <CollapsibleSection title="Collection Breakdown" icon={FileText}>
            <div className="space-y-3">
              {Object.values(metrics.nfts.collections).map(
                (collection: any) => (
                  <div key={collection.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-mono text-gray-300">
                        {collection.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatCurrency(collection.totalValue)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
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
    <Card className="bg-black border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-gray-800/50">
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className="text-xs text-gray-400 font-mono"
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
                className="border-gray-700 hover:bg-gray-800/20"
              >
                {columns.map(col => (
                  <TableCell
                    key={col.key}
                    className="text-xs text-white font-mono"
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
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <Image
            src={`/icons/tokens/${value?.toLowerCase()}.png`}
            alt={value}
            width={16}
            height={16}
            className="rounded-full"
            onError={e => {
              (e.target as HTMLImageElement).src = '/placeholder.jpg';
            }}
          />
          <span className="font-bold">{value}</span>
        </div>
      ),
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
      render: (value: number) => (
        <span className={value >= 0 ? 'text-white' : 'text-gray-400'}>
          {value >= 0 ? '+' : ''}
          {formatPercentage(value)}%
        </span>
      ),
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
      render: (value: number) => (
        <span className="text-white">{formatPercentage(value)}%</span>
      ),
    },
  ];

  // Filter assets and DeFi positions worth more than $0.1
  const filteredAssets = useMemo(
    () => assets.filter(asset => (asset.value || 0) > 0.1),
    [assets]
  );

  const filteredDefiPositions = useMemo(
    () => defiPositions.filter(pos => (pos.totalValue || 0) > 0.1),
    [defiPositions]
  );

  return (
    <div className={`min-h-screen bg-black text-white ${GeistMono.className}`}>
      <TerminalHeader
        walletAddress={walletAddress}
        totalValue={totalValue}
        accountNames={accountNames}
        onBackClick={onBackClick}
      />
      <MarketDataTicker />

      <div className="p-6">
        <PortfolioOverview
          totalValue={totalValue}
          assets={filteredAssets}
          defiPositions={filteredDefiPositions}
          nfts={nfts}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="text-xs">
              OVERVIEW
            </TabsTrigger>
            <TabsTrigger value="assets" className="text-xs">
              ASSETS
            </TabsTrigger>
            <TabsTrigger value="defi" className="text-xs">
              DEFI
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              ANALYTICS
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

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-black border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">
                    RISK METRICS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Volatility</span>
                      <span className="text-xs text-white font-mono">
                        12.4%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">
                        Sharpe Ratio
                      </span>
                      <span className="text-xs text-white font-mono">1.23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">
                        Max Drawdown
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        -15.2%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">
                    PERFORMANCE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">24h Change</span>
                      <span className="text-xs text-white font-mono">
                        +2.34%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">7d Change</span>
                      <span className="text-xs text-white font-mono">
                        +12.1%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">30d Change</span>
                      <span className="text-xs text-gray-400 font-mono">
                        -5.2%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">
                    ALLOCATION
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">
                        Liquid Assets
                      </span>
                      <span className="text-xs text-white font-mono">
                        78.5%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">
                        DeFi Positions
                      </span>
                      <span className="text-xs text-white font-mono">
                        19.2%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">NFTs</span>
                      <span className="text-xs text-white font-mono">2.3%</span>
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
