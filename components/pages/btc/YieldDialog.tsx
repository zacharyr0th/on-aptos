"use client";

import { ExternalLink } from "lucide-react";
import Image from "next/image";
import React from "react";

import { Market } from "@/components/pages/btc/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PROTOCOL_ICONS } from "@/lib/config/protocols/echo";
import {
  YIELD_COLORS,
  PROTOCOL_COLORS,
  UI_COLORS,
} from "@/lib/constants/ui/colors";
import { cn } from "@/lib/utils";
import { formatCurrency, formatAmount } from "@/lib/utils";

interface YieldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market | null;
  protocol: string;
}

export const YieldDialog: React.FC<YieldDialogProps> = ({
  isOpen,
  onClose,
  market,
  protocol,
}) => {
  if (!market) return null;

  // Get protocol color
  const protocolKey = protocol.toLowerCase() as keyof typeof PROTOCOL_COLORS;
  const protocolIcon =
    PROTOCOL_ICONS[protocolKey.toLowerCase() as keyof typeof PROTOCOL_ICONS];

  // Determine if this is Echo protocol
  const isEcho = protocol === "Echo";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn("sm:max-w-md md:max-w-lg", UI_COLORS.dialogBackground)}
      >
        <DialogHeader>
          <DialogTitle>{market.symbol} Market Details</DialogTitle>
          <DialogDescription className={cn("text-xs", UI_COLORS.lowEmphasis)}>
            From {market.description} on {protocol}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <p className={UI_COLORS.lowEmphasis}>Protocol</p>
              <div className="flex items-center gap-1.5">
                {protocolIcon && (
                  <div className="relative w-4 h-4">
                    <Image
                      src={protocolIcon}
                      alt={protocol}
                      width={16}
                      height={16}
                      className="rounded-full object-contain"
                    />
                  </div>
                )}
                <p className="font-medium">{protocol}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className={UI_COLORS.lowEmphasis}>Asset</p>
              <p className="font-medium">{market.symbol}</p>
            </div>
            <div className="space-y-1">
              <p className={UI_COLORS.lowEmphasis}>Current Balance</p>
              <p className="font-mono">
                {formatAmount(parseFloat(market.balance), "BTC")}
              </p>
            </div>
            <div className="space-y-1">
              <p className={UI_COLORS.lowEmphasis}>Price</p>
              <p className="font-mono">
                {market.price ? formatCurrency(market.price, "USD") : "N/A"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-semibold">
              {isEcho ? "Yield Rates" : "Lending Rates"}
            </h4>
            {isEcho ? (
              <div className="p-4 rounded-md bg-muted/50">
                <div className="mb-3">
                  <p
                    className={cn(
                      "text-sm mb-1 font-medium",
                      UI_COLORS.highEmphasis,
                    )}
                  >
                    Incentivized Deposit Yield
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Echo currently offers incentivized yields for deposits only,
                    with no traditional lending or borrowing.
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
                    {`${((market.apyReward || 0) * 100).toFixed(2)}%`} APY
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-md bg-muted/50">
                  <p className={cn("text-xs mb-1", UI_COLORS.lowEmphasis)}>
                    Supply APY
                  </p>
                  <p
                    className="font-medium"
                    style={{ color: YIELD_COLORS.supplyAPR }}
                  >
                    {`${((market.apyBase || 0) * 100).toFixed(2)}%`}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/50">
                  <p className={cn("text-xs mb-1", UI_COLORS.lowEmphasis)}>
                    Reward APY
                  </p>
                  <p
                    className="font-medium"
                    style={{ color: YIELD_COLORS.rewardAPR }}
                  >
                    {`${((market.apyReward || 0) * 100).toFixed(2)}%`}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/50">
                  <p className={cn("text-xs mb-1", UI_COLORS.lowEmphasis)}>
                    Borrow APY
                  </p>
                  <p
                    className="font-medium"
                    style={{ color: YIELD_COLORS.borrowAPR }}
                  >
                    {`${((market.apyBaseBorrow || 0) * 100).toFixed(2)}%`}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-muted/50">
                  <p className={cn("text-xs mb-1", UI_COLORS.lowEmphasis)}>
                    Total APY
                  </p>
                  <p
                    className="font-medium"
                    style={{ color: YIELD_COLORS.totalAPR }}
                  >
                    {`${(((market.apyBase || 0) + (market.apyReward || 0)) * 100).toFixed(2)}%`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-semibold">Market Stats</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className={UI_COLORS.lowEmphasis}>Total Supply</p>
                <p className="font-mono">
                  {market.totalSupply
                    ? formatAmount(market.totalSupply, "BTC")
                    : "N/A"}
                </p>
                <p className={cn("text-xs", UI_COLORS.lowEmphasis)}>
                  {market.totalSupplyUsd
                    ? formatCurrency(market.totalSupplyUsd, "USD")
                    : "N/A"}
                </p>
              </div>
              {!isEcho && (
                <div className="space-y-1">
                  <p className={UI_COLORS.lowEmphasis}>Total Borrow</p>
                  <p className="font-mono">
                    {market.totalBorrow
                      ? formatAmount(market.totalBorrow, "BTC")
                      : "N/A"}
                  </p>
                  <p className={cn("text-xs", UI_COLORS.lowEmphasis)}>
                    {market.totalBorrowUsd
                      ? formatCurrency(market.totalBorrowUsd, "USD")
                      : "N/A"}
                  </p>
                </div>
              )}
              <div
                className={
                  isEcho ? "col-span-2 space-y-1" : "col-span-2 space-y-1"
                }
              >
                <p className={UI_COLORS.lowEmphasis}>TVL</p>
                <p className="font-mono">
                  {formatAmount(
                    (market.totalSupply || 0) - (market.totalBorrow || 0),
                    "BTC",
                  )}
                </p>
                <p className={cn("text-xs", UI_COLORS.lowEmphasis)}>
                  {market.tvlUsd ? formatCurrency(market.tvlUsd, "USD") : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
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
      </DialogContent>
    </Dialog>
  );
};

export default YieldDialog;
