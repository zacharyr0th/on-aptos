"use client";

import React, { useMemo } from "react";

import { getProtocolLogo } from "@/app/portfolio/_components/shared/PortfolioMetrics";
import { DeFiPositionsTable } from "@/app/portfolio/_components/tables/PortfolioTables";
import {
  usePortfolioContext,
  useSelection,
  useFilters,
} from "@/app/portfolio/_providers";

export function DeFiPositions() {
  const { defiPositions, defiLoading } = usePortfolioContext();
  const { selectedDeFiPosition, setSelectedDeFiPosition } = useSelection();
  const { defiSortBy, defiSortOrder, setDeFiSort } = useFilters();

  const groupedDeFiPositions = useMemo(() => {
    if (!defiPositions || !Array.isArray(defiPositions)) return [];

    const grouped = defiPositions.reduce(
      (acc, position) => {
        const protocol = position.protocol;
        if (!acc[protocol]) {
          acc[protocol] = {
            protocol,
            positions: [],
            totalValue: 0,
            protocolTypes: new Set(),
          };
        }
        acc[protocol].positions.push(position);
        acc[protocol].totalValue +=
          position.totalValueUSD ||
          position.totalValue ||
          position.tvl_usd ||
          0;
        const protocolType = position.protocolType || position.protocol_type;
        if (protocolType) {
          acc[protocol].protocolTypes.add(protocolType);
        }
        return acc;
      },
      {} as Record<
        string,
        {
          protocol: string;
          positions: typeof defiPositions;
          totalValue: number;
          protocolTypes: Set<string>;
        }
      >,
    );

    return Object.values(grouped);
  }, [defiPositions]);

  if (!groupedDeFiPositions || groupedDeFiPositions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        DeFi Positions ({groupedDeFiPositions.length})
      </h3>

      <DeFiPositionsTable
        groupedDeFiPositions={groupedDeFiPositions}
        defiPositionsLoading={defiLoading}
        selectedItem={selectedDeFiPosition}
        defiSortBy={defiSortBy}
        defiSortOrder={defiSortOrder}
        getProtocolLogo={getProtocolLogo}
        onItemSelect={setSelectedDeFiPosition}
        onSortChange={(sortBy: string, order: "asc" | "desc") => {
          setDeFiSort(sortBy as "value" | "protocol" | "type", order);
        }}
      />
    </div>
  );
}
