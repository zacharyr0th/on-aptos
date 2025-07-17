'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ImageIcon,
  Search,
  Filter,
  Grid3X3,
  LayoutGrid,
  List,
  SortAsc,
  SortDesc,
  TrendingUp,
  Clock,
  Hash,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NFT } from './types';

interface EnhancedNFTGridProps {
  nfts: NFT[] | null;
  nftsLoading: boolean;
  selectedNFT: NFT | null;
  onNFTSelect: (nft: NFT) => void;
}

type ViewMode = 'grid' | 'list' | 'compact';
type SortOption = 'name' | 'collection' | 'recent' | 'amount';

export const EnhancedNFTGrid = ({
  nfts,
  nftsLoading,
  selectedNFT,
  onNFTSelect,
}: EnhancedNFTGridProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Get unique collections
  const collections = useMemo(() => {
    if (!nfts) return [];
    const uniqueCollections = [...new Set(nfts.map(nft => nft.collection_name))];
    return uniqueCollections.filter(Boolean).sort();
  }, [nfts]);

  // Collection stats
  const collectionStats = useMemo(() => {
    if (!nfts) return {};
    
    return nfts.reduce((acc, nft) => {
      const collection = nft.collection_name || 'Unknown';
      if (!acc[collection]) {
        acc[collection] = { count: 0, totalAmount: 0 };
      }
      acc[collection].count += 1;
      acc[collection].totalAmount += nft.amount || 1;
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);
  }, [nfts]);

  // Filter and sort NFTs
  const filteredAndSortedNFTs = useMemo(() => {
    if (!nfts) return [];

    let filtered = nfts.filter(nft => {
      const matchesSearch = !searchQuery || 
        nft.token_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.collection_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCollection = selectedCollection === 'all' || 
        nft.collection_name === selectedCollection;

      return matchesSearch && matchesCollection;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.token_name || '').localeCompare(b.token_name || '');
          break;
        case 'collection':
          comparison = (a.collection_name || '').localeCompare(b.collection_name || '');
          break;
        case 'recent':
          comparison = parseInt(b.last_transaction_timestamp || '0') - 
                      parseInt(a.last_transaction_timestamp || '0');
          break;
        case 'amount':
          comparison = (b.amount || 1) - (a.amount || 1);
          break;
      }
      
      return sortAsc ? comparison : -comparison;
    });

    return filtered;
  }, [nfts, searchQuery, selectedCollection, sortBy, sortAsc]);

  const renderNFTCard = (nft: NFT, index: number) => {
    const isSelected = selectedNFT?.token_data_id === nft.token_data_id;
    const imageUrl = nft.cdn_image_uri || nft.token_uri || '/placeholder.jpg';

    if (viewMode === 'list') {
      return (
        <div
          key={`${nft.token_data_id}-${index}`}
          className={cn(
            "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
            "hover:bg-muted/50 hover:border-primary/50",
            isSelected && "border-primary bg-primary/5"
          )}
          onClick={() => onNFTSelect(nft)}
        >
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={imageUrl}
              alt={nft.token_name || 'NFT'}
              fill
              sizes="64px"
              className="object-cover"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.src = '/placeholder.jpg';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{nft.token_name || 'Unnamed'}</p>
            <p className="text-sm text-muted-foreground truncate">
              {nft.collection_name || 'Unknown Collection'}
            </p>
          </div>
          {nft.amount > 1 && (
            <Badge variant="secondary">×{nft.amount}</Badge>
          )}
        </div>
      );
    }

    return (
      <div
        key={`${nft.token_data_id}-${index}`}
        className={cn(
          "group relative rounded-xl border bg-card overflow-hidden cursor-pointer transition-all duration-200",
          "hover:shadow-lg hover:border-primary/50 hover:-translate-y-1",
          isSelected && "ring-2 ring-primary ring-offset-2",
          viewMode === 'compact' && "aspect-square"
        )}
        onClick={() => onNFTSelect(nft)}
      >
        <div className={cn(
          "relative overflow-hidden bg-muted",
          viewMode === 'grid' ? "aspect-square" : "aspect-[4/3]"
        )}>
          <Image
            src={imageUrl}
            alt={nft.token_name || 'NFT'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
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
        {viewMode !== 'compact' && (
          <div className="p-4">
            <h3 className="font-semibold truncate" title={nft.token_name}>
              {nft.token_name || 'Unnamed NFT'}
            </h3>
            <p className="text-sm text-muted-foreground truncate" title={nft.collection_name}>
              {nft.collection_name || 'Unknown Collection'}
            </p>
          </div>
        )}
      </div>
    );
  };

  const totalNFTs = nfts?.length || 0;
  const totalCollections = collections.length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total NFTs</p>
                <p className="text-2xl font-bold">{totalNFTs}</p>
              </div>
              <Hash className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collections</p>
                <p className="text-2xl font-bold">{totalCollections}</p>
              </div>
              <Grid3X3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Items</p>
                <p className="text-2xl font-bold">
                  {nfts?.filter(n => n.amount === 1).length || 0}
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Multiple Editions</p>
                <p className="text-2xl font-bold">
                  {nfts?.filter(n => n.amount > 1).length || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search NFTs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCollection} onValueChange={setSelectedCollection}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Collections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collections.map(collection => (
              <SelectItem key={collection} value={collection}>
                {collection} ({collectionStats[collection]?.count || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="collection">Collection</SelectItem>
            <SelectItem value="recent">Recent Activity</SelectItem>
            <SelectItem value="amount">Quantity</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortAsc(!sortAsc)}
        >
          {sortAsc ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </Button>
        
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('compact')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* NFT Grid/List */}
      {nftsLoading ? (
        <div className={cn(
          viewMode === 'list' ? "space-y-3" : "grid gap-4",
          viewMode === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          viewMode === 'compact' && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        )}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={viewMode === 'list' ? "flex items-center gap-4 p-4" : "space-y-2"}>
              <Skeleton className={cn(
                viewMode === 'list' ? "w-16 h-16 rounded-lg" : "aspect-square rounded-xl"
              )} />
              {viewMode !== 'compact' && (
                <div className={viewMode === 'list' ? "flex-1 space-y-2" : "space-y-2"}>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : filteredAndSortedNFTs.length > 0 ? (
        <div className={cn(
          viewMode === 'list' ? "space-y-2" : "grid gap-4",
          viewMode === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          viewMode === 'compact' && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        )}>
          {filteredAndSortedNFTs.map((nft, index) => renderNFTCard(nft, index))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No NFTs Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || selectedCollection !== 'all' 
                ? "Try adjusting your filters or search query" 
                : "This wallet doesn't have any NFTs yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};