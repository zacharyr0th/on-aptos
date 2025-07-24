'use client';

import { GeistMono } from 'geist/font/mono';
import { Coins, TrendingUp, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency, formatTokenAmount } from '@/lib/utils/format';
import { getTokenLogoUrlWithFallback } from '@/lib/utils/token-logos';

import { cleanProtocolName, getDetailedProtocolInfo } from './utils';


interface BaseTableProps {
  selectedItem: any;
  onItemSelect: (item: any) => void;
}

interface AssetsTableProps extends BaseTableProps {
  visibleAssets: any[];
  showOnlyVerified: boolean;
  portfolioAssets: any[];
}

interface DeFiTableProps extends BaseTableProps {
  groupedDeFiPositions: any[] | null;
  defiPositionsLoading: boolean;
  defiSortBy: string;
  defiSortOrder: 'asc' | 'desc';
  getProtocolLogo: (protocol: string) => string;
  onSortChange: (sortBy: string, order: 'asc' | 'desc') => void;
}

const MIN_DEFI_VALUE_THRESHOLD = 0; // Show all positions regardless of value

const isLPToken = (position: any) => {
  if (position.position && position.position.liquidity) {
    return true;
  }

  const symbols =
    position.positions
      ?.map((p: any) => p.protocolType?.toLowerCase() || '')
      .join(' ') || '';
  const protocol = position.protocol?.toLowerCase() || '';
  return (
    symbols.includes('lp') ||
    symbols.includes('pool') ||
    protocol.includes('farm') ||
    protocol.includes('liquidity')
  );
};

export const AssetsTable = ({
  visibleAssets,
  selectedItem,
  showOnlyVerified,
  portfolioAssets,
  onItemSelect,
}: AssetsTableProps) => {
  // Separate APT from other assets
  const aptAsset = visibleAssets.find(
    asset => asset.asset_type === '0x1::aptos_coin::AptosCoin'
  );
  const otherAssets = visibleAssets
    .filter(asset => asset.asset_type !== '0x1::aptos_coin::AptosCoin')
    .sort((a, b) => {
      const valueA = a.value || 0;
      const valueB = b.value || 0;
      return valueB - valueA; // Descending order
    });
  const remainingCount = 0;

  const renderAssetRow = (asset: any, showDivider = false) => (
    <React.Fragment key={`asset-${asset.asset_type}-${asset.amount}`}>
      <TableRow
        className={cn(
          'cursor-pointer hover:bg-muted/30 transition-colors h-14 border-b-0',
          selectedItem?.asset_type === asset.asset_type &&
            'bg-muted/40 rounded-lg'
        )}
        onClick={() => onItemSelect(asset)}
      >
        <TableCell className="py-2 w-2/5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">
              <Image
                src={getTokenLogoUrlWithFallback(
                  asset.asset_type,
                  asset.metadata
                )}
                alt={asset.metadata?.symbol || 'Asset'}
                width={32}
                height={32}
                className={`rounded-full object-cover w-full h-full ${
                  asset.metadata?.symbol?.toUpperCase() === 'APT' ||
                  asset.asset_type.includes('aptos_coin')
                    ? 'dark:invert'
                    : ''
                }`}
                onError={e => {
                  const img = e.target as HTMLImageElement;
                  const symbol = asset.metadata?.symbol;
                  if (img.src.includes('.svg') && symbol) {
                    img.src = `https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/main/logos/${symbol}.png`;
                  } else {
                    img.src = '/placeholder.jpg';
                  }
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {asset.metadata?.symbol || 'Unknown'}
                </span>
                {asset.protocolInfo && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 font-normal"
                  >
                    {asset.protocolInfo.protocolLabel}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {asset.metadata?.name || 'Unknown Asset'}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-2 w-1/5 text-right pr-2">
          <div
            className={`text-sm text-muted-foreground ${GeistMono.className}`}
          >
            {formatTokenAmount(asset.balance || 0, undefined, {
              showSymbol: false,
            })}
          </div>
        </TableCell>
        <TableCell className="py-2 w-1/5 text-right pr-2">
          <div
            className={`text-sm text-muted-foreground ${GeistMono.className}`}
          >
            {formatCurrency(asset.price || 0)}
          </div>
        </TableCell>
        <TableCell className="py-2 w-1/5 text-right pr-2">
          <div className={`font-medium text-sm ${GeistMono.className}`}>
            {formatCurrency(asset.value || 0)}
          </div>
        </TableCell>
      </TableRow>
      {showDivider && (
        <TableRow className="h-0">
          <TableCell colSpan={4} className="p-0">
            <div className="w-full border-b-2 border-border/50" />
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );

  return (
    <div className="asset-table-container" data-asset-table>
      {visibleAssets.length > 0 ? (
        <div className="flex flex-col h-[calc(100vh-280px)]">
          {/* Fixed APT Header */}
          <div className="flex-shrink-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50">
                  <TableHead className="w-2/5 text-left font-medium text-muted-foreground text-xs">
                    Ticker
                  </TableHead>
                  <TableHead className="w-1/5 font-medium text-muted-foreground text-xs text-right pr-2 [&>div]:justify-end">
                    Quantity
                  </TableHead>
                  <TableHead className="w-1/5 font-medium text-muted-foreground text-xs text-right pr-2 [&>div]:justify-end">
                    Price
                  </TableHead>
                  <TableHead className="w-1/5 font-medium text-muted-foreground text-xs text-right pr-2 [&>div]:justify-end">
                    Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              {aptAsset && (
                <TableBody>{renderAssetRow(aptAsset, true)}</TableBody>
              )}
            </Table>
          </div>

          {/* Scrollable Other Assets */}
          {otherAssets.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <Table>
                <TableHeader className="sr-only">
                  <TableRow>
                    <TableHead className="w-2/5 text-left font-medium text-muted-foreground text-xs">
                      Ticker
                    </TableHead>
                    <TableHead className="w-1/5 font-medium text-muted-foreground text-xs text-right pr-2 [&>div]:justify-end">
                      Quantity
                    </TableHead>
                    <TableHead className="w-1/5 font-medium text-muted-foreground text-xs text-right pr-2 [&>div]:justify-end">
                      Price
                    </TableHead>
                    <TableHead className="w-1/5 font-medium text-muted-foreground text-xs text-right pr-2 [&>div]:justify-end">
                      Value
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherAssets.map(asset => renderAssetRow(asset))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>
            {showOnlyVerified ? 'No verified assets found' : 'No assets found'}
          </p>
          {showOnlyVerified &&
            portfolioAssets &&
            portfolioAssets.length === 0 && (
              <p className="text-sm mt-2">
                Try disabling the &quot;Verified tokens only&quot; filter to see
                all assets
              </p>
            )}
        </div>
      )}
    </div>
  );
};

export const DeFiPositionsTable = ({
  groupedDeFiPositions,
  defiPositionsLoading,
  selectedItem,
  defiSortBy,
  defiSortOrder,
  getProtocolLogo,
  onItemSelect,
  onSortChange,
}: DeFiTableProps) => {
  if (defiPositionsLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!groupedDeFiPositions || groupedDeFiPositions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg mb-2">No DeFi positions found</p>
        <p className="text-sm">
          Start using DeFi protocols on Aptos to see your positions here
        </p>
      </div>
    );
  }

  const handleSortByType = () => {
    if (defiSortBy === 'type') {
      onSortChange('type', defiSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange('type', 'asc');
    }
  };

  const handleSortByValue = () => {
    if (defiSortBy === 'value') {
      onSortChange('value', defiSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange('value', 'desc');
    }
  };

  const sortedPositions = [...groupedDeFiPositions];

  // Show all positions - no filtering by value
  // sortedPositions = sortedPositions.filter(position => {
  //   if (isLPToken(position)) {
  //     return true;
  //   }
  //   return position.totalValue >= MIN_DEFI_VALUE_THRESHOLD;
  // });

  if (defiSortBy === 'type') {
    sortedPositions.sort((a, b) => {
      const typeA = Array.from(a.protocolTypes)[0] as string;
      const typeB = Array.from(b.protocolTypes)[0] as string;
      const displayA = typeA === 'derivatives' ? 'perps' : typeA;
      const displayB = typeB === 'derivatives' ? 'perps' : typeB;

      if (defiSortOrder === 'asc') {
        return displayA.localeCompare(displayB);
      } else {
        return displayB.localeCompare(displayA);
      }
    });
  } else if (defiSortBy === 'value') {
    sortedPositions.sort((a, b) => {
      if (defiSortOrder === 'asc') {
        return a.totalValue - b.totalValue;
      } else {
        return b.totalValue - a.totalValue;
      }
    });
  }

  return (
    <div className="defi-table-container" data-defi-table>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/50">
            <TableHead className="h-10 text-xs font-medium text-muted-foreground">
              Protocol
            </TableHead>
            <TableHead
              className="hidden sm:table-cell h-10 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={handleSortByType}
            >
              Type{' '}
              {defiSortBy === 'type' && (
                <span className="text-[10px]">
                  {defiSortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </TableHead>
            <TableHead
              className="h-10 text-xs font-medium text-muted-foreground text-right cursor-pointer hover:text-foreground transition-colors"
              onClick={handleSortByValue}
            >
              Value{' '}
              {defiSortBy === 'value' && (
                <span className="text-[10px]">
                  {defiSortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPositions.map((groupedPosition, index) => {
            const positionId = `defi-${groupedPosition.protocol}-${index}`;
            const isSelected =
              selectedItem?.protocol === groupedPosition.protocol;
            const primaryType = Array.from(
              groupedPosition.protocolTypes
            )[0] as string;

            return (
              <TableRow
                key={positionId}
                className={cn(
                  'cursor-pointer hover:bg-muted/30 transition-colors h-14 border-b-0',
                  isSelected && 'bg-muted/40 rounded-lg'
                )}
                onClick={() => onItemSelect(groupedPosition)}
              >
                <TableCell className="py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {(() => {
                        const protocolInfo = getDetailedProtocolInfo(groupedPosition.protocol);
                        const logoElement = (
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-background border border-border/50">
                            <Image
                              src={getProtocolLogo(groupedPosition.protocol)}
                              alt={`${groupedPosition.protocol} logo`}
                              fill
                              className="object-cover"
                              sizes="32px"
                              onError={e => {
                                const img = e.target as HTMLImageElement;
                                img.src = '/placeholder.jpg';
                              }}
                            />
                          </div>
                        );
                        
                        if (protocolInfo?.href) {
                          return (
                            <a
                              href={protocolInfo.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                              title={`Visit ${cleanProtocolName(groupedPosition.protocol)} website`}
                            >
                              {logoElement}
                            </a>
                          );
                        }
                        
                        return logoElement;
                      })()}
                    </div>
                    <span className="font-medium text-sm">
                      {cleanProtocolName(groupedPosition.protocol)}
                    </span>
                    {groupedPosition.protocol.toLowerCase() === 'aptin' && (
                      <div className="hidden xs:block">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center">
                                <AlertTriangle className="h-4 w-4 text-red-500 ml-1 cursor-help" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-red-500 text-white border-red-600">
                              <p className="text-sm font-medium">
                                This protocol is deprecated
                              </p>
                              <p className="text-sm">
                                It&apos;s recommended to remove your assets
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell py-2">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 font-normal"
                  >
                    {groupedPosition.protocolTypes.size > 1
                      ? 'Multiple'
                      : primaryType === 'derivatives'
                        ? 'Perps'
                        : primaryType
                            .replace('_', ' ')
                            .split(' ')
                            .map(
                              word =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-2">
                  <div className="flex items-center justify-end gap-1">
                    <div
                      className={`font-medium text-sm ${GeistMono.className}`}
                    >
                      {formatCurrency(groupedPosition.totalValue)}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
