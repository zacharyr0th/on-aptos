import { Eye, Search, X } from "lucide-react";
import React from "react";

import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface AddressBarProps {
  manualAddress: string;
  setManualAddress: (address: string) => void;
  isManualMode: boolean;
  normalizedAddress: string | undefined;
  addressError: string;
  onSubmit: () => void;
  onClear: () => void;
  connected: boolean;
}

export function AddressBar({
  manualAddress,
  setManualAddress,
  isManualMode,
  normalizedAddress,
  addressError,
  onSubmit,
  onClear,
  connected,
}: AddressBarProps) {
  const { t } = useTranslation("common");

  if (connected && !isManualMode) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex justify-center items-center gap-2 sm:gap-4">
        {!isManualMode && (
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("wallet.search_placeholder", "View any wallet address...")}
              value={manualAddress}
              onChange={(e) => {
                setManualAddress(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSubmit();
                }
              }}
              className={cn(
                "pl-10 pr-10 h-10 sm:h-11 transition-all text-sm",
                addressError && "border-destructive focus-visible:ring-destructive/50"
              )}
            />
            {manualAddress && (
              <button
                onClick={onClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors touch-target"
                aria-label="Clear address"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {addressError && (
              <p className="absolute -bottom-6 left-0 text-xs text-destructive px-1">
                {addressError}
              </p>
            )}
          </div>
        )}
        {isManualMode && (
          <div className="inline-flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-muted/50 rounded-full border border-border/50 max-w-full overflow-hidden">
            <Eye className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium font-mono truncate">
              {t("wallet.viewing_label", "Viewing")} {normalizedAddress?.slice(0, 6)}...
              {normalizedAddress?.slice(-4)}
            </span>
            <button
              onClick={onClear}
              className="ml-1 text-muted-foreground hover:text-foreground transition-colors touch-target flex-shrink-0"
              aria-label="Clear viewing mode"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
