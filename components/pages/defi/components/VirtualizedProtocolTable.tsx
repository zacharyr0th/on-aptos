import {
  Github,
  Globe,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useState, useMemo } from "react";

import { FaXTwitter } from "@/components/icons/SocialIcons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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


type SortField = 'tvl' | 'volume' | 'fees' | null;
type SortDirection = 'asc' | 'desc';

export const VirtualizedProtocolTable = React.memo(
  function VirtualizedProtocolTable({
    filteredProtocols,
  }: VirtualizedProtocolTableProps) {
    const { t } = usePageTranslation("defi");
    const [sortField, setSortField] = useState<SortField>('tvl');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');


    // Handle sorting
    const handleSort = useCallback((field: SortField) => {
      if (sortField === field) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('desc');
      }
    }, [sortField]);

    // Sort protocols
    const sortedProtocols = useMemo(() => {
      if (!sortField) return filteredProtocols;

      return [...filteredProtocols].sort((a, b) => {
        let aVal: number = 0;
        let bVal: number = 0;

        switch(sortField) {
          case 'tvl':
            aVal = parseFloat(a.tvl?.defiLlama || a.tvl?.current || '0');
            bVal = parseFloat(b.tvl?.defiLlama || b.tvl?.current || '0');
            // Handle NaN values by treating them as 0
            aVal = isNaN(aVal) ? 0 : aVal;
            bVal = isNaN(bVal) ? 0 : bVal;
            break;
          case 'volume':
            aVal = parseFloat(a.volume?.daily || '0');
            bVal = parseFloat(b.volume?.daily || '0');
            aVal = isNaN(aVal) ? 0 : aVal;
            bVal = isNaN(bVal) ? 0 : bVal;
            break;
          case 'fees':
            aVal = parseFloat(a.financials?.fees?.daily || '0');
            bVal = parseFloat(b.financials?.fees?.daily || '0');
            aVal = isNaN(aVal) ? 0 : aVal;
            bVal = isNaN(bVal) ? 0 : bVal;
            break;
        }

        if (sortDirection === 'asc') {
          return aVal - bVal;
        } else {
          return bVal - aVal;
        }
      });
    }, [filteredProtocols, sortField, sortDirection]);

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
      [t],
    );

    return (
      <div className="space-y-4">
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px] sm:min-w-[250px] px-3">
                  {t("table.protocol", "Protocol")}
                </TableHead>
                <TableHead className="min-w-[100px] sm:min-w-[120px] hidden sm:table-cell px-3">
                  {t("table.category", "Category")}
                </TableHead>
                <TableHead className="min-w-[120px] sm:min-w-[150px] hidden md:table-cell px-3">
                  {t("table.subcategory", "Subcategory")}
                </TableHead>
                <TableHead 
                  className="min-w-[140px] sm:min-w-[160px] cursor-pointer px-3"
                  onClick={() => handleSort('tvl')}
                >
                  <div className="flex items-center gap-1">
                    {t("table.tvl", "TVL")}
                    {sortField === 'tvl' ? (
                      sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[140px] sm:min-w-[160px] cursor-pointer hidden lg:table-cell px-3"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center gap-1">
                    {t("table.volume_24h", "24h Volume")}
                    {sortField === 'volume' ? (
                      sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[120px] sm:min-w-[140px] cursor-pointer hidden lg:table-cell px-3"
                  onClick={() => handleSort('fees')}
                >
                  <div className="flex items-center gap-1">
                    {t("table.fees_24h", "24h Fees")}
                    {sortField === 'fees' ? (
                      sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                    ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </TableHead>
                <TableHead className="min-w-[100px] px-3">
                  {t("table.links", "Links")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                    {sortedProtocols.map((protocol, index) => {
                      const socialLinks = getSocialLinks(protocol);

                      // Helper function to format numbers with cleaner display
                      const formatNumber = (num: string | number | undefined) => {
                        if (!num) return '-';
                        const n = typeof num === 'string' ? parseFloat(num.replace(/[^0-9.-]/g, '')) : num;
                        if (isNaN(n)) return '-';
                        
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
                        if (!percent) return '-';
                        const val = parseFloat(percent);
                        const color = val >= 0 ? 'text-green-600' : 'text-red-600';
                        return (
                          <span className={positive ? color : ''}>
                            {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                          </span>
                        );
                      };

                      return (
                        <React.Fragment key={protocol.title}>
                          <TableRow>
                            {/* Protocol Name */}
                            <TableCell className="min-w-[200px] sm:min-w-[250px] whitespace-nowrap px-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  {protocol.logo ? (
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-secondary">
                                      <Image
                                        src={protocol.logo}
                                        alt={`${protocol.title} logo`}
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                      <span className="font-bold text-gray-600 dark:text-gray-300 text-xs">
                                        {protocol.title.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="font-semibold text-sm truncate">
                                  {protocol.title}
                                  {/* Show indicator for cross-chain protocols */}
                                  {(protocol.title.toLowerCase().includes('pancake') || 
                                    protocol.title.toLowerCase().includes('sushi') ||
                                    protocol.title.toLowerCase().includes('wormhole') ||
                                    protocol.title.toLowerCase().includes('layer')) && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="ml-1 text-xs text-primary align-super">●</span>
                                      </TooltipTrigger>
                                      <TooltipContent side="right">
                                        <p className="text-xs">Cross-chain protocol - showing Aptos data only</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* Category */}
                            <TableCell className="min-w-[100px] sm:min-w-[120px] hidden sm:table-cell px-3">
                              <span className="inline-flex items-center bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                                {t(`defi:categories.${protocol.category}.name`, protocol.category)}
                              </span>
                            </TableCell>

                            {/* Subcategory */}
                            <TableCell className="min-w-[120px] sm:min-w-[150px] text-sm text-muted-foreground hidden md:table-cell px-3">
                              {protocol.subcategory || '-'}
                            </TableCell>

                            {/* TVL with 7d Change */}
                            <TableCell className="min-w-[140px] sm:min-w-[160px] text-sm px-3">
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {formatNumber(protocol.tvl?.defiLlama || protocol.tvl?.current)}
                                </div>
                                <div className="text-xs">
                                  {formatPercent(protocol.tvl?.change7d)}
                                </div>
                              </div>
                            </TableCell>

                            {/* 24h Volume with Change */}
                            <TableCell className="min-w-[140px] sm:min-w-[160px] text-sm hidden lg:table-cell px-3">
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {formatNumber(protocol.volume?.daily)}
                                </div>
                                <div className="text-xs">
                                  {formatPercent(protocol.volume?.change24h)}
                                </div>
                              </div>
                            </TableCell>

                            {/* 24h Fees */}
                            <TableCell className="min-w-[120px] sm:min-w-[140px] text-sm hidden lg:table-cell px-3">
                              {formatNumber(protocol.financials?.fees?.daily)}
                            </TableCell>

                            {/* Links */}
                            <TableCell className="min-w-[100px] px-3">
                              <div className="flex items-center gap-1">
                                {socialLinks.map((link, linkIndex) => {
                                  const IconComponent = link.icon;
                                  return (
                                    <Tooltip key={linkIndex}>
                                      <TooltipTrigger asChild>
                                        <Link
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <IconComponent className="w-4 h-4" />
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
            <p className="text-lg font-medium text-muted-foreground">
              No protocols found.
            </p>
          </div>
        )}
      </div>
    );
  },
);
