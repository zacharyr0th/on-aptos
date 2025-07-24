import {
  ExternalLink,
  Copy,
  Check,
  X,
  Globe,
  Activity,
  TrendingUp,
  Clock,
  Users,
  Layers,
  Eye,
  Hash,
  Calendar,
  Info,
} from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { NFTTransferHistory } from './NFTTransferHistory';
import type { NFT } from './types';

interface NFTDetailViewProps {
  nft: NFT;
  onClose?: () => void;
  className?: string;
}

export function NFTDetailView({ nft, onClose, className }: NFTDetailViewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [attributes, setAttributes] = useState<any[]>([]);

  const imageUrl = nft.cdn_image_uri || nft.token_uri || '/placeholder.jpg';
  const explorerUrl = `https://explorer.aptoslabs.com/object/${nft.token_data_id}?network=mainnet`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(parseInt(timestamp) / 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const truncateAddress = (address: string, chars = 6) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

  // Parse attributes if available
  useEffect(() => {
    if (nft.token_properties) {
      try {
        const props =
          typeof nft.token_properties === 'string'
            ? JSON.parse(nft.token_properties)
            : nft.token_properties;
        const attrs = Object.entries(props).map(([key, value]) => ({
          trait_type: key,
          value: value,
        }));
        setAttributes(attrs);
      } catch (e) {
        console.error('Failed to parse token properties:', e);
      }
    }
  }, [nft]);

  return (
    <Card className={cn('w-full max-w-7xl mx-auto', className)}>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 h-full">
          {/* Left Column - Image and Basic Info */}
          <div className="relative p-6 lg:p-8 space-y-6 bg-muted/20">
            {/* Close Button */}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 z-10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* NFT Image */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-background/50 backdrop-blur-sm border shadow-lg">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse bg-muted w-full h-full" />
                </div>
              )}
              <Image
                src={imageUrl}
                alt={nft.token_name || 'NFT'}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={cn(
                  'object-contain transition-opacity duration-300',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
                onError={e => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.src = '/placeholder.jpg';
                  setImageLoaded(true);
                }}
                priority
              />
              {nft.amount > 1 && (
                <Badge className="absolute top-4 right-4 text-lg px-3 py-1">
                  ×{nft.amount}
                </Badge>
              )}
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">
                  {nft.token_name || 'Unnamed NFT'}
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  {nft.collection_name || 'Unknown Collection'}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(explorerUrl, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(nft.token_data_id, 'Token ID')
                        }
                      >
                        {copied === 'Token ID' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy Token ID</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Collection Stats */}
              {nft.collection_description && (
                <div className="p-4 bg-background/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    {nft.collection_description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="p-6 lg:p-8 overflow-y-auto max-h-[800px]">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="attributes">Attributes</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-6">
                {/* Description */}
                {nft.description && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Description
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {nft.description}
                    </p>
                  </div>
                )}

                {/* Token Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Token Details
                  </h3>
                  <div className="space-y-3">
                    {/* Token ID */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Token ID</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {truncateAddress(nft.token_data_id)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(nft.token_data_id, 'Token ID')
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Creator */}
                    {nft.creator_address && (
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Creator</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-background px-2 py-1 rounded">
                            {truncateAddress(nft.creator_address)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(nft.creator_address!, 'Creator')
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Last Transaction */}
                    {nft.last_transaction_timestamp && (
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Last Activity
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(nft.last_transaction_timestamp)}
                        </span>
                      </div>
                    )}

                    {/* Property Version */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">
                        Property Version
                      </span>
                      <Badge variant="secondary">
                        v{nft.property_version_v1}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Collection Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Collection Info
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Name</span>
                        <span className="text-sm">{nft.collection_name}</span>
                      </div>
                      {nft.collection_uri && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Collection URI
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(nft.collection_uri, '_blank')
                            }
                          >
                            <Globe className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attributes" className="space-y-6 mt-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Attributes
                </h3>
                {attributes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {attributes.map((attr, index) => (
                      <div
                        key={index}
                        className="p-4 bg-muted/30 rounded-lg border hover:border-primary/50 transition-colors"
                      >
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {attr.trait_type}
                        </p>
                        <p className="text-sm font-medium mt-1">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attributes available for this NFT</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <NFTTransferHistory tokenDataId={nft.token_data_id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
