'use client';

import { ExternalLink, Copy } from 'lucide-react';
import Image from 'next/image';
import React, { useMemo, memo, useCallback } from 'react';

import { DialogErrorFallback } from '@/components/errors/DialogErrorFallback';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TokenDialogContent } from '@/components/ui/token-dialog-content';
import {
  BaseTokenDialogProps,
  TokenMetadata,
} from '@/components/ui/token-dialog-types';
import { useTranslation } from '@/hooks/useTranslation';
import { TETHER_RESERVE_ADDRESS } from '@/lib/config/data';

import { measurePerformance } from './types';

// Enhanced props interface with better typing
interface TokenDialogProps extends BaseTokenDialogProps {
  susdePrice?: number;
  suppliesData?: Record<string, string>;
}

// Constants for better maintainability
const COINMARKETCAP_SUSDE_URL =
  'https://coinmarketcap.com/currencies/ethena-staked-usde/';

const ICON_MAP: Record<string, string> = {
  USDe: '/icons/stables/usde.png',
  sUSDe: '/icons/stables/susde.png',
  USDC: '/icons/stables/usdc.png',
  USDt: '/icons/stables/usdt.png',
} as const;

// Optimized token icon getter with memoization
const getTokenIcon = (symbol: string): string => {
  return ICON_MAP[symbol] || '/icons/aptos.png';
};

// Enhanced formatted addresses component with better performance
const FormattedAddresses = memo<{
  metadata: TokenMetadata;
  symbolParts: string[];
  onCopy: (text: string, label: string) => void;
  t: (key: string, fallback?: string) => string;
}>(({ metadata, symbolParts, onCopy, t }) => {
  const addresses = useMemo(
    () => metadata.assetAddress.split('\n'),
    [metadata.assetAddress]
  );

  return (
    <div className="space-y-2">
      {addresses.map((addr, i) => (
        <div key={`addr-${i}`} className="flex items-center gap-2 mt-1">
          <div className="flex-grow">
            <div className="text-sm text-muted-foreground mb-1">
              {symbolParts[i] || t('common:labels.token', 'Token')}{' '}
              {t('common:labels.address', 'Address')}:
            </div>
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono break-all">
              {addr}
            </code>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onCopy(addr, t('common:actions.copy', 'address'))}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {/* Add Tether reserve address information for USDt */}
      {(metadata.symbol === 'USDt' || symbolParts.includes('USDt')) && (
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
          <div className="flex-grow">
            <div className="text-sm text-muted-foreground mb-1">
              {t(
                'stables:labels.tether_reserve_address',
                'Tether Reserve Address'
              )}
              :
            </div>
            <div className="text-xs text-muted-foreground mb-1">
              {t(
                'stables:labels.subtracted_from_supply',
                '(Subtracted from circulating supply)'
              )}
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono break-all flex-grow">
                {TETHER_RESERVE_ADDRESS}
              </code>
              <a
                href={`https://explorer.aptoslabs.com/account/${TETHER_RESERVE_ADDRESS}?network=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
                title={t(
                  'stables:labels.view_on_explorer',
                  'View on Aptos Explorer'
                )}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() =>
              onCopy(
                TETHER_RESERVE_ADDRESS,
                t('stables:labels.reserve_address', 'reserve address')
              )
            }
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
});

FormattedAddresses.displayName = 'FormattedAddresses';

// Enhanced token supply display component with better performance
const TokenSupplyDisplay = memo<{
  symbol: string;
  supply: string;
  fullSupplyData: Record<string, string>;
  metadata: TokenMetadata;
  susdePrice?: number;
  t: (key: string, fallback?: string) => string;
}>(({ symbol, supply, fullSupplyData, metadata, susdePrice, t: _t }) => {
  const formattedAmount = useMemo(() => {
    return measurePerformance(() => {
      try {
        // Get the raw value from supply data
        const rawSupply = fullSupplyData[symbol];
        if (!rawSupply) return supply; // Fall back to abbreviated value if not found

        // Convert to decimal based on token decimals
        const tokenCount =
          Number(BigInt(rawSupply)) / Math.pow(10, metadata.decimals);

        // Format the token count with full precision and commas
        const formattedTokenCount = new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 0,
          useGrouping: true,
        }).format(tokenCount);

        // For sUSDe, always show token count with @ price as a clickable link
        if (symbol === 'sUSDe') {
          // Only show price if available
          if (
            typeof susdePrice === 'number' &&
            !isNaN(susdePrice) &&
            susdePrice > 0
          ) {
            return (
              <>
                {formattedTokenCount}
                <a
                  href={COINMARKETCAP_SUSDE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-1"
                >
                  <ExternalLink className="h-3 w-3 inline" />
                </a>
              </>
            );
          }
          return formattedTokenCount;
        }

        // For USDe, just show the token count
        if (symbol === 'USDe') {
          return formattedTokenCount;
        }

        // For USDT and USDC, show formatted number without $ sign
        if (symbol === 'USDt' || symbol === 'USDC') {
          return formattedTokenCount;
        }

        // For other tokens, show the full USD value with commas
        const formattedDollarValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
          useGrouping: true,
        }).format(tokenCount);

        return formattedDollarValue;
      } catch (error) {
        console.error('Error formatting token amount:', error);
        return supply;
      }
    }, `format-${symbol}`);
  }, [symbol, supply, fullSupplyData, metadata.decimals, susdePrice]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-4 h-4">
        <Image
          src={getTokenIcon(symbol)}
          alt={symbol}
          width={16}
          height={16}
          className="rounded-full object-contain"
        />
      </div>
      <div className="font-mono text-sm text-card-foreground">
        {formattedAmount}
      </div>
    </div>
  );
});

TokenSupplyDisplay.displayName = 'TokenSupplyDisplay';

// Enhanced formatted supply component with comprehensive optimizations
const FormattedSupply = memo<{
  metadata: TokenMetadata;
  symbolParts: string[];
  supply: string;
  fullSupplyData: Record<string, string>;
  susdePrice?: number;
  t: (key: string, fallback?: string) => string;
}>(({ metadata, symbolParts, supply, fullSupplyData, susdePrice, t }) => {
  // Handle combined token case (sUSDe / USDe)
  if (symbolParts.length > 1) {
    return (
      <div className="space-y-1">
        {symbolParts.map((symbol, i) => {
          const trimmedSymbol = symbol.trim();

          return (
            <div key={`${trimmedSymbol}-${i}`} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-[50px]">
                  {trimmedSymbol}:
                </span>
                <TokenSupplyDisplay
                  symbol={trimmedSymbol}
                  supply={supply}
                  fullSupplyData={fullSupplyData}
                  metadata={metadata}
                  susdePrice={susdePrice}
                  t={t}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Handle single token case
  return (
    <TokenSupplyDisplay
      symbol={metadata.symbol}
      supply={supply}
      fullSupplyData={fullSupplyData}
      metadata={metadata}
      susdePrice={susdePrice}
      t={t}
    />
  );
});

FormattedSupply.displayName = 'FormattedSupply';

// Enhanced main dialog component with comprehensive optimizations
export const TokenDialog = memo<TokenDialogProps>(
  ({ isOpen, onClose, metadata, supply, susdePrice, suppliesData = {} }) => {
    const handleCopy = useCallback((text: string, label: string) => {
      navigator.clipboard.writeText(text);
      // Could add toast notification here
    }, []);

    const handleClose = useCallback(() => {
      onClose();
    }, [onClose]);
    const { t } = useTranslation(['stables', 'common']);

    // Memoized symbol parts for better performance
    const symbolParts = useMemo(
      () => metadata.symbol.split(' / '),
      [metadata.symbol]
    );

    // Use passed supply data instead of fetching separately
    const fullSupplyData = useMemo(() => {
      return suppliesData;
    }, [suppliesData]);

    // Memoized formatted addresses
    const formattedAddresses = useMemo(
      () => (
        <FormattedAddresses
          metadata={metadata}
          symbolParts={symbolParts}
          onCopy={handleCopy}
          t={t}
        />
      ),
      [metadata, symbolParts, handleCopy, t]
    );

    // Memoized formatted supply
    const formattedSupply = useMemo(
      () => (
        <FormattedSupply
          metadata={metadata}
          symbolParts={symbolParts}
          supply={supply}
          fullSupplyData={fullSupplyData}
          susdePrice={susdePrice}
          t={t}
        />
      ),
      [metadata, symbolParts, supply, fullSupplyData, susdePrice, t]
    );

    return (
      <ErrorBoundary
        fallback={<DialogErrorFallback onCloseDialog={handleClose} />}
      >
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  {metadata.thumbnail && (
                    <Image
                      src={metadata.thumbnail}
                      alt={`${metadata.symbol} icon`}
                      width={32}
                      height={32}
                      className="object-contain w-full h-full"
                      priority
                    />
                  )}
                </div>
                <span>{metadata.symbol}</span>
              </DialogTitle>
            </DialogHeader>

            <TokenDialogContent
              metadata={metadata}
              formattedSupply={formattedSupply}
              formattedAddresses={formattedAddresses}
              handleCopy={handleCopy}
            />
          </DialogContent>
        </Dialog>
      </ErrorBoundary>
    );
  }
);

TokenDialog.displayName = 'TokenDialog';

export type { TokenMetadata };
