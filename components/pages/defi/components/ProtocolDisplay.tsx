import React from "react";

import { Button } from "@/components/ui/button";
import { useResponsive } from "@/hooks/useResponsive";
import { usePageTranslation } from "@/hooks/useTranslation";

import { defiProtocols } from "../data";

import { VirtualizedProtocolTable } from "./VirtualizedProtocolTable";

interface ProtocolDisplayProps {
  filteredProtocols: typeof defiProtocols;
  onClearFilters: () => void;
}

export const ProtocolDisplay = React.memo(function ProtocolDisplay({
  filteredProtocols,
  onClearFilters,
}: ProtocolDisplayProps) {
  const { isMobile } = useResponsive();
  const { t } = usePageTranslation("defi");

  if (filteredProtocols.length === 0) {
    return (
      <div className="text-center py-8 md:py-12 px-4">
        <p className="text-muted-foreground mb-4 text-sm md:text-base">
          {t(
            "defi:search.no_results",
            "No protocols found matching your criteria.",
          )}
        </p>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={onClearFilters}
          className="shadow-sm"
        >
          {t("common:actions.clear_filters", "Clear Filters")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <VirtualizedProtocolTable filteredProtocols={filteredProtocols} />

      {/* DISABLED - ProtocolDialog component removed */}
      {/* <ProtocolDialog
        protocol={selectedProtocol}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
      /> */}
    </>
  );
});
