'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import { Coins } from 'lucide-react';
import { LST_METADATA } from '@/lib/config';
import { trpc } from '@/lib/trpc/client';
import { usePageTranslation } from '@/hooks/useTranslation';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { DialogErrorFallback } from '@/components/errors/DialogErrorFallback';
import { TokenDialogContent } from '@/components/ui/token-dialog-content';
import {
  BaseTokenDialogProps,
  SupplyItem,
} from '@/components/ui/token-dialog-types';

const TokenDialog: React.FC<BaseTokenDialogProps> = ({
  isOpen,
  onClose,
  metadata,
  supply,
}) => {
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const [sortedTokenSymbols, setSortedTokenSymbols] = useState<string[]>([]);
  const { t } = usePageTranslation('lst');

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Use tRPC to fetch supply data when dialog is open
  const { data: supplyResponse, isLoading: isLoadingSupply } =
    trpc.domains.assets.liquidStaking.getSupplies.useQuery(
      { forceRefresh: false },
      {
        enabled: isOpen, // Only fetch when dialog is open
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    );

  // Handle combined token sorting when data is received
  React.useEffect(() => {
    if (metadata.symbol.includes('/') && supplyResponse?.data?.supplies) {
      const supplyMap: Record<string, string> = {};
      supplyResponse.data.supplies.forEach((item: SupplyItem) => {
        supplyMap[item.symbol] = item.supply;
      });

      const symbols = metadata.symbol.split('/').map(s => s.trim());
      const sortedSymbols = [...symbols].sort((a, b) => {
        const supplyA = BigInt(supplyMap[a] || '0');
        const supplyB = BigInt(supplyMap[b] || '0');
        return supplyB > supplyA ? 1 : -1;
      });
      setSortedTokenSymbols(sortedSymbols);
    }
  }, [supplyResponse, metadata.symbol]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setImageLoaded({});
      setSortedTokenSymbols([]);
    }
  }, [isOpen]);

  const handleImageLoad = useCallback((symbol: string) => {
    setImageLoaded(prev => ({
      ...prev,
      [symbol]: true,
    }));
  }, []);

  const formattedSupply = useMemo(() => {
    if (isLoadingSupply) {
      return (
        <span className="text-muted-foreground text-sm">
          {t('common:labels.loading', 'Loading...')}
        </span>
      );
    }

    // Create supply map from tRPC response
    const supplyMap: Record<string, string> = {};
    if (supplyResponse?.data?.supplies) {
      supplyResponse.data.supplies.forEach((item: SupplyItem) => {
        supplyMap[item.symbol] = item.supply;
      });
    }

    const formatFullAmount = (symbol: string) => {
      // Get the raw value from API data
      const rawSupply = supplyMap[symbol];
      if (!rawSupply) return supply; // Fall back to abbreviated value if not found

      // For LST, the supply field is already the raw amount, not converted
      // Convert to decimal based on token decimals
      const tokenCount =
        Number(BigInt(rawSupply)) / Math.pow(10, metadata.decimals);

      // Format the token count with full precision and commas (no abbreviation)
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(tokenCount);
    };

    // Handle combined token case (multiple symbols separated by /)
    if (metadata.symbol.includes('/')) {
      const symbols = metadata.symbol.split('/').map(s => s.trim());
      return (
        <div className="space-y-1">
          {symbols.map((symbol, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-5 w-5 relative">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <span>
                {symbol}: {formatFullAmount(symbol)} APT
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Handle single token case
    return (
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 relative">
          <Coins className="h-5 w-5 text-primary" />
        </div>
        <span>{formatFullAmount(metadata.symbol)} APT</span>
      </div>
    );
  }, [
    supply,
    supplyResponse,
    isLoadingSupply,
    metadata.symbol,
    metadata.decimals,
    t,
  ]);

  // Get tokens for combined display
  const combinedTokens = useMemo(() => {
    if (!metadata.symbol.includes('/')) {
      return [];
    }

    const tokens =
      sortedTokenSymbols.length > 0
        ? sortedTokenSymbols
        : metadata.symbol.split('/').map(s => s.trim());

    return tokens.map(symbol => ({
      symbol,
      metadata: LST_METADATA[symbol] || null,
    }));
  }, [metadata.symbol, sortedTokenSymbols]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          {metadata.symbol.includes('/') ? (
            <>
              <DialogTitle className="text-xl">{metadata.name}</DialogTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {combinedTokens.map((token, index) => (
                    <React.Fragment key={token.symbol}>
                      <div className="flex items-center">
                        <div className="relative w-8 h-8 mr-1">
                          {!imageLoaded[token.symbol] && (
                            <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
                          )}
                          <Image
                            src={
                              token.metadata?.thumbnail ||
                              '/icons/lst/default.png'
                            }
                            alt={`${token.symbol} icon`}
                            width={32}
                            height={32}
                            className={`rounded-full object-contain ${!imageLoaded[token.symbol] ? 'opacity-0' : ''}`}
                            onLoad={() => handleImageLoad(token.symbol)}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {token.symbol}
                        </span>
                      </div>
                      {index < combinedTokens.length - 1 && (
                        <span className="mx-1">/</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                {!imageLoaded['main'] && (
                  <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
                )}
                <Image
                  src={metadata.thumbnail}
                  alt={metadata.name}
                  fill
                  sizes="48px"
                  priority
                  className={`rounded-full object-contain ${!imageLoaded['main'] ? 'opacity-0' : ''}`}
                  onLoad={() => handleImageLoad('main')}
                />
              </div>
              <div>
                <DialogTitle className="text-xl">{metadata.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {metadata.symbol}
                </p>
              </div>
            </div>
          )}
        </DialogHeader>

        <ErrorBoundary
          fallback={<DialogErrorFallback onCloseDialog={handleClose} />}
        >
          <TokenDialogContent
            metadata={metadata}
            formattedSupply={formattedSupply}
            handleCopy={handleCopy}
          />
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};

export const MemoizedTokenDialog = React.memo(TokenDialog);
export { MemoizedTokenDialog as TokenDialog };
