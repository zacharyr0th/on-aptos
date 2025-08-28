"use client";

import { ArrowUpRight, ArrowDownLeft, Clock, ExternalLink } from "lucide-react";
import React from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/format";

interface Transaction {
  hash: string;
  type: string;
  timestamp: string;
  success: boolean;
  amount?: number;
  symbol?: string;
  gas_used?: number;
  function?: string;
}

interface MobileTransactionsListProps {
  transactions?: Transaction[] | null;
  isLoading?: boolean;
  walletAddress?: string;
}

const formatTimeAgo = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  } catch {
    return timestamp;
  }
};

const getTransactionIcon = (type: string, functionName?: string) => {
  const lowerType = type.toLowerCase();
  const lowerFunction = functionName?.toLowerCase() || "";

  if (lowerFunction.includes("transfer") || lowerFunction.includes("send")) {
    return <ArrowUpRight className="h-4 w-4 text-red-500" />;
  }
  if (lowerFunction.includes("receive") || lowerType.includes("receive")) {
    return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

const getTransactionType = (type: string, functionName?: string): string => {
  if (functionName) {
    if (functionName.includes("transfer")) return "Transfer";
    if (functionName.includes("swap")) return "Swap";
    if (functionName.includes("deposit")) return "Deposit";
    if (functionName.includes("withdraw")) return "Withdraw";
    if (functionName.includes("mint")) return "Mint";
    if (functionName.includes("burn")) return "Burn";
  }

  return type || "Transaction";
};

export function MobileTransactionsList({
  transactions,
  isLoading,
  walletAddress,
}: MobileTransactionsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Recent Transactions</h3>
        <p className="text-muted-foreground text-sm">
          Your transaction history will appear here once you start using your
          wallet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.slice(0, 10).map((tx, index) => (
        <Card key={tx.hash || `tx-${index}`} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {getTransactionIcon(tx.type, tx.function)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium truncate">
                    {getTransactionType(tx.type, tx.function)}
                  </p>
                  {!tx.success && (
                    <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                      Failed
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(tx.timestamp)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {tx.amount && tx.symbol && (
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(tx.amount)} {tx.symbol}
                  </p>
                  {tx.gas_used && (
                    <p className="text-xs text-muted-foreground">
                      Gas: {tx.gas_used}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  const explorerUrl = `https://explorer.aptoslabs.com/txn/${tx.hash}?network=mainnet`;
                  window.open(explorerUrl, "_blank", "noopener,noreferrer");
                }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="View on Explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}

      {transactions.length > 10 && (
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Showing 10 of {transactions.length} transactions
          </p>
        </Card>
      )}
    </div>
  );
}
