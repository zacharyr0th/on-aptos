'use client';

import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  ExternalLink,
  Grid3X3,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { NFT } from './types';

interface NFTDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT | null;
}

export const NFTDetailsDialog: React.FC<NFTDetailsDialogProps> = ({
  isOpen,
  onClose,
  nft,
}) => {
  const [copiedTokenId, setCopiedTokenId] = React.useState(false);

  if (!nft) return null;

  const imageUrl = nft.cdn_image_uri || nft.token_uri;
  const explorerUrl = `https://explorer.aptoslabs.com/account/${nft.token_data_id}?network=mainnet`;

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(parseInt(timestamp) / 1000).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const copyTokenId = async () => {
    try {
      await navigator.clipboard.writeText(nft.token_data_id);
      setCopiedTokenId(true);
      toast.success('Token ID copied to clipboard');
      setTimeout(() => setCopiedTokenId(false), 2000);
    } catch (error) {
      toast.error('Failed to copy token ID');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-[380px] sm:max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] mx-auto flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base pr-8">
            <Grid3X3 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{nft.token_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-3">
            {/* NFT Image - Smaller on mobile */}
            <div className="aspect-square rounded-lg overflow-hidden border bg-muted/50 relative mx-auto max-w-[200px] sm:max-w-[280px]">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={nft.token_name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 200px, 280px"
                  onError={e => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/placeholder.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Grid3X3 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Compact Details */}
            <div className="space-y-2">
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Collection</p>
                  <p className="text-sm font-medium truncate">{nft.collection_name}</p>
                </div>
                
                {nft.amount && (
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-sm font-medium">{nft.amount}</p>
                  </div>
                )}
              </div>

              {/* Token ID with copy - more compact */}
              <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                <p className="text-xs font-mono truncate flex-1">
                  {nft.token_data_id}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyTokenId}
                >
                  {copiedTokenId ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {/* Only show description on larger screens or if short */}
              {nft.description && nft.description.length < 100 && (
                <div className="text-xs text-muted-foreground">
                  {nft.description}
                </div>
              )}
            </div>

            {/* Explorer button */}
            <Button
              variant="default"
              className="w-full"
              size="sm"
              onClick={() => window.open(explorerUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              View on Explorer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};