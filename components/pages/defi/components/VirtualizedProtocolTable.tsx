import { Github, Globe, ChevronDown, ChevronRight, ExternalLink, Shield, TrendingUp, DollarSign } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useState } from "react";

import { FaXTwitter } from "@/components/icons/SocialIcons";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { usePageTranslation } from "@/hooks/useTranslation";

import { defiProtocols } from "../data";

interface VirtualizedProtocolTableProps {
  filteredProtocols: typeof defiProtocols;
  height?: number; // Made optional since we're not using virtualization
}

const DESKTOP_ROW_HEIGHT = 88;

// Protocol Details Component
const ProtocolDetails = React.memo(({ protocol, t }: { protocol: (typeof defiProtocols)[0], t: (key: string, fallback?: string) => string }) => (
  <div className="border-t bg-muted/20 p-4 md:p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Basic Information */}
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          {t("defi:details.basic_info", "Basic Information")}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("defi:details.status", "Status")}:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              protocol.status === "Active" 
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
            }`}>
              {protocol.status}
            </span>
          </div>
          {protocol.launchDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("defi:details.launch_date", "Launch Date")}:</span>
              <span>{new Date(protocol.launchDate).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("defi:details.networks", "Networks")}:</span>
            <span className="capitalize">{protocol.networks.join(", ")}</span>
          </div>
        </div>
      </div>

      {/* Security & Audit */}
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {t("defi:details.security", "Security & Audit")}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("defi:details.audit_status", "Audit Status")}:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              protocol.security.auditStatus === "Audited"
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : protocol.security.auditStatus === "In Progress"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
            }`}>
              {protocol.security.auditStatus || "Unknown"}
            </span>
          </div>
          {protocol.security.auditFirms && protocol.security.auditFirms.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("defi:details.audit_firms", "Audit Firms")}:</span>
              <span className="text-right">{protocol.security.auditFirms.join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          {t("defi:details.metrics", "Financial Metrics")}
        </h4>
        <div className="space-y-2 text-sm">
          {protocol.tvl && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("defi:details.tvl", "TVL")}:</span>
              <span className="font-medium">{protocol.tvl.current}</span>
            </div>
          )}
          {protocol.volume?.daily && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("defi:details.daily_volume", "Daily Volume")}:</span>
              <span>{protocol.volume.daily}</span>
            </div>
          )}
          {protocol.yields?.current && protocol.yields.current.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("defi:details.yields", "Yields")}:</span>
              <span>{protocol.yields.current.join(", ")}</span>
            </div>
          )}
          {protocol.users && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("defi:details.users", "Users")}:</span>
              <span>{protocol.users}</span>
            </div>
          )}
        </div>
      </div>

      {/* Token Information */}
      {protocol.token && (
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            {t("defi:details.token_info", "Token Information")}
          </h4>
          <div className="space-y-2 text-sm">
            {protocol.token.governanceToken && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("defi:details.token", "Token")}:</span>
                <span className="font-medium">{protocol.token.governanceTokenSymbol || protocol.token.governanceToken}</span>
              </div>
            )}
            {protocol.token.price && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("defi:details.price", "Price")}:</span>
                <span>${protocol.token.price}</span>
              </div>
            )}
            {protocol.token.marketCap && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("defi:details.market_cap", "Market Cap")}:</span>
                <span>{protocol.token.marketCap}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integration Links */}
      {protocol.integration && (
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Github className="w-4 h-4" />
            {t("defi:details.integration", "Integration")}
          </h4>
          <div className="space-y-2 text-sm">
            {protocol.integration.docs && (
              <Link
                href={protocol.integration.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {t("defi:details.documentation", "Documentation")}
              </Link>
            )}
            {protocol.integration.smartContractLinks && protocol.integration.smartContractLinks.map((link, index) => (
              <Link
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Github className="w-3 h-3" />
                {t("defi:details.github", "GitHub Repository")}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="space-y-3 md:col-span-2 lg:col-span-3">
        <h4 className="font-semibold">{t("defi:details.description", "Description")}</h4>
        <p className="text-sm text-muted-foreground">
          {t(protocol.description, "Protocol description not available")}
        </p>
      </div>
    </div>
  </div>
));

ProtocolDetails.displayName = "ProtocolDetails";

export const VirtualizedProtocolTable = React.memo(
  function VirtualizedProtocolTable({
    filteredProtocols,
  }: VirtualizedProtocolTableProps) {
    const { t } = usePageTranslation("defi");
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    
    const toggleExpanded = useCallback((index: number) => {
      setExpandedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    }, []);

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
            label: t("defi:protocol.website", "Website"),
          });
        }

        // Add GitHub link if available
        if (protocol.external?.socials?.github) {
          links.push({
            type: "github",
            url: protocol.external.socials.github,
            icon: Github,
            label: t("defi:protocol.github", "GitHub"),
          });
        }

        // Add Twitter link if available
        if (protocol.external?.socials?.twitter) {
          links.push({
            type: "twitter",
            url: protocol.external.socials.twitter,
            icon: FaXTwitter,
            label: t("defi:protocol.twitter", "Twitter"),
          });
        }

        return links;
      },
      [t],
    );


    return (
      <div className="space-y-4">
        {/* Table Container - Similar to other tables */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
              
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <div className="border-b bg-card">
                  <div className="flex items-center hover:bg-transparent">
                    <div className="font-bold text-base py-4 md:py-6 px-4 md:px-8 w-1/4">
                      {t("defi:table.protocol", "Protocol")}
                    </div>
                    <div className="font-bold text-base py-6 px-6 w-1/4">
                      {t("defi:table.category", "Category")}
                    </div>
                    <div className="font-bold text-base py-6 px-6 w-1/4">
                      {t("defi:table.subcategory", "Subcategory")}
                    </div>
                    <div className="font-bold text-base py-6 pl-6 pr-4 w-1/4 text-right">
                      {t("defi:table.links", "Links")}
                    </div>
                  </div>
                </div>

                {/* Desktop Rows */}
                {filteredProtocols.map((protocol, index) => {
                  const socialLinks = getSocialLinks(protocol);
                  const isExpanded = expandedRows.has(index);
                  
                  return (
                    <div key={protocol.title} className="border-b">
                      <div 
                        className="flex items-center px-4 md:px-8 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleExpanded(index)}
                        style={{ minHeight: DESKTOP_ROW_HEIGHT }}
                      >
                        {/* Expand/Collapse Icon */}
                        <div className="flex-shrink-0 mr-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Protocol Info */}
                        <div className="flex gap-4 min-w-0 items-center w-1/4">
                          <div className="flex-shrink-0">
                            {protocol.logo ? (
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-secondary ring-2 ring-border/20">
                                <Image
                                  src={protocol.logo}
                                  alt={`${protocol.title} logo`}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center ring-2 ring-border/20">
                                <span className="font-bold text-gray-600 dark:text-gray-300 text-sm">
                                  {protocol.title.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold truncate text-base">
                              {protocol.title}
                            </div>
                            {protocol.categoryBreakdown && (
                              <div className="text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  {t(protocol.categoryBreakdown, "Multiple DeFi services")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Category */}
                        <div className="w-1/4 px-6">
                          <span className="inline-flex items-center bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
                            {t(
                              `defi:categories.${protocol.category}.name`,
                              protocol.category,
                            )}
                          </span>
                        </div>

                        {/* Subcategory */}
                        <div className="w-1/4 px-6">
                          <div className="flex flex-wrap gap-2">
                            {protocol.subcategory
                              .split(", ")
                              .map((subcategory: string, subIndex: number) => (
                                <span
                                  key={subIndex}
                                  className="inline-flex items-center bg-secondary/60 text-secondary-foreground px-3 py-1.5 rounded-lg text-sm font-medium"
                                >
                                  {subcategory.trim()}
                                </span>
                              ))}
                          </div>
                        </div>

                        {/* Links */}
                        <div className="w-1/4 pl-6 pr-4 flex justify-end">
                          <div className="flex items-center gap-3">
                            {socialLinks.map((link, linkIndex) => {
                              const IconComponent = link.icon;
                              return (
                                <Tooltip key={linkIndex}>
                                  <TooltipTrigger asChild>
                                    <Link
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-muted/50 rounded-lg"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <IconComponent className="w-5 h-5" />
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="bottom"
                                    className="bg-popover text-popover-foreground border border-border [&>svg]:hidden"
                                  >
                                    <p className="text-sm">{link.label}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            {socialLinks.length === 0 && (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <ProtocolDetails protocol={protocol} t={t} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden">
                <div className="space-y-3 p-4">
                  {filteredProtocols.map((protocol, index) => {
                    const socialLinks = getSocialLinks(protocol);
                    const isExpanded = expandedRows.has(index);
                    
                    return (
                      <div key={protocol.title} className="border rounded-lg bg-card">
                        <div 
                          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleExpanded(index)}
                        >
                          <div className="space-y-3">
                            {/* Header Row */}
                            <div className="flex items-start justify-between min-h-[56px]">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0 w-16 h-16">
                                  {protocol.logo ? (
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-secondary ring-2 ring-border/20">
                                      <Image
                                        src={protocol.logo}
                                        alt={`${protocol.title} logo`}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center ring-2 ring-border/20">
                                      <span className="font-bold text-gray-600 dark:text-gray-300 text-xl">
                                        {protocol.title.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                  <div className="font-bold text-xl mb-2 truncate">
                                    {protocol.title}
                                  </div>
                                  {protocol.categoryBreakdown && (
                                    <div className="text-xs text-muted-foreground truncate">
                                      {t(protocol.categoryBreakdown, "Multiple DeFi services")}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            
                            {/* Category and Subcategory */}
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Category:</span>
                                <span className="inline-flex items-center bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
                                  {t(
                                    `defi:categories.${protocol.category}.name`,
                                    protocol.category,
                                  )}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-xs text-muted-foreground flex-shrink-0">Subcategory:</span>
                                <div className="flex flex-wrap gap-1">
                                  {protocol.subcategory
                                    .split(", ")
                                    .map((subcategory: string, subIndex: number) => (
                                      <span
                                        key={subIndex}
                                        className="inline-flex items-center bg-secondary/60 text-secondary-foreground px-2 py-1 rounded text-xs font-medium"
                                      >
                                        {subcategory.trim()}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            </div>
                            
                            {/* Links */}
                            {socialLinks.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Links:</span>
                                <div className="flex items-center gap-2">
                                  {socialLinks.map((link, linkIndex) => {
                                    const IconComponent = link.icon;
                                    return (
                                      <Link
                                        key={linkIndex}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-muted/50 rounded-lg"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <IconComponent className="w-4 h-4" />
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {isExpanded && (
                          <ProtocolDetails protocol={protocol} t={t} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Empty State */}
              {filteredProtocols.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg font-medium text-muted-foreground">No protocols found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
