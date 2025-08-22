import { Wallet, Loader2, PieChart as PieChartIcon } from "lucide-react";
import React, { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatTokenAmount } from "@/lib/utils/format/format";

import {
  PieChart,
  calculateAssetAllocation,
  MINIMAL_CHART_COLORS,
} from "../shared/ChartUtils";
import { LoadingSkeleton } from "../shared/LoadingSkeletons";
import { usePortfolioMetrics } from "../shared/PortfolioMetrics";
import type { FungibleAsset, DeFiPosition } from "../shared/PortfolioMetrics";

interface WalletSummaryProps {
  walletAddress: string | undefined;
  assets?: FungibleAsset[];
  defiPositions?: DeFiPosition[];
  totalValue?: number;
  className?: string;
  isLoading?: boolean;
  selectedNFT?: unknown;
  selectedDeFiPosition?: unknown;
  selectedAsset?: FungibleAsset | null;
  onAssetSelect?: (asset: FungibleAsset | null) => void;
  pieChartData?: Array<{
    symbol: string;
    value: number;
    percentage: number;
  }>;
  pieChartColors?: string[];
  nfts?: Array<Record<string, unknown>>;
  nftTotalValue?: number;
  filteredAssetsCount?: number;
  totalNFTCount?: number | null;
  aptPrice?: number;
}

export const WalletSummary: React.FC<WalletSummaryProps> = ({
  walletAddress,
  assets = [],
  defiPositions = [],
  totalValue = 0,
  className,
  isLoading = false,
  selectedAsset,
  onAssetSelect,
  nfts = [],
  nftTotalValue = 0,
  totalNFTCount,
}) => {
  // Use shared portfolio metrics calculation
  const portfolioMetrics = usePortfolioMetrics(
    assets,
    defiPositions,
    nfts,
    nftTotalValue,
  );

  // Calculate totals once and reuse
  const { calculatedTotalValue } = useMemo(() => {
    const tokenTotal = assets.reduce(
      (sum, asset) => sum + (asset.value || 0),
      0,
    );
    const defiTotal = (defiPositions || []).reduce(
      (sum, pos) => sum + (pos.totalValue || 0),
      0,
    );
    return {
      calculatedTotalValue: tokenTotal + defiTotal + nftTotalValue,
    };
  }, [assets, defiPositions, nftTotalValue]);

  // Use shared asset allocation calculation with minimal colors
  const allAssetsData = useMemo(
    () =>
      calculateAssetAllocation(
        assets,
        defiPositions,
        calculatedTotalValue,
        MINIMAL_CHART_COLORS, // Use minimal black-based colors
      ),
    [assets, defiPositions, calculatedTotalValue],
  );

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton variant="wallet-summary" className={className} />;
  }

  // No wallet connected state
  if (!walletAddress) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <CardTitle className="text-base sm:text-lg">
              Wallet Summary
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Connect your wallet to view summary
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Minimal Stats - Hidden on mobile */}
      <div className="hidden sm:grid grid-cols-3 gap-8 mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            Tokens
          </p>
          <p className="text-xl font-light font-mono">
            {portfolioMetrics.totalAssets}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            NFTs
          </p>
          <div className="text-xl font-light font-mono">
            {totalNFTCount !== null ? (
              totalNFTCount
            ) : portfolioMetrics.nftCount > 0 ? (
              `${portfolioMetrics.nftCount}+`
            ) : (
              <Loader2 className="h-5 w-5 animate-spin inline-block text-muted-foreground" />
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            <span className="hidden sm:inline">DeFi Positions</span>
            <span className="sm:hidden">DeFi</span>
          </p>
          <p className="text-xl font-light font-mono">
            {portfolioMetrics.defiCount}
          </p>
        </div>
      </div>

      {/* Divider - Hidden on mobile */}
      <div className="hidden sm:block border-b border-neutral-200 dark:border-neutral-800"></div>

      {/* Portfolio Chart - Simplified without legend */}
      <div className="h-72 relative overflow-visible mt-4">
        {selectedAsset ? (
          /* Token Details View */
          <div className="bg-card border rounded-lg p-6 h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-12 h-12 bg-neutral-50 dark:bg-neutral-950 rounded-lg overflow-hidden flex-shrink-0">
                <TokenImage
                  src={
                    (selectedAsset.metadata as { icon_uri?: string })?.icon_uri
                  }
                  alt={selectedAsset.metadata?.symbol || "Token"}
                  assetType={selectedAsset.asset_type}
                  metadata={selectedAsset.metadata}
                  fill
                  className="object-contain"
                  sizes="48px"
                  priority
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {selectedAsset.metadata?.symbol || "Unknown"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedAsset.metadata?.name || "Unknown Asset"}
                </p>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Balance
                  </p>
                  <p className="text-base font-medium mt-1 font-mono">
                    {formatTokenAmount(selectedAsset.balance || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Value
                  </p>
                  <p className="text-base font-medium mt-1 font-mono">
                    {formatCurrency(selectedAsset.value || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Price
                  </p>
                  <p className="text-base font-medium mt-1 font-mono">
                    {formatCurrency(selectedAsset.price || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Portfolio %
                  </p>
                  <p className="text-base font-medium mt-1 font-mono">
                    {calculatedTotalValue > 0
                      ? (
                          ((selectedAsset.value || 0) / calculatedTotalValue) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onAssetSelect && onAssetSelect(null)}
              className="text-sm text-primary hover:underline mt-4"
            >
              ← Back to portfolio overview
            </button>
          </div>
        ) : allAssetsData.length > 0 ? (
          <PieChart
            data={allAssetsData}
            colorScheme="minimal"
            animationDuration={600}
            centerContent={
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-2xl font-bold font-mono">
                  {formatCurrency(totalValue)}
                </div>
              </div>
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <PieChartIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No assets with value data
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Assets will appear here once price data is available
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
