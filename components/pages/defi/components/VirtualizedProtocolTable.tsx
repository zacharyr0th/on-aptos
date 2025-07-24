import { Github, Globe } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

import { FaXTwitter } from '@/components/icons/SocialIcons';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/useResponsive';
import { usePageTranslation } from '@/hooks/useTranslation';

import { defiProtocols } from '../data';

interface VirtualizedProtocolTableProps {
  filteredProtocols: typeof defiProtocols;
  height: number;
}

interface RowData {
  protocols: typeof defiProtocols;
  getSocialLinks: (protocol: (typeof defiProtocols)[0]) => any[];
  t: (key: string, fallback?: string) => string;
  isMobile: boolean;
}

const DESKTOP_ROW_HEIGHT = 88;
const MOBILE_ROW_HEIGHT = 280;

const Row = React.memo(
  ({
    index,
    style,
    data,
  }: {
    index: number;
    style: React.CSSProperties;
    data: RowData;
  }) => {
    const { protocols, getSocialLinks, t, isMobile } = data;
    const protocol = protocols[index];
    const socialLinks = getSocialLinks(protocol);

    return (
      <div style={style} className="border-b">
        <div className="flex items-center h-full px-4 md:px-8 hover:bg-muted/50 transition-colors">
          {/* Protocol Info */}
          <div
            className={`flex gap-4 min-w-0 ${isMobile ? 'flex-col items-center text-center' : 'items-center'} ${isMobile ? 'w-full' : 'w-1/4'}`}
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
                    {t(protocol.categoryBreakdown, 'Multiple DeFi services')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Category */}
          {!isMobile && (
            <div className="w-1/4 px-6">
              <span className="inline-flex items-center bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
                {t(
                  `defi:categories.${protocol.category}.name`,
                  protocol.category
                )}
              </span>
            </div>
          )}

          {/* Desktop: Subcategory */}
          {!isMobile && (
            <div className="w-1/4 px-6">
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
            </div>
          )}

          {/* Desktop: Links */}
          {!isMobile && (
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
          )}
        </div>
      </div>
    );
  }
);

Row.displayName = 'VirtualizedRow';

export const VirtualizedProtocolTable = React.memo(
  function VirtualizedProtocolTable({
    filteredProtocols,
    height,
  }: VirtualizedProtocolTableProps) {
    const { isMobile } = useResponsive();
    const { getText, t } = usePageTranslation('defi');

    // Helper function to get social links for a protocol
    const getSocialLinks = useCallback(
      (protocol: (typeof defiProtocols)[0]) => {
        const links = [];

        // Add website link
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
      },
      [t]
    );

    const itemData = useMemo<RowData>(
      () => ({
        protocols: filteredProtocols,
        getSocialLinks,
        t,
        isMobile,
      }),
      [filteredProtocols, getSocialLinks, t, isMobile]
    );

    const rowHeight = isMobile ? MOBILE_ROW_HEIGHT : DESKTOP_ROW_HEIGHT;

    return (
      <div className="mb-6 md:mb-8">
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="border-b-2 bg-card">
            <div className="flex items-center hover:bg-transparent">
              <div
                className={`font-bold text-base py-4 md:py-6 px-4 md:px-8 ${isMobile ? 'w-full text-center' : 'w-1/4'}`}
              >
                {t('defi:table.protocol', 'Protocol')}
              </div>
              {!isMobile && (
                <>
                  <div className="font-bold text-base py-6 px-6 w-1/4">
                    {t('defi:table.category', 'Category')}
                  </div>
                  <div className="font-bold text-base py-6 px-6 w-1/4">
                    {t('defi:table.subcategory', 'Subcategory')}
                  </div>
                  <div className="font-bold text-base py-6 pl-6 pr-4 w-1/4 text-right">
                    {t('defi:table.links', 'Links')}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Virtualized List */}
          <List
            height={height}
            itemCount={filteredProtocols.length}
            itemSize={rowHeight}
            itemData={itemData}
            width="100%"
          >
            {Row}
          </List>
        </div>
      </div>
    );
  }
);
