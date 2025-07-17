'use client';

import Image from 'next/image';
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
import { Coins, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatTokenAmount } from '@/lib/utils/format';
import { getTokenLogoUrlWithFallback } from '@/lib/utils/token-logos';
import { cleanProtocolName } from './utils';

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
  // Limit to 10 assets and calculate remaining count
  const displayAssets = visibleAssets.slice(0, 10);
  const remainingCount = Math.max(0, visibleAssets.length - 10);

  return (
    <div className="space-y-4 asset-table-container">
      {visibleAssets.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%] min-w-[140px]">Asset</TableHead>
                <TableHead className="hidden sm:table-cell w-[25%] min-w-[80px]">
                  Amount
                </TableHead>
                <TableHead className="w-[25%] min-w-[70px]">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayAssets.map((asset, index) => (
                <TableRow
                  key={`asset-${asset.asset_type}-${asset.amount}-${index}`}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50 transition-colors',
                    selectedItem?.asset_type === asset.asset_type &&
                      'bg-muted/50'
                  )}
                  onClick={() => onItemSelect(asset)}
                >
                  <TableCell className="w-[50%] min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center">
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
                          <span className="font-medium text-sm sm:text-base truncate">
                            {asset.metadata?.symbol || 'Unknown'}
                          </span>
                          {asset.protocolInfo && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0.5 h-5"
                            >
                              {asset.protocolInfo.protocolLabel}
                            </Badge>
                          )}
                          {!showOnlyVerified && asset.isVerified === false && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0"
                                >
                                  Unverified
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  This token is not verified by Panora Exchange
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground sm:hidden font-mono text-left">
                          {formatTokenAmount(asset.balance || 0, undefined, {
                            showSymbol: false,
                          })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell w-[25%] min-w-[80px] text-left">
                    <div className="text-sm font-mono">
                      {formatTokenAmount(asset.balance || 0, undefined, {
                        showSymbol: false,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="w-[25%] min-w-[70px]">
                    <div className="font-medium text-sm sm:text-base font-mono">
                      {formatCurrency(asset.value || 0)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Show remaining count if there are more than 10 assets */}
          {remainingCount > 0 && (
            <div className="text-center py-2 text-sm text-muted-foreground">
              + ({remainingCount}) more
            </div>
          )}
        </>
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
  if (!groupedDeFiPositions) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No DeFi positions found</p>
      </div>
    );
  }

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

  if (groupedDeFiPositions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No DeFi positions found</p>
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

  let sortedPositions = [...groupedDeFiPositions];

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
    <div className="space-y-4 defi-table-container">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60%] sm:w-[50%]">Protocol</TableHead>
            <TableHead
              className="hidden sm:table-cell w-[30%] cursor-pointer hover:text-primary transition-colors"
              onClick={handleSortByType}
            >
              Type{' '}
              {defiSortBy === 'type' && (defiSortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="w-[40%] sm:w-[20%] text-right cursor-pointer hover:text-primary transition-colors"
              onClick={handleSortByValue}
            >
              Value{' '}
              {defiSortBy === 'value' && (defiSortOrder === 'asc' ? '↑' : '↓')}
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
                  'cursor-pointer transition-all duration-200',
                  isSelected && 'bg-muted/50'
                )}
                onClick={() => onItemSelect(groupedPosition)}
              >
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-background border">
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
                      <div className="text-[10px] text-muted-foreground xs:hidden text-center mt-0.5 max-w-[40px] truncate">
                        {
                          cleanProtocolName(groupedPosition.protocol).split(
                            ' '
                          )[0]
                        }
                      </div>
                    </div>
                    <span className="font-medium text-sm truncate hidden xs:block">
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
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
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
                  </div>
                </TableCell>
                <TableCell className="text-right py-2">
                  <div className="flex items-center justify-end gap-2">
                    <div className="font-medium text-sm font-mono">
                      {groupedPosition.protocol === 'Thala Farm'
                        ? 'TBD'
                        : formatCurrency(groupedPosition.totalValue)}
                    </div>
                    {groupedPosition.protocol === 'Merkle' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-muted-foreground cursor-help">
                              ⓘ
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              MKLP price is hardcoded to $1.05 for now
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
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
