'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NFT } from './types';

interface VirtualizedNFTGridProps {
  nfts: NFT[] | null;
  nftsLoading: boolean;
  selectedNFT: NFT | null;
  onNFTSelect: (nft: NFT) => void;
}

type ViewMode = 'grid' | 'list' | 'compact';
type SortOption = 'name' | 'collection' | 'recent' | 'amount';

const PAGE_SIZE = 50;

export const VirtualizedNFTGrid = ({
  nfts,
  nftsLoading,
  selectedNFT,
  onNFTSelect,
}: VirtualizedNFTGridProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Get unique collections with virtualized list for dropdown
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

  // Simulate paginated data fetching for virtual scrolling
  const fetchNFTsPage = useCallback(async ({ pageParam = 0 }) => {
    const start = pageParam * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = filteredAndSortedNFTs.slice(start, end);
    
    return {
      data: pageData,
      nextCursor: end < filteredAndSortedNFTs.length ? pageParam + 1 : undefined,
    };
  }, [filteredAndSortedNFTs]);

  // Use infinite query for virtual scrolling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['nfts', searchQuery, selectedCollection, sortBy, sortAsc, filteredAndSortedNFTs.length],
    queryFn: fetchNFTsPage,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !nftsLoading && !!nfts,
    staleTime: Infinity,
  });

  const allNFTs = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  // Calculate grid dimensions based on view mode
  const getItemsPerRow = () => {
    if (viewMode === 'list') return 1;
    if (viewMode === 'compact') return 6;
    return 4; // grid mode
  };

  const itemsPerRow = getItemsPerRow();
  const rowCount = Math.ceil(allNFTs.length / itemsPerRow);

  // Virtual row renderer for grid/compact views
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => gridContainerRef.current,
    estimateSize: () => viewMode === 'compact' ? 200 : 280,
    overscan: 5,
  });

  // Virtual item renderer for list view
  const listVirtualizer = useVirtualizer({
    count: allNFTs.length,
    getScrollElement: () => listContainerRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  // Load more when scrolling near the end
  React.useEffect(() => {
    const lastItem = viewMode === 'list' 
      ? listVirtualizer.getVirtualItems().slice(-1)[0]
      : rowVirtualizer.getVirtualItems().slice(-1)[0];

    if (!lastItem) return;

    const lastIndex = viewMode === 'list' ? lastItem.index : lastItem.index * itemsPerRow;
    
    if (
      lastIndex >= allNFTs.length - itemsPerRow * 2 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allNFTs.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
    listVirtualizer.getVirtualItems(),
    viewMode,
    itemsPerRow,
  ]);

  const renderNFTCard = (nft: NFT, index: number) => {
    const isSelected = selectedNFT?.token_data_id === nft.token_data_id;
    const imageUrl = nft.cdn_image_uri || nft.token_uri || '/placeholder.jpg';

    if (viewMode === 'list') {
      return (
        <div
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
        
        {/* Collection selector with Command for virtualization */}
        <Popover open={collectionOpen} onOpenChange={setCollectionOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={collectionOpen}
              className="w-full sm:w-[200px] justify-between"
            >
              {selectedCollection === 'all' 
                ? "All Collections" 
                : collections.find(c => c === selectedCollection) || "Select collection..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search collections..." />
              <CommandList>
                <CommandEmpty>No collection found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setSelectedCollection('all');
                      setCollectionOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCollection === 'all' ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Collections
                  </CommandItem>
                  {collections.map((collection) => (
                    <CommandItem
                      key={collection}
                      value={collection}
                      onSelect={(currentValue) => {
                        setSelectedCollection(currentValue === selectedCollection ? 'all' : currentValue);
                        setCollectionOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCollection === collection ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{collection}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {collectionStats[collection]?.count || 0}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
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

      {/* Virtualized NFT Grid/List */}
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
      ) : allNFTs.length > 0 ? (
        viewMode === 'list' ? (
          <div
            ref={listContainerRef}
            className="h-[600px] overflow-auto space-y-2"
          >
            <div
              style={{
                height: `${listVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {listVirtualizer.getVirtualItems().map((virtualItem) => {
                const nft = allNFTs[virtualItem.index];
                if (!nft) return null;
                
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {renderNFTCard(nft, virtualItem.index)}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            ref={gridContainerRef}
            className="h-[600px] overflow-auto"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const startIndex = virtualRow.index * itemsPerRow;
                const endIndex = Math.min(startIndex + itemsPerRow, allNFTs.length);
                const rowNFTs = allNFTs.slice(startIndex, endIndex);
                
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className={cn(
                      "grid gap-4 h-full",
                      viewMode === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                      viewMode === 'compact' && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
                    )}>
                      {rowNFTs.map((nft, idx) => (
                        <div key={`${nft.token_data_id}-${startIndex + idx}`}>
                          {renderNFTCard(nft, startIndex + idx)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Loading more...
                </div>
              </div>
            )}
          </div>
        )
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