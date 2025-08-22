"use client";

import { ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";
import { sanitizeNFTMetadata, sanitizeImageUrl } from "@/lib/utils/core/security";

import { NFT } from "../types";

import { SimpleNFTGridSkeleton } from "./LoadingSkeletons";
import { NFTImage } from "./SmartImage";

// Unified NFT Grid Props
interface UnifiedNFTGridProps {
  nfts: NFT[] | null;
  nftsLoading?: boolean;
  selectedNFT: NFT | null;
  onNFTSelect: (nft: any) => void;
  isLoading?: boolean;
  totalNFTCount?: number | null;
  accountNames?: any;
  nftCollectionStats?: any;
  hasMoreNFTs?: boolean;
  isLoadingMore?: boolean;
  loadMoreNFTs?: () => void;

  // Display modes
  variant?: "minimal" | "enhanced" | "standard";
  viewMode?: "grid" | "collection";

  // Grid configuration
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  showMetadata?: boolean;

  // Infinite scroll
  onLoadMore?: () => void;

  // Styling
  className?: string;
  containerClassName?: string;

  // Empty state
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<any>;
}

export const UnifiedNFTGrid: React.FC<UnifiedNFTGridProps> = ({
  nfts,
  nftsLoading,
  selectedNFT,
  onNFTSelect,
  variant = "standard",
  viewMode = "grid",
  columns = 3,
  gap = "md",
  showMetadata = true,
  hasMoreNFTs = false,
  isLoadingMore = false,
  onLoadMore,
  className = "",
  containerClassName = "",
  emptyMessage = "No NFTs found",
  emptyIcon: EmptyIcon = ImageIcon,
}) => {
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set(),
  );
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filteredNFTs = nfts || [];

  // Intersection Observer for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (hasMoreNFTs && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMoreNFTs, isLoadingMore, onLoadMore]);

  useEffect(() => {
    if (!onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleLoadMore, onLoadMore]);

  // Group NFTs by collection for collection view
  const groupedNFTs = useMemo(() => {
    if (!nfts || viewMode !== "collection") return {};

    return nfts.reduce(
      (acc, nft) => {
        const sanitizedNFT = sanitizeNFTMetadata(nft);
        const collection = sanitizedNFT.collection_name || "Unknown Collection";
        if (!acc[collection]) {
          acc[collection] = [];
        }
        acc[collection].push(nft);
        return acc;
      },
      {} as Record<string, NFT[]>,
    );
  }, [nfts, viewMode]);

  const toggleCollection = (collection: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collection)) {
      newExpanded.delete(collection);
    } else {
      newExpanded.add(collection);
    }
    setExpandedCollections(newExpanded);
  };

  // Grid configuration
  const gridConfig = {
    columns: {
      2: "grid-cols-2",
      3: "grid-cols-2 sm:grid-cols-3",
      4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    },
    gaps: {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    },
  };

  const gridClass = `grid ${gridConfig.columns[columns]} ${gridConfig.gaps[gap]}`;

  // Render individual NFT card based on variant
  const renderNFTCard = (nft: NFT, index: number) => {
    if (!nft || !nft.token_data_id) {
      logger.debug("Invalid NFT data, skipping render");
      return null;
    }

    // Sanitize NFT metadata for safe display
    const sanitizedNFT = sanitizeNFTMetadata(nft);
    const imageUrl = sanitizeImageUrl(
      nft.cdn_image_uri || nft.token_uri,
      "/placeholder.jpg",
    );
    const uniqueKey = `${sanitizedNFT.collection_name}-${nft.token_data_id}-${sanitizedNFT.token_name}-${index}`;
    const isSelected = selectedNFT?.token_data_id === nft.token_data_id;

    if (variant === "minimal") {
      return (
        <div
          key={uniqueKey}
          className={cn(
            "group relative aspect-square cursor-pointer overflow-hidden bg-neutral-50 dark:bg-neutral-950 rounded-lg",
            "transition-all duration-200",
            isSelected && "ring-1 ring-neutral-900 dark:ring-neutral-100",
            className,
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
          {nft.amount > 1 && (
            <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-2 py-0.5 text-xs">
              {nft.amount}
            </div>
          )}
        </div>
      );
    }

    if (variant === "enhanced") {
      return (
        <div
          key={uniqueKey}
          className={cn(
            "group relative rounded-xl border bg-card overflow-hidden cursor-pointer transition-all duration-200",
            "hover:shadow-lg hover:border-primary/50 hover:-translate-y-1",
            isSelected && "ring-2 ring-primary ring-offset-2",
            className,
          )}
          onClick={() => onNFTSelect(nft)}
        >
          <div className="relative overflow-hidden bg-muted aspect-square">
            <NFTImage
              src={imageUrl}
              alt={sanitizedNFT.token_name || "NFT"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
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
    }

    // Standard variant (default)
    return (
      <div
        key={uniqueKey}
        className={cn(
          "relative group cursor-pointer transition-all duration-200",
          isSelected && "ring-2 ring-primary ring-offset-2",
          className,
        )}
        onClick={() => onNFTSelect(nft)}
      >
        <div className="aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors">
          <NFTImage
            src={imageUrl}
            alt={sanitizedNFT.token_name || "NFT"}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {nft.amount > 1 && (
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
              x{nft.amount}
            </div>
          )}
        </div>

        {/* Show metadata for standard variant */}
        {showMetadata && (
          <div className="mt-2 space-y-1">
            <p
              className="text-sm font-medium truncate"
              title={sanitizedNFT.token_name}
            >
              {sanitizedNFT.token_name || "Unnamed NFT"}
            </p>
            <p
              className="text-xs text-muted-foreground truncate"
              title={sanitizedNFT.collection_name}
            >
              {sanitizedNFT.collection_name}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (nftsLoading && filteredNFTs.length === 0) {
    return (
      <SimpleNFTGridSkeleton
        count={variant === "minimal" ? 9 : 6}
        columns={columns}
        className={containerClassName}
      />
    );
  }

  // Empty state
  if (!nftsLoading && filteredNFTs.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-[400px]",
          containerClassName,
        )}
      >
        <div className="text-center">
          <EmptyIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", containerClassName)}>
      {viewMode === "grid" ? (
        // Grid View
        <>
          <div className={gridClass}>
            {filteredNFTs.map((nft, index) => renderNFTCard(nft, index))}
          </div>

          {/* Infinite scroll trigger */}
          {onLoadMore && hasMoreNFTs && (
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

          {/* Show total count for minimal variant */}
          {variant === "minimal" && filteredNFTs.length > 0 && (
            <div className="text-center text-xs text-muted-foreground py-2">
              Showing {filteredNFTs.length} NFTs
              {hasMoreNFTs && " (scroll for more)"}
            </div>
          )}
        </>
      ) : (
        // Collection View
        <div className="space-y-4">
          {Object.entries(groupedNFTs).map(([collection, collectionNFTs]) => (
            <Collapsible key={collection}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto"
                  onClick={() => toggleCollection(collection)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-medium truncate max-w-[200px]"
                      title={collection}
                    >
                      {collection}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({collectionNFTs.length})
                    </span>
                  </div>
                  {expandedCollections.has(collection) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className={`${gridClass} mt-3`}>
                  {collectionNFTs.map((nft, index) =>
                    renderNFTCard(nft, index),
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
};
