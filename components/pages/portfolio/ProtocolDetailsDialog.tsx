'use client';

import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  ExternalLink,
  Shield,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { defiProtocols } from '@/components/pages/defi/data';

interface ProtocolDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  protocolName: string;
  protocolLogo: string;
  defiPosition?: any;
}

export const ProtocolDetailsDialog: React.FC<ProtocolDetailsDialogProps> = ({
  isOpen,
  onClose,
  protocolName,
  protocolLogo,
  defiPosition,
}) => {
  // Find detailed protocol information
  const protocolDetails = defiProtocols.find(
    protocol =>
      protocol.title.toLowerCase() === protocolName.toLowerCase() ||
      protocol.title.toLowerCase().includes(protocolName.toLowerCase()) ||
      protocolName.toLowerCase().includes(protocol.title.toLowerCase())
  );

  // Map protocol names to handle variations
  const mapProtocolName = (name: string): string => {
    const nameMap: Record<string, string> = {
      'Thala Farm': 'Thala',
      'Amnis Finance': 'Amnis',
      'Merkle Trade': 'Merkle',
      'Aries Markets': 'Aries',
      'Thala Liquid Staking': 'Thala',
      LiquidSwap: 'LiquidSwap',
      PancakeSwap: 'PancakeSwap',
      'Cellana Finance': 'Cellana',
    };
    return nameMap[name] || name;
  };

  const getAuditStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'audited':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unaudited':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProtocolTypeDescription = (
    category: string,
    subcategory: string
  ) => {
    const descriptions: Record<string, string> = {
      'trading-dex': 'Decentralized exchange for swapping tokens',
      'trading-perps': 'Perpetual futures trading platform',
      'trading-dex aggregator': 'Aggregates liquidity across multiple DEXs',
      'credit-lending': 'Lending and borrowing protocol',
      'yield-liquid staking': 'Liquid staking derivatives for APT',
      'yield-yield aggregator':
        'Automatically optimizes yield across protocols',
      'yield-leveraged farming': 'Leveraged yield farming strategies',
      multiple: 'Multi-protocol DeFi platform',
    };

    const key = `${category?.toLowerCase()}-${subcategory?.toLowerCase()}`;
    return (
      descriptions[key] || `${category} protocol focused on ${subcategory}`
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-[380px] sm:max-w-lg md:max-w-2xl max-h-[85vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={protocolLogo}
                alt={`${protocolName} logo`}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold">{protocolName}</h2>
              {protocolDetails && (
                <p className="text-sm text-muted-foreground">
                  {getProtocolTypeDescription(
                    protocolDetails.category,
                    protocolDetails.subcategory
                  )}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Your Position */}
          {defiPosition && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Your Position
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-lg font-mono">
                    {protocolName === 'Thala Farm'
                      ? 'TBD'
                      : formatCurrency(defiPosition.totalValue || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position Type</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.from(defiPosition.protocolTypes || []).map(type => (
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
              </div>
            </div>
          )}

          {/* Protocol Overview */}
          {protocolDetails && (
            <>
              <div>
                <h3 className="font-semibold mb-3">Protocol Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{protocolDetails.category}</Badge>
                    <Badge variant="secondary">
                      {protocolDetails.subcategory}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <Badge
                      className={getAuditStatusColor(
                        protocolDetails.security?.auditStatus || 'Unknown'
                      )}
                    >
                      <span className="hidden xs:inline">
                        {protocolDetails.security?.auditStatus || 'Unknown'} Audit
                      </span>
                      <span className="xs:hidden">
                        {protocolDetails.security?.auditStatus || 'Unknown'}
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Key Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {protocolDetails.tvl?.current && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        Total Value Locked
                      </p>
                      <p className="text-lg font-mono">
                        {protocolDetails.tvl.current}
                      </p>
                    </div>
                  )}
                  {protocolDetails.volume?.total && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        Total Volume
                      </p>
                      <p className="text-lg font-mono">
                        {protocolDetails.volume.total}
                      </p>
                    </div>
                  )}
                  {protocolDetails.yields?.current && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        Current Yield
                      </p>
                      <p className="text-lg font-mono">
                        {protocolDetails.yields.current.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Token Information */}
              {protocolDetails.token?.governanceToken && (
                <div>
                  <h3 className="font-semibold mb-3">Governance Token</h3>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="font-medium">
                      {protocolDetails.token.governanceToken}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Symbol: {protocolDetails.token.governanceTokenSymbol}
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Links and Integration */}
              <div>
                <h3 className="font-semibold mb-3">Resources</h3>
                <div className="flex flex-wrap gap-2">
                  {protocolDetails.href && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={protocolDetails.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Website
                      </a>
                    </Button>
                  )}
                  {protocolDetails.external?.socials?.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={protocolDetails.external.socials.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {protocolDetails.integration?.smartContractLinks?.[0] && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={protocolDetails.integration.smartContractLinks[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  {protocolDetails.integration?.docs && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={protocolDetails.integration.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Docs
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Fallback for protocols not in detailed data */}
          {!protocolDetails && (
            <div className="text-center py-6 text-muted-foreground">
              <p>
                Detailed information for {protocolName} is not available yet.
              </p>
              <p className="text-sm mt-2">
                This protocol is part of your DeFi portfolio but detailed
                summaries are coming soon.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
