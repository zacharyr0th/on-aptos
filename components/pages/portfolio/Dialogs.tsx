'use client';

import { GeistMono } from 'geist/font/mono';
import {
  ExternalLink,
  Shield,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  Grid3X3,
  Copy,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { toast } from 'sonner';

import { defiProtocols } from '@/components/pages/defi/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/format';

import { NFT } from './types';


interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NFTDetailsDialogProps extends BaseDialogProps {
  nft: NFT | null;
}

interface ProtocolDetailsDialogProps extends BaseDialogProps {
  protocolName: string;
  protocolLogo: string;
  defiPosition?: any;
}

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

const getProtocolTypeDescription = (category: string, subcategory: string) => {
  const descriptions: Record<string, string> = {
    'trading-dex': 'Decentralized exchange for swapping tokens',
    'trading-perps': 'Perpetual futures trading platform',
    'trading-dex aggregator': 'Aggregates liquidity across multiple DEXs',
    'credit-lending': 'Lending and borrowing protocol',
    'yield-liquid staking': 'Liquid staking derivatives for APT',
    'yield-yield aggregator': 'Automatically optimizes yield across protocols',
    'yield-leveraged farming': 'Leveraged yield farming strategies',
    multiple: 'Multi-protocol DeFi platform',
  };

  const key = `${category?.toLowerCase()}-${subcategory?.toLowerCase()}`;
  return descriptions[key] || `${category} protocol focused on ${subcategory}`;
};

export const NFTDetailsDialog: React.FC<NFTDetailsDialogProps> = ({
  isOpen,
  onClose,
  nft,
}) => {
  const [copiedTokenId, setCopiedTokenId] = React.useState(false);

  if (!nft) return null;

  const imageUrl = nft.cdn_image_uri || nft.token_uri;
  const explorerUrl = `https://explorer.aptoslabs.com/account/${nft.token_data_id}?network=mainnet`;

  const copyTokenId = async () => {
    try {
      await navigator.clipboard.writeText(nft.token_data_id);
      setCopiedTokenId(true);
      toast.success('Token ID copied to clipboard');
      setTimeout(() => setCopiedTokenId(false), 2000);
    } catch (error) {
      toast.error('Failed to copy token ID');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-[380px] sm:max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] mx-auto flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base pr-8">
            <Grid3X3 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{nft.token_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-3">
            <div className="aspect-square rounded-lg overflow-hidden border bg-muted/50 relative mx-auto max-w-[200px] sm:max-w-[280px]">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={nft.token_name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 200px, 280px"
                  onError={e => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/placeholder.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Grid3X3 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Collection</p>
                  <p className="text-sm font-medium truncate">
                    {nft.collection_name}
                  </p>
                </div>

                {nft.amount && (
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-sm font-medium">{nft.amount}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                <p className={`text-xs truncate flex-1 ${GeistMono.className}`}>
                  {nft.token_data_id}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyTokenId}
                >
                  {copiedTokenId ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {nft.description && nft.description.length < 100 && (
                <div className="text-xs text-muted-foreground">
                  {nft.description}
                </div>
              )}
            </div>

            <Button
              variant="default"
              className="w-full"
              size="sm"
              onClick={() => window.open(explorerUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              View on Explorer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ProtocolDetailsDialog: React.FC<ProtocolDetailsDialogProps> = ({
  isOpen,
  onClose,
  protocolName,
  protocolLogo,
  defiPosition,
}) => {
  const protocolDetails = defiProtocols.find(
    protocol =>
      protocol.title.toLowerCase() === protocolName.toLowerCase() ||
      protocol.title.toLowerCase().includes(protocolName.toLowerCase()) ||
      protocolName.toLowerCase().includes(protocol.title.toLowerCase())
  );

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
          {defiPosition && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Your Position
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className={`text-lg ${GeistMono.className}`}>
                    {formatCurrency(defiPosition.totalValue || 0)}
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
                        {protocolDetails.security?.auditStatus || 'Unknown'}{' '}
                        Audit
                      </span>
                      <span className="xs:hidden">
                        {protocolDetails.security?.auditStatus || 'Unknown'}
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>

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
                      <p className={`text-lg ${GeistMono.className}`}>
                        {protocolDetails.tvl.current}
                      </p>
                    </div>
                  )}
                  {protocolDetails.volume?.total && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        Total Volume
                      </p>
                      <p className={`text-lg ${GeistMono.className}`}>
                        {protocolDetails.volume.total}
                      </p>
                    </div>
                  )}
                  {protocolDetails.yields?.current && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        Current Yield
                      </p>
                      <p className={`text-lg ${GeistMono.className}`}>
                        {protocolDetails.yields.current.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

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
