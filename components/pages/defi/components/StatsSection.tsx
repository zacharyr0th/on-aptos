'use client';

import React from 'react';
import { DollarSign, TrendingUp, Building2, Coins, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { formatCurrency } from '@/lib/utils';
import { usePageTranslation } from '@/hooks/useTranslation';

interface StatsSectionProps {
  protocolCount: number;
  filteredCount: number;
  totalCount: number;
  selectedCategory: string;
  selectedSubcategory?: string;
}

export function StatsSection({ protocolCount }: StatsSectionProps) {
  const { t } = usePageTranslation('defi');

  // Fetch DeFi metrics from tRPC - this gets real-time data from DeFiLlama
  const {
    data: defiMetrics,
    isLoading,
    error,
  } = trpc.domains.marketData.defiMetrics.getAllMetrics.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for real-time data
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });

  // Use fetched data or fallback values
  const tvl = defiMetrics?.data?.tvl ?? 0;
  const spotVolume = defiMetrics?.data?.spotVolume ?? 0;
  const totalFees24h = defiMetrics?.data?.fees?.total24h ?? 0;

  // Enhanced number formatting function for proper B/M/K display
  const formatNumberClean = (value: number) => {
    if (value === 0) return '$0';

    // Use formatCurrency with compact notation - this handles 1.2B formatting
    const formatted = formatCurrency(value, 'USD', {
      compact: true,
      decimals: 1, // Ensure we show 1 decimal place for compact notation
    });

    // Remove .0 from whole numbers (like 1.0B -> 1B)
    return formatted.replace(/\.0([KMBT])/, '$1');
  };

  // Helper to determine if we have live data
  const hasLiveData = defiMetrics?.data && !error;
  const hasTvlData = hasLiveData && tvl > 0;
  const hasVolumeData = hasLiveData && spotVolume > 0;
  const hasFeesData = hasLiveData && totalFees24h > 0;

  return (
    <div className="space-y-4 md:space-y-6 mb-4 md:mb-6">
      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* TVL Card */}
        <div className="flex items-center bg-card border rounded-lg py-3 px-3 sm:px-4 shadow-sm">
          <div className="flex-grow min-w-0">
            <h2 className="text-sm md:text-lg font-medium text-card-foreground truncate">
              {t('defi:stats.total_value_locked')}
            </h2>
            <p className="text-lg md:text-2xl font-bold text-card-foreground">
              {isLoading ? (
                <span className="animate-pulse bg-muted rounded w-16 h-6 inline-block"></span>
              ) : (
                formatNumberClean(tvl)
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t('defi:stats.live_from_defillama')}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-secondary/50 flex-shrink-0">
            <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Volume Card */}
        <div className="flex items-center bg-card border rounded-lg py-3 px-3 sm:px-4 shadow-sm">
          <div className="flex-grow min-w-0">
            <h2 className="text-sm md:text-lg font-medium text-card-foreground truncate">
              {t('defi:stats.volume_24h')}
            </h2>
            <p className="text-lg md:text-2xl font-bold text-card-foreground">
              {isLoading ? (
                <span className="animate-pulse bg-muted rounded w-16 h-6 inline-block"></span>
              ) : (
                formatNumberClean(spotVolume)
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t('defi:stats.live_from_defillama')}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-secondary/50 flex-shrink-0">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Protocol Count Card */}
        <div className="flex items-center bg-card border rounded-lg py-3 px-3 sm:px-4 shadow-sm">
          <div className="flex-grow min-w-0">
            <h2 className="text-sm md:text-lg font-medium text-card-foreground truncate">
              {t('defi:stats.protocols')}
            </h2>
            <p className="text-lg md:text-2xl font-bold text-card-foreground">
              {Math.floor(protocolCount).toString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t('defi:stats.defi_protocols')}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-secondary/50 flex-shrink-0">
            <Building2 className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Fees Card */}
        <div className="flex items-center bg-card border rounded-lg py-3 px-3 sm:px-4 shadow-sm">
          <div className="flex-grow min-w-0">
            <h2 className="text-sm md:text-lg font-medium text-card-foreground truncate">
              {t('defi:stats.fees_24h')}
            </h2>
            <p className="text-lg md:text-2xl font-bold text-card-foreground">
              {isLoading ? (
                <span className="animate-pulse bg-muted rounded w-16 h-6 inline-block"></span>
              ) : (
                formatNumberClean(totalFees24h)
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t('defi:stats.protocol_fees')}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-secondary/50 flex-shrink-0">
            <Coins className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Stablecoin Volume Card - Coming Soon */}
        <div className="flex items-center bg-card border rounded-lg py-3 px-3 sm:px-4 shadow-sm">
          <div className="flex-grow min-w-0">
            <h2 className="text-sm md:text-lg font-medium text-card-foreground truncate">
              {t('defi:stats.stablecoin_volume')}
            </h2>
            <p className="text-lg md:text-2xl font-bold text-muted-foreground">
              {t('defi:stats.coming_soon')}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t('defi:stats.stablecoin_trading')}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-secondary/50 flex-shrink-0">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
