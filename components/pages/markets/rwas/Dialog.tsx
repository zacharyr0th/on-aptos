"use client";

import React, { memo, useCallback, useMemo } from "react";

import {
  AddressDisplay,
  BaseDialog,
  createCopyHandler,
  DialogInfoRow,
  DialogSection,
  formatDisplayText,
  hasValidData,
  type RWATokenData,
  type RwaDialogProps,
  TokenHeader,
} from "@/components/shared/dialogs";
import { Badge } from "@/components/ui/badge";
import { useResponsive } from "@/lib/hooks/useResponsive";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { formatCurrency } from "@/lib/utils";

interface RwaTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  token: RWATokenData;
  currentValue?: number;
}

// These utility functions are now provided by shared components

// Token name formatting is now handled by shared formatTokenName utility

// Get logo URL based on protocol
const getLogoUrl = (protocol: string, assetTicker: string): string => {
  const protocolLogos: Record<string, string> = {
    pact: "/icons/rwas/pact.png",
    securitize: "/icons/rwas/securitize.png",
    "franklin-templeton-benji-investments": "/icons/rwas/ft.jpeg",
    "libre-capital": "/icons/rwas/libre.png",
    ondo: "/icons/rwas/ondo.jpeg",
    blackrock: "/icons/rwas/blackrock.png",
  };

  // For BlackRock assets, use BlackRock logo regardless of protocol
  if (assetTicker === "BUIDL") {
    return "/icons/rwas/blackrock.png";
  }

  return protocolLogos[protocol] || "/icons/rwas/pact.png";
};

export const RwaTokenDialog = memo<RwaTokenDialogProps>(
  ({ isOpen, onClose, token, currentValue = 0 }) => {
    const { isMobile } = useResponsive();
    const { t } = useTranslation(["rwas", "common"]);
    const copyHandler = createCopyHandler();

    // Format the display value using real API data
    const displayValue = useMemo(() => {
      if (currentValue > 0) {
        return formatCurrency(currentValue, "USD", { compact: true });
      }
      return t("rwas:labels.value_not_available", "Value not available");
    }, [currentValue, t]);

    // Token header using shared component
    const headerContent = useMemo(
      () => (
        <TokenHeader
          symbol={token.assetTicker}
          name={token.name}
          logoUrl={getLogoUrl(token.protocol, token.assetTicker)}
          badges={[token.assetTicker]}
          formatContext={{
            protocol: token.protocol,
            standards: token.standards,
            isBridged: token.protocol === "ondo" && token.standards === "ERC-20",
            t,
          }}
        />
      ),
      [token, t]
    );

    return (
      <BaseDialog
        isOpen={isOpen}
        onClose={onClose}
        title={headerContent}
        size={isMobile ? "sm" : "lg"}
        showErrorBoundary={true}
      >
        <div className="space-y-6">
          {/* Value Information */}
          <DialogSection title={t("rwas:sections.value_information", "Value Information")}>
            <div className="bg-muted/50 rounded-lg p-4">
              <DialogInfoRow
                label={t("rwas:labels.current_value", "Current Value")}
                value={<span className="text-lg font-bold">{displayValue}</span>}
              />
            </div>
          </DialogSection>

          {/* Asset Details */}
          <DialogSection title={t("rwas:sections.asset_details", "Asset Details")}>
            <div className="space-y-4">
              <DialogInfoRow
                label={t("rwas:labels.asset_name", "Asset Name")}
                value={<span className="font-medium">{token.assetName}</span>}
              />

              {hasValidData(token.assetIssuer) && (
                <DialogInfoRow
                  label={t("rwas:labels.asset_issuer", "Asset Issuer")}
                  value={
                    <span className="font-medium">
                      {formatDisplayText(
                        token.assetIssuer,
                        t("rwas:labels.not_specified", "Not Specified")
                      )}
                    </span>
                  }
                />
              )}

              {hasValidData(token.standards) && (
                <DialogInfoRow
                  label={t("rwas:labels.standards", "Standards")}
                  value={
                    <span className="font-medium">
                      {formatDisplayText(
                        token.standards,
                        t("rwas:labels.not_specified", "Not Specified")
                      )}
                    </span>
                  }
                />
              )}
            </div>
          </DialogSection>

          {/* Regulatory Information */}
          {(hasValidData(token.assetRegulatoryFramework) ||
            hasValidData(token.assetGoverningBody)) && (
            <DialogSection
              title={t("rwas:sections.regulatory_information", "Regulatory Information")}
            >
              <div className="space-y-4">
                {hasValidData(token.assetRegulatoryFramework) && (
                  <DialogInfoRow
                    label={t("rwas:labels.regulatory_framework", "Regulatory Framework")}
                    value={
                      <span className="font-medium">
                        {formatDisplayText(
                          token.assetRegulatoryFramework,
                          t("rwas:labels.not_specified", "Not Specified")
                        )}
                      </span>
                    }
                  />
                )}

                {hasValidData(token.assetGoverningBody) && (
                  <DialogInfoRow
                    label={t("rwas:labels.governing_body", "Governing Body")}
                    value={
                      <span className="font-medium">
                        {formatDisplayText(
                          token.assetGoverningBody,
                          t("rwas:labels.not_specified", "Not Specified")
                        )}
                      </span>
                    }
                  />
                )}
              </div>
            </DialogSection>
          )}

          {/* Legal Structure */}
          {hasValidData(token.assetIssuerLegalStructureCountry) && (
            <DialogSection title={t("rwas:sections.legal_structure", "Legal Structure")}>
              <DialogInfoRow
                label={t(
                  "rwas:labels.issuer_legal_structure_country",
                  "Issuer Legal Structure Country"
                )}
                value={
                  <span className="font-medium">
                    {formatDisplayText(
                      token.assetIssuerLegalStructureCountry,
                      t("rwas:labels.not_specified", "Not Specified")
                    )}
                  </span>
                }
              />
            </DialogSection>
          )}

          {/* Technical Details */}
          <DialogSection title={t("rwas:sections.technical_details", "Technical Details")}>
            <DialogInfoRow
              label={t("rwas:labels.contract_address", "Contract Address")}
              value={
                <AddressDisplay
                  addresses={token.address}
                  onCopy={copyHandler}
                  showExplorerLinks={true}
                  truncate={isMobile}
                />
              }
            />
          </DialogSection>
        </div>
      </BaseDialog>
    );
  }
);

RwaTokenDialog.displayName = "RwaTokenDialog";
