import { GeistMono } from "geist/font/mono";
import { Clock } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import React, {
  FC,
  memo,
  ReactElement,
  useMemo,
  useState,
  useEffect,
} from "react";

import { FaGlobe, FaGithub, FaXTwitter } from "@/components/icons/SocialIcons";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useTranslation } from "@/hooks/useTranslation";
import { DEVELOPER_CONFIG } from "@/lib/config/app";
import { dedupeFetch } from "@/lib/utils/cache/request-deduplication";

import { ErrorBoundary } from "../errors/ErrorBoundary";

interface FooterProps {
  showAptosAttribution?: boolean;
  className?: string;
}

const CurrentUTCTime: FC = memo(function CurrentUTCTime(): ReactElement {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const { t } = useTranslation("common");

  useEffect(() => {
    // Set initial client-side flag and time
    setIsClient(true);
    setCurrentTime(new Date());
    setWindowWidth(window.innerWidth);

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const formattedTime = useMemo<string>(() => {
    if (!currentTime || !isClient) {
      // Return a consistent placeholder during SSR and initial hydration
      return t("labels.loading_dots", "Loading...");
    }

    // Check if we're on a small screen (mobile)
    const isMobile = windowWidth > 0 && windowWidth < 640;

    if (isMobile) {
      // Shorter format for mobile: "12 Jul, 16:24 UTC"
      return (
        new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "UTC",
        }).format(currentTime) + " UTC"
      );
    }

    // Full format for larger screens
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(currentTime);
  }, [currentTime, isClient, t, windowWidth]);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
      <span
        className="font-mono truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none"
        suppressHydrationWarning
      >
        {formattedTime}
      </span>
    </div>
  );
});
CurrentUTCTime.displayName = "CurrentUTCTime";

const AptPrice: FC = memo(function AptPrice(): ReactElement {
  const { t } = useTranslation("common");

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Consolidate image props
  const aptIconProps = {
    src: "/icons/apt.png",
    alt: "APT token",
    width: 16,
    height: 16,
    className:
      "w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0 rounded-full dark:invert",
    priority: false,
    quality: 90,
    unoptimized: false,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.target as HTMLImageElement;
      img.src = "/placeholder.jpg";
    },
  };

  // Fetch APT price data
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // Fetch current price using deduplication
        const currentResponse = await dedupeFetch(
          "/api/analytics/token-latest-price?address=0x1::aptos_coin::AptosCoin",
        );
        if (!currentResponse.ok) {
          throw new Error("Failed to fetch current price");
        }
        const currentData = await currentResponse.json();

        if (currentData.data && currentData.data.length > 0) {
          const latestPrice = currentData.data[0].price_usd;
          setCurrentPrice(latestPrice);
          setError(null);
        } else {
          throw new Error("No price data available");
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    // Refresh every minute
    const interval = setInterval(fetchPrice, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
        <Image
          {...aptIconProps}
          className={`${aptIconProps.className} opacity-50`}
          alt={aptIconProps.alt}
        />
        <span className="truncate">
          {t("messages.apt_price_loading", "Loading...")}
        </span>
      </div>
    );
  }

  if (error || currentPrice === null) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
        <Image
          {...aptIconProps}
          className={`${aptIconProps.className} opacity-50`}
          alt={aptIconProps.alt}
        />
        <span className="truncate">
          {t("messages.apt_price_unavailable", "Unavailable")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm">
      <Image {...aptIconProps} alt={aptIconProps.alt} />
      <span className="font-medium whitespace-nowrap text-muted-foreground">
        ${currentPrice.toFixed(2)}
      </span>
    </div>
  );
});
AptPrice.displayName = "AptPrice";

const ProductHuntBadge: FC = memo(function ProductHuntBadge(): ReactElement {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine the current theme
  const currentTheme = mounted ? resolvedTheme || theme : "light";
  const isDark = currentTheme === "dark";

  const badgeUrl = isDark
    ? "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=974163&theme=dark&t=1749075198418"
    : "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=974163&theme=neutral&t=1749075207851";

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
ProductHuntBadge.displayName = "ProductHuntBadge";

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
      className="p-2 sm:p-2.5 -m-2 sm:-m-2.5 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md touch-manipulation"
      aria-label={label}
    >
      {icon}
    </a>
  );
});
SocialLink.displayName = "SocialLink";

const FooterComponent: FC<FooterProps> = ({
  showAptosAttribution: _showAptosAttribution = true,
  className,
}): ReactElement => {
  const { t } = useTranslation("common");

  // Consolidate social links data
  const socialLinks = useMemo(
    () =>
      [
        DEVELOPER_CONFIG.website && {
          href: DEVELOPER_CONFIG.website,
          icon: <FaGlobe className="w-4 h-4 sm:w-5 sm:h-5" />,
          label: t("actions.visit_personal_website"),
        },
        DEVELOPER_CONFIG.github && {
          href: DEVELOPER_CONFIG.github,
          icon: <FaGithub className="w-4 h-4 sm:w-5 sm:h-5" />,
          label: t("actions.view_github"),
        },
        DEVELOPER_CONFIG.twitter && {
          href: DEVELOPER_CONFIG.twitter,
          icon: <FaXTwitter className="w-4 h-4 sm:w-5 sm:h-5" />,
          label: t("actions.follow_on_twitter"),
        },
      ].filter(Boolean),
    [t],
  );

  const SocialLinksGroup = ({ className: groupClassName = "" }) => (
    <div className={`flex items-center gap-2 xl:gap-3 ${groupClassName}`}>
      {socialLinks.filter(Boolean).map((link, index) => {
        const validLink = link as {
          href: string;
          icon: React.ReactElement;
          label: string;
        };
        return (
          <SocialLink
            key={index}
            href={validLink.href}
            icon={validLink.icon}
            label={validLink.label}
          />
        );
      })}
    </div>
  );

  return (
    <ErrorBoundary>
      <footer
        className={`w-full py-3 sm:py-4 ${GeistMono.className} ${className || ""}`}
      >
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            {/* Left: Controls & Live Data */}
            <div className="flex items-center gap-4 xl:gap-6">
              <div className="flex items-center gap-2 xl:gap-3">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <div className="w-px h-4 bg-border"></div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                <span>
                  Built by{" "}
                  <a
                    href={DEVELOPER_CONFIG.twitter}
                    target="__blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-foreground/80 transition-colors"
                  >
                    {DEVELOPER_CONFIG.twitterHandle}
                  </a>
                </span>
              </div>
            </div>

            {/* Center: Empty for balance */}
            <div></div>

            {/* Right: Social Links & Time */}
            <div className="flex items-center gap-4 xl:gap-6">
              <CurrentUTCTime />
              <div className="w-px h-4 bg-border"></div>
              <SocialLinksGroup />
            </div>
          </div>

          {/* Tablet Layout */}
          <div className="hidden md:flex md:flex-col md:gap-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
                <div className="w-px h-4 bg-border"></div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                  <span>
                    Built by{" "}
                    <a
                      href={DEVELOPER_CONFIG.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-foreground/80 transition-colors"
                    >
                      {DEVELOPER_CONFIG.twitterHandle}
                    </a>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CurrentUTCTime />
                <div className="w-px h-4 bg-border"></div>
                <SocialLinksGroup />
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="flex items-center justify-between md:hidden">
            {/* Left side: Controls & APT Price */}
            <div className="flex items-center gap-2 xs:gap-3 min-w-0">
              <div className="flex items-center gap-1.5 xs:gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <div className="w-px h-4 bg-border flex-shrink-0 hidden xs:block"></div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] xs:text-xs text-muted-foreground">
                  <span>
                    Built by{" "}
                    <a
                      href={DEVELOPER_CONFIG.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-foreground/80 transition-colors"
                    >
                      {DEVELOPER_CONFIG.twitterHandle}
                    </a>
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: Social Links stacked above Time */}
            <div className="flex flex-col items-end gap-1">
              <SocialLinksGroup className="gap-1.5 xs:gap-2 flex-shrink-0" />
              <CurrentUTCTime />
            </div>
          </div>
        </div>
      </footer>
    </ErrorBoundary>
  );
};

FooterComponent.displayName = "FooterComponent";

export const Footer = memo(FooterComponent);
