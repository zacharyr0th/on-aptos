import React, {
  FC,
  memo,
  ReactElement,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { Clock } from 'lucide-react';
import { FaGlobe, FaXTwitter, FaGithub } from '@/components/icons/SocialIcons';
import { ErrorBoundary } from '../errors/ErrorBoundary';
import Image from 'next/image';
import { trpc } from '@/lib/trpc/client';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/hooks/useTranslation';
import { DEVELOPER_CONFIG } from '@/lib/config/app';

interface FooterProps {
  showAptosAttribution?: boolean;
}

const CurrentUTCTime: FC = memo(function CurrentUTCTime(): ReactElement {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    // Set initial client-side flag and time
    setIsClient(true);
    setCurrentTime(new Date());

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedTime = useMemo<string>(() => {
    if (!currentTime || !isClient) {
      // Return a consistent placeholder during SSR and initial hydration
      return t('labels.loading_dots', 'Loading...');
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
      timeZoneName: 'short',
    }).format(currentTime);
  }, [currentTime, isClient, t]);

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
      <span className="font-mono" suppressHydrationWarning>
        {formattedTime}
      </span>
    </div>
  );
});
CurrentUTCTime.displayName = 'CurrentUTCTime';

const AptPrice: FC = memo(function AptPrice(): ReactElement {
  const { t } = useTranslation('common');
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if we should show white background (dark mode)
  const isDark = mounted && resolvedTheme === 'dark';

  // Use tRPC to fetch APT price instead of direct external API calls
  const {
    data: aptPriceData,
    isLoading: loading,
    error,
  } = trpc.domains.marketData.prices.getCMCPrice.useQuery(
    { symbol: 'apt' },
    {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 60 * 1000, // Auto-refetch every minute
      refetchIntervalInBackground: true,
      retry: 3,
    }
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <Image
          src="/icons/apt.png"
          alt="APT token"
          width={16}
          height={16}
          className={`w-4 h-4 opacity-50 flex-shrink-0 rounded-full ${
            isDark ? 'bg-white' : ''
          }`}
          priority={false}
          quality={90}
          unoptimized={false}
        />
        <span>{t('messages.apt_price_loading', 'Loading APT price...')}</span>
      </div>
    );
  }

  if (error || !aptPriceData?.data?.price) {
    return (
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <Image
          src="/icons/apt.png"
          alt="APT token"
          width={16}
          height={16}
          className={`w-4 h-4 opacity-50 flex-shrink-0 rounded-full ${
            isDark ? 'bg-white' : ''
          }`}
          priority={false}
          quality={90}
          unoptimized={false}
        />
        <span>{t('messages.apt_price_unavailable')}</span>
      </div>
    );
  }

  const price = aptPriceData.data.price;
  // For 24h change, we'll calculate it from the price data we have
  // This is a simplified approach - ideally we'd store historical data
  const change24h: number = 0; // We can enhance this later with historical data
  const isPositive = change24h >= 0;

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm">
      <Image
        src="/icons/apt.png"
        alt="APT token"
        width={16}
        height={16}
        className={`w-4 h-4 flex-shrink-0 rounded-full ${
          isDark ? 'bg-white' : ''
        }`}
        priority={false}
        quality={90}
        unoptimized={false}
      />
      <span className="font-medium">APT: ${price.toFixed(2)}</span>
      {change24h !== 0 && (
        <span
          className={`font-medium ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {isPositive ? '+' : ''}
          {change24h.toFixed(2)}%
        </span>
      )}
    </div>
  );
});
AptPrice.displayName = 'AptPrice';

const ProductHuntBadge: FC = memo(function ProductHuntBadge(): ReactElement {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine the current theme
  const currentTheme = mounted ? resolvedTheme || theme : 'light';
  const isDark = currentTheme === 'dark';

  const badgeUrl = isDark
    ? 'https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=974163&theme=dark&t=1749075198418'
    : 'https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=974163&theme=neutral&t=1749075207851';

  return (
    <a
      href="https://www.producthunt.com/products/on-aptos?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-on-aptos"
      target="_blank"
      rel="noopener noreferrer"
      className="transition-opacity duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
    >
      <Image
        src={badgeUrl}
        alt="On Aptos - Real-time blockchain analytics of what's on Aptos | Product Hunt"
        width={250}
        height={54}
        className="w-[180px] h-auto sm:w-[200px] lg:w-[220px]"
      />
    </a>
  );
});
ProductHuntBadge.displayName = 'ProductHuntBadge';

const SocialLink: FC<{
  href: string;
  icon: ReactElement;
  label: string;
}> = memo(function SocialLink({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 -m-2 transition-colors duration-200 hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
      aria-label={label}
    >
      {icon}
    </a>
  );
});
SocialLink.displayName = 'SocialLink';

const FooterComponent: FC<FooterProps> = ({
  showAptosAttribution: _showAptosAttribution = true,
}): ReactElement => {
  const { t } = useTranslation('common');

  return (
    <ErrorBoundary>
      <footer className="pb-6 sm:pb-8 lg:pb-10">
        <div className="space-y-6">
          {/* Mobile Layout: Vertical stack */}
          <div className="flex flex-col items-center gap-4 lg:hidden">
            {/* 1. Social Icons and APT Price */}
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-3">
                {DEVELOPER_CONFIG.website && (
                  <SocialLink
                    href={DEVELOPER_CONFIG.website}
                    icon={<FaGlobe className="w-4 h-4" />}
                    label={t('actions.visit_personal_website')}
                  />
                )}
                {DEVELOPER_CONFIG.twitter && (
                  <SocialLink
                    href={`https://x.com/${DEVELOPER_CONFIG.twitter.replace('@', '')}`}
                    icon={<FaXTwitter className="w-4 h-4" />}
                    label={t('actions.follow_on_twitter')}
                  />
                )}
                {DEVELOPER_CONFIG.github && (
                  <SocialLink
                    href={DEVELOPER_CONFIG.github}
                    icon={<FaGithub className="w-4 h-4" />}
                    label={t('actions.view_github')}
                  />
                )}
              </div>
              <div className="w-px h-4 bg-border"></div>
              <AptPrice />
            </div>

            {/* 2. Time */}
            <CurrentUTCTime />
          </div>

          {/* Desktop Layout: Two column layout */}
          <div className="hidden lg:flex lg:justify-between lg:items-center">
            {/* Left Column: Social Icons and APT Price */}
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-3">
                {DEVELOPER_CONFIG.website && (
                  <SocialLink
                    href={DEVELOPER_CONFIG.website}
                    icon={<FaGlobe className="w-4 h-4" />}
                    label={t('actions.visit_personal_website')}
                  />
                )}
                {DEVELOPER_CONFIG.twitter && (
                  <SocialLink
                    href={`https://x.com/${DEVELOPER_CONFIG.twitter.replace('@', '')}`}
                    icon={<FaXTwitter className="w-4 h-4" />}
                    label={t('actions.follow_on_twitter')}
                  />
                )}
                {DEVELOPER_CONFIG.github && (
                  <SocialLink
                    href={DEVELOPER_CONFIG.github}
                    icon={<FaGithub className="w-4 h-4" />}
                    label={t('actions.view_github')}
                  />
                )}
              </div>
              <div className="w-px h-4 bg-border"></div>
              <AptPrice />
            </div>

            {/* Right Column: Time */}
            <CurrentUTCTime />
          </div>
        </div>
      </footer>
    </ErrorBoundary>
  );
};

FooterComponent.displayName = 'FooterComponent';

export const Footer = memo(FooterComponent);
