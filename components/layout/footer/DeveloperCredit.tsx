"use client";

import React, { memo } from "react";

import { useTranslation } from "@/lib/hooks/useTranslation";
import { DEVELOPER_CONFIG } from "@/lib/config/app";

export const DeveloperCredit = memo(function DeveloperCredit() {
  const { t } = useTranslation("common");

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
      <span>
        Built by{" "}
        <a
          href="https://www.zacharyr0th.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:text-foreground/80 transition-colors"
        >
          {DEVELOPER_CONFIG.twitterHandle}
        </a>
      </span>
    </div>
  );
});
