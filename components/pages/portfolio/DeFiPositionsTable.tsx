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
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format';

interface DeFiPositionsTableProps {
  groupedDeFiPositions: any[] | null;
  defiPositionsLoading: boolean;
  selectedDeFiPosition: any;
  defiSortBy: string;
  defiSortOrder: 'asc' | 'desc';
  getProtocolLogo: (protocol: string) => string;
  onPositionSelect: (position: any) => void;
  onSortChange: (sortBy: string, order: 'asc' | 'desc') => void;
}

export const DeFiPositionsTable = ({
  groupedDeFiPositions,
  defiPositionsLoading,
  selectedDeFiPosition,
  defiSortBy,
  defiSortOrder,
  getProtocolLogo,
  onPositionSelect,
  onSortChange,
}: DeFiPositionsTableProps) => {
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

  // Filter out positions with value less than $0.10 (dust amounts)
  // BUT always include LP tokens regardless of value
  const MIN_DEFI_VALUE_THRESHOLD = 0.1;
  const isLPToken = (position: any) => {
    // Check if position has liquidity data (LP token structure)
    if (position.position && position.position.liquidity) {
      return true;
    }
    
    // Check if position has LP-related symbols
    const symbols = position.positions?.map((p: any) => p.protocolType?.toLowerCase() || '').join(' ') || '';
    const protocol = position.protocol?.toLowerCase() || '';
    return symbols.includes('lp') || symbols.includes('pool') || protocol.includes('farm') || protocol.includes('liquidity');
  };
  
  sortedPositions = sortedPositions.filter(position => {
    // Always include LP tokens
    if (isLPToken(position)) {
      return true;
    }
    // Filter by value threshold for non-LP tokens
    return position.totalValue >= MIN_DEFI_VALUE_THRESHOLD;
  });

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
            <TableHead className="w-[50%]">Protocol</TableHead>
            <TableHead
              className="w-[30%] cursor-pointer hover:text-primary transition-colors"
              onClick={handleSortByType}
            >
              Type{' '}
              {defiSortBy === 'type' && (defiSortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="w-[20%] text-right cursor-pointer hover:text-primary transition-colors"
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
              selectedDeFiPosition?.protocol === groupedPosition.protocol;
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
                onClick={() => onPositionSelect(groupedPosition)}
              >
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-background border flex-shrink-0">
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
                    <span className="font-medium text-sm truncate">
                      {groupedPosition.protocol}
                    </span>
                    {groupedPosition.protocol.toLowerCase() === 'aptin' && (
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
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2">
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
