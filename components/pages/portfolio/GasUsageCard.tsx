"use client";

import { Fuel, DollarSign } from "lucide-react";
import React, { useState, useEffect, useMemo, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatTokenAmount } from "@/lib/utils/format";
import { errorLogger } from "@/lib/utils/core/logger";

interface GasUsageData {
  total_gas_used_octas: number;
  total_gas_used_usd: number;
}

interface GasUsageCardProps {
  walletAddress: string;
  timeframe?: "7d" | "30d" | "90d";
}

export function GasUsageCard({
  walletAddress,
  timeframe = "30d",
}: GasUsageCardProps) {
  const [gasData, setGasData] = useState<GasUsageData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  const timeframeOptions = useMemo(
    () => [
      { value: "7d", label: "7D", days: 7 },
      { value: "30d", label: "30D", days: 30 },
      { value: "90d", label: "90D", days: 90 },
    ],
    [],
  );

  const fetchGasUsage = useCallback(
    async (days: number) => {
      if (!walletAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/analytics/gas-usage?address=${walletAddress}&days=${days}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch gas usage: ${response.status}`);
        }

        const result = await response.json();
        setGasData(result.data || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        errorLogger.error("Gas usage fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [walletAddress],
  );

  useEffect(() => {
    const selectedOption = timeframeOptions.find(
      (opt) => opt.value === selectedTimeframe,
    );
    if (selectedOption) {
      fetchGasUsage(selectedOption.days);
    }
  }, [walletAddress, selectedTimeframe, fetchGasUsage, timeframeOptions]);

  // Calculate metrics
  const totalGasSpent =
    gasData?.reduce((sum, usage) => sum + (usage.total_gas_used_usd || 0), 0) ||
    0;
  const totalGasOctas =
    gasData?.reduce(
      (sum, usage) => sum + (usage.total_gas_used_octas || 0),
      0,
    ) || 0;
  const totalGasAPT = totalGasOctas / 100000000; // Convert octas to APT

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Gas Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Unable to load gas usage data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Gas Usage
          </CardTitle>
          <div className="flex items-center gap-1">
            {timeframeOptions.map((option) => (
              <Button
                key={option.value}
                variant={
                  selectedTimeframe === option.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedTimeframe(option.value as any)}
                className="h-6 px-2 text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">
              Loading gas usage...
            </p>
          </div>
        ) : gasData && gasData.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Total Spent
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(totalGasSpent)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTokenAmount(totalGasAPT)} APT
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Fuel className="h-3 w-3" />
                  Transactions
                </p>
                <p className="text-lg font-bold">{gasData.length}</p>
                <p className="text-xs text-muted-foreground">gas events</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Fuel className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No gas usage data for this period
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
