'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Grid3X3, ImageIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { NFT } from './types';

interface NFTSummaryViewProps {
  nfts: NFT[];
  currentPageNFTs: number;
  onCollectionClick?: (collection: string) => void;
}

export const NFTSummaryView: React.FC<NFTSummaryViewProps> = ({
  nfts,
  currentPageNFTs,
  onCollectionClick,
}) => {
  // Calculate collection statistics
  const collections = React.useMemo(() => {
    const collectionMap = nfts.reduce((acc: any, nft) => {
      acc[nft.collection_name] = (acc[nft.collection_name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(collectionMap)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 8);
  }, [nfts]);

  const totalCollections = new Set(nfts.map(nft => nft.collection_name)).size;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            NFT Collection Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total NFTs</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono">{nfts.length}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Collections</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono">{totalCollections}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">This Page</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono">{currentPageNFTs}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Collections */}
      {collections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Top Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {collections.map(([collection, count]) => (
                <div
                  key={collection}
                  className={`flex items-center justify-between p-3 rounded-lg border bg-muted/30 transition-colors ${
                    onCollectionClick ? 'cursor-pointer hover:bg-muted/50' : ''
                  }`}
                  onClick={() => onCollectionClick?.(collection)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-background border flex items-center justify-center">
                      <Grid3X3 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{collection}</p>
                      <p className="text-sm text-muted-foreground">Collection</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      {count as number} NFT{(count as number) > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {nfts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
            <p className="text-muted-foreground">
              This wallet doesn&apos;t have any NFTs or they haven&apos;t been loaded yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};