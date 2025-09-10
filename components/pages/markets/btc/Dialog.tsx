"use client";

import { Bitcoin } from "lucide-react";
import React, { memo, useCallback, useMemo } from "react";
import {
  AddressDisplay,
  BaseDialog,
  type BtcDialogProps,
  createCopyHandler,
  DialogInfoRow,
  DialogSection,
  type DialogTokenMetadata,
  TokenHeader,
} from "@/components/shared/dialogs";
import { TokenDialogContent } from "@/components/ui/token-dialog-content";
import { usePageTranslation } from "@/lib/hooks/useTranslation";
import { convertRawTokenAmount } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";
import { BTC_DECIMAL_PLACES, BTCFormattingError, measurePerformance } from "./types";

interface BtcTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: DialogTokenMetadata;
  supply: string;
  bitcoinPrice?: number;
}

// Optimized supply calculation with ultra-fast formatting
const calculateSupplyData = (supply: string, decimals: number, bitcoinPrice: number) => {
  // Input validation with early returns
  if (!supply || typeof supply !== "string") {
    throw new BTCFormattingError("Invalid supply data", { supply });
  }

  // Fix: Handle null/undefined decimals and provide default
  const validDecimals =
    decimals !== null && decimals !== undefined && Number.isFinite(decimals) ? decimals : 8;

  if (validDecimals < 0 || validDecimals > BTC_DECIMAL_PLACES) {
    throw new BTCFormattingError("Invalid decimals", {
      decimals: validDecimals,
    });
  }

  if (!Number.isFinite(bitcoinPrice) || bitcoinPrice <= 0) {
    throw new BTCFormattingError("Invalid Bitcoin price", { bitcoinPrice });
  }

  // Convert raw supply to BTC using the token's decimals
  const cleanSupply = supply.replace(/[,\s]/g, ""); // Remove commas and spaces
  const btcAmount = convertRawTokenAmount(cleanSupply, validDecimals);

  if (!Number.isFinite(btcAmount) || btcAmount < 0) {
    throw new BTCFormattingError("Invalid BTC amount after conversion", {
      btcAmount,
      cleanSupply,
      decimals: validDecimals,
    });
  }

  // Calculate USD value using Bitcoin price
  const usdValue = btcAmount * bitcoinPrice;

  // Use optimized formatting with pre-computed formatters
  const btcFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: BTC_DECIMAL_PLACES,
    useGrouping: true,
  });

  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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
        logger.error("Error calculating BTC values:", error);
        return {
          btcAmount: t("btc:error.error_calculating_supply", "Error calculating supply"),
          usdAmount: null,
          success: false,
          error:
            error instanceof BTCFormattingError
              ? error.message
              : t("btc:error.unknown_error", "Unknown error"),
        };
      }
    }, "SupplyCalculator calculation");
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
          <span className="text-muted-foreground ml-1">≈ {formattedData.usdAmount}</span>
        )}
      </span>
    </div>
  );
});

SupplyCalculator.displayName = "SupplyCalculator";

// BTC-specific address display is now handled by shared AddressDisplay component

// TokenIcon is now provided by shared components

// Ultra-optimized token dialog with shared components
const TokenDialog = memo<BtcTokenDialogProps>(
  ({ isOpen, onClose, metadata, supply, bitcoinPrice = 0 }) => {
    const { t } = usePageTranslation("btc");
    const copyHandler = createCopyHandler();

    // Validation with early returns
    const isValidData = useMemo(() => {
      return !!(
        metadata?.name &&
        metadata?.symbol &&
        metadata?.address &&
        metadata?.logoUrl &&
        supply &&
        (metadata.decimals === 0 ||
          metadata.decimals ||
          metadata.decimals === null ||
          metadata.decimals === undefined)
      );
    }, [metadata, supply]);

    // Formatted supply component
    const formattedSupply = useMemo(() => {
      if (!isValidData || !metadata) {
        return (
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-amber-500" />
            <span className="text-destructive">{t("btc:error.invalid_data", "Invalid data")}</span>
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

    // Address display component
    const addressDisplay = useMemo(() => {
      if (!isValidData || !metadata) {
        return (
          <div className="text-destructive">
            {t("btc:error.invalid_metadata", "Invalid metadata")}
          </div>
        );
      }

      return <AddressDisplay addresses={metadata.address} onCopy={copyHandler} />;
    }, [isValidData, metadata, copyHandler]);

    // Dialog header content using shared TokenHeader
    const headerContent = useMemo(() => {
      if (!metadata) return null;

      return (
        <TokenHeader
          symbol={metadata.symbol}
          name={metadata.name}
          logoUrl={metadata.logoUrl}
          description={metadata.description}
        />
      );
    }, [metadata]);

    // Bitcoin-specific content using shared DialogSection
    const bitcoinSpecificContent = useMemo(() => {
      if (!metadata) return null;

      return (
        <DialogSection title={t("btc:sections.bitcoin_info", "Bitcoin Information")}>
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <Bitcoin className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-foreground">
              {t("btc:info.bitcoin_backed_asset", "Bitcoin-backed Asset")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <DialogInfoRow
              label={t("btc:stats.decimals", "Decimals")}
              value={<span className="font-mono">{metadata.decimals ?? 8}</span>}
            />
            <DialogInfoRow
              label={t("btc:stats.network", "Network")}
              value={t("btc:stats.aptos_mainnet", "Aptos Mainnet")}
            />
          </div>
        </DialogSection>
      );
    }, [metadata, t]);

    // Early return for invalid data
    if (!isValidData || !metadata) {
      return null;
    }

    return (
      <BaseDialog
        isOpen={isOpen}
        onClose={onClose}
        title={headerContent}
        size="lg"
        showErrorBoundary={true}
      >
        <div className="space-y-6">
          <DialogSection title={t("common:labels.token_details", "Token Details")}>
            <div className="space-y-4">
              <DialogInfoRow
                label={`${t("common:labels.total_supply", "Total Supply")}:`}
                value={formattedSupply}
              />
              <DialogInfoRow
                label={`${t("common:labels.asset_address", "Asset Address")}:`}
                value={addressDisplay}
              />
              <DialogInfoRow
                label={`${t("common:labels.type", "Type")}:`}
                value={metadata.type || "Bitcoin Asset"}
              />
            </div>
          </DialogSection>

          {bitcoinSpecificContent}
        </div>
      </BaseDialog>
    );
  }
);

TokenDialog.displayName = "TokenDialog";

export { TokenDialog };
