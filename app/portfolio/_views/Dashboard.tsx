"use client";

import { Search, X } from "lucide-react";
import React, { useEffect } from "react";

import { useSelection } from "@/app/portfolio/_providers";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

// Temporary placeholder for DashboardView
function DashboardView() {
  return <div>Dashboard content will be implemented here</div>;
}

interface DashboardProps {
  isManualMode: boolean;
  manualAddress: string;
  addressError: string;
  onManualAddressChange: (address: string) => void;
  onManualAddressSubmit: () => void;
  onClearManualMode: () => void;
  connected: boolean;
}

export function Dashboard({
  isManualMode,
  manualAddress,
  addressError,
  onManualAddressChange,
  onManualAddressSubmit,
  onClearManualMode,
  connected,
}: DashboardProps) {
  const { t } = useTranslation("common");
  const { clearAllSelections } = useSelection();

  // Handle click outside to deselect items
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't deselect if clicking on interactive elements
      if (
        target.closest(".asset-table-container") ||
        target.closest(".defi-table-container") ||
        target.closest(".nft-grid-container") ||
        target.closest(".dropdown-menu") ||
        target.closest("button") ||
        target.closest(".performance-content") ||
        target.closest('[role="tabpanel"]')
      ) {
        return;
      }

      clearAllSelections();
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [clearAllSelections]);

  return (
    <div className="w-full">
      {/* Address Input Bar */}
      <div className="mb-6 px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20">
        <div className="flex items-center gap-2">
          {!connected && (
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t(
                    "wallet.enter_address",
                    "Enter wallet address",
                  )}
                  value={manualAddress}
                  onChange={(e) => onManualAddressChange(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && onManualAddressSubmit()
                  }
                  className={cn(
                    "pr-24 font-mono text-sm",
                    addressError && "border-red-500 focus:ring-red-500",
                  )}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {manualAddress && (
                    <button
                      onClick={() => onManualAddressChange("")}
                      className="p-1 rounded hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={onManualAddressSubmit}
                    className="px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                  >
                    <Search className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {addressError && (
                <p className="text-xs text-red-500 mt-1">{addressError}</p>
              )}
            </div>
          )}

          {isManualMode && (
            <button
              onClick={onClearManualMode}
              className="px-3 py-1.5 text-xs rounded bg-muted hover:bg-muted/80"
            >
              {t("wallet.clear_manual", "Clear Manual Address")}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <DashboardView />
    </div>
  );
}
