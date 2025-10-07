import { Github, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback } from "react";
import { FaXTwitter } from "@/components/icons/SocialIcons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePageTranslation } from "@/lib/hooks/useTranslation";
import type { BaseTableProps } from "@/lib/types/ui";
import type { defiProtocols } from "../data";

interface VirtualizedProtocolTableProps
  extends Omit<BaseTableProps, "onItemSelect" | "selectedItem"> {
  filteredProtocols: typeof defiProtocols;
  height?: number; // Made optional since we're not using virtualization
}

const DESKTOP_ROW_HEIGHT = 88;

export const VirtualizedProtocolTable = React.memo(function VirtualizedProtocolTable({
  filteredProtocols,
}: VirtualizedProtocolTableProps) {
  const { t } = usePageTranslation("defi");

  // Helper function to get social links for a protocol
  const getSocialLinks = useCallback(
    (protocol: (typeof defiProtocols)[0]) => {
      const links = [];

      // Add website link
      const websiteUrl = protocol.href;
      if (websiteUrl && websiteUrl !== "#") {
        links.push({
          type: "website",
          url: websiteUrl,
          icon: Globe,
          label: t("protocol.website", "Website"),
        });
      }

      // Add GitHub link if available
      if (protocol.external?.socials?.github) {
        links.push({
          type: "github",
          url: protocol.external.socials.github,
          icon: Github,
          label: t("protocol.github", "GitHub"),
        });
      }

      // Add Twitter link if available
      if (protocol.external?.socials?.twitter) {
        links.push({
          type: "twitter",
          url: protocol.external.socials.twitter,
          icon: FaXTwitter,
          label: t("protocol.twitter", "Twitter"),
        });
      }

      return links;
    },
    [t]
  );

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%] px-6">{t("table.protocol", "Protocol")}</TableHead>
            <TableHead className="w-[20%] hidden sm:table-cell px-6">
              {t("table.category", "Category")}
            </TableHead>
            <TableHead className="w-[35%] hidden md:table-cell px-6">
              {t("table.subcategory", "Subcategory")}
            </TableHead>
            <TableHead className="w-[15%] px-6">{t("table.links", "Links")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProtocols.map((protocol, index) => {
            const socialLinks = getSocialLinks(protocol);

            // Helper function to format numbers with cleaner display
            const formatNumber = (num: string | number | undefined) => {
              if (!num) return "-";
              const n = typeof num === "string" ? parseFloat(num.replace(/[^0-9.-]/g, "")) : num;
              if (isNaN(n)) return "-";

              if (n >= 1e9) {
                // For billions, show 1 decimal place if less than 10B, otherwise no decimals
                const billions = n / 1e9;
                return `$${billions >= 10 ? billions.toFixed(0) : billions.toFixed(1)}B`;
              }
              if (n >= 1e6) {
                // For millions, show 1 decimal place if less than 10M, otherwise no decimals
                const millions = n / 1e6;
                return `$${millions >= 10 ? millions.toFixed(0) : millions.toFixed(1)}M`;
              }
              if (n >= 1e3) {
                // For thousands, show no decimal places
                return `$${(n / 1e3).toFixed(0)}K`;
              }
              // For small numbers, show appropriate decimals
              return n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
            };

            const formatPercent = (percent: string | undefined, positive = true) => {
              if (!percent) return "-";
              const val = parseFloat(percent);
              const color = val >= 0 ? "text-green-600" : "text-red-600";
              return (
                <span className={positive ? color : ""}>
                  {val >= 0 ? "+" : ""}
                  {val.toFixed(2)}%
                </span>
              );
            };

            return (
              <React.Fragment key={protocol.title}>
                <TableRow>
                  {/* Protocol Name */}
                  <TableCell className="w-[30%] px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {protocol.logo ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-secondary">
                            <Image
                              src={protocol.logo}
                              alt={`${protocol.title} logo`}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                            <span className="font-bold text-gray-600 dark:text-gray-300 text-sm">
                              {protocol.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="font-semibold text-base">
                        {protocol.title}
                        {/* Show indicator for cross-chain protocols */}
                        {(protocol.title.toLowerCase().includes("pancake") ||
                          protocol.title.toLowerCase().includes("sushi") ||
                          protocol.title.toLowerCase().includes("wormhole") ||
                          protocol.title.toLowerCase().includes("layer")) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1 text-xs text-primary align-super">●</span>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-xs">
                                Cross-chain protocol - showing Aptos data only
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="w-[20%] hidden sm:table-cell px-6">
                    <span className="inline-flex items-center bg-primary/10 text-primary px-3 py-1.5 rounded text-sm font-medium">
                      {t(`defi:categories.${protocol.category}.name`, protocol.category)}
                    </span>
                  </TableCell>

                  {/* Subcategory */}
                  <TableCell className="w-[35%] text-sm text-muted-foreground hidden md:table-cell px-6">
                    {protocol.subcategory || "-"}
                  </TableCell>

                  {/* Links */}
                  <TableCell className="w-[15%] px-6">
                    <div className="flex items-center gap-2">
                      {socialLinks.map((link, linkIndex) => {
                        const IconComponent = link.icon;
                        return (
                          <Tooltip key={linkIndex}>
                            <TooltipTrigger asChild>
                              <Link
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <IconComponent className="w-5 h-5" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p className="text-xs">{link.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>

      {/* Empty State */}
      {filteredProtocols.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg font-medium text-muted-foreground">No protocols found.</p>
        </div>
      )}
    </div>
  );
});
