'use client';

import { Copy, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import React, { useMemo, memo, useCallback } from 'react';
import { toast } from 'sonner';

import { DialogErrorFallback } from '@/components/errors/DialogErrorFallback';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency } from '@/lib/utils';

import { RWAToken } from './rwa-constants';


interface RwaTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  token: RWAToken;
  currentValue?: number; // Real current value from RWA.xyz API
}

// Format general text fields
const formatText = (
  text: string | undefined | null,
  fallback: string = 'Not Specified'
): string => {
  if (
    !text ||
    typeof text !== 'string' ||
    text.toLowerCase() === 'unknown' ||
    text.toLowerCase() === 'null'
  ) {
    return fallback;
  }
  // Replace hyphens with spaces and format as proper noun
  return text
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Check if field has valid data
const hasValidData = (text: string | undefined | null): boolean => {
  return !(
    !text ||
    typeof text !== 'string' ||
    text.toLowerCase() === 'unknown' ||
    text.toLowerCase() === 'null'
  );
};

// Format token name with (bridged) for Ondo ERC-20 tokens
const formatTokenName = (
  name: string,
  protocol: string,
  standards: string,
  t: (key: string, fallback?: string) => string
): string => {
  if (protocol === 'ondo' && standards === 'ERC-20') {
    return `${name} (${t('rwas:labels.bridged', 'bridged')})`;
  }
  return name;
};

// Get logo URL based on protocol
const getLogoUrl = (protocol: string, assetTicker: string): string => {
  const protocolLogos: Record<string, string> = {
    pact: '/icons/rwas/pact.png',
    securitize: '/icons/rwas/securitize.png',
    'franklin-templeton-benji-investments': '/icons/rwas/ft.jpeg',
    'libre-capital': '/icons/rwas/libre.png',
    ondo: '/icons/rwas/ondo.jpeg',
    blackrock: '/icons/rwas/blackrock.png',
  };

  // For BlackRock assets, use BlackRock logo regardless of protocol
  if (assetTicker === 'BUIDL') {
    return '/icons/rwas/blackrock.png';
  }

  return protocolLogos[protocol] || '/icons/rwas/pact.png';
};

export const RwaTokenDialog = memo<RwaTokenDialogProps>(
  ({ isOpen, onClose, token, currentValue = 0 }) => {
    const { isMobile } = useResponsive();
    const { t } = useTranslation(['rwas', 'common']);

    // Format the display value using real API data
    const displayValue = useMemo(() => {
      if (currentValue > 0) {
        return formatCurrency(currentValue, 'USD', { compact: true });
      }
      return t('rwas:labels.value_not_available', 'Value not available');
    }, [currentValue, t]);

    // Copy address handler
    const handleCopyAddress = useCallback(() => {
      if (token.address) {
        navigator.clipboard.writeText(token.address);
        toast.success(`${token.assetTicker} address copied!`);
      }
    }, [token.address, token.assetTicker]);

    // View on explorer handler
    const handleViewExplorer = useCallback(() => {
      if (token.address) {
        const explorerUrl = `https://explorer.aptoslabs.com/account/${token.address}`;
        window.open(explorerUrl, '_blank');
      }
    }, [token.address]);

    const formatAddress = (address: string): string => {
      if (address.length <= 20) return address;
      return `${address.slice(0, 10)}...${address.slice(-10)}`;
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={`${isMobile ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto ${!isMobile && 'sm:max-h-[85vh]'}`}
        >
          <ErrorBoundary
            fallback={<DialogErrorFallback onCloseDialog={onClose} />}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div
                  className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10'} relative flex-shrink-0`}
                >
                  <Image
                    src={getLogoUrl(token.protocol, token.assetTicker)}
                    alt={`${token.assetTicker} logo`}
                    width={40}
                    height={40}
                    className="object-contain rounded-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} font-semibold`}
                    >
                      {formatTokenName(
                        token.name,
                        token.protocol,
                        token.standards,
                        t
                      )}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {token.assetTicker}
                    </Badge>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className={`space-y-${isMobile ? '3' : '4 sm:space-y-6'}`}>
              {/* Value Information */}
              <div
                className={`bg-muted/50 rounded-lg ${isMobile ? 'p-2.5' : 'p-3 sm:p-4'}`}
              >
                <h3
                  className={`font-semibold mb-2 ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
                >
                  {t('rwas:sections.value_information', 'Value Information')}
                </h3>
                <div>
                  <p
                    className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}
                  >
                    {t('rwas:labels.current_value', 'Current Value')}
                  </p>
                  <p
                    className={`${isMobile ? 'text-base font-bold' : 'text-lg sm:text-xl font-bold'}`}
                  >
                    {displayValue}
                  </p>
                </div>
              </div>

              {/* Asset Details */}
              <div>
                <h3
                  className={`font-semibold mb-3 ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
                >
                  {t('rwas:sections.asset_details', 'Asset Details')}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className={`space-y-${isMobile ? '2' : '3'}`}>
                    <div>
                      <p
                        className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}
                      >
                        {t('rwas:labels.asset_name', 'Asset Name')}
                      </p>
                      <p
                        className={`font-medium ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
                      >
                        {token.assetName}
                      </p>
                    </div>

                    {hasValidData(token.assetIssuer) && (
                      <div>
                        <p
                          className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}
                        >
                          {t('rwas:labels.asset_issuer', 'Asset Issuer')}
                        </p>
                        <p
                          className={`font-medium ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
                        >
                          {formatText(
                            token.assetIssuer,
                            t('rwas:labels.not_specified', 'Not Specified')
                          )}
                        </p>
                      </div>
                    )}
                    {hasValidData(token.standards) && (
                      <div>
                        <p
                          className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}
                        >
                          {t('rwas:labels.standards', 'Standards')}
                        </p>
                        <p
                          className={`font-medium ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
                        >
                          {formatText(
                            token.standards,
                            t('rwas:labels.not_specified', 'Not Specified')
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Regulatory Information */}
              {(hasValidData(token.assetRegulatoryFramework) ||
                hasValidData(token.assetGoverningBody)) && (
                <div>
                  <h3
                    className={`font-semibold mb-3 ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
                  >
                    {t(
                      'rwas:sections.regulatory_information',
                      'Regulatory Information'
                    )}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {hasValidData(token.assetRegulatoryFramework) && (
                      <div>
                        <p
                          className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}
                        >
                          {t(
                            'rwas:labels.regulatory_framework',
                            'Regulatory Framework'
                          )}
                        </p>
                        <p
                          className={`font-medium ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
                        >
                          {formatText(
                            token.assetRegulatoryFramework,
                            t('rwas:labels.not_specified', 'Not Specified')
                          )}
                        </p>
                      </div>
                    )}
                    {hasValidData(token.assetGoverningBody) && (
                      <div>
                        <p
                          className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}
                        >
                          {t('rwas:labels.governing_body', 'Governing Body')}
                        </p>
                        <p
                          className={`font-medium ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
                        >
                          {formatText(
                            token.assetGoverningBody,
                            t('rwas:labels.not_specified', 'Not Specified')
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Legal Structure */}
              {hasValidData(token.assetIssuerLegalStructureCountry) && (
                <div>
                  <h3
                    className={`font-semibold mb-3 ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
                  >
                    {t('rwas:sections.legal_structure', 'Legal Structure')}
                  </h3>
                  <div>
                    <p
                      className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}
                    >
                      {t(
                        'rwas:labels.issuer_legal_structure_country',
                        'Issuer Legal Structure Country'
                      )}
                    </p>
                    <p
                      className={`font-medium ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
                    >
                      {formatText(
                        token.assetIssuerLegalStructureCountry,
                        t('rwas:labels.not_specified', 'Not Specified')
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div>
                <h3
                  className={`font-semibold mb-3 ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}
                >
                  {t('rwas:sections.technical_details', 'Technical Details')}
                </h3>
                <div className={`space-y-${isMobile ? '2' : '3'}`}>
                  <div>
                    <p
                      className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground`}
                    >
                      {t('rwas:labels.contract_address', 'Contract Address')}
                    </p>
                    <div
                      className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'} flex-wrap`}
                    >
                      <code
                        className={`bg-muted ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded text-xs font-mono break-all min-w-0 flex-1`}
                      >
                        {formatAddress(token.address)}
                      </code>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyAddress}
                          className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} p-0`}
                        >
                          <Copy
                            className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleViewExplorer}
                          className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} p-0`}
                        >
                          <ExternalLink
                            className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ErrorBoundary>
        </DialogContent>
      </Dialog>
    );
  }
);

RwaTokenDialog.displayName = 'RwaTokenDialog';
