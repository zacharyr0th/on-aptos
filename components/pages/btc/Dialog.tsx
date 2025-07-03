'use client';

import React, { useMemo, memo, useCallback } from 'react';
import Image from 'next/image';
import { Bitcoin, Copy } from 'lucide-react';
import { convertRawTokenAmount } from '@/lib/utils';
import { usePageTranslation } from '@/hooks/useTranslation';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { DialogErrorFallback } from '@/components/errors/DialogErrorFallback';
import { TokenDialogContent } from '@/components/ui/token-dialog-content';
import { BaseTokenDialogProps } from '@/components/ui/token-dialog-types';
import {
  BTCFormattingError,
  BTC_DECIMAL_PLACES,
  measurePerformance,
} from './types';

interface BtcTokenDialogProps extends BaseTokenDialogProps {
  bitcoinPrice?: number;
}

// Optimized supply calculation with ultra-fast formatting
const calculateSupplyData = (
  supply: string,
  decimals: number,
  bitcoinPrice: number
) => {
  // Input validation with early returns
  if (!supply || typeof supply !== 'string') {
    throw new BTCFormattingError('Invalid supply data', { supply });
  }

  // Fix: Handle null/undefined decimals and provide default
  const validDecimals =
    decimals !== null && decimals !== undefined && Number.isFinite(decimals)
      ? decimals
      : 8;

  if (validDecimals < 0 || validDecimals > BTC_DECIMAL_PLACES) {
    throw new BTCFormattingError('Invalid decimals', {
      decimals: validDecimals,
    });
  }

  if (!Number.isFinite(bitcoinPrice) || bitcoinPrice <= 0) {
    throw new BTCFormattingError('Invalid Bitcoin price', { bitcoinPrice });
  }

  // Convert raw supply to BTC using the token's decimals
  const cleanSupply = supply.replace(/[,\s]/g, ''); // Remove commas and spaces
  const btcAmount = convertRawTokenAmount(cleanSupply, validDecimals);

  if (!Number.isFinite(btcAmount) || btcAmount < 0) {
    throw new BTCFormattingError('Invalid BTC amount after conversion', {
      btcAmount,
      cleanSupply,
      decimals: validDecimals,
    });
  }

  // Calculate USD value using Bitcoin price
  const usdValue = btcAmount * bitcoinPrice;

  // Use optimized formatting with pre-computed formatters
  const btcFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: BTC_DECIMAL_PLACES,
    useGrouping: true,
  });

  const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: usdValue >= 1 ? 0 : 2,
    useGrouping: true,
  });

  return {
    btcAmount: btcFormatter.format(btcAmount),
    usdAmount: usdFormatter.format(usdValue),
    rawBtcAmount: btcAmount,
    rawUsdAmount: usdValue,
  };
};

// Ultra-optimized memoized supply calculator
const SupplyCalculator = memo<{
  supply: string;
  decimals: number;
  bitcoinPrice: number;
  t: (key: string, fallback?: string) => string;
}>(({ supply, decimals, bitcoinPrice, t }) => {
  const formattedData = useMemo(() => {
    return measurePerformance(() => {
      try {
        const result = calculateSupplyData(supply, decimals, bitcoinPrice);
        return {
          btcAmount: result.btcAmount,
          usdAmount: result.usdAmount,
          success: true,
        };
      } catch (error) {
        console.error('Error calculating BTC values:', error);
        return {
          btcAmount: t(
            'btc:error.error_calculating_supply',
            'Error calculating supply'
          ),
          usdAmount: null,
          success: false,
          error:
            error instanceof BTCFormattingError
              ? error.message
              : t('btc:error.unknown_error', 'Unknown error'),
        };
      }
    }, 'SupplyCalculator calculation');
  }, [supply, decimals, bitcoinPrice, t]);

  if (!formattedData.success) {
    return (
      <div className="flex items-center gap-2">
        <Bitcoin className="h-5 w-5 text-amber-500" />
        <span className="text-destructive">{formattedData.error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-5 relative">
        <Bitcoin className="h-5 w-5 text-amber-500" />
      </div>
      <span>
        {formattedData.btcAmount} BTC
        {formattedData.usdAmount && (
          <span className="text-muted-foreground ml-1">
            ≈ {formattedData.usdAmount}
          </span>
        )}
      </span>
    </div>
  );
});

SupplyCalculator.displayName = 'SupplyCalculator';

// Ultra-optimized address display component
const AddressDisplay = memo<{
  address: string;
  onCopy: (address: string, label: string) => void;
  t: (key: string, fallback?: string) => string;
}>(({ address, onCopy, t }) => {
  const handleCopyClick = useCallback(() => {
    onCopy(address, t('common:actions.copy', 'address'));
  }, [address, onCopy, t]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-grow">
        <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono break-all">
          {address}
        </code>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={handleCopyClick}
        aria-label={t('common:actions.copy', `Copy ${address} to clipboard`)}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
});

AddressDisplay.displayName = 'AddressDisplay';

// Optimized token icon with error handling and lazy loading
const TokenIcon = memo<{
  src: string;
  alt: string;
  fallbackSrc?: string;
}>(({ src, alt, fallbackSrc = '/icons/bitcoin.png' }) => {
  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      console.error('Failed to load token image:', src);
      e.currentTarget.src = fallbackSrc;
    },
    [src, fallbackSrc]
  );

  return (
    <div className="relative w-12 h-12">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="48px"
        priority
        className="rounded-full object-contain"
        onError={handleError}
      />
    </div>
  );
});

TokenIcon.displayName = 'TokenIcon';

// Ultra-optimized token dialog with comprehensive performance improvements
const TokenDialog = memo<BtcTokenDialogProps>(
  ({ isOpen, onClose, metadata, supply, bitcoinPrice = 0 }) => {
    const { t } = usePageTranslation('btc');

    const handleCopy = useCallback((text: string, label: string) => {
      navigator.clipboard.writeText(text);
      // Could add toast notification here
    }, []);

    const handleClose = useCallback(() => {
      onClose();
    }, [onClose]);

    // Ultra-fast validation with early returns
    const isValidData = useMemo(() => {
      return !!(
        metadata?.name &&
        metadata?.symbol &&
        metadata?.assetAddress &&
        metadata?.thumbnail &&
        supply &&
        (metadata.decimals === 0 ||
          metadata.decimals ||
          metadata.decimals === null ||
          metadata.decimals === undefined)
      );
    }, [metadata, supply]);

    // Memoized formatted supply component with performance measurement
    const formattedSupply = useMemo(() => {
      if (!isValidData || !metadata) {
        return (
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-amber-500" />
            <span className="text-destructive">
              {t('btc:error.invalid_data', 'Invalid data')}
            </span>
          </div>
        );
      }

      return (
        <SupplyCalculator
          supply={supply}
          decimals={metadata.decimals}
          bitcoinPrice={bitcoinPrice}
          t={t}
        />
      );
    }, [isValidData, metadata, supply, bitcoinPrice, t]);

    // Ultra-optimized address display with memoization
    const formattedAddresses = useMemo(() => {
      if (!isValidData || !metadata) {
        return (
          <div className="text-destructive">
            {t('btc:error.invalid_metadata', 'Invalid metadata')}
          </div>
        );
      }

      return (
        <AddressDisplay
          address={metadata.assetAddress}
          onCopy={handleCopy}
          t={t}
        />
      );
    }, [isValidData, metadata, handleCopy, t]);

    // Memoized dialog header content
    const headerContent = useMemo(() => {
      if (!metadata) return null;

      return (
        <div className="flex items-center gap-3">
          <TokenIcon src={metadata.thumbnail} alt={`${metadata.name} icon`} />
          <div>
            <DialogTitle className="text-xl">{metadata.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">{metadata.symbol}</p>
          </div>
        </div>
      );
    }, [metadata]);

    // Memoized Bitcoin-specific content
    const bitcoinSpecificContent = useMemo(() => {
      if (!metadata) return null;

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <Bitcoin className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-foreground">
              {t('btc:info.bitcoin_backed_asset', 'Bitcoin-backed Asset')}
            </span>
          </div>

          {/* Additional metadata display */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">
                {t('btc:stats.decimals', 'Decimals')}
              </p>
              <p className="font-mono">{metadata.decimals ?? 8}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">
                {t('btc:stats.network', 'Network')}
              </p>
              <p>{t('btc:stats.aptos_mainnet', 'Aptos Mainnet')}</p>
            </div>
          </div>
        </div>
      );
    }, [metadata, t]);

    // Early return for invalid data
    if (!isValidData || !metadata) {
      return null;
    }

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>{headerContent}</DialogHeader>

          <ErrorBoundary
            fallback={<DialogErrorFallback onCloseDialog={handleClose} />}
          >
            <TokenDialogContent
              metadata={metadata}
              formattedSupply={formattedSupply}
              formattedAddresses={formattedAddresses}
              handleCopy={handleCopy}
            >
              {bitcoinSpecificContent}
            </TokenDialogContent>
          </ErrorBoundary>
        </DialogContent>
      </Dialog>
    );
  }
);

TokenDialog.displayName = 'TokenDialog';

export { TokenDialog };
