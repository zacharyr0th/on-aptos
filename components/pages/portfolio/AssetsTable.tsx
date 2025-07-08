'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/tooltip';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatTokenAmount } from '@/lib/utils/format';
import { getTokenLogoUrlWithFallback } from '@/lib/utils/token-logos';

interface AssetsTableProps {
  visibleAssets: any[];
  selectedAsset: any;
  showOnlyVerified: boolean;
  portfolioAssets: any[];
  onAssetSelect: (asset: any) => void;
}

export const AssetsTable = ({
  visibleAssets,
  selectedAsset,
  showOnlyVerified,
  portfolioAssets,
  onAssetSelect,
}: AssetsTableProps) => {
  return (
    <div className="space-y-4 asset-table-container">
      {visibleAssets.length > 0 ? (
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
            {visibleAssets.map((asset, index) => (
              <TableRow
                key={`asset-${asset.asset_type}-${asset.amount}-${index}`}
                className={cn(
                  'cursor-pointer hover:bg-muted/50 transition-colors',
                  selectedAsset?.asset_type === asset.asset_type &&
                    'bg-muted/50'
                )}
                onClick={() => onAssetSelect(asset)}
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
                          // Try PNG if SVG fails
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
