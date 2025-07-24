'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Repeat,
  Zap,
} from 'lucide-react';
import { formatTokenAmount } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface TransactionData {
  asset_name: string;
  asset_symbol: string;
  block_timestamp: string;
  label_type: string;
  storage_id: string;
  txn_label: string;
  txn_version: string;
  wallet_balance: string;
  wallet_change: string;
}

interface TransactionInsightsProps {
  walletAddress: string;
  limit?: number;
}

export function TransactionInsights({
  walletAddress,
  limit = 20,
}: TransactionInsightsProps) {
  const [transactions, setTransactions] = useState<TransactionData[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/analytics/transaction-history?address=${walletAddress}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const result = await response.json();
      setTransactions(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Transaction fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Analyze transaction patterns
  const getTransactionInsights = (txs: TransactionData[]) => {
    if (!txs || txs.length === 0) return null;

    const totalTxs = txs.length;
    const assets = new Set(txs.map(tx => tx.asset_symbol)).size;
    const txTypes = txs.reduce(
      (acc, tx) => {
        acc[tx.txn_label] = (acc[tx.txn_label] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostCommonType = Object.entries(txTypes).sort(
      ([, a], [, b]) => b - a
    )[0];

    // Calculate activity score (transactions per week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentTxs = txs.filter(
      tx => new Date(tx.block_timestamp) > oneWeekAgo
    ).length;

    const getActivityLevel = (weeklyTxs: number) => {
      if (weeklyTxs >= 20)
        return { level: 'Very Active', color: 'text-green-600', icon: Zap };
      if (weeklyTxs >= 10)
        return { level: 'Active', color: 'text-blue-600', icon: TrendingUp };
      if (weeklyTxs >= 5)
        return { level: 'Moderate', color: 'text-yellow-600', icon: Activity };
      if (weeklyTxs >= 1)
        return { level: 'Light', color: 'text-orange-600', icon: Clock };
      return { level: 'Inactive', color: 'text-gray-600', icon: TrendingDown };
    };

    return {
      totalTxs,
      assets,
      mostCommonType: mostCommonType ? mostCommonType[0] : 'Unknown',
      mostCommonCount: mostCommonType ? mostCommonType[1] : 0,
      recentTxs,
      activity: getActivityLevel(recentTxs),
    };
  };

  const getTransactionIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'send':
      case 'transfer':
        return ArrowUpRight;
      case 'receive':
        return ArrowDownLeft;
      case 'swap':
        return Repeat;
      default:
        return Activity;
    }
  };

  const getTransactionColor = (change: string) => {
    const numChange = parseFloat(change);
    if (numChange > 0) return 'text-green-600';
    if (numChange < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const insights = transactions ? getTransactionInsights(transactions) : null;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Transaction Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Unable to load transaction data
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
            Transaction Insights
          </CardTitle>
          {insights && (
            <Badge
              variant="outline"
              className={cn('text-xs', insights.activity.color)}
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
              Loading transactions...
            </p>
          </div>
        ) : transactions && transactions.length > 0 && insights ? (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold">{insights.totalTxs}</p>
                <p className="text-xs text-muted-foreground">Total Txns</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{insights.assets}</p>
                <p className="text-xs text-muted-foreground">Assets</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{insights.recentTxs}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>

            {/* Most Common Activity */}
            <div className="p-3 rounded border bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Most Common Activity
                </p>
                <Badge variant="secondary" className="text-xs">
                  {insights.mostCommonCount}x
                </Badge>
              </div>
              <p className="text-sm font-medium mt-1">
                {insights.mostCommonType}
              </p>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Recent Activity</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchTransactions}
                  className="h-6 px-2 text-xs"
                >
                  Refresh
                </Button>
              </div>

              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {transactions.slice(0, 8).map((tx, index) => {
                    const Icon = getTransactionIcon(tx.txn_label);
                    const changeColor = getTransactionColor(tx.wallet_change);

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
                                {tx.asset_symbol}
                              </Badge>
                              <span className="text-xs text-muted-foreground truncate">
                                {tx.txn_label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                tx.block_timestamp
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn('text-xs font-medium', changeColor)}>
                            {parseFloat(tx.wallet_change) > 0 ? '+' : ''}
                            {formatTokenAmount(parseFloat(tx.wallet_change))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Bal:{' '}
                            {formatTokenAmount(parseFloat(tx.wallet_balance))}
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
                  {insights.recentTxs} transactions in the last 7 days
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No transaction history available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Transaction data will appear here once available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
