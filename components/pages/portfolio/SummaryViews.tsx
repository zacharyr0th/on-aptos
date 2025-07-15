'use client';

import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  Shield,
  Activity,
  ExternalLink,
  Grid3X3,
  ImageIcon,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { defiProtocols } from '@/components/pages/defi/data';
import { cleanProtocolName } from './utils';
import { NFT } from './types';

interface BaseSummaryCardProps {
  title: string;
  icon: React.ReactNode;
  metrics: Array<{
    label: string;
    value: string | number;
  }>;
}

interface DeFiSummaryViewProps {
  groupedDeFiPositions: any[];
  totalDefiValue: number;
  getProtocolLogo: (protocol: string) => string;
  onProtocolClick: (position: any) => void;
}

interface NFTSummaryViewProps {
  nfts: NFT[];
  currentPageNFTs: number;
  onCollectionClick?: (collection: string) => void;
}

const SummaryCard: React.FC<BaseSummaryCardProps> = ({
  title,
  icon,
  metrics,
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-muted/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-2xl sm:text-3xl font-bold font-mono">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const getProtocolDetails = (protocolName: string) => {
  return defiProtocols.find(
    protocol =>
      protocol.title.toLowerCase() === protocolName.toLowerCase() ||
      protocol.title.toLowerCase().includes(protocolName.toLowerCase()) ||
      protocolName.toLowerCase().includes(protocol.title.toLowerCase())
  );
};

export const DeFiSummaryView: React.FC<DeFiSummaryViewProps> = ({
  groupedDeFiPositions,
  totalDefiValue,
  getProtocolLogo,
  onProtocolClick,
}) => {
  const metrics = [
    { label: 'Total Value', value: formatCurrency(totalDefiValue) },
    { label: 'Protocols', value: groupedDeFiPositions.length },
    {
      label: 'Positions',
      value: groupedDeFiPositions.reduce(
        (sum, pos) => sum + (pos.positions?.length || 1),
        0
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SummaryCard
        title="DeFi Portfolio Overview"
        icon={<TrendingUp className="w-5 h-5" />}
        metrics={metrics}
      />

      {groupedDeFiPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Your DeFi Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {groupedDeFiPositions
                .sort((a, b) => b.totalValue - a.totalValue)
                .map((position, index) => {
                  const primaryType = Array.from(
                    position.protocolTypes
                  )[0] as string;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onProtocolClick(position)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-background border flex items-center justify-center">
                          <Image
                            src={getProtocolLogo(position.protocol)}
                            alt={`${position.protocol} logo`}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover rounded"
                            onError={e => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/placeholder.jpg';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {cleanProtocolName(position.protocol)}
                            </p>
                            {position.protocol.toLowerCase() === 'aptin' && (
                              <Badge variant="destructive" className="text-xs">
                                Deprecated
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {position.protocolTypes.size > 1
                              ? 'Multiple'
                              : primaryType === 'derivatives'
                                ? 'Perps'
                                : primaryType}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium font-mono">
                          {position.protocol === 'Thala Farm'
                            ? 'TBD'
                            : formatCurrency(position.totalValue)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Portfolio Distribution by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(() => {
              const categoryBreakdown: Record<
                string,
                { value: number; count: number; protocols: string[] }
              > = {};

              groupedDeFiPositions.forEach(position => {
                const protocolDetails = getProtocolDetails(position.protocol);
                const category = protocolDetails?.category || 'Unknown';

                if (!categoryBreakdown[category]) {
                  categoryBreakdown[category] = {
                    value: 0,
                    count: 0,
                    protocols: [],
                  };
                }

                categoryBreakdown[category].value += position.totalValue;
                categoryBreakdown[category].count += 1;
                categoryBreakdown[category].protocols.push(position.protocol);
              });

              return Object.entries(categoryBreakdown)
                .sort(([, a], [, b]) => b.value - a.value)
                .map(([category, data]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{category}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.count} protocol{data.count > 1 ? 's' : ''}:{' '}
                        {data.protocols.join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono">{formatCurrency(data.value)}</p>
                      <p className="text-sm text-muted-foreground">
                        {((data.value / totalDefiValue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ));
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const NFTSummaryView: React.FC<NFTSummaryViewProps> = ({
  nfts,
  currentPageNFTs,
  onCollectionClick,
}) => {
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

  const metrics = [
    { label: 'Total NFTs', value: nfts.length },
    { label: 'Collections', value: totalCollections },
    { label: 'This Page', value: currentPageNFTs },
  ];

  if (nfts.length === 0) {
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

  return (
    <div className="space-y-6">
      <SummaryCard
        title="NFT Collection Overview"
        icon={<Grid3X3 className="h-5 w-5" />}
        metrics={metrics}
      />

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
                      <p className="text-sm text-muted-foreground">
                        Collection
                      </p>
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
    </div>
  );
};
