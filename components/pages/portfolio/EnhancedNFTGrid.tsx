'use client';

import React from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NFT } from './types';

interface EnhancedNFTGridProps {
  nfts: NFT[] | null;
  nftsLoading: boolean;
  selectedNFT: NFT | null;
  onNFTSelect: (nft: NFT) => void;
}

export const EnhancedNFTGrid = ({
  nfts,
  nftsLoading,
  selectedNFT,
  onNFTSelect,
}: EnhancedNFTGridProps) => {
  const viewMode = 'grid';

  const filteredAndSortedNFTs = nfts || [];

  const renderNFTCard = (nft: NFT, index: number) => {
    const isSelected = selectedNFT?.token_data_id === nft.token_data_id;
    const imageUrl = nft.cdn_image_uri || nft.token_uri || '/placeholder.jpg';

    return (
      <div
        key={`${nft.token_data_id}-${index}`}
        className={cn(
          'group relative rounded-xl border bg-card overflow-hidden cursor-pointer transition-all duration-200',
          'hover:shadow-lg hover:border-primary/50 hover:-translate-y-1',
          isSelected && 'ring-2 ring-primary ring-offset-2'
        )}
        onClick={() => onNFTSelect(nft)}
      >
        <div className="relative overflow-hidden bg-muted aspect-square">
          <Image
            src={imageUrl}
            alt={nft.token_name || 'NFT'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            onError={e => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = '/placeholder.jpg';
            }}
          />
          {nft.amount > 1 && (
            <Badge className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm">
              ×{nft.amount}
            </Badge>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* NFT Grid */}
      {nftsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredAndSortedNFTs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedNFTs.map((nft, index) => renderNFTCard(nft, index))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <ImageIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            This wallet doesn&apos;t have any NFTs yet
          </p>
        </div>
      )}
    </div>
  );
};
