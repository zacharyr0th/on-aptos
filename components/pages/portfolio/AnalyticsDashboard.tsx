"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Fuel,
  History,
  Gift,
  Percent,
  RefreshCw,
  Calendar,
} from "lucide-react";
import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// import { useAnalytics } from "./hooks/useAnalytics"; // TODO: Implement analytics hook
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatPercentage,
  formatTokenAmount,
} from "@/lib/utils/format";

interface AnalyticsDashboardProps {
  walletAddress: string;
  timeframe?: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function AnalyticsDashboard({
  walletAddress,
  timeframe = "7d",
}: AnalyticsDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  // TODO: Implement useAnalytics hook
  const {
    portfolioPerformance,
    balanceHistory,
    tokenLatestPrice,
    tokenPriceHistory,
    topPriceChanges,
    gasUsage,
    transactionHistory,
    ariesRewards,
    ariesPoolAPR,
    isLoading,
    error,
    refetch,
    lastUpdated,
  } = {
    portfolioPerformance: [{ value: 0, timestamp: Date.now() }],
    balanceHistory: [],
    tokenLatestPrice: 0,
    tokenPriceHistory: [],
    topPriceChanges: [
      {
        asset_symbol: "APT",
        asset_name: "Aptos",
        price_change: 0,
        current_price_usd: 0,
        price_change_percentage: 0,
      },
    ],
    gasUsage: [{ total_gas_used_usd: 0, total_gas_used_octas: 0 }],
    transactionHistory: [
      {
        asset_symbol: "APT",
        txn_label: "No transactions",
        value_usd: 0,
        timestamp: new Date().toISOString(),
        block_timestamp: new Date().toISOString(),
        wallet_change: 0,
        balance: 0,
        wallet_balance: "0",
      },
    ],
    ariesRewards: [
      { total_reward_balance: 0, asset_type: "APT", reward_asset_type: "APT" },
    ],
    ariesPoolAPR: [
      {
        date_day: new Date().toISOString(),
        apr: 0,
        deposit_apr: 0,
        pool_utilization: 0,
        utilization_percentage: 0,
      },
    ],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
    lastUpdated: new Date(),
  };

  const timeframeOptions = [
    { value: "1h", label: "1H" },
    { value: "24h", label: "24H" },
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
    { value: "1y", label: "1Y" },
    { value: "all", label: "ALL" },
  ];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Analytics Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={refetch} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate portfolio metrics
  const currentValue =
    portfolioPerformance && portfolioPerformance.length > 0
      ? portfolioPerformance[portfolioPerformance.length - 1].value
      : 0;

  const previousValue =
    portfolioPerformance && portfolioPerformance.length > 1
      ? portfolioPerformance[0].value
      : currentValue;

  const valueChange = currentValue - previousValue;
  const percentChange =
    previousValue > 0 ? (valueChange / previousValue) * 100 : 0;

  // Calculate total gas spent
  const totalGasSpent =
    gasUsage?.reduce(
      (sum, usage) => sum + (usage.total_gas_used_usd || 0),
      0,
    ) || 0;

  // Calculate total rewards
  const totalRewards =
    ariesRewards?.reduce(
      (sum, reward) => sum + (reward.total_reward_balance || 0),
      0,
    ) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Analytics</h2>
          <p className="text-sm text-muted-foreground">
            {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {timeframeOptions.map((option) => (
              <Button
                key={option.value}
                variant={
                  selectedTimeframe === option.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedTimeframe(option.value)}
                className="h-8 px-3"
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Button
            onClick={refetch}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Portfolio Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentValue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {percentChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              )}
              <span
                className={
                  percentChange >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {formatPercentage(Math.abs(percentChange))} (
                {formatCurrency(Math.abs(valueChange))})
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APT Price</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tokenLatestPrice ? formatCurrency(tokenLatestPrice) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Current APT price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Spent</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalGasSpent)}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTokenAmount(totalRewards)}
            </div>
            <p className="text-xs text-muted-foreground">Aries rewards</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="balance">Balance</TabsTrigger>
          <TabsTrigger value="price">APT Price</TabsTrigger>
          <TabsTrigger
            value="transactions"
            disabled
            className="cursor-not-allowed opacity-60"
          >
            Transactions (Coming Soon)
          </TabsTrigger>
          <TabsTrigger value="defi">DeFi</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>
                Your portfolio value over time ({selectedTimeframe})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {portfolioPerformance && portfolioPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={portfolioPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleString()
                      }
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "Value",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-400 flex items-center justify-center">
                  <p className="text-muted-foreground">
                    No performance data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance History</CardTitle>
              <CardDescription>Your balance changes over time</CardDescription>
            </CardHeader>
            <CardContent>
              {balanceHistory && balanceHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={balanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hourly_timestamp"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleString()
                      }
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "Balance",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="total_store_balance_usd"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-400 flex items-center justify-center">
                  <p className="text-muted-foreground">
                    No balance history available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="price" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>APT Price History</CardTitle>
                <CardDescription>
                  APT price movement ({selectedTimeframe})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tokenPriceHistory && tokenPriceHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={tokenPriceHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="bucketed_timestamp_minutes_utc"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString()
                        }
                      />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip
                        labelFormatter={(value) =>
                          new Date(value).toLocaleString()
                        }
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "Price",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="price_usd"
                        stroke="#ffc658"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      No price history available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Price Changes</CardTitle>
                <CardDescription>
                  Biggest movers in the last 24h
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topPriceChanges && topPriceChanges.length > 0 ? (
                  <div className="space-y-2">
                    {topPriceChanges.slice(0, 5).map((change, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{change.asset_symbol}</Badge>
                          <span className="text-sm font-medium">
                            {change.asset_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {formatCurrency(change.current_price_usd)}
                          </span>
                          <Badge
                            variant={
                              change.price_change_percentage >= 0
                                ? "default"
                                : "destructive"
                            }
                          >
                            {change.price_change_percentage >= 0 ? "+" : ""}
                            {formatPercentage(change.price_change_percentage)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-300 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      No price changes available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Your latest transaction activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionHistory && transactionHistory.length > 0 ? (
                  <div className="space-y-2">
                    {transactionHistory.slice(0, 5).map((tx, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{tx.asset_symbol}</Badge>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {tx.txn_label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(
                                tx.block_timestamp,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {tx.wallet_change}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Balance:{" "}
                            {formatTokenAmount(parseFloat(tx.wallet_balance))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-300 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      No transactions available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gas Usage</CardTitle>
                <CardDescription>
                  Your gas consumption (last 30 days)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gasUsage && gasUsage.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {formatCurrency(totalGasSpent)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total gas spent
                      </p>
                    </div>
                    {gasUsage.map((usage, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <span className="text-sm">Gas consumed</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(usage.total_gas_used_usd)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTokenAmount(
                              usage.total_gas_used_octas / 100000000,
                            )}{" "}
                            APT
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-300 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      No gas usage data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="defi" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Aries Rewards</CardTitle>
                <CardDescription>
                  Your accumulated rewards from Aries protocol
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ariesRewards && ariesRewards.length > 0 ? (
                  <div className="space-y-2">
                    {ariesRewards.map((reward, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {reward.asset_type.split("::").pop()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Reward: {reward.reward_asset_type.split("::").pop()}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatTokenAmount(reward.total_reward_balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-300 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      No Aries rewards available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aries Pool APR</CardTitle>
                <CardDescription>Current lending pool rates</CardDescription>
              </CardHeader>
              <CardContent>
                {ariesPoolAPR && ariesPoolAPR.length > 0 ? (
                  <div className="space-y-2">
                    {ariesPoolAPR.slice(0, 5).map((apr, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">USDC Pool</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(apr.date_day).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {formatPercentage(apr.deposit_apr)} APR
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Utilization:{" "}
                            {formatPercentage(apr.utilization_percentage)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-300 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      No APR data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
