"use client";

import React, { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { DialogTitle } from "@/components/ui/dialog";
import { TokenIcon } from "./TokenIcon";
import { formatTokenName } from "./utils";

export interface TokenHeaderProps {
  symbol: string;
  name: string;
  logoUrl?: string;
  description?: string;
  badges?: string[];
  formatContext?: {
    protocol?: string;
    standards?: string;
    isBridged?: boolean;
    t?: (key: string, fallback?: string) => string;
  };
  className?: string;
}

/**
 * Standardized token header component for dialogs
 */
export const TokenHeader = memo<TokenHeaderProps>(
  ({ symbol, name, logoUrl, description, badges = [], formatContext, className = "" }) => {
    const formattedName = formatTokenName(name, formatContext);

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {logoUrl && <TokenIcon src={logoUrl} alt={`${symbol} logo`} size="lg" />}

        <div className="min-w-0 flex-1">
          <DialogTitle className="text-xl font-semibold">{formattedName}</DialogTitle>

          <div className="flex items-center gap-2 flex-wrap mt-1">
            <p className="text-sm text-muted-foreground">{symbol}</p>

            {badges.map((badge) => (
              <Badge key={badge} variant="outline" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>

          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
    );
  }
);

TokenHeader.displayName = "TokenHeader";
