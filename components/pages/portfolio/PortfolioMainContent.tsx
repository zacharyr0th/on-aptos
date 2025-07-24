'use client';

import { GeistMono } from 'geist/font/mono';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import React, { useRef, useEffect } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatTokenAmount } from '@/lib/utils/format';
import { getTokenLogoUrlWithFallback } from '@/lib/utils/token-logos';

import { AnalyticsDashboard } from './AnalyticsDashboard';
import { DeFiSummaryView, NFTSummaryView } from './SummaryViews';
import { TokenChart } from './TokenChart';
import { TransactionHistoryTable } from './TransactionHistoryTable';
import {
  cleanProtocolName,
  getProtocolLogo,
  getDetailedProtocolInfo,
} from './utils';
import { WalletSummary } from './WalletSummary';



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
  nfts,
  currentNFTs,
  normalizedAddress,
  assets,
  groupedDeFiPositions,
  portfolioMetrics,
  dataLoading,
  pieChartData,
  pieChartColors,
  setHoveredCollection,
  setProtocolDetailsOpen,
  accountNames,
}: PortfolioMainContentProps) {
  const detailedProtocolInfo = selectedDeFiPosition
    ? getDetailedProtocolInfo(selectedDeFiPosition.protocol)
    : null;

  const nftDetailRef = useRef<HTMLDivElement>(null);
  const assetDetailRef = useRef<HTMLDivElement>(null);
  const defiDetailRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close detail views
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // NFT detail view
      if (
        selectedNFT &&
        nftDetailRef.current &&
        !nftDetailRef.current.contains(event.target as Node)
      ) {
        const sidebar = document.querySelector('[data-nft-grid]');
        if (sidebar && sidebar.contains(event.target as Node)) {
          return;
        }
        setSelectedNFT(null);
      }

      // Asset detail view
      if (
        selectedAsset &&
        assetDetailRef.current &&
        !assetDetailRef.current.contains(event.target as Node)
      ) {
        const sidebar = document.querySelector('[data-asset-table]');
        if (sidebar && sidebar.contains(event.target as Node)) {
          return;
        }
        handleAssetSelect(null);
      }

      // DeFi detail view
      if (
        selectedDeFiPosition &&
        defiDetailRef.current &&
        !defiDetailRef.current.contains(event.target as Node)
      ) {
        const sidebar = document.querySelector('[data-defi-table]');
        if (sidebar && sidebar.contains(event.target as Node)) {
          return;
        }
        handleDeFiPositionSelect(null);
      }
    };

    if (selectedNFT || selectedAsset || selectedDeFiPosition) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [
    selectedNFT,
    setSelectedNFT,
    selectedAsset,
    handleAssetSelect,
    selectedDeFiPosition,
    handleDeFiPositionSelect,
  ]);

  return (
    <div className="lg:col-span-3">
      <Tabs
        value={activeTab}
        onValueChange={v => setActiveTab(v as any)}
        className="h-full"
      >
        <div className="w-full pb-3">
          <div className="flex justify-between items-center">
            <TabsList className="w-full flex justify-start gap-8 rounded-none bg-transparent p-0 h-auto border-b border-neutral-200 dark:border-neutral-800">
              <TabsTrigger
                value="portfolio"
                className="rounded-none px-0 pb-3 pt-0 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                Portfolio
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="rounded-none px-0 pb-3 pt-0 h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground border-b-2 border-transparent text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                Transactions
              </TabsTrigger>
              <div className="flex-1"></div>
              <div className="hidden lg:flex items-center">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Portfolio Value
                  </p>
                  <p className="text-lg font-bold font-mono">
                    {formatCurrency(portfolioMetrics?.totalPortfolioValue || 0)}
                  </p>
                </div>
              </div>
            </TabsList>
          </div>
        </div>

        <TabsContent value="portfolio" className="mt-6 p-0">
          <div className="max-h-[calc(100vh-200px)] overflow-hidden">
            {/* Show NFT Details if NFT is selected */}
            {selectedNFT ? (
              <div
                ref={nftDetailRef}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full"
              >
                {/* Left Side - NFT Image */}
                <div className="flex justify-center h-full">
                  <div className="relative aspect-square w-full h-full max-h-[500px] bg-neutral-50 dark:bg-neutral-950 rounded-lg overflow-hidden">
                    <Image
                      src={
                        selectedNFT.cdn_image_uri ||
                        selectedNFT.token_uri ||
                        '/placeholder.jpg'
                      }
                      alt={selectedNFT.token_name || 'NFT'}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </div>
                </div>

                {/* Right Side - NFT Metadata */}
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {selectedNFT.token_name || 'Unnamed NFT'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedNFT.collection_name || 'Unknown Collection'}
                      </p>
                      {selectedNFT.amount > 1 && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Owned: {selectedNFT.amount}
                        </Badge>
                      )}
                    </div>

                    {/* Metadata Accordion - Only one open at a time */}
                    <Accordion type="single" collapsible className="w-full">
                      {/* Basic Information */}
                      <AccordionItem value="basic-info">
                        <AccordionTrigger>Basic Information</AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Token ID
                                </p>
                                <p className="font-mono text-sm break-all">
                                  {selectedNFT.token_data_id}
                                </p>
                              </div>
                              {selectedNFT.description && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Description
                                  </p>
                                  <p className="text-sm">
                                    {selectedNFT.description}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Property Version
                                </p>
                                <p className="font-mono text-sm">
                                  {selectedNFT.property_version_v1}
                                </p>
                              </div>
                            </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Collection Details */}
                      <AccordionItem value="collection-details">
                        <AccordionTrigger>Collection Details</AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Collection Name
                                </p>
                                <p className="font-medium">
                                  {selectedNFT.collection_name || 'Unknown'}
                                </p>
                              </div>
                              {selectedNFT.creator_address && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Creator Address
                                  </p>
                                  <p className="font-mono text-sm break-all">
                                    {selectedNFT.creator_address}
                                  </p>
                                </div>
                              )}
                              {selectedNFT.collection_description && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Collection Description
                                  </p>
                                  <p className="text-sm">
                                    {selectedNFT.collection_description}
                                  </p>
                                </div>
                              )}
                              {selectedNFT.collection_uri && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Collection URI
                                  </p>
                                  <a
                                    href={selectedNFT.collection_uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-sm text-primary hover:underline break-all"
                                  >
                                    {selectedNFT.collection_uri}
                                  </a>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Technical Details */}
                      <AccordionItem value="technical-details">
                        <AccordionTrigger>Technical Details</AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-4">
                              {selectedNFT.token_uri && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Token URI
                                  </p>
                                  <a
                                    href={selectedNFT.token_uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-sm text-primary hover:underline break-all"
                                  >
                                    {selectedNFT.token_uri}
                                  </a>
                                </div>
                              )}
                              {selectedNFT.cdn_image_uri && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    CDN Image URI
                                  </p>
                                  <a
                                    href={selectedNFT.cdn_image_uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-sm text-primary hover:underline break-all"
                                  >
                                    {selectedNFT.cdn_image_uri}
                                  </a>
                                </div>
                              )}
                              {selectedNFT.cdn_animation_uri && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    CDN Animation URI
                                  </p>
                                  <a
                                    href={selectedNFT.cdn_animation_uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-sm text-primary hover:underline break-all"
                                  >
                                    {selectedNFT.cdn_animation_uri}
                                  </a>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Transaction Information */}
                      {(selectedNFT.last_transaction_version ||
                        selectedNFT.last_transaction_timestamp) && (
                        <AccordionItem value="transaction-info">
                          <AccordionTrigger>
                            Transaction Information
                          </AccordionTrigger>
                          <AccordionContent>
                            <ScrollArea className="h-[200px] pr-4">
                              <div className="space-y-4">
                                {selectedNFT.last_transaction_version && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Last Transaction Version
                                    </p>
                                    <p className="font-mono text-sm">
                                      {selectedNFT.last_transaction_version}
                                    </p>
                                  </div>
                                )}
                                {selectedNFT.last_transaction_timestamp && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Last Transaction Time
                                    </p>
                                    <p className="text-sm">
                                      {new Date(
                                        selectedNFT.last_transaction_timestamp
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Token Properties */}
                      {selectedNFT.token_properties && (
                        <AccordionItem value="token-properties">
                          <AccordionTrigger>Token Properties</AccordionTrigger>
                          <AccordionContent>
                            <ScrollArea className="h-[200px]">
                              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                                {typeof selectedNFT.token_properties ===
                                'string'
                                  ? selectedNFT.token_properties
                                  : JSON.stringify(
                                      selectedNFT.token_properties,
                                      null,
                                      2
                                    )}
                              </pre>
                            </ScrollArea>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNFT(null)}
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Portfolio
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <>
                {/* Portfolio Overview Card - Hidden when sidebarView is 'defi' or 'nfts' or when any individual item is selected */}
                {sidebarView !== 'defi' &&
                  sidebarView !== 'nfts' &&
                  !selectedAsset && (
                    <ScrollArea className="h-full">
                      <WalletSummary
                        walletAddress={normalizedAddress}
                        assets={assets || []}
                        defiPositions={groupedDeFiPositions || []}
                        totalValue={portfolioMetrics?.totalPortfolioValue || 0}
                        isLoading={dataLoading}
                        selectedNFT={selectedNFT}
                        selectedDeFiPosition={selectedDeFiPosition}
                        pieChartData={pieChartData}
                        pieChartColors={pieChartColors}
                        nfts={nfts || []}
                      />
                    </ScrollArea>
                  )}
              </>
            )}

            {/* Token Detail View */}
            {selectedAsset && (
              <div
                ref={assetDetailRef}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full"
              >
                {/* Left Side - Token Chart */}
                <div className="bg-card border rounded-lg p-4">
                  <TokenChart
                    tokenAddress={selectedAsset.asset_type}
                    tokenSymbol={selectedAsset.metadata?.symbol || 'Unknown'}
                    tokenName={selectedAsset.metadata?.name || 'Unknown Asset'}
                    currentPrice={selectedAsset.price}
                  />
                </div>

                {/* Right Side - Token Metadata */}
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-neutral-50 dark:bg-neutral-950 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={getTokenLogoUrlWithFallback(
                            selectedAsset.asset_type,
                            selectedAsset.metadata
                          )}
                          alt={selectedAsset.metadata?.symbol || 'Asset'}
                          fill
                          className={`object-contain ${
                            selectedAsset.metadata?.symbol?.toUpperCase() ===
                              'APT' ||
                            selectedAsset.asset_type.includes('aptos_coin')
                              ? 'dark:invert'
                              : ''
                          }`}
                          sizes="48px"
                          priority
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">
                          {selectedAsset.metadata?.symbol || 'Unknown'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {selectedAsset.metadata?.name || 'Unknown Asset'}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Accordion */}
                    <Accordion type="single" collapsible className="w-full">
                      {/* Basic Information */}
                      <AccordionItem value="basic-info">
                        <AccordionTrigger>Basic Information</AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Balance
                                </p>
                                <p
                                  className={`font-semibold ${GeistMono.className}`}
                                >
                                  {formatTokenAmount(
                                    selectedAsset.balance || 0
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Value
                                </p>
                                <p
                                  className={`font-semibold ${GeistMono.className}`}
                                >
                                  {formatCurrency(selectedAsset.value || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Price
                                </p>
                                <p
                                  className={`font-semibold ${GeistMono.className}`}
                                >
                                  {formatCurrency(selectedAsset.price || 0)}
                                </p>
                              </div>
                              {selectedAsset.price_24h_change !== undefined && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    24h Change
                                  </p>
                                  <p
                                    className={`font-semibold ${
                                      selectedAsset.price_24h_change >= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}
                                  >
                                    {selectedAsset.price_24h_change >= 0
                                      ? '+'
                                      : ''}
                                    {selectedAsset.price_24h_change.toFixed(2)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Token Details */}
                      <AccordionItem value="token-details">
                        <AccordionTrigger>Token Details</AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Asset Type
                                </p>
                                <p className="font-mono text-sm break-all">
                                  {selectedAsset.asset_type}
                                </p>
                              </div>
                              {selectedAsset.metadata?.decimals !==
                                undefined && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Decimals
                                  </p>
                                  <p className="font-mono text-sm">
                                    {selectedAsset.metadata.decimals}
                                  </p>
                                </div>
                              )}
                              {selectedAsset.metadata?.project_uri && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Project URI
                                  </p>
                                  <a
                                    href={selectedAsset.metadata.project_uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-sm text-primary hover:underline break-all"
                                  >
                                    {selectedAsset.metadata.project_uri}
                                  </a>
                                </div>
                              )}
                              {selectedAsset.metadata?.icon_uri && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Icon URI
                                  </p>
                                  <a
                                    href={selectedAsset.metadata.icon_uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-sm text-primary hover:underline break-all"
                                  >
                                    {selectedAsset.metadata.icon_uri}
                                  </a>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Market Information */}
                      {(selectedAsset.market_cap ||
                        selectedAsset.volume_24h) && (
                        <AccordionItem value="market-info">
                          <AccordionTrigger>
                            Market Information
                          </AccordionTrigger>
                          <AccordionContent>
                            <ScrollArea className="h-[200px] pr-4">
                              <div className="space-y-4">
                                {selectedAsset.market_cap && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Market Cap
                                    </p>
                                    <p
                                      className={`font-semibold ${GeistMono.className}`}
                                    >
                                      {formatCurrency(selectedAsset.market_cap)}
                                    </p>
                                  </div>
                                )}
                                {selectedAsset.volume_24h && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      24h Volume
                                    </p>
                                    <p
                                      className={`font-semibold ${GeistMono.className}`}
                                    >
                                      {formatCurrency(selectedAsset.volume_24h)}
                                    </p>
                                  </div>
                                )}
                                {selectedAsset.total_supply && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Total Supply
                                    </p>
                                    <p
                                      className={`font-semibold ${GeistMono.className}`}
                                    >
                                      {formatTokenAmount(
                                        selectedAsset.total_supply
                                      )}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAssetSelect(null)}
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Portfolio
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* DeFi Position Detail View */}
            {selectedDeFiPosition && (
              <div ref={defiDetailRef} className="h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Image
                        src={getProtocolLogo(selectedDeFiPosition.protocol)}
                        alt={`${selectedDeFiPosition.protocol} logo`}
                        width={40}
                        height={40}
                        className="rounded-lg flex-shrink-0"
                        onError={e => {
                          const img = e.target as HTMLImageElement;
                          img.src = '/placeholder.jpg';
                        }}
                      />
                      <h2 className="text-xl font-semibold">
                        {cleanProtocolName(selectedDeFiPosition.protocol)}
                      </h2>
                    </div>
                    <div>
                      <div className="flex gap-2 mt-2">
                        {Array.from(selectedDeFiPosition.protocolTypes).map(
                          type => (
                            <Badge
                              key={String(type)}
                              variant="secondary"
                              className="text-xs"
                            >
                              {String(type) === 'derivatives'
                                ? 'Perps'
                                : String(type)}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>

                    {/* Metadata Accordion */}
                    <Accordion type="single" collapsible className="w-full">
                      {/* Position Overview */}
                      <AccordionItem value="position-overview">
                        <AccordionTrigger>Position Overview</AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Position Value
                                </p>
                                <p
                                  className={`font-semibold ${GeistMono.className}`}
                                >
                                  {formatCurrency(
                                    selectedDeFiPosition.totalValue
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Number of Positions
                                </p>
                                <p className="font-semibold">
                                  {selectedDeFiPosition.positions.length}
                                </p>
                              </div>
                              {/* Show detailed position information */}
                              {selectedDeFiPosition.positions.map(
                                (pos: any, idx: number) => (
                                  <div key={idx} className="border-t pt-2">
                                    <p className="text-sm font-medium mb-2">
                                      Position {idx + 1}
                                    </p>
                                    {pos.positionType && (
                                      <p className="text-xs text-muted-foreground mb-2">
                                        Type: {pos.positionType}
                                      </p>
                                    )}

                                    {/* Show supplied assets */}
                                    {pos.suppliedAssets &&
                                      pos.suppliedAssets.length > 0 && (
                                        <div className="mb-2">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">
                                            Supplied Assets:
                                          </p>
                                          {pos.suppliedAssets.map(
                                            (asset: any, assetIdx: number) => (
                                              <div
                                                key={assetIdx}
                                                className="mb-1 p-2 bg-muted/20 rounded text-xs"
                                              >
                                                <div className="flex justify-between items-center">
                                                  <div>
                                                    <p className="font-medium">
                                                      {asset.asset.includes(
                                                        'MKLP'
                                                      )
                                                        ? 'MKLP Token'
                                                        : asset.asset.includes(
                                                              'StakedApt'
                                                            )
                                                          ? 'stAPT Token'
                                                          : asset.asset ===
                                                              '0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d'
                                                            ? 'THALA-LP Token'
                                                            : 'LP Token'}
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                      Amount:{' '}
                                                      {asset.amount.toFixed(6)}
                                                    </p>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="font-semibold">
                                                      {formatCurrency(
                                                        asset.value
                                                      )}
                                                    </p>
                                                  </div>
                                                </div>
                                                {asset.asset.includes(
                                                  'MKLP'
                                                ) && (
                                                  <p className="text-muted-foreground mt-1">
                                                    Merkle Liquidity Provider
                                                    Token @ $1.05
                                                  </p>
                                                )}
                                                {asset.asset ===
                                                  '0xb4a8b8462b4423780d6ee256f3a9a3b9ece5d9440d614f7ab2bfa4556aa4f69d' && (
                                                  <p className="text-muted-foreground mt-1">
                                                    Thala Farm LP Token @ $1.50
                                                  </p>
                                                )}
                                                {asset.asset.includes(
                                                  'StakedApt'
                                                ) && (
                                                  <p className="text-muted-foreground mt-1">
                                                    Liquid Staked APT via Amnis
                                                    Finance
                                                  </p>
                                                )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}

                                    {/* Show total position value */}
                                    <div className="text-xs text-muted-foreground">
                                      Total Value:{' '}
                                      {formatCurrency(pos.totalValueUSD || 0)}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Protocol Information */}
                      {detailedProtocolInfo && (
                        <AccordionItem value="protocol-info">
                          <AccordionTrigger>
                            Protocol Information
                          </AccordionTrigger>
                          <AccordionContent>
                            <ScrollArea className="h-[200px] pr-4">
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Category
                                  </p>
                                  <p className="font-medium">
                                    {detailedProtocolInfo.category}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Subcategory
                                  </p>
                                  <p className="font-medium">
                                    {detailedProtocolInfo.subcategory}
                                  </p>
                                </div>
                                {detailedProtocolInfo.tvl?.current && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Protocol TVL
                                    </p>
                                    <p className="font-semibold">
                                      {detailedProtocolInfo.tvl.current}
                                    </p>
                                  </div>
                                )}
                                {detailedProtocolInfo.token
                                  ?.governanceToken && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Governance Token
                                    </p>
                                    <p
                                      className={`font-medium ${GeistMono.className}`}
                                    >
                                      {detailedProtocolInfo.token
                                        .governanceTokenSymbol ||
                                        detailedProtocolInfo.token
                                          .governanceToken}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Security & Audits */}
                      {detailedProtocolInfo?.security && (
                        <AccordionItem value="security-audits">
                          <AccordionTrigger>Security & Audits</AccordionTrigger>
                          <AccordionContent>
                            <ScrollArea className="h-[200px] pr-4">
                              <div className="space-y-4">
                                {detailedProtocolInfo.security.auditStatus && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Audit Status
                                    </p>
                                    <Badge
                                      variant={
                                        detailedProtocolInfo.security
                                          .auditStatus === 'Audited'
                                          ? 'default'
                                          : 'destructive'
                                      }
                                      className="text-xs"
                                    >
                                      {
                                        detailedProtocolInfo.security
                                          .auditStatus
                                      }
                                    </Badge>
                                  </div>
                                )}
                                {detailedProtocolInfo.security.auditFirms && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Audit Firms
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {detailedProtocolInfo.security.auditFirms.map(
                                        (firm: string) => (
                                          <Badge
                                            key={firm}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {firm}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                                {/* Risk Factors section removed as it doesn't exist in the type */}
                              </div>
                            </ScrollArea>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Protocol Links */}
                      {(detailedProtocolInfo?.href ||
                        detailedProtocolInfo?.external?.socials) && (
                        <AccordionItem value="protocol-links">
                          <AccordionTrigger>Protocol Links</AccordionTrigger>
                          <AccordionContent>
                            <ScrollArea className="h-[200px] pr-4">
                              <div className="space-y-4">
                                {detailedProtocolInfo.href && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Website
                                    </p>
                                    <a
                                      href={detailedProtocolInfo.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline"
                                    >
                                      {detailedProtocolInfo.href}
                                    </a>
                                  </div>
                                )}
                                {detailedProtocolInfo.external?.socials
                                  ?.twitter && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Twitter
                                    </p>
                                    <a
                                      href={
                                        detailedProtocolInfo.external.socials
                                          .twitter
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline"
                                    >
                                      {
                                        detailedProtocolInfo.external.socials
                                          .twitter
                                      }
                                    </a>
                                  </div>
                                )}
                                {detailedProtocolInfo.external?.socials
                                  ?.github && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      GitHub
                                    </p>
                                    <a
                                      href={
                                        detailedProtocolInfo.external.socials
                                          .github
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline"
                                    >
                                      {
                                        detailedProtocolInfo.external.socials
                                          .github
                                      }
                                    </a>
                                  </div>
                                )}
                                {detailedProtocolInfo.integration
                                  ?.smartContractLinks &&
                                  detailedProtocolInfo.integration
                                    .smartContractLinks.length > 0 && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">
                                        Smart Contracts
                                      </p>
                                      {detailedProtocolInfo.integration.smartContractLinks.map(
                                        (link, idx) => (
                                          <a
                                            key={idx}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline block"
                                          >
                                            {link}
                                          </a>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            </ScrollArea>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeFiPositionSelect(null)}
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Portfolio
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProtocolDetailsOpen(true)}
                      >
                        View Full Details
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* DeFi Summary - Only shown when sidebarView is 'defi' AND no position is selected */}
            {sidebarView === 'defi' && !selectedDeFiPosition && (
              <ScrollArea className="h-full">
                <DeFiSummaryView
                  groupedDeFiPositions={groupedDeFiPositions}
                  totalDefiValue={
                    groupedDeFiPositions?.reduce(
                      (sum, pos) => sum + (pos.totalValue || 0),
                      0
                    ) || 0
                  }
                  getProtocolLogo={getProtocolLogo}
                  onProtocolClick={handleDeFiPositionSelect}
                />
              </ScrollArea>
            )}

            {/* NFT Summary - Only shown when sidebarView is 'nfts' AND no NFT is selected */}
            {sidebarView === 'nfts' && !selectedNFT && (
              <ScrollArea className="h-full">
                <NFTSummaryView
                  nfts={nfts || []}
                  currentPageNFTs={currentNFTs.length}
                  onCollectionClick={collection => {
                    setHoveredCollection(collection);
                  }}
                />
              </ScrollArea>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6 p-0">
          {/* Transaction History Only */}
          <TransactionHistoryTable
            walletAddress={normalizedAddress}
            limit={50}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
