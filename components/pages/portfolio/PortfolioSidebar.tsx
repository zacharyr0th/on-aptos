"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import React, { useState, useMemo, memo, useCallback } from "react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTokenAmount } from "@/lib/utils/format";
import { getTokenLogoUrlWithFallbackSync } from "@/lib/utils/token/token-utils";

interface PortfolioSidebarProps {
  sidebarView: "assets" | "nfts";
  setSidebarView: (view: "assets" | "nfts") => void;
  visibleAssets: any[];
  selectedAsset: any;
  handleAssetSelect: (asset: any) => void;
  nfts: any[];
  dataLoading: boolean;
  nftsLoading: boolean;
  defiLoading: boolean;
  selectedNFT: any;
  setSelectedNFT: (nft: any) => void;
  groupedDeFiPositions: any[];
  selectedDeFiPosition: any;
  getProtocolLogo: (protocol: string) => string;
  handleDeFiPositionSelect: (position: any) => void;
  hideFilteredAssets: boolean;
  setHideFilteredAssets: (hide: boolean) => void;
  totalNFTCount?: number | null;
  [key: string]: any; // Allow additional props
}

export const PortfolioSidebar = memo(
  ({
    sidebarView,
    setSidebarView,
    visibleAssets,
    selectedAsset,
    handleAssetSelect,
    nfts,
    dataLoading,
    nftsLoading,
    defiLoading,
    selectedNFT,
    setSelectedNFT,
    groupedDeFiPositions,
    selectedDeFiPosition,
    getProtocolLogo,
    handleDeFiPositionSelect,
    hideFilteredAssets,
    setHideFilteredAssets,
    totalNFTCount,
  }: PortfolioSidebarProps) => {
    const [nftSearch, setNftSearch] = useState("");

    // Optimized NFT filtering with memoization
    const filteredNFTs = useMemo(() => {
      if (!nftSearch || !nfts) return nfts;
      const query = nftSearch.toLowerCase();
      return nfts.filter(
        (nft) =>
          nft.token_name?.toLowerCase().includes(query) ||
          nft.collection_name?.toLowerCase().includes(query),
      );
    }, [nfts, nftSearch]);

    // Memoize APT token and sorted tokens
    const { aptToken, otherTokens } = useMemo(() => {
      const apt = visibleAssets?.find(
        (t) => t.asset_type === "0x1::aptos_coin::AptosCoin",
      );
      const others =
        visibleAssets
          ?.filter((t) => t.asset_type !== "0x1::aptos_coin::AptosCoin")
          ?.sort((a, b) => (b.value || 0) - (a.value || 0)) || [];
      return { aptToken: apt, otherTokens: others };
    }, [visibleAssets]);

    // Memoize callbacks
    const handleToggleHideAssets = useCallback(() => {
      setHideFilteredAssets?.(!hideFilteredAssets);
    }, [setHideFilteredAssets, hideFilteredAssets]);

    const handleNftSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setNftSearch(e.target.value);
      },
      [],
    );

    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between pb-2">
          <div className="flex gap-8">
            {[
              ["assets", "Tokens", visibleAssets?.length || 0],
              ["nfts", "NFTs", totalNFTCount ?? (nfts?.length || 0)],
            ].map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setSidebarView(key as "assets" | "nfts")}
                className={cn(
                  "pb-2 border-b-2",
                  sidebarView === key
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground",
                )}
              >
                {label} ({count})
              </button>
            ))}
          </div>
          {sidebarView === "assets" && setHideFilteredAssets !== undefined && (
            <button onClick={handleToggleHideAssets} className="p-2">
              {hideFilteredAssets ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarView === "assets" &&
            (dataLoading ? (
              <div className="p-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 mb-2" />
                ))}
              </div>
            ) : (
              <>
                {aptToken && (
                  <TokenRow
                    token={aptToken}
                    isSelected={
                      selectedAsset?.asset_type === aptToken.asset_type
                    }
                    onClick={() => handleAssetSelect(aptToken)}
                  />
                )}
                {otherTokens.map((token, i) => (
                  <TokenRow
                    key={i}
                    token={token}
                    isSelected={selectedAsset?.asset_type === token.asset_type}
                    onClick={() => handleAssetSelect(token)}
                  />
                ))}
              </>
            ))}

          {sidebarView === "nfts" && (
            <div className="p-4">
              <Input
                placeholder="Search NFTs..."
                value={nftSearch}
                onChange={handleNftSearchChange}
                className="mb-4"
              />
              <div className="grid grid-cols-2 gap-3">
                {(nftsLoading ? [...Array(6)] : filteredNFTs || []).map(
                  (nft, i) =>
                    nftsLoading ? (
                      <Skeleton key={i} className="aspect-square" />
                    ) : (
                      <div
                        key={i}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden cursor-pointer border",
                          selectedNFT?.token_data_id === nft.token_data_id
                            ? "border-primary"
                            : "border-border",
                        )}
                        onClick={() => setSelectedNFT(nft)}
                      >
                        <Image
                          src={nft.cdn_image_uri || "/placeholder.jpg"}
                          alt="NFT"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ),
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

PortfolioSidebar.displayName = "PortfolioSidebar";

// Memoized TokenRow component for better performance
interface TokenRowProps {
  token: any;
  isSelected: boolean;
  onClick: () => void;
}

const TokenRow = memo(({ token, isSelected, onClick }: TokenRowProps) => {
  const symbol = token.metadata?.symbol || "Unknown";
  const name = token.metadata?.name || "Unknown";
  const decimals = token.metadata?.decimals;

  // Memoize formatted values
  const formattedValue = useMemo(
    () => formatCurrency(token.value || 0),
    [token.value],
  );
  const formattedBalance = useMemo(
    () =>
      formatTokenAmount(token.balance || 0, decimals, {
        showSymbol: false,
        useCompact: true,
        maximumFractionDigits: 4,
        minimumFractionDigits: 0,
      }),
    [token.balance, decimals, symbol],
  );

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50",
        isSelected && "bg-muted",
      )}
      onClick={onClick}
    >
      <Image
        src={
          token.logoUrl ||
          getTokenLogoUrlWithFallbackSync(token.asset_type, token.metadata)
        }
        alt=""
        width={40}
        height={40}
        className={cn(
          "rounded-full",
          token.asset_type === "0x1::aptos_coin::AptosCoin" && "dark:invert",
        )}
      />
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="font-medium">{symbol}</span>
          <span className="font-mono text-sm">{formattedValue}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{name}</span>
          <span className="font-mono">{formattedBalance}</span>
        </div>
      </div>
    </div>
  );
});

TokenRow.displayName = "TokenRow";
