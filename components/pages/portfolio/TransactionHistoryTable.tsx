import React from 'react';
import { GeistMono } from 'geist/font/mono';
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
import { ArrowUpRight, ArrowDownRight, History, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useTransactionHistory } from '@/hooks/useAptosAnalytics';

interface TransactionHistoryTableProps {
  walletAddress: string | undefined;
  className?: string;
  limit?: number;
}

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> =
  React.memo(({ walletAddress, className, limit = 10 }) => {
    // Show coming soon message for now
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-6">
          <History className="h-4 w-4" />
          <h2 className="text-base font-medium">Transactions</h2>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className={`text-lg font-semibold ${GeistMono.className}`}>
              Transactions
            </h3>
            <p
              className={`text-muted-foreground text-sm ${GeistMono.className}`}
            >
              (Coming Soon)
            </p>
            <p className="text-muted-foreground text-xs max-w-md mx-auto">
              Transaction history and detailed activity tracking will be
              available in a future update.
            </p>
          </div>
        </div>
      </div>
    );
  });

TransactionHistoryTable.displayName = 'TransactionHistoryTable';
