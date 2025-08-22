import Image from "next/image";
"use client";

import { RefreshCw } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format/format";

interface PriceData {
  timestamp: string;
  price: number;
  formatted_time?: string;
}

interface APTChartProps {
  selectedAsset?: unknown;
}

export function APTChart({ selectedAsset }: APTChartProps) {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ setLastUpdated] = useState<Date | null>(null);
  const [timeframe, setTimeframe] = useState<
    "hour" | "day" | "week" | "month" | "year"
  >("day");

  // Determine which token to display
  const tokenAddress =
    selectedAsset?.asset_type ||
    selectedAsset?.address ||
    selectedAsset?.token_address ||
    "0x1::aptos_coin::AptosCoin";
  const tokenSymbol = selectedAsset?.symbol || "APT";
  const tokenLogo =
    selectedAsset?.logoUrl || selectedAsset?.iconUri || "/icons/apt.png";

  const fetchAPTData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      // Fetch REAL token price data directly from Panora API
      const [currentResponse, historyResponse] = await Promise.all{)
        fetch(
          `https://api.panora.exchange/prices?tokenAddress=${encodeURIComponent(tokenAddress)}`,
          {
            headers: {
              "x-api-key":
                "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
            },
          },
        ),
        fetch(
          `/api/prices/history?address=${encodeURIComponent(tokenAddress)}&lookback=${timeframe}&downsample_to=48`,
        ),
      ]);

      if (!currentResponse.ok || !historyResponse.ok) {
        throw new Error("Failed to fetch real APT data from blockchain");
      }

      const currentData = await currentResponse.json();
      const historyData = await historyResponse.json();

      // Set current REAL price from Panora API
      if (Array.isArray(currentData) && currentData.length > 0) {
        const price = parseFloat(currentData[0].usdPrice);
        if (!isNaN(price) && price > 0) {
          setCurrentPrice(price);
          setLastUpdated(new Date());
        }
      }

      // Process REAL historical data for chart - NO MOCK DATA
      if (
        historyData.data &&
        Array.isArray(historyData.data) &&
        historyData.data.length > 0
      ) {
        // First sort by timestamp to get chronological order
        const sortedData = historyData.data
          .filter(
            (item: Record<string, unknown>) =>
              item.price_usd && parseFloat(item.price_usd) > 0,
          )
          .sort((a: unknown, b: unknown) => {
            const timeA = new Date(a.timestamp).getTime() || 0;
            const timeB = new Date(b.timestamp).getTime() || 0;
            return timeA - timeB;
          });

        const processedData = sortedData.map(
          (item: Record<string, unknown>) => {
            const date = new Date(item.timestamp);
            let formatted_time: string;

            // Format time based on timeframe
            if (timeframe === "hour") {
              formatted_time = date.toLocaleTimeString(("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
            } else if (timeframe === "day") {
              formatted_time = date.toLocaleTimeString(("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
            } else if (timeframe === "week") {
              formatted_time = date.toLocaleDateString(("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                hour12: false,
              });
            } else {
              formatted_time = date.toLocaleDateString(("en-US", {
                month: "short",
                day: "numeric",
              });
            }

            return {
              timestamp: item.timestamp,
              price: parseFloat(item.price_usd),
              formatted_time,
            };
          },
        );

        setPriceHistory(processedData);

        // Calculate REAL price change from actual data
        if (processedData.length > 1) {
          const firstPrice = processedData[0].price;
          const lastPrice = processedData[processedData.length - 1].price;
          const change = ((lastPrice - firstPrice) / firstPrice) * 100;
          setPriceChange(change);
        }
      }
    } catch (error) {
      logger.error(
        `Failed to fetch real ${tokenSymbol} data from blockchain: ${error}`,
      );
      // Don't set any mock data on error - just leave it empty
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tokenAddress, timeframe, tokenSymbol]);

  useEffect(() => {
    fetchAPTData();
    // Refresh every 30 seconds with REAL data
    const interval = setInterval(() => fetchAPTData(), 30000);
    return () => clearInterval(interval);
  }, [fetchAPTData]); // Re-fetch when selected asset or timeframe changes

  return (
    <div className="h-full flex flex-col">
      {/* Timeframe selector */}
      <div className="flex items-center gap-1 mb-3">
        {(["hour", "day", "week", "month", "year"] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              timeframe === tf
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground",
            )}
          >
            {tf === "hour"
              ? "1H"
              : tf === "day"
                ? "24H"
                : tf === "week"
                  ? "7D"
                  : tf === "month"
                    ? "1M"
                    : "1Y"}
          </button>
        ))}
      </div>

      {/* Header with logo left and price right */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            {tokenLogo.startsWith("/") ? (
              <Image
                src={tokenLogo}
                alt={tokenSymbol}
                width={32}
                height={32}
                className={`rounded-full ${tokenSymbol === "APT" ? "dark:invert" : ""}`}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tokenLogo}
                alt={tokenSymbol}
                width={32}
                height={32}
                className="rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/icons/apt.png";
                }}
              />
            )}
          </div>
          <h4 className="font-semibold text-lg text-foreground">
            {tokenSymbol}
          </h4>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-7 bg-muted rounded w-20"></div>
            </div>
          ) : currentPrice > 0 ? (
            <>
              <span className="text-xl font-bold font-mono text-foreground">
                {formatCurrency(currentPrice)}
              </span>
              {priceChange !== 0 && (
                <span
                  className={cn(
                    "text-sm font-medium font-mono",
                    priceChange > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {priceChange > 0 ? "+" : ""}
                  {priceChange.toFixed(2)}%
                </span>
              )}
            </>
          ) : null}

          <button
            onClick={() => fetchAPTData(true)}
            disabled={refreshing}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[200px]">
        {loading ? (
          <div className="animate-pulse h-full bg-muted rounded-lg"></div>
        ) : priceHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={priceHistory}
              margin={{ top: 20, right: 20, left: 50, bottom: 40 }}
            >
              <defs>
                <linearGradient id="colorPriceAPT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="hsl(var(--muted-foreground))"
                opacity={0.2}
              />
              <XAxis
                dataKey="formatted_time"
                tick={{ fontSize: 11, fill: "#64748b" }}
                className="dark:[&_text]:fill-slate-300"
                stroke="#64748b"
                axisLine={{ stroke: "#64748b", strokeWidth: 1 }}
                tickLine={{ stroke: "#64748b", strokeWidth: 1 }}
                interval={Math.max(Math.floor(priceHistory.length / 4), 1)}
                height={30}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                className="dark:[&_text]:fill-slate-300"
                stroke="#64748b"
                domain={["dataMin - 5%", "dataMax + 5%"]}
                tickFormatter={(value) => {
                  if (value >= 1) return `$${value.toFixed(2)}`;
                  if (value >= 0.01) return `$${value.toFixed(4)}`;
                  return `$${value.toFixed(8)}`;
                }}
                axisLine={{ stroke: "#64748b", strokeWidth: 1 }}
                tickLine={{ stroke: "#64748b", strokeWidth: 1 }}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{
                  color: "hsl(var(--foreground))",
                  fontWeight: "500",
                }}
                formatter={(value: unknown) => [
                  `$${Number(value).toFixed(4)}`,
                  "Price",
                ]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorPriceAPT)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
