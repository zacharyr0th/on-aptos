"use client";

import { GeistMono } from "geist/font/mono";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import React, { useRef, useEffect } from "react";

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
import { formatCurrency, formatTokenAmount } from "@/lib/utils/format/format";
import {
  sanitizeNFTMetadata,
  sanitizeImageUrl,
  sanitizeText,
  safeWindowOpen,
} from "@/lib/utils/core/security";
import { getTokenLogoUrlWithFallbackSync } from "@/lib/utils/token/token-utils";

import { DeFiSummaryView, NFTSummaryView } from "./SummaryViews";
import { TokenChart } from "./TokenChart";
import { TransactionHistoryTable } from "./TransactionHistoryTable";
import {
  cleanProtocolName,
  getProtocolLogo,
  getDetailedProtocolInfo,
} from "./shared/PortfolioMetrics";
import { WalletSummary } from "./WalletSummary";
import { YieldTable } from "./YieldTable";

interface PortfolioMainContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedAsset: any;
  handleAssetSelect: (asset: any) => void;
  selectedDeFiPosition: any;
  handleDeFiPositionSelect: (position: any) => void;
  selectedNFT: any;
  setSelectedNFT: (nft: any) => void;
  sidebarView: string;
  setSidebarView: (view: "assets" | "nfts" | "defi") => void;
  nfts: any[];
  currentNFTs: any[];
  normalizedAddress: string;
  assets: any[];
  groupedDeFiPositions: any[];
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
  selectedDeFiPosition,
  handleDeFiPositionSelect,
  selectedNFT,
  setSelectedNFT,
  sidebarView,
  setSidebarView,
  nfts,
  currentNFTs,
  normalizedAddress,
  assets,
  groupedDeFiPositions,
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
  const defiDetailRef = useRef<HTMLDivElement>(null);

  // Summary view refs for click-outside handling
  const nftSummaryRef = useClickOutside(
    () => {
      if (sidebarView === "nfts") {
        // Reset to default portfolio view
        setSidebarView("assets");
        handleAssetSelect(null);
        setSelectedNFT(null);
        handleDeFiPositionSelect(null);
      }
    },
    sidebarView === "nfts" && !selectedNFT,
  );

  const defiSummaryRef = useClickOutside(
    () => {
      if (sidebarView === "defi") {
        // Reset to default portfolio view
        setSidebarView("assets");
        handleAssetSelect(null);
        setSelectedNFT(null);
        handleDeFiPositionSelect(null);
      }
    },
    sidebarView === "defi" && !selectedDeFiPosition,
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

      // DeFi detail view
      if (
        selectedDeFiPosition &&
        defiDetailRef.current &&
        !defiDetailRef.current.contains(event.target as Node)
      ) {
        const sidebar = document.querySelector("[data-defi-table]");
        if (sidebar && sidebar.contains(event.target as Node)) {
          return;
        }
        handleDeFiPositionSelect(null);
        setSidebarView("assets");
      }
    };

    if (selectedNFT || selectedAsset || selectedDeFiPosition) {
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
    selectedDeFiPosition,
    handleDeFiPositionSelect,
    setSidebarView,
  ]);

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="flex flex-col"
      >
        <div className="flex-shrink-0 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex justify-between items-center">
            <TabsList className="bg-transparent p-0 h-auto border-none">
              <TabsTrigger
                value="portfolio"
                className="rounded-none px-0 pb-2 pt-0 h-auto bg-transparent shadow-none border-b-2 border-transparent data-[state=active]:border-foreground text-sm lg:text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                Portfolio
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="rounded-none px-0 pb-2 pt-0 h-auto bg-transparent shadow-none border-b-2 border-transparent data-[state=active]:border-foreground text-sm lg:text-base font-normal text-muted-foreground data-[state=active]:text-foreground ml-8"
              >
                Transactions
              </TabsTrigger>
              <TabsTrigger
                value="yield"
                className="rounded-none px-0 pb-2 pt-0 h-auto bg-transparent shadow-none border-b-2 border-transparent data-[state=active]:border-foreground text-sm lg:text-base font-normal text-muted-foreground data-[state=active]:text-foreground ml-8"
              >
                Yields
              </TabsTrigger>
            </TabsList>
            <div className="hidden lg:block">
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-0.5">
                  Portfolio Value
                </p>
                <p className="text-xl font-mono text-foreground font-bold">
                  {formatCurrency(
                    portfolioMetrics?.totalPortfolioValue || 0,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <TabsContent value="portfolio" className="m-0">
            <div>
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
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full"
                    >
                      {/* Left Side - NFT Image */}
                      <div className="flex justify-center h-full">
                        <div className="relative aspect-square w-full h-full max-h-[500px] bg-neutral-50 dark:bg-neutral-950 rounded-lg overflow-hidden">
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
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedNFT(null);
                              setSidebarView("assets");
                            }}
                            className="text-muted-foreground hover:text-foreground"
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
                          Object.keys(selectedNFT.token_properties).length > 0 && (
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
                <div ref={assetDetailRef} className="h-full">
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleAssetSelect(null);
                        setSidebarView("assets");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Portfolio
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    {/* Left Side - Token Info */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Image
                          src={getTokenLogoUrlWithFallbackSync(
                            selectedAsset.symbol,
                            selectedAsset.token_address ||
                              selectedAsset.fa_address,
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
                              selectedAsset.amount,
                              selectedAsset.decimals,
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
                          onClick={() =>
                            safeWindowOpen(selectedAsset.websiteUrl)
                          }
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
                          selectedAsset.token_address ||
                          selectedAsset.fa_address
                        }
                        currentPrice={selectedAsset.price || 0}
                      />
                    </div>
                  </div>
                </div>
              ) : selectedDeFiPosition ? (
                <div ref={defiDetailRef}>
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleDeFiPositionSelect(null);
                        setSidebarView("assets");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Portfolio
                    </Button>
                  </div>

                  <DeFiSummaryView
                    selectedDeFiPosition={selectedDeFiPosition}
                    getProtocolLogo={getProtocolLogo}
                    accountNames={accountNames}
                  />
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
              ) : sidebarView === "defi" ? (
                <div ref={defiSummaryRef}>
                  <DeFiSummaryView
                    selectedDeFiPosition={null}
                    getProtocolLogo={getProtocolLogo}
                    accountNames={accountNames}
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
                    pieChartData={pieChartData}
                    pieChartColors={pieChartColors}
                    nfts={nfts}
                    totalNFTCount={totalNFTCount}
                    nftCollectionStats={nftCollectionStats}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="m-0">
            <div>
              <TransactionHistoryTable
                transactions={transactions}
                isLoading={transactionsLoading}
                walletAddress={normalizedAddress}
              />
            </div>
          </TabsContent>

          <TabsContent value="yield" className="m-0">
            <div>
              <YieldTable walletAddress={normalizedAddress} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}