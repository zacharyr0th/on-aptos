import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useTransactionHistory } from '@/hooks/useAptosAnalytics';

interface TransactionHistoryTableProps {
  walletAddress: string | undefined;
  className?: string;
  limit?: number;
}

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> =
  React.memo(({ walletAddress, className, limit = 10 }) => {
    const { data, loading, error } = useTransactionHistory(
      walletAddress || null,
      {
        limit,
      }
    );

    // Loading state
    if (loading) {
      return (
        <Card className={className}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <CardTitle className="text-base font-medium">
                Transaction History
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Error state
    if (error) {
      return (
        <Card className={className}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <CardTitle className="text-base font-medium">
                Transaction History
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Failed to load transaction history
            </p>
          </CardContent>
        </Card>
      );
    }

    // No data state
    if (!data || data.length === 0) {
      return (
        <Card className={className}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <CardTitle className="text-base font-medium">
                Transaction History
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No transaction history found
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <CardTitle className="text-base font-medium">
              Recent Transactions
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((tx, index) => {
                const isPositive = parseFloat(tx.wallet_change || '0') > 0;
                const timestamp = new Date(tx.block_timestamp);

                return (
                  <TableRow key={`${tx.txn_version}-${index}`}>
                    <TableCell className="text-sm">
                      {timestamp.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tx.asset_symbol}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {tx.txn_label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.wallet_change && tx.wallet_change !== '' ? (
                        <div
                          className={`flex items-center justify-end gap-1 ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          <span className="font-medium">
                            {isPositive ? '+' : ''}
                            {tx.wallet_change}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {tx.wallet_balance}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  });

TransactionHistoryTable.displayName = 'TransactionHistoryTable';
