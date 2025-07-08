import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { History, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

interface NFTTransferHistoryProps {
  tokenDataId: string;
}

export function NFTTransferHistory({ tokenDataId }: NFTTransferHistoryProps) {
  const {
    data: transfers,
    isLoading,
    error,
  } = trpc.domains.blockchain.portfolio.getNFTTransferHistory.useQuery({
    tokenDataId,
    limit: 20,
  });

  const formatAddress = (address: string) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  const getTransferTypeColor = (transferType: string) => {
    switch (transferType.toLowerCase()) {
      case 'mint':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'burn':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'transfer':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'deposit':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'withdraw':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getTransferIcon = (transferType: string) => {
    switch (transferType.toLowerCase()) {
      case 'mint':
      case 'deposit':
        return <ArrowDownRight className="h-3 w-3" />;
      case 'burn':
      case 'withdraw':
      case 'transfer':
        return <ArrowUpRight className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  if (error) {
    return (
      <Card className="border-t">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Unable to load transfer history at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-t">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Transfer History
        </CardTitle>
        <CardDescription>
          Complete transaction history for this NFT
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : transfers && transfers.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {transfers.map((transfer, index) => (
                <div
                  key={`${transfer.transaction_version}-${index}`}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getTransferTypeColor(transfer.transfer_type)}`}
                    >
                      {getTransferIcon(transfer.transfer_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs border ${getTransferTypeColor(transfer.transfer_type)}`}
                        >
                          {transfer.transfer_type}
                        </Badge>
                        {transfer.token_amount !== '1' && (
                          <Badge variant="secondary" className="text-xs">
                            ×{transfer.token_amount}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {transfer.from_address === '0x0' ? (
                          <span>
                            Minted to {formatAddress(transfer.to_address)}
                          </span>
                        ) : transfer.to_address === '0x0' ? (
                          <span>
                            Burned from {formatAddress(transfer.from_address)}
                          </span>
                        ) : (
                          <span>
                            {formatAddress(transfer.from_address)} →{' '}
                            {formatAddress(transfer.to_address)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(transfer.transaction_timestamp)}
                    </p>
                    <p className="text-xs text-muted-foreground/60 font-mono">
                      #{transfer.transaction_version}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <History className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <h4 className="text-sm font-medium mb-1">No Transfer History</h4>
            <p className="text-xs text-muted-foreground">
              No transfer records found for this NFT.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
