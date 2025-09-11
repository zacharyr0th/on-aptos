"use client";

import { ChevronRight, Image as ImageIcon, Layers, Wallet } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

interface SidebarTab {
  id: "tokens" | "nfts" | "defi";
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface NewSidebarProps {
  // Data
  assets?: any[];
  nfts?: any[];
  defiPositions?: any[];

  // Loading states
  assetsLoading?: boolean;
  nftsLoading?: boolean;
  defiLoading?: boolean;

  // Selection
  selectedAsset?: any;
  selectedNFT?: any;
  selectedDeFi?: any;

  // Callbacks
  onAssetSelect?: (asset: any) => void;
  onNFTSelect?: (nft: any) => void;
  onDeFiSelect?: (defi: any) => void;

  // Metadata
  totalValue?: number;
  totalNFTCount?: number | null;

  className?: string;
}

export function NewSidebar({
  assets = [],
  nfts = [],
  defiPositions = [],
  assetsLoading = false,
  nftsLoading = false,
  defiLoading = false,
  selectedAsset,
  selectedNFT,
  selectedDeFi,
  onAssetSelect,
  onNFTSelect,
  onDeFiSelect,
  totalValue = 0,
  totalNFTCount,
  className,
}: NewSidebarProps) {
  const [activeTab, setActiveTab] = useState<"tokens" | "nfts" | "defi">("tokens");

  const tabs: SidebarTab[] = [
    {
      id: "tokens",
      label: "Tokens",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      id: "nfts",
      label: "NFTs",
      icon: <ImageIcon className="h-4 w-4" />,
    },
    {
      id: "defi",
      label: "DeFi",
      icon: <Layers className="h-4 w-4" />,
    },
  ];

  // Use data directly without filtering
  const filteredAssets = assets;
  const filteredNFTs = nfts;
  const filteredDeFi = defiPositions;

  const renderTokenItem = (asset: any) => {
    const isSelected = selectedAsset?.asset_type === asset.asset_type;
    const symbol = asset.metadata?.symbol || asset.symbol || "Unknown";
    const name = asset.metadata?.name || asset.name || "Unknown Token";
    const logoUrl = asset.logoUrl || asset.metadata?.icon_uri;

    return (
      <button
        key={asset.asset_type || asset.fa_address || asset.token_address}
        onClick={() => onAssetSelect?.(asset)}
        className={cn(
          "w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg",
          isSelected && "bg-muted"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {logoUrl ? (
              <>
                <Image
                  src={logoUrl}
                  alt={symbol}
                  width={32}
                  height={32}
                  className={cn("rounded-full", symbol === "APT" && "dark:invert")}
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.parentElement?.querySelector(
                      ".fallback-text"
                    ) as HTMLElement;
                    if (fallback) {
                      fallback.style.display = "flex";
                    }
                  }}
                />
                <span
                  className="fallback-text text-xs font-medium absolute inset-0 flex items-center justify-center"
                  style={{ display: "none" }}
                >
                  {symbol.substring(0, 2).toUpperCase()}
                </span>
              </>
            ) : (
              <span className="text-xs font-medium">{symbol.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="text-left min-w-0">
            <p className="font-medium text-sm truncate">{symbol}</p>
            <p className="text-xs text-muted-foreground truncate">{name}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium">{formatCurrency(asset.value || 0)}</p>
          <p className="text-xs text-muted-foreground">
            {typeof asset.balance === "number" ? asset.balance.toFixed(2) : "0.00"} {symbol}
          </p>
        </div>
      </button>
    );
  };

  const renderNFTItem = (nft: any) => {
    const isSelected = selectedNFT?.token_data_id === nft.token_data_id;

    return (
      <button
        key={nft.token_data_id}
        onClick={() => onNFTSelect?.(nft)}
        className={cn(
          "w-full p-2 hover:bg-muted/50 transition-colors rounded-lg",
          isSelected && "bg-muted"
        )}
      >
        <div className="aspect-square w-full rounded-lg bg-muted overflow-hidden mb-2">
          {nft.cdn_image_uri ? (
            <img
              src={nft.cdn_image_uri}
              alt={nft.token_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <p className="text-xs font-medium truncate">{nft.token_name || "Unnamed"}</p>
        <p className="text-xs text-muted-foreground truncate">{nft.collection_name || "Unknown"}</p>
      </button>
    );
  };

  const renderDeFiItem = (defi: any) => {
    const isSelected = selectedDeFi === defi;

    return (
      <button
        key={`${defi.protocol}-${defi.type}-${defi.totalValueUSD}`}
        onClick={() => onDeFiSelect?.(defi)}
        className={cn(
          "w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg",
          isSelected && "bg-muted"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div className="text-left min-w-0">
            <p className="font-medium text-sm truncate">{defi.protocol}</p>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {defi.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {defi.positions?.length || 1} position{defi.positions?.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium">{formatCurrency(defi.totalValueUSD || 0)}</p>
        </div>
      </button>
    );
  };

  const renderContent = () => {
    if (activeTab === "tokens") {
      if (assetsLoading) {
        return (
          <div className="space-y-2 px-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        );
      }

      if (filteredAssets.length === 0) {
        return (
          <div className="text-center py-8 text-sm text-muted-foreground">No tokens in wallet</div>
        );
      }

      return <div className="space-y-1 px-3">{filteredAssets.map(renderTokenItem)}</div>;
    }

    if (activeTab === "nfts") {
      if (nftsLoading) {
        return (
          <div className="grid grid-cols-2 gap-2 px-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        );
      }

      if (filteredNFTs.length === 0) {
        return (
          <div className="text-center py-8 text-sm text-muted-foreground">No NFTs in wallet</div>
        );
      }

      return <div className="grid grid-cols-2 gap-2 px-3">{filteredNFTs.map(renderNFTItem)}</div>;
    }

    if (activeTab === "defi") {
      if (defiLoading) {
        return (
          <div className="space-y-2 px-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        );
      }

      if (filteredDeFi.length === 0) {
        return (
          <div className="text-center py-8 text-sm text-muted-foreground">No DeFi positions</div>
        );
      }

      return <div className="space-y-1 px-3">{filteredDeFi.map(renderDeFiItem)}</div>;
    }

    return null;
  };

  return (
    <div className={cn("flex flex-col h-full bg-inherit", className)}>
      {/* Tab navigation */}
      <div className="border-b">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-medium transition-colors relative",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 text-xs">({tab.count})</span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <ScrollArea className="flex-1">
        <div className="py-1">{renderContent()}</div>
      </ScrollArea>
    </div>
  );
}
