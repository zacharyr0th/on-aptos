"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StickyPortfolioHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  sidebarView?: "assets" | "nfts";
  onSidebarViewChange?: (view: "assets" | "nfts") => void;
  portfolioMetrics?: {
    totalPortfolioValue?: number;
    totalAssets?: number;
    totalNFTs?: number;
    totalDeFiValue?: number;
  };
}

const portfolioTabs = ["portfolio", "transactions", "yield"];

export function StickyPortfolioHeader({ activeTab, onTabChange }: StickyPortfolioHeaderProps) {
  const currentIndex = portfolioTabs.indexOf(activeTab);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < portfolioTabs.length - 1;

  const goToPrevious = () => {
    if (canGoPrevious) {
      onTabChange(portfolioTabs[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      onTabChange(portfolioTabs[currentIndex + 1]);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={goToPrevious}
        disabled={!canGoPrevious}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        {portfolioTabs.map((tab, index) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange(tab)}
            className={cn("h-8 w-8 p-0 capitalize", activeTab === tab && "pointer-events-none")}
          >
            {index + 1}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={goToNext}
        disabled={!canGoNext}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
