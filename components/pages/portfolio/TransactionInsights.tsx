"use client";

import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Repeat,
  Zap,
  DollarSign,
  Coins,
  Shield,
  Shuffle,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { errorLogger } from "@/lib/utils/core/logger";
import { formatTokenAmount } from "@/lib/utils/format";
import {
  OptimizedTransactionAnalyzer as EnhancedTransactionAnalyzer,
  TransactionCategory,
  ActivityType,
  type OptimizedTransactionInfo as EnhancedTransactionInfo,
} from "@/lib/utils/token/transaction-analysis";

interface WalletTransaction {
  transaction_version: string;
  transaction_timestamp: string;
  type: string;
  amount: string;
  asset_type: string;
  sender?: string;
  receiver?: string;
  gas_fee?: string;
  success: boolean;
  function?: string;
  payload?: any;
  events?: any[];
}

interface EnhancedTransaction extends WalletTransaction {
  analysis?: EnhancedTransactionInfo;
}

interface TransactionInsightsProps {
  walletAddress: string;
  limit?: number;
}

export function TransactionInsights({
  walletAddress,
  limit = 20,
}: TransactionInsightsProps) {
  const { t } = useTranslation("common");
  const [transactions, setTransactions] = useState<
    EnhancedTransaction[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/portfolio/transactions?address=${walletAddress}&limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const result = await response.json();
      const rawTransactions = result.data || [];

      // Enhance transactions with analysis
      const enhancedTransactions: EnhancedTransaction[] = rawTransactions.map(
        (tx: WalletTransaction) => ({
          ...tx,
          analysis: EnhancedTransactionAnalyzer.analyzeTransactionSync(tx),
        }),
      );

      setTransactions(enhancedTransactions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      errorLogger.error("Transaction fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [walletAddress, limit]);

  // Enhanced transaction pattern analysis
  const getTransactionInsights = (txs: EnhancedTransaction[]) => {
    if (!txs || txs.length === 0) return null;

    const totalTxs = txs.length;

    // Category breakdown
    const categories = txs.reduce(
      (acc, tx) => {
        const category = tx.analysis?.category || TransactionCategory.UNKNOWN;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<TransactionCategory, number>,
    );

    // Protocol breakdown
    const protocols = new Set(
      txs.map((tx) => tx.analysis?.protocol?.name).filter(Boolean),
    ).size;

    // Asset diversity
    const assets = new Set(
      txs.map(
        (tx) =>
          tx.analysis?.assetInfo?.displaySymbol ||
          tx.asset_type.split("::").pop() ||
          "Unknown",
      ),
    ).size;

    // Most common category
    const mostCommonCategory = Object.entries(categories).sort(
      ([, a], [, b]) => b - a,
    )[0];

    // Calculate activity score (transactions per week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentTxs = txs.filter(
      (tx) => new Date(tx.transaction_timestamp) > oneWeekAgo,
    ).length;

    const getActivityLevel = (weeklyTxs: number) => {
      if (weeklyTxs >= 20)
        return {
          level: t("portfolio.transactions.very_active"),
          color: "text-green-600 dark:text-green-400",
          icon: Zap,
        };
      if (weeklyTxs >= 10)
        return {
          level: t("portfolio.transactions.active"),
          color: "text-blue-600 dark:text-blue-400",
          icon: TrendingUp,
        };
      if (weeklyTxs >= 5)
        return {
          level: t("portfolio.transactions.moderate"),
          color: "text-yellow-600 dark:text-yellow-400",
          icon: Activity,
        };
      if (weeklyTxs >= 1)
        return {
          level: t("portfolio.transactions.light"),
          color: "text-orange-600 dark:text-orange-400",
          icon: Clock,
        };
      return {
        level: t("portfolio.transactions.inactive"),
        color: "text-gray-600 dark:text-gray-400",
        icon: TrendingDown,
      };
    };

    // DeFi/Staking engagement
    const defiTxs = Object.entries(categories)
      .filter(([cat]) =>
        [TransactionCategory.DEFI, TransactionCategory.STAKING].includes(
          cat as TransactionCategory,
        ),
      )
      .reduce((sum, [, count]) => sum + count, 0);

    const defiEngagement = defiTxs / totalTxs;

    return {
      totalTxs,
      assets,
      protocols,
      categories,
      mostCommonCategory: mostCommonCategory
        ? mostCommonCategory[0]
        : TransactionCategory.UNKNOWN,
      mostCommonCount: mostCommonCategory ? mostCommonCategory[1] : 0,
      recentTxs,
      activity: getActivityLevel(recentTxs),
      defiEngagement,
    };
  };

  const getCategoryIcon = (category: TransactionCategory) => {
    switch (category) {
      case TransactionCategory.DEFI:
        return DollarSign;
      case TransactionCategory.STAKING:
        return Shield;
      case TransactionCategory.TRANSFER:
        return ArrowUpRight;
      case TransactionCategory.CEX:
        return Shuffle;
      case TransactionCategory.NFT:
        return Coins;
      case TransactionCategory.BRIDGE:
        return Repeat;
      case TransactionCategory.RWA:
        return TrendingUp;
      default:
        return Activity;
    }
  };

  const getTransactionIcon = (tx: EnhancedTransaction) => {
    if (tx.analysis?.activityType) {
      switch (tx.analysis.activityType) {
        case ActivityType.SEND:
          return ArrowUpRight;
        case ActivityType.RECEIVE:
          return ArrowDownLeft;
        case ActivityType.SWAP:
          return Repeat;
        case ActivityType.STAKE:
        case ActivityType.UNSTAKE:
          return Shield;
        case ActivityType.LIQUIDITY_ADD:
        case ActivityType.LIQUIDITY_REMOVE:
          return DollarSign;
        case ActivityType.CEX_DEPOSIT:
        case ActivityType.CEX_WITHDRAWAL:
          return Shuffle;
        default:
          return getCategoryIcon(tx.analysis.category);
      }
    }

    // Fallback to basic logic
    const type = tx.type.toLowerCase();
    if (type.includes("send") || type.includes("transfer")) return ArrowUpRight;
    if (type.includes("receive")) return ArrowDownLeft;
    if (type.includes("swap")) return Repeat;
    return Activity;
  };

  const getTransactionColor = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0) return "text-green-600 dark:text-green-400";
    if (numAmount < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  const getTransactionLabel = (tx: EnhancedTransaction) => {
    // Use enhanced analysis first
    if (tx.analysis?.displayName) {
      return tx.analysis.displayName;
    }

    // Fallback to basic labeling
    const type = tx.type.toLowerCase();
    switch (type) {
      case "send":
        return t("portfolio.transactions.send");
      case "receive":
        return t("portfolio.transactions.receive");
      case "swap":
        return t("portfolio.transactions.swap");
      case "deposit":
        return t("portfolio.transactions.deposit");
      case "withdraw":
        return t("portfolio.transactions.withdraw");
      case "stake":
        return t("portfolio.transactions.stake");
      case "unstake":
        return t("portfolio.transactions.unstake");
      case "claim":
        return t("portfolio.transactions.claim");
      case "transfer":
        return t("portfolio.transactions.transfer");
      case "mint":
        return t("portfolio.transactions.mint");
      case "burn":
        return t("portfolio.transactions.burn");
      case "approve":
        return t("portfolio.transactions.approve");
      default:
        return tx.type;
    }
  };

  const insights = transactions ? getTransactionInsights(transactions) : null;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t("portfolio.transactions.insights")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("portfolio.transactions.unable_to_load")}
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
            <Activity className="h-4 w-4" />
            {t("portfolio.transactions.insights")}
          </CardTitle>
          {insights && (
            <Badge
              variant="outline"
              className={cn("text-xs", insights.activity.color)}
            >
              <insights.activity.icon className="h-3 w-3 mr-1" />
              {insights.activity.level}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">
              {t("portfolio.transactions.loading_transactions")}
            </p>
          </div>
        ) : transactions && transactions.length > 0 && insights ? (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold">{insights.totalTxs}</p>
                <p className="text-xs text-muted-foreground">
                  {t("portfolio.transactions.total_transactions")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{insights.protocols}</p>
                <p className="text-xs text-muted-foreground">Protocols</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{insights.assets}</p>
                <p className="text-xs text-muted-foreground">
                  {t("portfolio.transactions.assets")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">
                  {Math.round(insights.defiEngagement * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">DeFi</p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="p-3 rounded border bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Most Common Category
                </p>
                <Badge variant="secondary" className="text-xs">
                  {insights.mostCommonCount}x
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {(() => {
                  const Icon = getCategoryIcon(
                    insights.mostCommonCategory as TransactionCategory,
                  );
                  return <Icon className="h-4 w-4 text-muted-foreground" />;
                })()}
                <p className="text-sm font-medium">
                  {EnhancedTransactionAnalyzer.getCategoryDisplayName(
                    insights.mostCommonCategory as TransactionCategory,
                  )}
                </p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">
                  {t("portfolio.transactions.recent_activity")}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchTransactions}
                  className="h-6 px-2 text-xs"
                >
                  {t("actions.refresh")}
                </Button>
              </div>

              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {transactions.slice(0, 8).map((tx, index) => {
                    const Icon = getTransactionIcon(tx);
                    const amountColor = getTransactionColor(tx.amount);
                    const displaySymbol =
                      tx.analysis?.assetInfo?.displaySymbol ||
                      tx.asset_type.split("::").pop() ||
                      "Unknown";

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border bg-background/50"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {displaySymbol}
                              </Badge>
                              {tx.analysis?.protocol && (
                                <Badge variant="secondary" className="text-xs">
                                  {tx.analysis.protocol.label}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground truncate">
                                {getTransactionLabel(tx)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  tx.transaction_timestamp,
                                ).toLocaleDateString()}
                              </p>
                              {tx.analysis?.confidence &&
                                tx.analysis.confidence >= 80 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-green-600"
                                  >
                                    High Confidence
                                  </Badge>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-xs font-medium", amountColor)}>
                            {parseFloat(tx.amount) > 0 ? "+" : ""}
                            {formatTokenAmount(parseFloat(tx.amount))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.success
                              ? t("portfolio.transactions.success")
                              : t("portfolio.transactions.failed")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Activity Summary */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {t("portfolio.transactions.transactions_in_last_days", {
                    count: insights.recentTxs,
                    days: 7,
                  })}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("portfolio.transactions.no_transactions")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("portfolio.transactions.transaction_data_will_appear")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
