"use client";

import { Copy, ExternalLink } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { memo, useCallback, useMemo } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { ErrorFallback as DialogErrorFallback } from "@/components/errors/ErrorFallback";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TokenDialogContent } from "@/components/ui/token-dialog-content";
import { useTranslation } from "@/lib/hooks/useTranslation";
import type { TokenMetadata } from "@/lib/types/tokens";
import { formatCurrency } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";
import {
  copyToClipboard,
  formatTokenAmount,
  formatUSDValue,
  getTokenLogoUrlSync,
  truncateAddress,
} from "@/lib/utils/token/token-utils";

// Generic token dialog props
export interface TokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name?: string;
  metadata?: TokenMetadata;
  supply: string;
  assetType: "stablecoins" | "btc" | "rwas";
  suppliesData?: Record<string, string>;
  priceMultiplier?: number; // BTC price or sUSDe price
  additionalLinks?: Array<{
    label: string;
    url: string;
    icon?: React.ReactNode;
  }>;
}

// Format addresses based on asset type
const FormattedAddresses = memo<{
  metadata: TokenMetadata;
  symbolParts: string[];
  assetType: "stablecoins" | "btc" | "rwas";
  onCopy: (text: string, label: string) => void;
  t: (key: string, fallback?: string) => string;
}>(({ metadata, symbolParts, assetType, onCopy, t }) => {
  const addresses = useMemo(
    () => (metadata.assetAddress || "").split("\n").filter(Boolean),
    [metadata.assetAddress]
  );

  if (!addresses.length) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("common:labels.no_address", "Address not available")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {addresses.map((addr: string, i: number) => (
        <div key={`addr-${i}`} className="flex items-center gap-2 mt-1">
          <div className="flex-grow">
            <div className="text-sm text-muted-foreground mb-1">
              {symbolParts[i] || t("common:labels.token", "Token")}{" "}
              {t("common:labels.address", "Address")}:
            </div>
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono break-all">{addr}</code>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onCopy(addr, t("common:actions.copy", "address"))}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {/* Special case for Tether reserve address in stablecoins */}
      {assetType === "stablecoins" &&
        (metadata.symbol === "USDt" || symbolParts.includes("USDt")) && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
            <div className="flex-grow">
              <div className="text-sm text-muted-foreground mb-1">
                {t("stables:labels.tether_reserve_address", "Tether Reserve Address")}:
              </div>
              <div className="text-xs text-muted-foreground mb-1">
                {t("stables:labels.subtracted_from_supply", "(Subtracted from circulating supply)")}
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono break-all flex-grow">
                  0xd5b71ee4d1bad5cb7f14c880ee55633c7befcb7384cf070919ea5c481019a4e9
                </code>
                <a
                  href="https://explorer.aptoslabs.com/account/0xd5b71ee4d1bad5cb7f14c880ee55633c7befcb7384cf070919ea5c481019a4e9?network=mainnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                  title={t("stables:labels.view_on_explorer", "View on Aptos Explorer")}
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
                  "0xd5b71ee4d1bad5cb7f14c880ee55633c7befcb7384cf070919ea5c481019a4e9",
                  t("stables:labels.reserve_address", "reserve address")
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

FormattedAddresses.displayName = "FormattedAddresses";

// Token supply display with proper formatting
const TokenSupplyDisplay = memo<{
  symbol: string;
  supply: string;
  fullSupplyData: Record<string, string>;
  metadata: TokenMetadata;
  assetType: "stablecoins" | "btc" | "rwas";
  priceMultiplier?: number;
  t: (key: string, fallback?: string) => string;
}>(({ symbol, supply, fullSupplyData, metadata, assetType, priceMultiplier, t }) => {
  const formattedAmount = useMemo(() => {
    try {
      const rawSupply = fullSupplyData[symbol];
      if (!rawSupply) return supply;

      const decimals = metadata.decimals || (assetType === "btc" ? 8 : 6);
      const tokenCount = Number(BigInt(rawSupply)) / 10 ** decimals;

      // Handle different asset types
      if (assetType === "btc") {
        const btcFormatted = formatTokenAmount(tokenCount, 0, {
          showDecimals: true,
          maxDecimals: 8,
        });
        return `${btcFormatted} ${symbol === "WBTC" ? "WBTC" : "BTC"}`;
      }

      if (assetType === "stablecoins") {
        // Special handling for sUSDe with price
        if (symbol === "sUSDe" && priceMultiplier) {
          const formattedTokenCount = new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 0,
            useGrouping: true,
          }).format(tokenCount);

          return (
            <>
              {formattedTokenCount}
              <a
                href="https://coinmarketcap.com/currencies/ethena-staked-usde/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                <ExternalLink className="h-3 w-3 inline" />
              </a>
            </>
          );
        }

        // For other stablecoins, show formatted count
        return new Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
          useGrouping: true,
        }).format(tokenCount);
      }

      if (assetType === "rwas") {
        // RWAs show USD value
        return formatUSDValue(tokenCount, { compact: false });
      }

      return supply;
    } catch (error) {
      logger.error("Error formatting token amount:", error);
      return supply;
    }
  }, [symbol, supply, fullSupplyData, metadata.decimals, assetType, priceMultiplier]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-4 h-4">
        <Image
          src={getTokenLogoUrlSync(metadata?.asset_type || symbol) || "/placeholder.jpg"}
          alt={symbol}
          width={16}
          height={16}
          className="rounded-full object-contain"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = "/placeholder.jpg";
          }}
        />
      </div>
      <div className="font-mono text-sm text-card-foreground">{formattedAmount}</div>
    </div>
  );
});

TokenSupplyDisplay.displayName = "TokenSupplyDisplay";

// Combined supply formatting for multi-token cases
const FormattedSupply = memo<{
  metadata: TokenMetadata;
  symbolParts: string[];
  supply: string;
  fullSupplyData: Record<string, string>;
  assetType: "stablecoins" | "btc" | "rwas";
  priceMultiplier?: number;
  t: (key: string, fallback?: string) => string;
}>(({ metadata, symbolParts, supply, fullSupplyData, assetType, priceMultiplier, t }) => {
  // Handle combined token case (e.g., sUSDe / USDe)
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
                  assetType={assetType}
                  priceMultiplier={priceMultiplier}
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
      symbol={metadata.symbol || ""}
      supply={supply}
      fullSupplyData={fullSupplyData}
      metadata={metadata}
      assetType={assetType}
      priceMultiplier={priceMultiplier}
      t={t}
    />
  );
});

FormattedSupply.displayName = "FormattedSupply";

// Main token dialog component
export const TokenDialog = memo<TokenDialogProps>(
  ({
    isOpen,
    onClose,
    symbol,
    name,
    metadata = {},
    supply,
    assetType,
    suppliesData = {},
    priceMultiplier,
    additionalLinks = [],
  }) => {
    const { t } = useTranslation([
      assetType === "stablecoins" ? "stables" : assetType === "btc" ? "btc" : "rwas",
      "common",
    ]);

    const handleCopy = useCallback(async (text: string, label: string) => {
      await copyToClipboard(text, label);
    }, []);

    const handleClose = useCallback(
      (open: boolean) => {
        if (!open) {
          onClose();
        }
      },
      [onClose]
    );

    // Memoized symbol parts for multi-token dialogs
    const symbolParts = useMemo(
      () => (metadata?.symbol || symbol || "").split(" / "),
      [metadata?.symbol, symbol]
    );

    // Memoized formatted addresses
    const formattedAddresses = useMemo(
      () => (
        <FormattedAddresses
          metadata={metadata}
          symbolParts={symbolParts}
          assetType={assetType}
          onCopy={handleCopy}
          t={t}
        />
      ),
      [metadata, symbolParts, assetType, handleCopy, t]
    );

    // Memoized formatted supply
    const formattedSupply = useMemo(
      () => (
        <FormattedSupply
          metadata={metadata}
          symbolParts={symbolParts}
          supply={supply}
          fullSupplyData={suppliesData}
          assetType={assetType}
          priceMultiplier={priceMultiplier}
          t={t}
        />
      ),
      [metadata, symbolParts, supply, suppliesData, assetType, priceMultiplier, t]
    );

    return (
      <ErrorBoundary fallback={<DialogErrorFallback level="dialog" onClose={onClose} />}>
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-md fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  {metadata?.thumbnail && (
                    <Image
                      src={metadata.thumbnail as string}
                      alt={`${metadata?.symbol || symbol} icon`}
                      width={32}
                      height={32}
                      className="object-contain w-full h-full"
                      priority
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src =
                          getTokenLogoUrlSync(metadata?.asset_type || symbol) || "/placeholder.jpg";
                      }}
                    />
                  )}
                </div>
                <span>{name || metadata?.name || metadata?.symbol || symbol}</span>
              </DialogTitle>
            </DialogHeader>

            <TokenDialogContent
              metadata={metadata}
              formattedSupply={formattedSupply}
              formattedAddresses={formattedAddresses}
              handleCopy={handleCopy}
            >
              {additionalLinks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-card-foreground mb-2">
                    {t("common:labels.external_links", "External Links")}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {additionalLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                      >
                        {link.icon && <span className="w-3 h-3">{link.icon}</span>}
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </TokenDialogContent>
          </DialogContent>
        </Dialog>
      </ErrorBoundary>
    );
  }
);

TokenDialog.displayName = "TokenDialog";

export type { TokenMetadata };
