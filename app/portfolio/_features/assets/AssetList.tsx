"use client";

import { Eye, EyeOff } from "lucide-react";
import React from "react";

import { AssetsTable } from "@/app/portfolio/_components/tables/PortfolioTables";
import {
  usePortfolioContext,
  useFilters,
  useSelection,
} from "@/app/portfolio/_providers";
import { Button } from "@/components/ui/button";

export function AssetList() {
  const { assets } = usePortfolioContext();
  const {
    hideFilteredAssets,
    setHideFilteredAssets,
    filterAssets,
    showOnlyVerified,
  } = useFilters();
  const { selectedAsset, setSelectedAsset } = useSelection();

  const visibleAssets = filterAssets(assets);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Tokens ({visibleAssets.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHideFilteredAssets(!hideFilteredAssets)}
          className="h-8 w-8 p-0 hover:bg-muted"
          title={
            hideFilteredAssets
              ? "Show all assets (including CELL tokens)"
              : "Hide low-value and CELL tokens"
          }
        >
          {hideFilteredAssets ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AssetsTable
        visibleAssets={visibleAssets}
        selectedItem={selectedAsset}
        showOnlyVerified={showOnlyVerified}
        portfolioAssets={assets}
        onItemSelect={setSelectedAsset}
      />
    </div>
  );
}
