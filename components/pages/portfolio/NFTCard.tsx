import React, { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NFT {
  token_data_id: string;
  token_name: string;
  collection_name: string;
  token_uri: string;
  description?: string;
  property_version_v1: number;
  amount: number;
  cdn_image_uri?: string;
  cdn_animation_uri?: string;
  collection_description?: string;
  creator_address?: string;
  collection_uri?: string;
  last_transaction_version?: number;
  last_transaction_timestamp?: string;
}

interface NFTCardProps {
  nft: NFT;
  onSelect: (nft: NFT) => void;
  showCollection?: boolean;
  className?: string;
}

export function NFTCard({
  nft,
  onSelect,
  showCollection = false,
  className,
}: NFTCardProps) {
  const [imageError, setImageError] = useState<string | null>(null);
  const imageUrl = nft.cdn_image_uri || nft.token_uri;

  const getErrorMessage = (error: string) => {
    if (error.includes('403') || error.includes('Forbidden')) {
      return 'Image blocked by server permissions';
    }
    if (error.includes('ipfs') || error.includes('pinata')) {
      return 'IPFS content temporarily unavailable';
    }
    if (error.includes('svg') || error.includes('dangerouslyAllowSVG')) {
      return 'SVG images blocked for security';
    }
    return 'Image failed to load';
  };

  const renderImage = () => {
    if (!imageUrl) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <div className="text-muted-foreground/50 text-2xl font-bold">
            {nft.token_name.charAt(0).toUpperCase()}
          </div>
        </div>
      );
    }

    try {
      const url = new URL(imageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }

      if (imageError) {
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center p-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <div className="text-center">
              <div className="text-muted-foreground/70 text-xs font-medium mb-1">
                {nft.token_name.charAt(0).toUpperCase()}
              </div>
              <div className="text-muted-foreground/50 text-[10px] leading-tight">
                {getErrorMessage(imageError)}
              </div>
            </div>
          </div>
        );
      }

      return (
        <Image
          src={imageUrl}
          alt={nft.token_name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => {
            const errorMsg = imageUrl.includes('svg')
              ? 'SVG blocked for security'
              : imageUrl.includes('ipfs')
                ? 'IPFS content unavailable'
                : imageUrl.includes('pinata')
                  ? 'IPFS gateway error'
                  : 'Image load failed';
            setImageError(errorMsg);
          }}
        />
      );
    } catch (error) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center p-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <div className="text-center">
            <div className="text-muted-foreground/70 text-xs font-medium mb-1">
              {nft.token_name.charAt(0).toUpperCase()}
            </div>
            <div className="text-muted-foreground/50 text-[10px] leading-tight">
              Invalid image URL
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:-translate-y-1',
        className
      )}
      onClick={() => onSelect(nft)}
    >
      {/* NFT Image Container */}
      <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent group-hover:border-primary/20 transition-colors duration-200 bg-background shadow-sm group-hover:shadow-lg">
        {renderImage()}

        {/* Overlay with hover effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Amount badge */}
        {nft.amount > 1 && (
          <div className="absolute top-2 right-2 bg-background/95 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-semibold border">
            ×{nft.amount}
          </div>
        )}

        {/* Hover overlay content */}
        <div className="absolute bottom-2 left-2 right-2 transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg p-2 border">
            <p className="text-xs text-muted-foreground truncate">
              View Details
            </p>
          </div>
        </div>
      </div>

      {/* NFT Metadata */}
      <div className="mt-3 space-y-2">
        <h4 className="font-medium text-sm leading-tight truncate group-hover:text-primary transition-colors">
          {nft.token_name}
        </h4>

        <p className="text-xs text-muted-foreground truncate">
          {nft.collection_name}
        </p>

        {/* Description */}
        {nft.description && (
          <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
            {nft.description}
          </p>
        )}

        {/* Details row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            {/* Property version indicator */}
            {nft.property_version_v1 > 0 && (
              <Badge variant="outline" className="text-xs h-5 px-1.5">
                v{nft.property_version_v1}
              </Badge>
            )}

            {/* Creator info */}
            {nft.creator_address && (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {nft.creator_address.slice(0, 6)}...
                {nft.creator_address.slice(-4)}
              </Badge>
            )}
          </div>

          {/* Last transaction timestamp */}
          {nft.last_transaction_timestamp && (
            <p className="text-xs text-muted-foreground/60">
              {new Date(nft.last_transaction_timestamp).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
