"use client";

import { ExternalLink } from "lucide-react";
import Image from "next/image";
import React, { memo, useCallback, useMemo } from "react";

import {
  AddressDisplay,
  BaseDialog,
  createCopyHandler,
  DialogInfoRow,
  DialogSection,
  type DialogTokenMetadata,
  measurePerformance,
  TokenHeader,
  TokenIcon,
} from "@/components/shared/dialogs";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { errorLogger } from "@/lib/utils/core/logger";

const TETHER_RESERVE_ADDRESS = "0xd5b71ee4d1bad5cb7f14c880ee55633c7befcb7384cf070919ea5c481019a4e9";

// Enhanced props interface with better typing
interface TokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: DialogTokenMetadata;
  supply: string;
  susdePrice?: number;
  suppliesData?: Record<string, string>;
}

// Constants for better maintainability
const COINMARKETCAP_SUSDE_URL = "https://coinmarketcap.com/currencies/ethena-staked-usde/";

const ICON_MAP: Record<string, string> = {
  USDe: "/icons/stables/usde.png",
  sUSDe: "/icons/stables/susde.png",
  USDC: "/icons/stables/usdc.png",
  USDt: "/icons/stables/usdt.png",
} as const;

// Optimized token icon getter with memoization
const getTokenIcon = (symbol: string): string => {
  return ICON_MAP[symbol] || "/icons/aptos.png";
};

// Enhanced formatted addresses component with Tether reserve handling
const StablecoinsAddressDisplay = memo<{
  metadata: DialogTokenMetadata;
  symbolParts: string[];
  onCopy?: (text: string, label?: string) => void;
  t: (key: string, fallback?: string) => string;
}>(({ metadata, symbolParts, onCopy, t }) => {
  const addresses = metadata.address ? metadata.address.split("\n") : [];
  const labels = symbolParts.map(
    (part, i) =>
      `${part || t("common:labels.token", "Token")} ${t("common:labels.address", "Address")}`
  );

  return (
    <div className="space-y-4">
      <AddressDisplay
        addresses={addresses}
        labels={labels}
        onCopy={onCopy}
        showExplorerLinks={true}
      />

      {/* Add Tether reserve address information for USDt */}
      {(metadata.symbol === "USDt" || symbolParts.includes("USDt")) && (
        <div className="pt-2 border-t border-border">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {t("stables:labels.tether_reserve_address", "Tether Reserve Address")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("stables:labels.subtracted_from_supply", "(Subtracted from circulating supply)")}
            </div>
            <AddressDisplay
              addresses={TETHER_RESERVE_ADDRESS}
              onCopy={onCopy}
              showExplorerLinks={true}
            />
          </div>
        </div>
      )}
    </div>
  );
});

StablecoinsAddressDisplay.displayName = "StablecoinsAddressDisplay";

// Enhanced token supply display component with better performance
const TokenSupplyDisplay = memo<{
  symbol: string;
  supply: string;
  fullSupplyData: Record<string, string>;
  metadata: DialogTokenMetadata;
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
        const tokenCount = Number(BigInt(rawSupply)) / 10 ** metadata.decimals;

        // Format the token count with full precision and commas
        const formattedTokenCount = new Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
          useGrouping: true,
        }).format(tokenCount);

        // For sUSDe, always show token count with @ price as a clickable link
        if (symbol === "sUSDe") {
          // Only show price if available
          if (typeof susdePrice === "number" && !isNaN(susdePrice) && susdePrice > 0) {
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
        if (symbol === "USDe") {
          return formattedTokenCount;
        }

        // For USDT and USDC, show formatted number without $ sign
        if (symbol === "USDt" || symbol === "USDC") {
          return formattedTokenCount;
        }

        // For other tokens, show the full USD value with commas
        const formattedDollarValue = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
          useGrouping: true,
        }).format(tokenCount);

        return formattedDollarValue;
      } catch (error) {
        errorLogger.error("Error formatting token amount:", error);
        return supply;
      }
    }, `format-${symbol}`);
  }, [symbol, supply, fullSupplyData, metadata.decimals, susdePrice]);

  return (
    <div className="flex items-center gap-2">
      <TokenIcon src={getTokenIcon(symbol)} alt={symbol} size="sm" />
      <div className="font-mono text-sm text-card-foreground">{formattedAmount}</div>
    </div>
  );
});

TokenSupplyDisplay.displayName = "TokenSupplyDisplay";

// Enhanced formatted supply component with comprehensive optimizations
const FormattedSupply = memo<{
  metadata: DialogTokenMetadata;
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

FormattedSupply.displayName = "FormattedSupply";

// Enhanced main dialog component with shared components
export const TokenDialog = memo<TokenDialogProps>(
  ({ isOpen, onClose, metadata, supply, susdePrice, suppliesData = {} }) => {
    const copyHandler = createCopyHandler();
    const { t } = useTranslation(["stables", "common"]);

    // Memoized symbol parts for better performance
    const symbolParts = useMemo(() => metadata.symbol.split(" / "), [metadata.symbol]);

    // Use passed supply data instead of fetching separately
    const fullSupplyData = useMemo(() => {
      return suppliesData;
    }, [suppliesData]);

    // Memoized formatted addresses
    const formattedAddresses = useMemo(
      () => (
        <StablecoinsAddressDisplay
          metadata={metadata}
          symbolParts={symbolParts}
          onCopy={copyHandler}
          t={t}
        />
      ),
      [metadata, symbolParts, copyHandler, t]
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

    const headerContent = useMemo(
      () => (
        <TokenHeader
          symbol={metadata.symbol}
          name={metadata.name}
          logoUrl={metadata.logoUrl || (metadata.thumbnail as string)}
          description={metadata.description}
        />
      ),
      [metadata]
    );

    return (
      <BaseDialog
        isOpen={isOpen}
        onClose={onClose}
        title={headerContent}
        size="md"
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
                value={formattedAddresses}
              />
              {metadata.type && (
                <DialogInfoRow
                  label={`${t("common:labels.type", "Type")}:`}
                  value={metadata.type}
                />
              )}
            </div>
          </DialogSection>
        </div>
      </BaseDialog>
    );
  }
);

TokenDialog.displayName = "TokenDialog";

export type { DialogTokenMetadata as TokenMetadata };
