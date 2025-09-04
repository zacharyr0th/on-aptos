"use client";

import { Clock } from "lucide-react";
import React, { memo, useState, useEffect, useMemo } from "react";

import { useTranslation } from "@/lib/hooks/useTranslation";

export const TimeDisplay = memo(function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { t } = useTranslation("common");

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedTime = useMemo(() => {
    if (!currentTime || !isClient) {
      return t("labels.loading_dots", "Loading...");
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(currentTime);
  }, [currentTime, isClient, t]);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
      <span className="font-mono" suppressHydrationWarning>
        {formattedTime}
      </span>
    </div>
  );
});
