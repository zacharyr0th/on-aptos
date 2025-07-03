import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/useResponsive';
import { defiProtocols, categoryDefinitions } from '../data';
import { ProtocolTable } from './ProtocolTable';
import { Globe, Github } from 'lucide-react';
import { FaXTwitter } from '@/components/icons/SocialIcons';
import { usePageTranslation } from '@/hooks/useTranslation';

interface ProtocolDisplayProps {
  viewMode: 'grid' | 'table';
  filteredProtocols: typeof defiProtocols;
  onClearFilters: () => void;
}

export const ProtocolDisplay = React.memo(function ProtocolDisplay({
  viewMode,
  filteredProtocols,
  onClearFilters,
}: ProtocolDisplayProps) {
  const { isMobile } = useResponsive();
  const { getText, t } = usePageTranslation('defi');

  // Helper function to get social links for a protocol
  const getSocialLinks = (protocol: (typeof defiProtocols)[0]) => {
    const links = [];

    // Add website link (prefer protocol.href)
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

    // Add Twitter/X link if available
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

  // Helper function to get subcategory description safely
  const getSubcategoryDescription = (category: string, subcategory: string) => {
    if (category === 'Multiple') {
      return (
        t('defi:fallbacks.multiple_defi_products', 'Multiple DeFi products') +
        ': ' +
        subcategory
      );
    }

    const categoryDef =
      categoryDefinitions[category as keyof typeof categoryDefinitions];
    if (categoryDef && 
        'subcategories' in categoryDef && 
        categoryDef.subcategories &&
        Object.keys(categoryDef.subcategories).length > 0) {
      const subcategoryDesc = (
        categoryDef.subcategories as unknown as Record<string, string>
      )[subcategory];
      return (
        subcategoryDesc ||
        t(
          'defi:fallbacks.defi_protocol_subcategory',
          'DeFi protocol subcategory'
        )
      );
    }

    return t(
      'defi:fallbacks.defi_protocol_subcategory',
      'DeFi protocol subcategory'
    );
  };

  // Helper function to parse and render multiple subcategories
  const renderSubcategoryBadges = (protocol: (typeof defiProtocols)[0]) => {
    const subcategories = protocol.subcategory
      .split(', ')
      .map((sub: string) => sub.trim());

    return subcategories.map((subcategory: string, index: number) => (
      <Tooltip key={index}>
        <TooltipTrigger asChild>
          <span className="text-xs bg-secondary/60 text-secondary-foreground px-2.5 py-1.5 rounded-md cursor-help font-medium">
            {subcategory}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-xs bg-popover text-popover-foreground border border-border shadow-md [&>svg]:hidden"
        >
          <p className="text-sm font-medium mb-1">{subcategory}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {getSubcategoryDescription(protocol.category, subcategory)}
          </p>
        </TooltipContent>
      </Tooltip>
    ));
  };

  const GridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 mb-8 md:mb-12">
      {filteredProtocols.map((protocol, index) => {
        const socialLinks = getSocialLinks(protocol);

        return (
          <div
            key={protocol.title}
            className="group relative bg-card rounded-xl border p-4 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col min-h-[200px] md:min-h-[220px]"
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${protocol.color} opacity-5 rounded-xl`}
            />

            <div className="relative z-10 flex flex-col h-full">
              {/* Header with Logo */}
              <div
                className={`flex gap-3 mb-4 ${isMobile ? 'flex-col items-center text-center' : 'items-start'}`}
              >
                {/* Protocol Logo */}
                <div className="flex-shrink-0">
                  {protocol.logo ? (
                    <div
                      className={`relative rounded-full overflow-hidden bg-secondary ${isMobile ? 'w-16 h-16' : 'w-10 h-10'}`}
                    >
                      <Image
                        src={protocol.logo}
                        alt={`${protocol.title} logo`}
                        fill
                        sizes={isMobile ? '64px' : '40px'}
                        priority={index < 8 || protocol.title === 'Amnis'}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center ${isMobile ? 'w-16 h-16' : 'w-10 h-10'}`}
                    >
                      <span
                        className={`font-semibold text-gray-600 dark:text-gray-300 ${isMobile ? 'text-xl' : 'text-sm'}`}
                      >
                        {protocol.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title and Social Links */}
                <div className={`flex-1 min-w-0 ${isMobile ? 'w-full' : ''}`}>
                  <div
                    className={`flex items-center gap-2 ${isMobile ? 'justify-center mb-2' : 'justify-between mb-1'}`}
                  >
                    <h3
                      className={`font-semibold leading-tight ${isMobile ? 'text-lg text-center' : 'text-base md:text-lg truncate'}`}
                    >
                      {protocol.title}
                    </h3>

                    {/* Social Links */}
                    {socialLinks.length > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {socialLinks.map(
                          (
                            link: {
                              type: string;
                              url: string;
                              icon: React.ComponentType<{ className?: string }>;
                              label: string;
                            },
                            linkIndex: number
                          ) => {
                            const IconComponent = link.icon;
                            return (
                              <Tooltip key={linkIndex}>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors p-1.5 hover:bg-muted/50 rounded-md"
                                  >
                                    <IconComponent className="w-4 h-4" />
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
                          }
                        )}
                      </div>
                    )}
                  </div>

                  {/* Category breakdown */}
                  {protocol.categoryBreakdown && (
                    <div
                      className={`text-xs text-muted-foreground mb-3 ${isMobile ? 'text-center' : ''}`}
                    >
                      {t(protocol.categoryBreakdown, 'Multiple DeFi services')}
                    </div>
                  )}
                </div>
              </div>

              {/* Category and Subcategory Tags */}
              <div
                className={`flex gap-1.5 flex-wrap mb-4 ${isMobile ? 'justify-center' : 'items-start'}`}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1.5 rounded-md cursor-help font-medium">
                      {t(
                        `defi:categories.${protocol.category}.name`,
                        protocol.category
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-xs bg-popover text-popover-foreground border border-border shadow-md [&>svg]:hidden"
                  >
                    <p className="text-sm font-medium mb-1">
                      {t(
                        `defi:categories.${protocol.category}.name`,
                        protocol.category
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {(() => {
                        if (protocol.category === 'Multiple') {
                          return t(
                            'defi:categories.multiple.description',
                            'Multiple DeFi products'
                          );
                        } else {
                          const categoryKey = protocol.category.toLowerCase();
                          return (
                            t(
                              `defi:categories.${categoryKey}.description`,
                              'DeFi protocol category'
                            ) ||
                            t(
                              'defi:fallbacks.defi_protocol_category',
                              'DeFi protocol category'
                            )
                          );
                        }
                      })()}
                    </p>
                  </TooltipContent>
                </Tooltip>
                {renderSubcategoryBadges(protocol)}
              </div>

              {/* Description */}
              <p
                className={`text-sm text-muted-foreground leading-relaxed flex-1 ${isMobile ? 'text-center' : ''}`}
              >
                {t(protocol.description, protocol.title + ' DeFi protocol')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (filteredProtocols.length === 0) {
    return (
      <div className="text-center py-8 md:py-12 px-4">
        <p className="text-muted-foreground mb-4 text-sm md:text-base">
          {t(
            'defi:search.no_results',
            'No protocols found matching your criteria.'
          )}
        </p>
        <Button
          variant="outline"
          size={isMobile ? 'sm' : 'default'}
          onClick={onClearFilters}
          className="shadow-sm"
        >
          {t('common:actions.clear_filters', 'Clear Filters')}
        </Button>
      </div>
    );
  }

  return (
    <>
      {viewMode === 'grid' ? (
        <GridView />
      ) : (
        <ProtocolTable
          filteredProtocols={filteredProtocols}
          // DISABLED - onProtocolClick prop removed
          // onProtocolClick={handleProtocolClick}
        />
      )}

      {/* DISABLED - ProtocolDialog component removed */}
      {/* <ProtocolDialog
        protocol={selectedProtocol}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
      /> */}
    </>
  );
});
