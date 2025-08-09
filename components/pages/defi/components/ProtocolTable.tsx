import { Github, Globe, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useMemo } from "react";
import { FaXTwitter } from "react-icons/fa6";

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
// DISABLED - DefiProtocol import removed since we no longer handle protocol click events
// import { defiProtocols, protocolLogos, categoryDefinitions, DefiProtocol } from '../data';

interface ProtocolTableProps {
  filteredProtocols: typeof defiProtocols;
  // DISABLED - onProtocolClick prop removed to disable dialog functionality
  // onProtocolClick?: (protocol: DefiProtocol) => void;
}

type SortField = 'protocol' | 'category' | 'subcategory';
type SortDirection = 'asc' | 'desc';

export const ProtocolTable = React.memo(function ProtocolTable({
  filteredProtocols,
}: ProtocolTableProps) {
  const { t } = usePageTranslation("defi");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort protocols based on current sort field and direction
  const sortedProtocols = useMemo(() => {
    if (!sortField) return filteredProtocols;

    return [...filteredProtocols].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortField) {
        case 'protocol':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'subcategory':
          aValue = a.subcategory.toLowerCase();
          bValue = b.subcategory.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProtocols, sortField, sortDirection]);

  // Function to get social links for a protocol
  const getSocialLinks = (protocol: (typeof defiProtocols)[0]) => {
    const links = [];

    // Add website link (prefer DeFiLlama data, fallback to protocol.href)
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
  };

  // Mobile Card Layout component removed (was unused)

  return (
    <div className="overflow-x-auto">
      {/* Mobile Card Layout */}
      <div className="block sm:hidden">
        <div className="space-y-3">
                {sortedProtocols.map((protocol, index) => {
                  const socialLinks = getSocialLinks(protocol);

                  return (
                    <div key={protocol.title} className="border rounded-lg bg-card">
                      <div className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="space-y-3">
                          {/* Header Row - Fixed height container */}
                          <div className="flex items-start justify-between min-h-[56px]">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 w-12 h-12">
                                {protocol.logo ? (
                                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-secondary ring-2 ring-border/20">
                                    <Image
                                      src={protocol.logo}
                                      alt={`${protocol.title} logo`}
                                      fill
                                      sizes="48px"
                                      priority={index < 6 || protocol.title === "Amnis"}
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center ring-2 ring-border/20">
                                    <span className="font-bold text-gray-600 dark:text-gray-300 text-lg">
                                      {protocol.title.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 py-1">
                                <div className="font-bold text-lg mb-1 truncate">
                                  {protocol.title}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Details Row - Fixed spacing */}
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
                                    <Tooltip key={linkIndex}>
                                      <TooltipTrigger asChild>
                                        <Link
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-muted/50 rounded-lg"
                                        >
                                          {IconComponent &&
                                            React.createElement(
                                              IconComponent as React.ComponentType<any>,
                                              { className: "w-4 h-4" },
                                            )}
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
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">
                <button
                  onClick={() => handleSort('protocol')}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  Protocol
                  {sortField === 'protocol' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </TableHead>
              <TableHead className="min-w-[120px]">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  Category
                  {sortField === 'category' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </TableHead>
              <TableHead className="min-w-[180px]">
                <button
                  onClick={() => handleSort('subcategory')}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  Subcategory
                  {sortField === 'subcategory' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </TableHead>
              <TableHead className="min-w-[100px]">Links</TableHead>
            </TableRow>
          </TableHeader>
                <TableBody>
                  {sortedProtocols.map((protocol, index) => {
                    const socialLinks = getSocialLinks(protocol);

                    return (
                      <TableRow key={protocol.title}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {protocol.logo ? (
                              <Image
                                src={protocol.logo}
                                alt={`${protocol.title} logo`}
                                width={20}
                                height={20}
                                className="rounded-full flex-shrink-0"
                                priority={index < 6}
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                  {protocol.title.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="font-medium">{protocol.title}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {t(`defi:categories.${protocol.category}.name`, protocol.category)}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {protocol.subcategory
                              .split(", ")
                              .map((subcategory: string, subIndex: number) => (
                                <span
                                  key={subIndex}
                                  className="text-sm text-muted-foreground"
                                >
                                  {subcategory.trim()}{subIndex < protocol.subcategory.split(", ").length - 1 ? "," : ""}
                                </span>
                              ))}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {socialLinks.map((link, linkIndex) => {
                              const IconComponent = link.icon;
                              return (
                                <Link
                                  key={linkIndex}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                >
                                  {IconComponent &&
                                    React.createElement(
                                      IconComponent as React.ComponentType<any>,
                                      { className: "w-4 h-4" },
                                    )}
                                </Link>
                              );
                            })}
                            {socialLinks.length === 0 && (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
