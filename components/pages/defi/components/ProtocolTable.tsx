import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/useResponsive';
import { defiProtocols } from '../data';
import { usePageTranslation } from '@/hooks/useTranslation';
// DISABLED - DefiProtocol import removed since we no longer handle protocol click events
// import { defiProtocols, protocolLogos, categoryDefinitions, DefiProtocol } from '../data';
import { Github, Globe, ChevronUp, ChevronDown } from 'lucide-react';
import { FaXTwitter } from '@/components/icons/SocialIcons';

interface ProtocolTableProps {
  filteredProtocols: typeof defiProtocols;
  // DISABLED - onProtocolClick prop removed to disable dialog functionality
  // onProtocolClick?: (protocol: DefiProtocol) => void;
}

type SortKey = 'protocol' | 'category' | 'subcategory';
type SortDirection = 'asc' | 'desc';

export const ProtocolTable = React.memo(function ProtocolTable({
  filteredProtocols,
}: ProtocolTableProps) {
  const { isMobile } = useResponsive();
  const { getText, t } = usePageTranslation('defi');
  const [sortKey, setSortKey] = useState<SortKey>('protocol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Function to get social links for a protocol
  const getSocialLinks = (protocol: (typeof defiProtocols)[0]) => {
    const links = [];

    // Add website link (prefer DeFiLlama data, fallback to protocol.href)
    const websiteUrl = protocol.href;
    if (websiteUrl && websiteUrl !== '#') {
      links.push({
        type: 'website',
        url: websiteUrl,
        icon: Globe,
        label: t('defi:protocol.website', 'Website'),
      });
    }

    // Add GitHub link if available
    if (protocol.external?.socials?.github) {
      links.push({
        type: 'github',
        url: protocol.external.socials.github,
        icon: Github,
        label: t('defi:protocol.github', 'GitHub'),
      });
    }

    // Add Twitter link if available
    if (protocol.external?.socials?.twitter) {
      links.push({
        type: 'twitter',
        url: protocol.external.socials.twitter,
        icon: FaXTwitter,
        label: t('defi:protocol.twitter', 'Twitter'),
      });
    }

    return links;
  };

  // Sorting function
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Sort protocols based on current sort key and direction
  const sortedProtocols = useMemo(() => {
    return [...filteredProtocols].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortKey) {
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
  }, [filteredProtocols, sortKey, sortDirection]);

  // Sort indicator component
  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div className="mb-6 md:mb-8">
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        {/* Mobile: Add horizontal scroll container */}
        <div className={`${isMobile ? 'overflow-x-auto' : ''}`}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead
                  className={`font-bold text-base py-4 md:py-6 px-4 md:px-8 cursor-pointer hover:bg-muted/50 ${
                    isMobile ? 'w-[280px] min-w-[280px]' : 'w-1/4'
                  }`}
                  onClick={() => handleSort('protocol')}
                >
                  {t('defi:table.protocol', 'Protocol')}{' '}
                  <SortIndicator column="protocol" />
                </TableHead>
                {!isMobile && (
                  <TableHead
                    className="font-bold text-base py-6 px-6 cursor-pointer hover:bg-muted/50 w-1/4"
                    onClick={() => handleSort('category')}
                  >
                    {t('defi:table.category', 'Category')}{' '}
                    <SortIndicator column="category" />
                  </TableHead>
                )}
                {!isMobile && (
                  <TableHead
                    className="font-bold text-base py-6 px-6 cursor-pointer hover:bg-muted/50 w-1/4"
                    onClick={() => handleSort('subcategory')}
                  >
                    {t('defi:table.subcategory', 'Subcategory')}{' '}
                    <SortIndicator column="subcategory" />
                  </TableHead>
                )}
                {!isMobile && (
                  <TableHead className="font-bold text-base py-6 px-6 w-1/4">
                    {t('defi:table.links', 'Links')}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProtocols.map((protocol, index) => {
                const socialLinks = getSocialLinks(protocol);

                return (
                  <TableRow
                    key={protocol.title}
                    className={`group hover:bg-muted/50 transition-colors ${index !== sortedProtocols.length - 1 ? 'border-b' : ''}`}
                  >
                    <TableCell
                      className={`${isMobile ? 'py-6 px-4' : 'py-4 md:py-6 px-4 md:px-8'}`}
                    >
                      <div
                        className={`flex gap-4 min-w-0 ${isMobile ? 'flex-col items-center text-center' : 'items-center'}`}
                      >
                        {/* Protocol Logo */}
                        <div className="flex-shrink-0">
                          {protocol.logo ? (
                            <div
                              className={`relative rounded-full overflow-hidden bg-secondary ring-2 ring-border/20 ${isMobile ? 'w-16 h-16' : 'w-10 h-10'}`}
                            >
                              <Image
                                src={protocol.logo}
                                alt={`${protocol.title} logo`}
                                fill
                                sizes={isMobile ? '64px' : '40px'}
                                priority={
                                  index < 6 || protocol.title === 'Amnis'
                                }
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className={`rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center ring-2 ring-border/20 ${isMobile ? 'w-16 h-16' : 'w-10 h-10'}`}
                            >
                              <span
                                className={`font-bold text-gray-600 dark:text-gray-300 ${isMobile ? 'text-xl' : 'text-sm'}`}
                              >
                                {protocol.title.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div
                          className={`min-w-0 flex-1 ${isMobile ? 'space-y-3 w-full' : ''}`}
                        >
                          <div
                            className={`font-bold truncate ${isMobile ? 'text-xl mb-2' : 'text-base'}`}
                          >
                            {protocol.title}
                          </div>
                          {protocol.categoryBreakdown && !isMobile && (
                            <div className="text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                {t(
                                  protocol.categoryBreakdown,
                                  'Multiple DeFi services'
                                )}
                              </span>
                            </div>
                          )}
                          {isMobile && (
                            <div className="space-y-3 w-full">
                              {/* Category breakdown for mobile */}
                              {protocol.categoryBreakdown && (
                                <div className="text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
                                    {t(
                                      protocol.categoryBreakdown,
                                      'Multiple DeFi services'
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* Category and subcategory tags */}
                              <div className="flex flex-wrap gap-2 justify-center">
                                <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium border border-primary/20">
                                  {t(
                                    `defi:categories.${protocol.category}.name`,
                                    protocol.category
                                  )}
                                </span>
                                {protocol.subcategory
                                  .split(', ')
                                  .map(
                                    (subcategory: string, subIndex: number) => (
                                      <span
                                        key={subIndex}
                                        className="bg-secondary/60 text-secondary-foreground px-3 py-1.5 rounded-lg text-sm font-medium border border-border/30"
                                      >
                                        {subcategory.trim()}
                                      </span>
                                    )
                                  )}
                              </div>

                              {/* Social links */}
                              {socialLinks.length > 0 && (
                                <div className="flex items-center gap-3 justify-center">
                                  {socialLinks.map((link, linkIndex) => {
                                    const IconComponent = link.icon;
                                    return (
                                      <Tooltip key={linkIndex}>
                                        <TooltipTrigger asChild>
                                          <Link
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-muted-foreground hover:text-primary transition-colors p-3 hover:bg-muted/50 rounded-lg border border-border/30"
                                          >
                                            <IconComponent className="w-5 h-5" />
                                          </Link>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="bottom"
                                          className="bg-popover text-popover-foreground border border-border [&>svg]:hidden"
                                        >
                                          <p className="text-sm">
                                            {link.label}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {!isMobile && (
                      <TableCell className="py-4 md:py-6 px-4 md:px-6 align-middle">
                        <span className="inline-flex items-center bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
                          {t(
                            `defi:categories.${protocol.category}.name`,
                            protocol.category
                          )}
                        </span>
                      </TableCell>
                    )}

                    {!isMobile && (
                      <TableCell className="py-4 md:py-6 px-4 md:px-6 align-middle">
                        <div className="flex flex-wrap gap-2">
                          {protocol.subcategory
                            .split(', ')
                            .map((subcategory: string, subIndex: number) => (
                              <span
                                key={subIndex}
                                className="inline-flex items-center bg-secondary/60 text-secondary-foreground px-3 py-1.5 rounded-lg text-sm font-medium"
                              >
                                {subcategory.trim()}
                              </span>
                            ))}
                        </div>
                      </TableCell>
                    )}

                    {!isMobile && (
                      <TableCell className="py-4 md:py-6 px-4 md:px-6 align-middle">
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
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
});
