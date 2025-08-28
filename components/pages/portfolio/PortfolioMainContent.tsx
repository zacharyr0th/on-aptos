"use client";

import { GeistMono } from "geist/font/mono";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import React, { useRef, useEffect, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClickOutside } from "@/hooks";
import { cn } from "@/lib/utils";
import {
  sanitizeNFTMetadata,
  sanitizeImageUrl,
  sanitizeText,
  safeWindowOpen,
} from "@/lib/utils/core/security";
import { formatCurrency, formatTokenAmount } from "@/lib/utils/format";
import { getTokenLogoUrlWithFallbackSync } from "@/lib/utils/token/token-utils";

import {
  cleanProtocolName,
  getProtocolLogo,
  getDetailedProtocolInfo,
} from "./shared/PortfolioMetrics";
import { NFTSummaryView } from "./SummaryViews";
import { TokenChart } from "./TokenChart";
import { TransactionHistoryTable } from "./TransactionHistoryTable";
import { WalletSummary } from "./WalletSummary";
import { YieldTable } from "./YieldTable";

interface PortfolioMainContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedAsset: any;
  handleAssetSelect: (asset: any) => void;
  selectedNFT: any;
  setSelectedNFT: (nft: any) => void;
  sidebarView: string;
  setSidebarView: (view: "assets" | "nfts") => void;
  nfts: any[];
  currentNFTs: any[];
  normalizedAddress: string;
  assets: any[];
  portfolioMetrics: any;
  dataLoading: boolean;
  pieChartData: any;
  pieChartColors: any;
  setHoveredCollection: (collection: any) => void;
  setProtocolDetailsOpen: (open: boolean) => void;
  accountNames?: string[] | null;
  totalNFTCount?: number | null;
  nftCollectionStats?: {
    collections: Array<{ name: string; count: number }>;
    totalCollections: number;
  } | null;
  defiPositions?: any[];
  transactions?: any[] | null;
  transactionsLoading?: boolean;
}

export function PortfolioMainContent({
  activeTab,
  setActiveTab,
  selectedAsset,
  handleAssetSelect,
  selectedNFT,
  setSelectedNFT,
  sidebarView,
  setSidebarView,
  nfts,
  currentNFTs,
  normalizedAddress,
  assets,
  portfolioMetrics,
  dataLoading,
  pieChartData,
  pieChartColors,
  accountNames,
  setHoveredCollection,
  setProtocolDetailsOpen,
  totalNFTCount,
  nftCollectionStats,
  defiPositions,
  transactions,
  transactionsLoading,
}: PortfolioMainContentProps) {
  const nftDetailRef = useRef<HTMLDivElement>(null);
  const assetDetailRef = useRef<HTMLDivElement>(null);

  // Summary view refs for click-outside handling
  const nftSummaryRef = useClickOutside(
    () => {
      if (sidebarView === "nfts") {
        // Reset to default portfolio view
        setSidebarView("assets");
        handleAssetSelect(null);
        setSelectedNFT(null);
      }
    },
    sidebarView === "nfts" && !selectedNFT,
  );

  // Handle click outside to close detail views
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // NFT detail view
      if (
        selectedNFT &&
        nftDetailRef.current &&
        !nftDetailRef.current.contains(event.target as Node)
      ) {
        const sidebar = document.querySelector("[data-nft-grid]");
        if (sidebar && sidebar.contains(event.target as Node)) {
          return;
        }
        setSelectedNFT(null);
        setSidebarView("assets");
      }

      // Asset detail view
      if (
        selectedAsset &&
        assetDetailRef.current &&
        !assetDetailRef.current.contains(event.target as Node)
      ) {
        const sidebar = document.querySelector("[data-asset-table]");
        if (sidebar && sidebar.contains(event.target as Node)) {
          return;
        }
        handleAssetSelect(null);
        setSidebarView("assets");
      }
    };

    if (selectedNFT || selectedAsset) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [
    selectedNFT,
    setSelectedNFT,
    selectedAsset,
    handleAssetSelect,
    setSidebarView,
  ]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between pb-2">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("portfolio")}
            className={cn(
              "pb-2 border-b-2",
              activeTab === "portfolio"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={cn(
              "pb-2 border-b-2",
              activeTab === "transactions"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab("yield")}
            className={cn(
              "pb-2 border-b-2",
              activeTab === "yield"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            Yields
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "portfolio" && (
          <div className="h-full overflow-auto">
            {/* Show NFT Details if NFT is selected */}
            {selectedNFT ? (
              (() => {
                // Sanitize NFT metadata for safe display
                const sanitizedNFT = sanitizeNFTMetadata(selectedNFT);
                const imageUrl = sanitizeImageUrl(
                  selectedNFT.cdn_image_uri || selectedNFT.token_uri,
                  "/placeholder.jpg",
                );

                return (
                  <div
                    ref={nftDetailRef}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-full overflow-y-auto lg:overflow-hidden"
                  >
                    {/* Left Side - NFT Image */}
                    <div className="flex justify-center h-auto lg:h-full">
                      <div className="relative aspect-square w-full max-w-md lg:max-w-none lg:h-full lg:max-h-[500px] bg-neutral-50 dark:bg-neutral-950 rounded-lg overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={sanitizedNFT.token_name || "NFT"}
                          fill
                          className="object-contain"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          priority
                        />
                      </div>
                    </div>

                    {/* Right Side - NFT Details */}
                    <div className="space-y-4 lg:space-y-6 pb-4 lg:pb-0 lg:overflow-y-auto">
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedNFT(null);
                            setSidebarView("assets");
                          }}
                          className="text-muted-foreground hover:text-foreground touch-target"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Portfolio
                        </Button>
                      </div>

                      <div>
                        <h1 className="text-2xl font-bold mb-2">
                          {sanitizedNFT.token_name || "Unnamed NFT"}
                        </h1>
                        {sanitizedNFT.collection_name && (
                          <p className="text-lg text-muted-foreground">
                            from {sanitizedNFT.collection_name}
                          </p>
                        )}
                      </div>

                      {sanitizedNFT.description && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Description
                          </h3>
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {sanitizeText(sanitizedNFT.description)}
                          </p>
                        </div>
                      )}

                      {/* Properties/Traits */}
                      {selectedNFT.token_properties &&
                        Object.keys(selectedNFT.token_properties).length >
                          0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-3">
                              Properties
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(selectedNFT.token_properties).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="p-3 bg-muted rounded-lg"
                                  >
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                      {sanitizeText(key)}
                                    </div>
                                    <div className="text-sm font-medium mt-1">
                                      {sanitizeText(String(value))}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* Technical Details */}
                      <Accordion type="single" collapsible>
                        <AccordionItem value="details">
                          <AccordionTrigger>Technical Details</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Token Standard:
                                </span>
                                <span className="font-mono">
                                  {selectedNFT.token_standard || "Unknown"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Token Address:
                                </span>
                                <span className="font-mono text-xs break-all">
                                  {selectedNFT.token_data_id}
                                </span>
                              </div>
                              {selectedNFT.property_version && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Property Version:
                                  </span>
                                  <span className="font-mono">
                                    {selectedNFT.property_version}
                                  </span>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      {/* External Links */}
                      <div className="flex gap-2">
                        {selectedNFT.token_uri && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              safeWindowOpen(selectedNFT.token_uri)
                            }
                          >
                            View Metadata
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            safeWindowOpen(
                              `https://explorer.aptoslabs.com/token/${selectedNFT.token_data_id}?network=mainnet`,
                            )
                          }
                        >
                          View on Explorer
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : selectedAsset ? (
              <div
                ref={assetDetailRef}
                className="h-full overflow-y-auto lg:overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleAssetSelect(null);
                      setSidebarView("assets");
                    }}
                    className="text-muted-foreground hover:text-foreground touch-target"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Portfolio
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-auto lg:h-full pb-4 lg:pb-0">
                  {/* Left Side - Token Info */}
                  <div className="space-y-4 lg:space-y-6 lg:overflow-y-auto">
                    <div className="flex items-center gap-4">
                      <Image
                        src={getTokenLogoUrlWithFallbackSync(
                          selectedAsset.token_address ||
                            selectedAsset.fa_address ||
                            "",
                          { symbol: selectedAsset.symbol },
                        )}
                        alt={selectedAsset.name}
                        width={64}
                        height={64}
                        className="rounded-full"
                      />
                      <div>
                        <h1 className="text-2xl font-bold">
                          {selectedAsset.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {selectedAsset.symbol}
                          </Badge>
                          {selectedAsset.bridge && (
                            <Badge variant="outline" className="text-xs">
                              {selectedAsset.bridge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Balance
                        </div>
                        <div className="text-lg font-semibold">
                          {formatTokenAmount(
                            selectedAsset.balance || selectedAsset.amount,
                            selectedAsset.decimals,
                            {
                              showSymbol: true,
                              useCompact: true,
                            },
                          )}
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Value
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(selectedAsset.value || 0)}
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Price
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(selectedAsset.price || 0)}
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Decimals
                        </div>
                        <div className="text-lg font-semibold">
                          {selectedAsset.decimals}
                        </div>
                      </div>
                    </div>

                    {selectedAsset.websiteUrl && (
                      <Button
                        variant="outline"
                        onClick={() => safeWindowOpen(selectedAsset.websiteUrl)}
                      >
                        Visit Website
                      </Button>
                    )}
                  </div>

                  {/* Right Side - Token Chart */}
                  <div className="h-full">
                    <TokenChart
                      tokenSymbol={selectedAsset.symbol}
                      tokenName={selectedAsset.name}
                      tokenAddress={
                        selectedAsset.token_address || selectedAsset.fa_address
                      }
                      currentPrice={selectedAsset.price || 0}
                    />
                  </div>
                </div>
              </div>
            ) : sidebarView === "nfts" ? (
              <div ref={nftSummaryRef}>
                <NFTSummaryView
                  nfts={nfts}
                  totalNFTCount={totalNFTCount}
                  nftCollectionStats={nftCollectionStats}
                  accountNames={accountNames}
                  isLoading={dataLoading}
                  onNFTSelect={setSelectedNFT}
                  selectedNFT={selectedNFT}
                  hasMoreNFTs={false}
                  isLoadingMore={false}
                  loadMoreNFTs={() => {}}
                />
              </div>
            ) : (
              <div>
                <WalletSummary
                  walletAddress={normalizedAddress}
                  assets={assets}
                  totalValue={portfolioMetrics?.totalPortfolioValue || 0}
                  isLoading={dataLoading}
                  selectedAsset={selectedAsset}
                  onAssetSelect={handleAssetSelect}
                  nfts={nfts}
                  totalNFTCount={totalNFTCount}
                  nftCollectionStats={nftCollectionStats}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="h-full">
            <TransactionHistoryTable
              preloadedTransactions={transactions}
              preloadedTransactionsLoading={transactionsLoading}
              walletAddress={normalizedAddress}
              className="h-full"
            />
          </div>
        )}

        {activeTab === "yield" && (
          <div className="h-full">
            <YieldTable walletAddress={normalizedAddress} />
          </div>
        )}
      </div>
    </div>
  );
}
