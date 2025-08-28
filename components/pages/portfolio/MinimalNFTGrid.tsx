"use client";

import React from "react";

import { useOnScreen } from "@/hooks";
import { cn } from "@/lib/utils";
import {
  sanitizeNFTMetadata,
  sanitizeImageUrl,
} from "@/lib/utils/core/security";

import { NFTImage } from "./shared/SmartImage";
import { NFT } from "./types";

interface MinimalNFTGridProps {
  nfts: NFT[] | null;
  nftsLoading: boolean;
  hasMoreNFTs?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  selectedNFT: NFT | null;
  onNFTSelect: (nft: NFT) => void;
}

export const MinimalNFTGrid = ({
  nfts,
  nftsLoading,
  hasMoreNFTs = false,
  isLoadingMore = false,
  onLoadMore,
  selectedNFT,
  onNFTSelect,
}: MinimalNFTGridProps) => {
  const filteredNFTs = nfts || [];

  // Use intersection observer hook for infinite scroll
  const [loadMoreRef, isLoadMoreVisible] = useOnScreen<HTMLDivElement>({
    threshold: 0.1,
  });

  // Trigger load more when the sentinel becomes visible
  React.useEffect(() => {
    if (hasMoreNFTs && !isLoadingMore && onLoadMore && isLoadMoreVisible) {
      onLoadMore();
    }
  }, [hasMoreNFTs, isLoadingMore, onLoadMore, isLoadMoreVisible]);

  // Show loading skeleton only when no NFTs are available yet
  if (nftsLoading && filteredNFTs.length === 0) {
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

  if (!nftsLoading && filteredNFTs.length === 0) {
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filteredNFTs.map((nft, index) => {
          const isSelected = selectedNFT?.token_data_id === nft.token_data_id;
          const sanitizedNFT = sanitizeNFTMetadata(nft);
          const imageUrl = sanitizeImageUrl(
            nft.cdn_image_uri || nft.token_uri,
            "/placeholder.jpg",
          );

          return (
            <div
              key={`${nft.token_data_id}-${index}`}
              className={cn(
                "group relative aspect-square cursor-pointer overflow-hidden bg-neutral-50 dark:bg-neutral-950 rounded-lg",
                "transition-all duration-200",
                isSelected && "ring-1 ring-neutral-900 dark:ring-neutral-100",
              )}
              onClick={() => onNFTSelect(nft)}
            >
              <NFTImage
                src={imageUrl}
                alt={sanitizedNFT.token_name || "NFT"}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />

              {/* Subtle hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

              {/* Amount badge - only if more than 1 */}
              {(nft.amount || 1) > 1 && (
                <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-2 py-0.5 text-xs">
                  {nft.amount || 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Intersection Observer trigger for infinite scroll */}
      {hasMoreNFTs && (
        <div
          ref={loadMoreRef}
          className="h-20 flex items-center justify-center"
        >
          {isLoadingMore && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              Loading more NFTs...
            </div>
          )}
        </div>
      )}

      {/* Show total count */}
      {filteredNFTs.length > 0 && (
        <div className="text-center text-xs text-muted-foreground py-2">
          Showing {filteredNFTs.length} NFTs
          {hasMoreNFTs && " (scroll for more)"}
        </div>
      )}
    </div>
  );
};
