'use client';

import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatTokenAmount } from '@/lib/utils/format';
import { getTokenLogoUrlWithFallback } from '@/lib/utils/token-logos';
import { cleanProtocolName, getProtocolLogo, getDetailedProtocolInfo } from './utils';
import { DeFiSummaryView, NFTSummaryView } from './SummaryViews';
import { WalletSummary } from './WalletSummary';
import { TransactionHistoryTable } from './TransactionHistoryTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PortfolioMainContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedAsset: any;
  selectedDeFiPosition: any;
  selectedNFT: any;
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
}

export function PortfolioMainContent({
  activeTab,
  setActiveTab,
  selectedAsset,
  selectedDeFiPosition,
  selectedNFT,
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
}: PortfolioMainContentProps) {
  const detailedProtocolInfo = selectedDeFiPosition
    ? getDetailedProtocolInfo(selectedDeFiPosition.protocol)
    : null;

  return (
    <div className="lg:col-span-3 space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={v => setActiveTab(v as any)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          {/* SINGLE CARD AREA - Only one thing at a time */}

          {/* Individual Asset Details */}
          {selectedAsset ? (
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Asset Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Image
                    src={getTokenLogoUrlWithFallback(
                      selectedAsset.asset_type,
                      selectedAsset.metadata
                    )}
                    alt={selectedAsset.metadata?.symbol || 'Asset'}
                    width={48}
                    height={48}
                    className={`rounded-full ${
                      selectedAsset.metadata?.symbol?.toUpperCase() ===
                        'APT' ||
                      selectedAsset.asset_type.includes('aptos_coin')
                        ? 'dark:invert'
                        : ''
                    }`}
                  />
                  <div>
                    <h4 className="font-semibold">
                      {selectedAsset.metadata?.symbol || 'Unknown'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedAsset.metadata?.name || 'Unknown Asset'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Balance
                    </p>
                    <p className="text-lg font-mono">
                      {formatTokenAmount(selectedAsset.balance || 0)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Value
                    </p>
                    <p className="text-lg font-mono">
                      {formatCurrency(selectedAsset.value || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedDeFiPosition ? (
            /* Individual DeFi Position Details */
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6">
                DeFi Position Details
              </h3>
              <div className="space-y-6">
                {/* Protocol Header */}
                <div className="flex items-start gap-6">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-background border-2 border-border/20 flex-shrink-0">
                    <Image
                      src={getProtocolLogo(
                        selectedDeFiPosition.protocol
                      )}
                      alt={`${selectedDeFiPosition.protocol} logo`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-xl font-semibold">
                        {cleanProtocolName(
                          selectedDeFiPosition.protocol
                        )}
                      </h4>
                      <div className="flex gap-2 mt-2">
                        {Array.from(
                          selectedDeFiPosition.protocolTypes
                        ).map(type => (
                          <Badge
                            key={String(type)}
                            variant="secondary"
                            className="text-xs"
                          >
                            {String(type) === 'derivatives'
                              ? 'Perps'
                              : String(type)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {detailedProtocolInfo && (
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {detailedProtocolInfo.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {detailedProtocolInfo.subcategory}
                        </Badge>
                        {detailedProtocolInfo.security.auditStatus && (
                          <Badge
                            variant={
                              detailedProtocolInfo.security
                                .auditStatus === 'Audited'
                                ? 'default'
                                : 'destructive'
                            }
                            className="text-xs"
                          >
                            {detailedProtocolInfo.security.auditStatus}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Position Value and Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Position Value
                    </p>
                    <p className="text-2xl font-mono font-semibold">
                      {selectedDeFiPosition.protocol === 'Thala Farm'
                        ? 'TBD'
                        : formatCurrency(
                            selectedDeFiPosition.totalValue
                          )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Positions
                    </p>
                    <p className="text-xl font-semibold">
                      {selectedDeFiPosition.positions.length}
                    </p>
                  </div>
                  {detailedProtocolInfo?.tvl?.current && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Protocol TVL
                      </p>
                      <p className="text-xl font-semibold">
                        {detailedProtocolInfo.tvl.current}
                      </p>
                    </div>
                  )}
                </div>

                {/* Protocol Information */}
                {detailedProtocolInfo && (
                  <div className="space-y-4">
                    <h5 className="font-semibold text-base">
                      Protocol Information
                    </h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {detailedProtocolInfo.token?.governanceToken && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Governance Token
                          </p>
                          <p className="text-sm font-mono">
                            {detailedProtocolInfo.token
                              .governanceTokenSymbol ||
                              detailedProtocolInfo.token
                                .governanceToken}
                          </p>
                        </div>
                      )}
                      {detailedProtocolInfo.security.auditFirms && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Audit Firms
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {detailedProtocolInfo.security.auditFirms.map(
                              (firm: string) => (
                                <Badge key={firm} variant="outline" className="text-xs">
                                  {firm}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProtocolDetailsOpen(true)}
                  >
                    View Protocol Details
                  </Button>
                </div>
              </div>
            </div>
          ) : sidebarView === 'defi' && groupedDeFiPositions && groupedDeFiPositions.length > 0 ? (
            /* DeFi Summary View */
            <DeFiSummaryView
              groupedDeFiPositions={groupedDeFiPositions}
              totalValue={portfolioMetrics?.totalPortfolioValue || 0}
              isLoading={dataLoading}
            />
          ) : sidebarView === 'nfts' && nfts && nfts.length > 0 ? (
            /* NFT Summary View */
            <NFTSummaryView
              nfts={nfts}
              currentPageNFTs={currentNFTs.length}
              onCollectionClick={collection => {
                setHoveredCollection(collection);
              }}
            />
          ) : (
            /* Default Wallet Summary View */
            <WalletSummary
              walletAddress={normalizedAddress}
              assets={assets || []}
              defiPositions={groupedDeFiPositions || []}
              totalValue={portfolioMetrics?.totalPortfolioValue || 0}
              isLoading={dataLoading}
              pieChartData={pieChartData}
              pieChartColors={pieChartColors}
            />
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <TransactionHistoryTable
            walletAddress={normalizedAddress}
            limit={50}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}