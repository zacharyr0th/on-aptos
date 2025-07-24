import React from 'react';
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
import { Github, Globe } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';

interface ProtocolTableProps {
  filteredProtocols: typeof defiProtocols;
  // DISABLED - onProtocolClick prop removed to disable dialog functionality
  // onProtocolClick?: (protocol: DefiProtocol) => void;
}

export const ProtocolTable = React.memo(function ProtocolTable({
  filteredProtocols,
}: ProtocolTableProps) {
  const { isMobile } = useResponsive();
  const { getText, t } = usePageTranslation('defi');

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

  // Mobile Card Layout - completely different approach for mobile
  const MobileProtocolCards = () => (
    <div className="space-y-4">
      {filteredProtocols.map((protocol, index) => {
        const socialLinks = getSocialLinks(protocol);

        return (
          <div
            key={protocol.title}
            className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header with logo and title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0">
                {protocol.logo ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary ring-2 ring-border/20">
                    <Image
                      src={protocol.logo}
                      alt={`${protocol.title} logo`}
                      fill
                      sizes="48px"
                      priority={index < 6 || protocol.title === 'Amnis'}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center ring-2 ring-border/20">
                    <span className="font-bold text-gray-600 dark:text-gray-300 text-lg">
                      {protocol.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg text-card-foreground truncate">
                  {protocol.title}
                </h3>
                {protocol.categoryBreakdown && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t(protocol.categoryBreakdown, 'Multiple DeFi services')}
                  </p>
                )}
              </div>
            </div>

            {/* Category and subcategory tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-medium border border-primary/20">
                {t(
                  `defi:categories.${protocol.category}.name`,
                  protocol.category
                )}
              </span>
              {protocol.subcategory
                .split(', ')
                .map((subcategory: string, subIndex: number) => (
                  <span
                    key={subIndex}
                    className="bg-secondary/60 text-secondary-foreground px-2.5 py-1 rounded-md text-xs font-medium border border-border/30"
                  >
                    {subcategory.trim()}
                  </span>
                ))}
            </div>

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground mr-2">
                  Links:
                </span>
                {socialLinks.map((link, linkIndex) => {
                  const IconComponent = link.icon;
                  return (
                    <Tooltip key={linkIndex}>
                      <TooltipTrigger asChild>
                        <Link
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors p-2.5 hover:bg-muted/50 rounded-lg border border-border/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          {IconComponent &&
                            React.createElement(
                              IconComponent as React.ComponentType<any>,
                              { className: 'w-4 h-4' }
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
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="mt-6 md:mt-8 w-full overflow-hidden">
      <hr className="border-t border-border mb-4 md:mb-6" />

      {/* Mobile Card Layout */}
      <div className="block md:hidden">
        <MobileProtocolCards />
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-2">
              <TableHead className="font-bold text-base py-6 px-8 w-[40%]">
                {t('defi:table.protocol', 'Protocol')}
              </TableHead>
              <TableHead className="font-bold text-base py-6 px-6 w-[20%]">
                {t('defi:table.category', 'Category')}
              </TableHead>
              <TableHead className="font-bold text-base py-6 px-6 w-[25%]">
                {t('defi:table.subcategory', 'Subcategory')}
              </TableHead>
              <TableHead className="font-bold text-base py-6 !pl-6 !pr-0 w-[15%] text-right">
                {t('defi:table.links', 'Links')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProtocols.map((protocol, index) => {
              const socialLinks = getSocialLinks(protocol);

              return (
                <TableRow
                  key={protocol.title}
                  className={`group hover:bg-muted/50 transition-colors ${index !== filteredProtocols.length - 1 ? 'border-b' : ''}`}
                >
                  <TableCell className="py-4 md:py-6 px-4 md:px-8">
                    <div className="flex gap-4 min-w-0 items-center">
                      {/* Protocol Logo */}
                      <div className="flex-shrink-0">
                        {protocol.logo ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-secondary ring-2 ring-border/20">
                            <Image
                              src={protocol.logo}
                              alt={`${protocol.title} logo`}
                              fill
                              sizes="40px"
                              priority={index < 6 || protocol.title === 'Amnis'}
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
                        <div className="font-bold text-base truncate">
                          {protocol.title}
                        </div>
                        {protocol.categoryBreakdown && (
                          <div className="text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              {t(
                                protocol.categoryBreakdown,
                                'Multiple DeFi services'
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 md:py-6 px-4 md:px-6 align-middle">
                    <span className="inline-flex items-center bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
                      {t(
                        `defi:categories.${protocol.category}.name`,
                        protocol.category
                      )}
                    </span>
                  </TableCell>

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

                  <TableCell className="py-4 md:py-6 !pl-4 md:!pl-6 !pr-0 align-middle text-right">
                    <div className="flex items-center gap-3 justify-end">
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
                                    { className: 'w-5 h-5' }
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
                      {socialLinks.length === 0 && (
                        <span className="text-sm text-muted-foreground">-</span>
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
