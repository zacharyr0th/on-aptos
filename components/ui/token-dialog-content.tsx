import { ExternalLink, Copy } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { InfoRow } from "@/components/ui/info-row";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/useTranslation";
import { TokenMetadata, normalizeIssuer } from "@/lib/types/tokens";

interface TokenDialogContentProps {
  metadata: TokenMetadata;
  formattedSupply: React.ReactNode;
  formattedAddresses?: React.ReactNode;
  handleCopy: (text: string, label: string) => void;
  children?: React.ReactNode; // For custom content sections
}

export const TokenDialogContent: React.FC<TokenDialogContentProps> = ({
  metadata,
  formattedSupply,
  formattedAddresses,
  handleCopy,
  children,
}) => {
  const { t, i18nT } = useTranslation(["common", "btc", "stables", "rwas"]);

  const issuerName = React.useMemo(() => {
    const normalizedIssuer = normalizeIssuer(metadata.issuer);
    if (!normalizedIssuer) return "";
    const name = normalizedIssuer.name || "";
    if (name.startsWith("Tether")) return "Tether";
    if (name.startsWith("Circle")) return "Circle";
    if (name.startsWith("Ethena")) return "Ethena";
    return name.split(" ")[0];
  }, [metadata.issuer]);

  const addressLines = metadata.assetAddress
    ? metadata.assetAddress.split("\n")
    : [];
  const explorerLines = metadata.explorerLink
    ? metadata.explorerLink.split("\n")
    : [];

  const defaultAddressDisplay = (
    <div className="space-y-2">
      {addressLines.map((address: any, index: number) => (
        <div key={`address-${index}`} className="flex items-center gap-2">
          <div className="flex-grow">
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono break-all">
              {address}
            </code>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() =>
              handleCopy(address, t("common:actions.copy", "address"))
            }
            aria-label={t("common:actions.copy_address", "Copy address")}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );

  const defaultExplorerLinks =
    explorerLines.length > 0 ? (
      explorerLines.map((link: any, index: number) => (
        <a
          key={`explorer-${index}`}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm hover:underline text-primary"
        >
          {t("common:labels.aptos_explorer", "Aptos Explorer")}{" "}
          {index > 0 ? `(${index + 1})` : ""}{" "}
          <ExternalLink className="h-3 w-3" />
        </a>
      ))
    ) : (
      <a
        href={metadata.explorerLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-sm hover:underline text-primary"
      >
        {t("common:labels.aptos_explorer", "Aptos Explorer")}{" "}
        <ExternalLink className="h-3 w-3" />
      </a>
    );

  return (
    <div className="space-y-6">
      <InfoRow
        label={`${t("common:labels.type", "Type")}:`}
        value={String(metadata.type || "—")}
      />
      <InfoRow
        label={`${t("common:labels.asset_address", "Asset Address")}:`}
        value={formattedAddresses || defaultAddressDisplay}
      />
      <InfoRow
        label={`${t("common:labels.issuer", "Issuer")}:`}
        value={String(
          normalizeIssuer(metadata.issuer)?.name ||
            (typeof metadata.issuer === "string" ? metadata.issuer : "") ||
            "",
        )}
      />
      <InfoRow
        label={`${t("common:labels.decimals", "Decimals")}:`}
        value={metadata.decimals}
      />
      <InfoRow
        label={`${t("common:labels.total_supply", "Total Supply")}:`}
        value={formattedSupply}
      />

      <Separator />

      <InfoRow
        label={`${t("common:labels.links", "Links")}:`}
        value={
          <div className="space-y-3">
            {defaultExplorerLinks}
            <a
              href={metadata.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm hover:underline text-primary"
            >
              {i18nT("common:labels.issuer_website", { issuerName }) ||
                `${issuerName}'s Website`}{" "}
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={metadata.auditLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm hover:underline text-primary"
            >
              {metadata.tags?.includes("stablecoin")
                ? t(
                    "common:labels.audit_proof_reserves",
                    "Audit / Proof of Reserves",
                  )
                : t(
                    "common:labels.audit_information",
                    "Audit Information",
                  )}{" "}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        }
      />

      <InfoRow
        label={`${t("common:labels.tags", "Tags")}:`}
        value={
          <div className="flex flex-wrap gap-2">
            {metadata.tags?.map((tag: any) => (
              <span
                key={tag}
                className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        }
      />

      {children}
    </div>
  );
};
