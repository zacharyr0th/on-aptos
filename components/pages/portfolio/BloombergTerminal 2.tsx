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
} from 'lucide-react';
import { formatCurrency, formatPercentage, formatTokenAmount } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BloombergTerminalProps {
  totalValue: number;
  walletAddress?: string;
  assets?: any[];
  defiPositions?: any[];
  nfts?: any[];
  performanceData?: any;
  accountNames?: any;
}

const TERMINAL_COLORS = {
  primary: '#FF6B00', // Bloomberg orange
  secondary: '#1E40AF', // Bloomberg blue
  success: '#10B981', // Green
  danger: '#EF4444', // Red
  warning: '#F59E0B', // Amber
  muted: '#6B7280', // Gray
  background: '#0F172A', // Dark blue
  surface: '#1E293B', // Lighter dark blue
  border: '#334155', // Gray border
  text: '#F8FAFC', // Light text
  textMuted: '#94A3B8', // Muted text
};

const StatusIndicator = ({ status }: { status: 'up' | 'down' | 'neutral' }) => {
  const colors = {
    up: 'bg-green-500',
    down: 'bg-red-500',
    neutral: 'bg-yellow-500'
  };
  
  return (
    <div className={`w-2 h-2 rounded-full ${colors[status]} animate-pulse`} />
  );
};

const TerminalHeader = ({ walletAddress, totalValue, accountNames }: {
  walletAddress?: string;
  totalValue: number;
  accountNames?: any;
}) => {
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    timeZone: 'UTC'
  });

  return (
    <div className="bg-slate-900 border-b border-slate-700 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="text-orange-500 font-semibold">TERMINAL</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <StatusIndicator status="up" />
              <span className="text-green-400">LIVE</span>
            </div>
            <div className="text-slate-400">
              {currentTime} UTC
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400">PORTFOLIO VALUE</div>
            <div className="text-xl font-mono font-bold text-white">
              {formatCurrency(totalValue)}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 px-3">
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 px-3">
              <Bell className="h-4 w-4" />
            </Button>
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
    <div className="bg-slate-800 border-b border-slate-700 px-4 py-2">
      <div className="flex items-center gap-8 overflow-x-auto">
        {marketData.map((data) => (
          <div key={data.symbol} className="flex items-center gap-3 flex-shrink-0">
            <span className="text-white font-mono font-bold text-sm">{data.symbol}</span>
            <span className="text-white font-mono text-sm">{formatCurrency(data.price)}</span>
            <span className={`flex items-center gap-1 text-sm font-mono ${
              data.status === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {data.status === 'up' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
  nfts = [] 
}: {
  totalValue: number;
  assets?: any[];
  defiPositions?: any[];
  nfts?: any[];
}) => {
  const metrics = useMemo(() => {
    const assetValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
    const defiValue = defiPositions.reduce((sum, pos) => sum + (pos.totalValue || 0), 0);
    const nftValue = nfts.reduce((sum, nft) => sum + (nft.estimatedValue || 0), 0);
    
    return {
      assets: { value: assetValue, count: assets.length },
      defi: { value: defiValue, count: defiPositions.length },
      nfts: { value: nftValue, count: nfts.length },
    };
  }, [assets, defiPositions, nfts]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            ASSETS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-mono font-bold text-white">
              {formatCurrency(metrics.assets.value)}
            </div>
            <div className="text-xs text-slate-400">
              {metrics.assets.count} positions
            </div>
            <div className="text-xs text-green-400">
              +{formatPercentage((metrics.assets.value / totalValue) * 100)}% of portfolio
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            DEFI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-mono font-bold text-white">
              {formatCurrency(metrics.defi.value)}
            </div>
            <div className="text-xs text-slate-400">
              {metrics.defi.count} positions
            </div>
            <div className="text-xs text-green-400">
              +{formatPercentage((metrics.defi.value / totalValue) * 100)}% of portfolio
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            NFTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-mono font-bold text-white">
              {formatCurrency(metrics.nfts.value)}
            </div>
            <div className="text-xs text-slate-400">
              {metrics.nfts.count} items
            </div>
            <div className="text-xs text-green-400">
              +{formatPercentage((metrics.nfts.value / totalValue) * 100)}% of portfolio
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TerminalTable = ({ 
  title, 
  data, 
  columns,
  icon: Icon 
}: {
  title: string;
  data: any[];
  columns: { key: string; label: string; render?: (value: any, row: any) => React.ReactNode }[];
  icon: React.ComponentType<{ className?: string }>;
}) => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-slate-700/50">
              {columns.map((col) => (
                <TableHead key={col.key} className="text-xs text-slate-400 font-mono">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((row, index) => (
              <TableRow key={index} className="border-slate-700 hover:bg-slate-700/20">
                {columns.map((col) => (
                  <TableCell key={col.key} className="text-xs text-white font-mono">
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
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const assetColumns = [
    { key: 'symbol', label: 'SYMBOL', render: (value: string, row: any) => (
      <div className="flex items-center gap-2">
        <Image
          src={`/icons/tokens/${value?.toLowerCase()}.png`}
          alt={value}
          width={16}
          height={16}
          className="rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.jpg';
          }}
        />
        <span className="font-bold">{value}</span>
      </div>
    )},
    { key: 'balance', label: 'BALANCE', render: (value: number) => formatTokenAmount(value) },
    { key: 'value', label: 'VALUE', render: (value: number) => formatCurrency(value) },
    { key: 'change', label: 'CHANGE', render: (value: number) => (
      <span className={value >= 0 ? 'text-green-400' : 'text-red-400'}>
        {value >= 0 ? '+' : ''}{formatPercentage(value)}%
      </span>
    )},
  ];

  const defiColumns = [
    { key: 'protocol', label: 'PROTOCOL', render: (value: string) => (
      <span className="font-bold">{value}</span>
    )},
    { key: 'type', label: 'TYPE' },
    { key: 'totalValue', label: 'VALUE', render: (value: number) => formatCurrency(value) },
    { key: 'apy', label: 'APY', render: (value: number) => (
      <span className="text-green-400">{formatPercentage(value)}%</span>
    )},
  ];

  return (
    <div className={`min-h-screen bg-slate-900 text-white ${GeistMono.className}`}>
      <TerminalHeader 
        walletAddress={walletAddress}
        totalValue={totalValue}
        accountNames={accountNames}
      />
      <MarketDataTicker />
      
      <div className="p-6">
        <PortfolioOverview 
          totalValue={totalValue}
          assets={assets}
          defiPositions={defiPositions}
          nfts={nfts}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="text-xs">OVERVIEW</TabsTrigger>
            <TabsTrigger value="assets" className="text-xs">ASSETS</TabsTrigger>
            <TabsTrigger value="defi" className="text-xs">DEFI</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">ANALYTICS</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TerminalTable
                title="TOP ASSETS"
                data={assets.sort((a, b) => (b.value || 0) - (a.value || 0))}
                columns={assetColumns}
                icon={Database}
              />
              <TerminalTable
                title="DEFI POSITIONS"
                data={defiPositions.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))}
                columns={defiColumns}
                icon={TrendingUp}
              />
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <TerminalTable
              title="ALL ASSETS"
              data={assets.sort((a, b) => (b.value || 0) - (a.value || 0))}
              columns={assetColumns}
              icon={Briefcase}
            />
          </TabsContent>

          <TabsContent value="defi" className="space-y-4">
            <TerminalTable
              title="DEFI POSITIONS"
              data={defiPositions.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))}
              columns={defiColumns}
              icon={TrendingUp}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-400">RISK METRICS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Volatility</span>
                      <span className="text-xs text-white font-mono">12.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Sharpe Ratio</span>
                      <span className="text-xs text-white font-mono">1.23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Max Drawdown</span>
                      <span className="text-xs text-red-400 font-mono">-15.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-400">PERFORMANCE</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">24h Change</span>
                      <span className="text-xs text-green-400 font-mono">+2.34%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">7d Change</span>
                      <span className="text-xs text-green-400 font-mono">+12.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">30d Change</span>
                      <span className="text-xs text-red-400 font-mono">-5.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-400">ALLOCATION</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Liquid Assets</span>
                      <span className="text-xs text-white font-mono">78.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">DeFi Positions</span>
                      <span className="text-xs text-white font-mono">19.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">NFTs</span>
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