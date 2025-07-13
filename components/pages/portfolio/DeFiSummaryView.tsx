'use client';

import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Shield, Activity, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { defiProtocols } from '@/components/pages/defi/data';
import { cleanProtocolName } from './utils';

interface DeFiSummaryViewProps {
  groupedDeFiPositions: any[];
  totalDefiValue: number;
  getProtocolLogo: (protocol: string) => string;
  onProtocolClick: (position: any) => void;
}

const DeFiSummaryView: React.FC<DeFiSummaryViewProps> = ({
  groupedDeFiPositions,
  totalDefiValue,
  getProtocolLogo,
  onProtocolClick,
}) => {
  // Get detailed protocol information for each position
  const getProtocolDetails = (protocolName: string) => {
    return defiProtocols.find(
      protocol =>
        protocol.title.toLowerCase() === protocolName.toLowerCase() ||
        protocol.title.toLowerCase().includes(protocolName.toLowerCase()) ||
        protocolName.toLowerCase().includes(protocol.title.toLowerCase())
    );
  };

  const getProtocolTypeColor = (category: string, subcategory: string) => {
    const key = `${category?.toLowerCase()}-${subcategory?.toLowerCase()}`;
    const colors: Record<string, string> = {
      'trading-dex': 'from-blue-500 to-cyan-500',
      'trading-perps': 'from-indigo-500 to-purple-500',
      'trading-dex aggregator': 'from-green-500 to-blue-500',
      'credit-lending': 'from-red-500 to-pink-500',
      'yield-liquid staking': 'from-teal-500 to-cyan-500',
      'yield-yield aggregator': 'from-green-500 to-yellow-500',
      'yield-leveraged farming': 'from-yellow-500 to-green-500',
      multiple: 'from-purple-500 to-pink-500',
    };
    return colors[key] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* DeFi Portfolio Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            DeFi Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono">
                {formatCurrency(totalDefiValue)}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Protocols</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono">
                {groupedDeFiPositions.length}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Positions</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono">
                {groupedDeFiPositions.reduce(
                  (sum, pos) => sum + (pos.positions?.length || 1),
                  0
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Positions */}
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
                  const protocolDetails = getProtocolDetails(position.protocol);
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
                        {position.protocol.toLowerCase() === 'aptin' && (
                          <p className="text-xs text-red-500 mt-1">
                            Deprecated
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Protocol Categories Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Portfolio Distribution by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Calculate category breakdown */}
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

export default DeFiSummaryView;
