"use client";

import { ExternalLink } from "lucide-react";
import type React from "react";

import type { Market } from "@/components/pages/markets/btc/types";
import {
  BaseDialog,
  DialogInfoRow,
  DialogSection,
  formatPercentage,
  type MarketData,
  type YieldDialogProps as SharedYieldDialogProps,
  TokenIcon,
} from "@/components/shared/dialogs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PROTOCOL_ICONS } from "@/lib/config/protocols/echo";
import { type PROTOCOL_COLORS, UI_COLORS, YIELD_COLORS } from "@/lib/constants/ui/colors";
import { cn, formatAmount, formatCurrency } from "@/lib/utils";

interface YieldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market | null;
  protocol: string;
}

export const YieldDialog: React.FC<YieldDialogProps> = ({ isOpen, onClose, market, protocol }) => {
  if (!market) return null;

  // Get protocol color and icon
  const protocolKey = protocol.toLowerCase() as keyof typeof PROTOCOL_COLORS;
  const protocolIcon = PROTOCOL_ICONS[protocolKey.toLowerCase() as keyof typeof PROTOCOL_ICONS];

  // Determine if this is Echo protocol
  const isEcho = protocol === "Echo";

  // Header content
  const headerContent = (
    <div className="flex items-center gap-3">
      {protocolIcon && <TokenIcon src={protocolIcon} alt={protocol} size="md" />}
      <div>
        <h2 className="text-xl font-semibold">{market.symbol} Market Details</h2>
        <p className={cn("text-sm", UI_COLORS.lowEmphasis)}>
          From {market.description} on {protocol}
        </p>
      </div>
    </div>
  );

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={onClose}
      title={headerContent}
      size="lg"
      showErrorBoundary={true}
    >
      <div className="space-y-6">
        {/* Basic Market Information */}
        <DialogSection title="Market Information">
          <div className="grid grid-cols-2 gap-4">
            <DialogInfoRow
              label="Protocol"
              value={
                <div className="flex items-center gap-1.5">
                  {protocolIcon && <TokenIcon src={protocolIcon} alt={protocol} size="sm" />}
                  <span className="font-medium">{protocol}</span>
                </div>
              }
            />
            <DialogInfoRow
              label="Asset"
              value={<span className="font-medium">{market.symbol}</span>}
            />
            <DialogInfoRow
              label="Current Balance"
              value={
                <span className="font-mono">{formatAmount(parseFloat(market.balance), "BTC")}</span>
              }
            />
            <DialogInfoRow
              label="Price"
              value={
                <span className="font-mono">
                  {market.price ? formatCurrency(market.price, "USD") : "N/A"}
                </span>
              }
            />
          </div>
        </DialogSection>

        <Separator />

        <DialogSection title={isEcho ? "Yield Rates" : "Lending Rates"}>
          {isEcho ? (
            <div className="p-4 rounded-md bg-muted/50">
              <div className="mb-3">
                <p className={cn("text-sm mb-1 font-medium", UI_COLORS.highEmphasis)}>
                  Incentivized Deposit Yield
                </p>
                <p className="text-sm text-muted-foreground">
                  Echo currently offers incentivized yields for deposits only, with no traditional
                  lending or borrowing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center rounded-md px-2 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: `${YIELD_COLORS.rewardAPR}15`,
                    color: YIELD_COLORS.rewardAPR,
                  }}
                >
                  {formatPercentage((market.apyReward || 0) * 100)} APY
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-md bg-muted/50">
                <DialogInfoRow
                  label="Supply APY"
                  value={
                    <span className="font-medium" style={{ color: YIELD_COLORS.supplyAPR }}>
                      {formatPercentage((market.apyBase || 0) * 100)}
                    </span>
                  }
                />
              </div>
              <div className="p-3 rounded-md bg-muted/50">
                <DialogInfoRow
                  label="Reward APY"
                  value={
                    <span className="font-medium" style={{ color: YIELD_COLORS.rewardAPR }}>
                      {formatPercentage((market.apyReward || 0) * 100)}
                    </span>
                  }
                />
              </div>
              <div className="p-3 rounded-md bg-muted/50">
                <DialogInfoRow
                  label="Borrow APY"
                  value={
                    <span className="font-medium" style={{ color: YIELD_COLORS.borrowAPR }}>
                      {formatPercentage((market.apyBaseBorrow || 0) * 100)}
                    </span>
                  }
                />
              </div>
              <div className="p-3 rounded-md bg-muted/50">
                <DialogInfoRow
                  label="Total APY"
                  value={
                    <span className="font-medium" style={{ color: YIELD_COLORS.totalAPR }}>
                      {formatPercentage(((market.apyBase || 0) + (market.apyReward || 0)) * 100)}
                    </span>
                  }
                />
              </div>
            </div>
          )}
        </DialogSection>

        <Separator />

        <DialogSection title="Market Stats">
          <div className="grid grid-cols-2 gap-4">
            <DialogInfoRow
              label="Total Supply"
              value={
                <div className="space-y-1">
                  <p className="font-mono">
                    {market.totalSupply ? formatAmount(market.totalSupply, "BTC") : "N/A"}
                  </p>
                  <p className={cn("text-xs", UI_COLORS.lowEmphasis)}>
                    {market.totalSupplyUsd ? formatCurrency(market.totalSupplyUsd, "USD") : "N/A"}
                  </p>
                </div>
              }
            />

            {!isEcho && (
              <DialogInfoRow
                label="Total Borrow"
                value={
                  <div className="space-y-1">
                    <p className="font-mono">
                      {market.totalBorrow ? formatAmount(market.totalBorrow, "BTC") : "N/A"}
                    </p>
                    <p className={cn("text-xs", UI_COLORS.lowEmphasis)}>
                      {market.totalBorrowUsd ? formatCurrency(market.totalBorrowUsd, "USD") : "N/A"}
                    </p>
                  </div>
                }
              />
            )}

            <DialogInfoRow
              label="TVL"
              value={
                <div className="space-y-1">
                  <p className="font-mono">
                    {formatAmount((market.totalSupply || 0) - (market.totalBorrow || 0), "BTC")}
                  </p>
                  <p className={cn("text-xs", UI_COLORS.lowEmphasis)}>
                    {market.tvlUsd ? formatCurrency(market.tvlUsd, "USD") : "N/A"}
                  </p>
                </div>
              }
            />
          </div>
        </DialogSection>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button size="sm" variant="outline" asChild>
            <a
              href={
                isEcho
                  ? "https://www.echoex.app"
                  : "https://app.echelon.market/markets?network=aptos_mainnet"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <span>Visit {protocol}</span>
              <ExternalLink size={14} />
            </a>
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};

export default YieldDialog;
