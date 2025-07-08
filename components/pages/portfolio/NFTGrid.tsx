'use client';

import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NFT } from './types';

interface NFTGridProps {
  nfts: NFT[] | null;
  nftsLoading: boolean;
  selectedNFT: NFT | null;
  onNFTSelect: (nft: NFT) => void;
}

export const NFTGrid = ({
  nfts,
  nftsLoading,
  selectedNFT,
  onNFTSelect,
}: NFTGridProps) => {
  return (
    <div className="space-y-4">
      {nftsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : nfts && nfts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {nfts.map((nft, index) => {
            if (!nft || !nft.token_data_id) {
              console.warn('Invalid NFT data:', nft);
              return null;
            }

            const uniqueKey = `${nft.collection_name}-${nft.token_data_id}-${nft.token_name}-${index}`;
            const isSelected = selectedNFT?.token_data_id === nft.token_data_id;

            return (
              <div
                key={uniqueKey}
                className={cn(
                  'relative group cursor-pointer transition-all duration-200',
                  isSelected && 'ring-2 ring-primary ring-offset-2'
                )}
                onClick={() => onNFTSelect(nft)}
              >
                <div className="aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors">
                  {(() => {
                    const imageUrl = nft.cdn_image_uri || nft.token_uri;
                    if (!imageUrl) {
                      return (
                        <div className="relative w-full h-full">
                          <Image
                            src="/placeholder.jpg"
                            alt={nft.token_name}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      );
                    }

                    try {
                      const url = new URL(imageUrl);
                      if (!['http:', 'https:'].includes(url.protocol)) {
                        throw new Error('Invalid protocol');
                      }

                      return (
                        <div className="relative w-full h-full">
                          <Image
                            src={imageUrl}
                            alt={nft.token_name}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={e => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.src = '/placeholder.jpg';
                            }}
                          />
                        </div>
                      );
                    } catch (error) {
                      console.warn('Invalid NFT image URL:', imageUrl, error);
                      return (
                        <div className="relative w-full h-full">
                          <Image
                            src="/placeholder.jpg"
                            alt={nft.token_name}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      );
                    }
                  })()}
                  {nft.amount > 1 && (
                    <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
                      x{nft.amount}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p
                    className="text-sm font-medium truncate"
                    title={nft.token_name}
                  >
                    {nft.token_name}
                  </p>
                  <p
                    className="text-xs text-muted-foreground truncate"
                    title={nft.collection_name}
                  >
                    {nft.collection_name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No NFTs found</p>
        </div>
      )}
    </div>
  );
};
