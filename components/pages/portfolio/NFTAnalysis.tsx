import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Grid3X3, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Image from 'next/image';
import { toast } from 'sonner';

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

interface NFTAnalysisProps {
  nfts: NFT[];
  nftsByCollection: Record<string, NFT[]>;
  selectedNFT: NFT | null;
  onClearSelection?: () => void;
}

export function NFTAnalysis({
  nfts,
  nftsByCollection,
  selectedNFT,
  onClearSelection,
}: NFTAnalysisProps) {
  const totalNFTs = nfts.length;

  // Get the first NFT alphabetically by token name as fallback
  const firstNFTAlphabetically = React.useMemo(() => {
    if (!nfts || nfts.length === 0) return null;

    return [...nfts]
      .filter(nft => nft && nft.token_name) // Filter out invalid NFTs
      .sort((a, b) => {
        const nameA = a.token_name?.toLowerCase() || '';
        const nameB = b.token_name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      })[0];
  }, [nfts]);

  // Use selected NFT or fall back to first alphabetically
  const displayNFT = selectedNFT || firstNFTAlphabetically;

  if (totalNFTs === 0 || !displayNFT) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
          <p className="text-muted-foreground">
            This wallet doesn&apos;t have any NFTs or they haven&apos;t been
            loaded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const explorerUrl = `https://explorer.aptoslabs.com/account/${displayNFT.token_data_id}?network=mainnet`;
  const imageUrl = displayNFT.cdn_image_uri || displayNFT.token_uri;

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(parseInt(timestamp) / 1000).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Card 
      className={selectedNFT && onClearSelection ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
      onClick={selectedNFT && onClearSelection ? onClearSelection : undefined}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          {selectedNFT ? displayNFT.token_name : 'Featured NFT'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* NFT Image */}
        <div className="aspect-square rounded-lg overflow-hidden border bg-muted/50 relative max-w-sm mx-auto">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayNFT.token_name}
              fill
              sizes="(max-width: 768px) 100vw, 384px"
              className="object-cover"
              onError={e => {
                const img = e.currentTarget as HTMLImageElement;
                img.src = '/placeholder.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Grid3X3 className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          {displayNFT.amount > 1 && (
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-sm font-medium">
              x{displayNFT.amount}
            </div>
          )}
        </div>

        {/* Comprehensive NFT Details */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">{displayNFT.token_name}</h3>
            <p
              className="text-lg text-muted-foreground truncate max-w-[300px] mx-auto"
              title={displayNFT.collection_name}
            >
              {displayNFT.collection_name}
            </p>
          </div>

          {/* Description */}
          {displayNFT.description && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {displayNFT.description}
              </p>
            </div>
          )}

          {/* Collection Description */}
          {displayNFT.collection_description && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Collection Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {displayNFT.collection_description}
              </p>
            </div>
          )}

          {/* Technical Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Technical Details</h4>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Token Data ID:</span>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              displayNFT.token_data_id
                            );
                            toast.success('Token Data ID copied to clipboard');
                          }}
                          className="font-mono text-xs break-all max-w-[200px] text-right hover:text-primary transition-colors cursor-pointer"
                        >
                          {displayNFT.token_data_id}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to copy</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            window.open(
                              `https://explorer.aptoslabs.com/object/${displayNFT.token_data_id}?network=mainnet`,
                              '_blank'
                            );
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View in Explorer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {displayNFT.creator_address && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Creator:</span>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                displayNFT.creator_address!
                              );
                              toast.success(
                                'Creator address copied to clipboard'
                              );
                            }}
                            className="font-mono text-xs break-all max-w-[200px] text-right hover:text-primary transition-colors cursor-pointer"
                          >
                            {displayNFT.creator_address}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to copy</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              window.open(
                                `https://explorer.aptoslabs.com/account/${displayNFT.creator_address}?network=mainnet`,
                                '_blank'
                              );
                            }}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View in Explorer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
