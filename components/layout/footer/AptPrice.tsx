"use client";

import Image from "next/image";
import type React from "react";
import { memo, useEffect, useState } from "react";

import { useTranslation } from "@/lib/hooks/useTranslation";
import { dedupeFetch } from "@/lib/utils/cache/request-deduplication";

export const AptPrice = memo(function AptPrice() {
  const { t } = useTranslation("common");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const aptIconProps = {
    src: "/icons/apt.png",
    alt: "APT token",
    width: 16,
    height: 16,
    className: "w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0 rounded-full dark:invert",
    priority: false,
    quality: 90,
    unoptimized: false,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.target as HTMLImageElement;
      img.src = "/placeholder.jpg";
    },
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const currentResponse = await dedupeFetch(
          "/api/unified/prices?tokens=0x1::aptos_coin::AptosCoin"
        );
        if (!currentResponse.ok) {
          throw new Error("Failed to fetch current price");
        }
        const currentData = await currentResponse.json();

        if (currentData.prices && currentData.prices["0x1::aptos_coin::AptosCoin"]) {
          const latestPrice = currentData.prices["0x1::aptos_coin::AptosCoin"];
          setCurrentPrice(latestPrice);
          setError(null);
        } else {
          throw new Error("No price data available");
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading || error || currentPrice === null) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
        <Image
          {...aptIconProps}
          className={`${aptIconProps.className} opacity-50`}
          alt={aptIconProps.alt}
        />
        <span className="truncate">
          {loading
            ? t("messages.apt_price_loading", "Loading...")
            : t("messages.apt_price_unavailable", "Unavailable")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm">
      <Image {...aptIconProps} alt={aptIconProps.alt} />
      <span className="font-medium whitespace-nowrap text-muted-foreground">
        ${currentPrice.toFixed(2)}
      </span>
    </div>
  );
});
