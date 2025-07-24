'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import YieldDialog from './YieldDialog';
import { Market, ProtocolData, formatBTCAmountWithCommas } from './types';
import { PROTOCOL_ICONS } from '@/lib/config';
import { YIELD_COLORS } from '@/lib/constants/ui/colors';
import { formatCurrency, formatBigIntWithDecimals } from '@/lib/utils';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { ECHO_PROTOCOL_CONFIG, SupplyData } from '@/lib/config/data';
import { usePageTranslation } from '@/hooks/useTranslation';

// --- Main Component ---
interface MoneyMarketsProps {
  echelonData?: {
    protocol: string;
    markets: Market[];
    total: {
      btc: string;
      normalized: string;
      tvlUsd?: number;
    };
    meta: {
      timestamp: string;
      responseTimeMs: number;
    };
  };
  supplyData?: SupplyData | null;
}

export default function MoneyMarkets({
  echelonData,
  supplyData,
}: MoneyMarketsProps) {
  const { t } = usePageTranslation('btc');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // Calculate Echo data based on configuration and real data
  const echoData = useMemo((): ProtocolData | null => {
    if (!echelonData || !supplyData || !ECHO_PROTOCOL_CONFIG.enabled)
      return null;

    try {
      // Find aBTC market in Echelon data
      const aBTCMarket = echelonData.markets.find(
        (m: { symbol: string }) => m.symbol === 'aBTC'
      );
      if (!aBTCMarket) return null;

      // Get the total aBTC supply from real data
      const aBTCSupplyData = supplyData.supplies.find(s => s.symbol === 'aBTC');
      if (!aBTCSupplyData) return null;

      const echoConfig = ECHO_PROTOCOL_CONFIG.markets[0]; // aBTC config
      const totalSupply = BigInt(aBTCSupplyData.supply);
      const usedInEchelon = BigInt(aBTCMarket.rawBalance);

      // Calculate real remaining supply for Echo: Total aBTC - Used in Echelon
      const realRemainingSupply =
        totalSupply > usedInEchelon ? totalSupply - usedInEchelon : BigInt(0);

      if (realRemainingSupply <= 0n) return null;

      const formatted = formatBigIntWithDecimals(
        realRemainingSupply,
        echoConfig.decimals
      );
      const now = new Date().toISOString();

      // Get the BTC price from Echelon data if available
      const btcPrice = aBTCMarket.price || 100000;
      const totalSupplyFloat =
        Number(realRemainingSupply) / Math.pow(10, echoConfig.decimals);
      const totalSupplyUsd = totalSupplyFloat * btcPrice;

      return {
        protocol: ECHO_PROTOCOL_CONFIG.protocol,
        markets: [
          {
            symbol: echoConfig.symbol,
            marketAddress: echoConfig.marketAddress,
            assetType: echoConfig.assetType,
            description: echoConfig.description,
            balance: formatted,
            rawBalance: realRemainingSupply.toString(),
            decimals: echoConfig.decimals,
            apyBase: echoConfig.apyBase,
            apyReward: echoConfig.apyReward,
            apyBaseBorrow: echoConfig.apyBaseBorrow,
            totalSupply: totalSupplyFloat,
            totalBorrow: echoConfig.totalBorrow,
            totalSupplyUsd: totalSupplyUsd,
            totalBorrowUsd: echoConfig.totalBorrowUsd,
            tvlUsd: totalSupplyUsd,
            price: btcPrice,
          },
        ],
        total: {
          btc: formatted,
          normalized: realRemainingSupply.toString(),
          tvlUsd: totalSupplyUsd,
        },
        meta: {
          timestamp: now,
          responseTimeMs: 0,
        },
      };
    } catch (calcErr) {
      console.error('Error building Echo data:', calcErr);
      return null;
    }
  }, [echelonData, supplyData]);

  // Loading state if no data provided
  if (!echelonData) {
    return (
      <Card className="my-6">
        <CardHeader>
          <CardTitle>{t('btc:money_markets.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center text-muted-foreground">
            {t('btc:loading.loading_market_data')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{t('btc:money_markets.title')}</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <InfoIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <Disclaimer />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Detail Dialog */}
        {selectedMarket && (
          <YieldDialog
            isOpen={dialogOpen}
            onClose={() => {
              setDialogOpen(false);
              setSelectedMarket(null);
            }}
            market={selectedMarket}
            protocol={
              selectedMarket.description.includes('Echo') ? 'Echo' : 'Echelon'
            }
          />
        )}

        {/* Protocols arranged horizontally on md+ screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProtocolSection
            data={echelonData}
            onMarketClick={market => {
              setSelectedMarket(market);
              setDialogOpen(true);
            }}
            iconSrc={PROTOCOL_ICONS.echelon}
          />

          {echoData && ECHO_PROTOCOL_CONFIG.enabled ? (
            <ProtocolSection
              data={echoData}
              onMarketClick={market => {
                setSelectedMarket(market);
                setDialogOpen(true);
              }}
              iconSrc={PROTOCOL_ICONS.echo}
            />
          ) : (
            <Card className="border-dashed">
              <CardHeader className="pb-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="relative w-5 h-5">
                      <Image
                        src={PROTOCOL_ICONS.echo}
                        alt={`${t('btc:protocols.echo')} ${t('btc:protocols.protocol')}`}
                        width={20}
                        height={20}
                        className="rounded-full object-contain"
                      />
                    </div>
                    <CardTitle className="text-base">
                      {t('btc:protocols.echo')} {t('btc:protocols.protocol')}
                    </CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {t('btc:status.coming_soon')}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="py-4 text-center text-muted-foreground">
                  {t('btc:protocols.echo_data_soon')}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Helper Components & Functions ---

interface ProtocolSectionProps {
  data: ProtocolData;
  onMarketClick: (market: Market) => void;
  iconSrc: string;
}

const ProtocolSection: React.FC<ProtocolSectionProps> = ({
  data,
  onMarketClick,
  iconSrc,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5">
              <Image
                src={iconSrc}
                alt={`${data.protocol} Protocol`}
                width={20}
                height={20}
                className="rounded-full object-contain"
              />
            </div>
            <CardTitle className="text-base">
              {data.protocol} Protocol
            </CardTitle>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            <strong>{data.markets.length}</strong>{' '}
            {data.markets.length === 1 ? 'asset' : 'assets'} •{' '}
            {formatBTCAmountWithCommas(parseFloat(data.total.btc))} BTC
            {data.total.tvlUsd &&
              ` • ${formatCurrency(data.total.tvlUsd, 'USD')}`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="hidden md:table-cell">
                Description
              </TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Supply APY</TableHead>
              <TableHead className="text-right">Borrow APY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.markets.map(m => (
              <TableRow
                key={m.symbol}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onMarketClick(m)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <span>{m.symbol}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {m.description}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatBTCAmountWithCommas(parseFloat(m.balance))} BTC
                </TableCell>
                <TableCell className="text-right">
                  {data.protocol === 'Echo' ? (
                    <div className="flex items-center justify-end gap-1">
                      <span
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${YIELD_COLORS.rewardAPR}15`,
                          color: YIELD_COLORS.rewardAPR,
                        }}
                      >
                        ~
                        {(m.apyReward !== undefined
                          ? m.apyReward * 100
                          : 0
                        ).toFixed(2)}
                        %
                      </span>
                    </div>
                  ) : m.apyBase !== undefined ? (
                    <div className="flex items-center justify-end gap-1">
                      <span
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${YIELD_COLORS.supplyAPR}15`,
                          color: YIELD_COLORS.supplyAPR,
                        }}
                      >
                        {(m.apyBase * 100).toFixed(2)}%
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {data.protocol === 'Echo' ? (
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      Not available
                    </span>
                  ) : m.apyBaseBorrow !== undefined ? (
                    <div className="flex items-center justify-end gap-1">
                      <span
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${YIELD_COLORS.borrowAPR}15`,
                          color: YIELD_COLORS.borrowAPR,
                        }}
                      >
                        {(m.apyBaseBorrow * 100).toFixed(2)}%
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
