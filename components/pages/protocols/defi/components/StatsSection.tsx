"use client";

import React from "react";

import { StatCard } from "@/components/ui/StatCard";

interface StatsSectionProps {
  protocolCount: number;
  filteredCount: number;
  totalCount: number;
  selectedCategory: string;
  selectedSubcategory?: string;
}

export function StatsSection({ protocolCount }: StatsSectionProps) {
  return (
    <div className="mb-8">
      {/* Primary Metrics Row - Using StatCard component */}
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:gap-6 mb-6">
        <StatCard
          title="Active Protocols"
          value={Math.floor(protocolCount).toString()}
          tooltip="Enterprise-grade DeFi protocols actively monitored across Aptos blockchain"
          isLoading={false}
          showError={false}
        />
      </div>
    </div>
  );
}
