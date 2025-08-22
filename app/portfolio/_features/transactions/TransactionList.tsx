"use client";

import { Activity } from "lucide-react";
import React from "react";

import { TransactionHistoryTable } from "@/app/portfolio/_components/tables/TransactionHistoryTable";
import { usePortfolioContext } from "@/app/portfolio/_providers";

export function TransactionList({
  compact,
  maxHeight,
}: {
  compact?: boolean;
  maxHeight?: string;
}) {
  const {
    transactions,
    transactionsLoading,
    address,
    totalTransactionCount,
    hasMoreTransactions,
  } = usePortfolioContext();

  if (compact) {
    return (
      <div
        className="h-full flex flex-col"
        style={{ maxHeight: maxHeight || "500px" }}
      >
        <div className="p-4 border-b border-border/50 flex-shrink-0">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Recent Activity</span>
            {totalTransactionCount && (
              <span className="text-xs text-muted-foreground">
                ({totalTransactionCount.toLocaleString()} total)
              </span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">Latest transactions</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <TransactionHistoryTable
            walletAddress={address}
            preloadedTransactions={transactions}
            preloadedTransactionsLoading={transactionsLoading}
            preloadedTotalCount={totalTransactionCount}
            preloadedHasMore={hasMoreTransactions}
            initialLimit={5}
            className="compact-mode"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Transactions</h3>

      <TransactionHistoryTable
        walletAddress={address}
        preloadedTransactions={transactions}
        preloadedTransactionsLoading={transactionsLoading}
        preloadedTotalCount={totalTransactionCount}
        preloadedHasMore={hasMoreTransactions}
      />
    </div>
  );
}
