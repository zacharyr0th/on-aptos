'use client';

import { GeistMono } from 'geist/font/mono';
import { trpc } from '@/lib/trpc/client';
import Image from 'next/image';

export const AptPriceDisplay = () => {
  // Use tRPC to fetch APT price
  const { data: aptPriceData } =
    trpc.domains.marketData.prices.getCMCPrice.useQuery(
      { symbol: 'apt' },
      {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 60 * 1000, // Auto-refetch every minute
        refetchIntervalInBackground: true,
        retry: 3,
      }
    );

  const price = aptPriceData?.data?.price;

  return (
    <div className="hidden sm:flex flex-col items-center gap-1">
      <Image
        src="/icons/apt.png"
        alt="APT"
        width={24}
        height={24}
        className="w-6 h-6 dark:invert"
      />
      <div className={`text-sm text-center ${GeistMono.className}`}>
        {price ? (
          <span className="font-medium">${price.toFixed(2)}</span>
        ) : (
          <span className="text-muted-foreground text-xs">Loading...</span>
        )}
      </div>
    </div>
  );
};
