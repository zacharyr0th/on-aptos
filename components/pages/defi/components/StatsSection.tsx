"use client";

import { TrendingUp, Building2, Coins } from "lucide-react";
import Image from "next/image";
import React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDefiMetrics } from "@/hooks/useDefiMetrics";
import { usePageTranslation } from "@/hooks/useTranslation";
import { formatCurrency } from "@/lib/utils";

interface StatsSectionProps {
  protocolCount: number;
  filteredCount: number;
  totalCount: number;
  selectedCategory: string;
  selectedSubcategory?: string;
}

export function StatsSection({ protocolCount }: StatsSectionProps) {
  const { t } = usePageTranslation("defi");
  const {
    metrics: defiMetrics,
    isLoading,
    error,
    isOffline,
    isEmpty,
  } = useDefiMetrics();

  // Use live data with fallbacks
  const tvl = defiMetrics?.tvl ?? 0;
  const tvlChange24h = defiMetrics?.tvlChange24h ?? undefined;
  const spotVolume = defiMetrics?.spotVolume ?? 0;
  const volumeChange24h = defiMetrics?.volumeChange24h ?? undefined;
  const totalFees24h = defiMetrics?.fees?.total24h ?? 0;
  const feesChange24h = defiMetrics?.fees?.change24h ?? undefined;

  // Enhanced number formatting function for proper B/M/K display
  const formatNumberClean = (value: number) => {
    if (value === 0) return "$0";

    // Use formatCurrency with compact notation - this handles 1.2B formatting
    const formatted = formatCurrency(value, "USD", {
      compact: true,
      decimals: 1, // Ensure we show 1 decimal place for compact notation
    });

    // Remove .0 from whole numbers (like 1.0B -> 1B)
    return formatted.replace(/\.0([KMBT])/, "$1");
  };

  // Helper to determine if we have live data
  const hasLiveData = defiMetrics && !error;
  const hasTvlData = hasLiveData && tvl > 0;
  const hasVolumeData = hasLiveData && spotVolume > 0;
  const hasFeesData = hasLiveData && totalFees24h > 0;

  // Show friendly error state when data is unavailable
  const showErrorState = error && !isLoading;
  const showOfflineState = isOffline && !isLoading;
  const showEmptyState = isEmpty && !isLoading;

  return (
    <div className="mb-8">
      {/* Error State Banner */}
      {showErrorState && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {showOfflineState
                  ? "DeFi data temporarily unavailable"
                  : "Data loading issue"}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                {showOfflineState
                  ? "We're having trouble connecting to our data provider. Please check your connection and try again."
                  : error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Metrics Row - Optimized for mobile and desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6">
        {/* TVL Card */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative flex flex-col bg-card border rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help min-h-[100px] md:min-h-[120px] group">
              <div className="mb-3">
                <h2 className="text-sm md:text-base font-semibold text-card-foreground">
                  Total Value Locked
                </h2>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-lg md:text-2xl font-bold text-card-foreground font-mono mb-1">
                  {isLoading ? (
                    <span className="animate-pulse bg-muted rounded w-16 md:w-20 h-6 md:h-8 inline-block"></span>
                  ) : showErrorState ? (
                    <span className="text-muted-foreground">--</span>
                  ) : (
                    formatNumberClean(tvl)
                  )}
                </p>
                {!isLoading && tvlChange24h !== undefined && (
                  <p
                    className={`text-xs font-medium ${tvlChange24h > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {tvlChange24h > 0 ? "+" : ""}
                    {tvlChange24h.toFixed(2)}% (1d)
                  </p>
                )}
              </div>
              <div className="absolute bottom-2 right-2">
                <Image
                  src="/icons/dl.png"
                  alt="DeFiLlama"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Total value of all assets locked in DeFi protocols across the
              Aptos ecosystem
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Volume Card */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative flex flex-col bg-card border rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help min-h-[100px] md:min-h-[120px] group">
              <div className="mb-3">
                <h2 className="text-sm md:text-base font-semibold text-card-foreground">
                  24h Volume
                </h2>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-lg md:text-2xl font-bold text-card-foreground font-mono mb-1">
                  {isLoading ? (
                    <span className="animate-pulse bg-muted rounded w-16 md:w-20 h-6 md:h-8 inline-block"></span>
                  ) : showErrorState ? (
                    <span className="text-muted-foreground">--</span>
                  ) : (
                    formatNumberClean(spotVolume)
                  )}
                </p>
                {!isLoading && volumeChange24h !== undefined && (
                  <p
                    className={`text-xs font-medium ${volumeChange24h > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {volumeChange24h > 0 ? "+" : ""}
                    {volumeChange24h.toFixed(2)}% (1d)
                  </p>
                )}
              </div>
              <div className="absolute bottom-2 right-2">
                <Image
                  src="/icons/dl.png"
                  alt="DeFiLlama"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Total trading volume across all DeFi protocols in the last 24
              hours
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Fees Card */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative flex flex-col bg-card border rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help min-h-[100px] md:min-h-[120px] group">
              <div className="mb-3">
                <h2 className="text-sm md:text-base font-semibold text-card-foreground">
                  24h Fees
                </h2>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-lg md:text-2xl font-bold text-card-foreground font-mono mb-1">
                  {isLoading ? (
                    <span className="animate-pulse bg-muted rounded w-16 md:w-20 h-6 md:h-8 inline-block"></span>
                  ) : showErrorState ? (
                    <span className="text-muted-foreground">--</span>
                  ) : (
                    formatNumberClean(totalFees24h)
                  )}
                </p>
                {!isLoading && feesChange24h !== undefined && (
                  <p
                    className={`text-xs font-medium ${feesChange24h > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {feesChange24h > 0 ? "+" : ""}
                    {feesChange24h.toFixed(2)}% (1d)
                  </p>
                )}
              </div>
              <div className="absolute bottom-2 right-2">
                <Image
                  src="/icons/dl.png"
                  alt="DeFiLlama"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Total fees generated by all DeFi protocols in the last 24 hours
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Protocol Count Card */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col bg-card border rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-help min-h-[100px] md:min-h-[120px] group">
              <div className="mb-3">
                <h2 className="text-sm md:text-base font-semibold text-card-foreground">
                  Active Protocols
                </h2>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-lg md:text-2xl font-bold text-card-foreground font-mono mb-1">
                  {Math.floor(protocolCount).toString()}
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Number of active DeFi protocols currently tracked on Aptos
              blockchain
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
