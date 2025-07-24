'use client';

import Image from 'next/image';
import React from 'react';

import { cn } from '@/lib/utils';

import { NFT } from './types';


interface MinimalNFTGridProps {
  nfts: NFT[] | null;
  nftsLoading: boolean;
  selectedNFT: NFT | null;
  onNFTSelect: (nft: NFT) => void;
}

export const MinimalNFTGrid = ({
  nfts,
  nftsLoading,
  selectedNFT,
  onNFTSelect,
}: MinimalNFTGridProps) => {
  const filteredNFTs = nfts || [];

  if (nftsLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-neutral-100 dark:bg-neutral-900 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (filteredNFTs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No NFTs found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {filteredNFTs.map((nft, index) => {
        const isSelected = selectedNFT?.token_data_id === nft.token_data_id;
        const imageUrl =
          nft.cdn_image_uri || nft.token_uri || '/placeholder.jpg';

        return (
          <div
            key={`${nft.token_data_id}-${index}`}
            className={cn(
              'group relative aspect-square cursor-pointer overflow-hidden bg-neutral-50 dark:bg-neutral-950 rounded-lg',
              'transition-all duration-200',
              isSelected && 'ring-1 ring-neutral-900 dark:ring-neutral-100'
            )}
            onClick={() => onNFTSelect(nft)}
          >
            <Image
              src={imageUrl}
              alt={nft.token_name || 'NFT'}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              onError={e => {
                const img = e.currentTarget as HTMLImageElement;
                img.src = '/placeholder.jpg';
              }}
            />

            {/* Subtle hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

            {/* Amount badge - only if more than 1 */}
            {nft.amount > 1 && (
              <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-2 py-0.5 text-xs">
                {nft.amount}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
