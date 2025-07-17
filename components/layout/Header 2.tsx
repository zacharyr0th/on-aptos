'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { ErrorBoundary } from '../errors/ErrorBoundary';
import {
  Menu,
  X,
  Bitcoin,
  Coins,
  Building2,
  TrendingUp,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { defiProtocols } from '@/components/pages/defi/data/protocols';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const HeaderComponent = (): React.ReactElement | null => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navigationValue, setNavigationValue] = useState<string>('');
  const isHomePage = pathname === '/';
  const { t } = useTranslation('common');
  const { account, connected, disconnect } = useWallet();

  const walletAddress = account?.address?.toString();
  const [primaryName, setPrimaryName] = useState<string | null>(null);

  // Fetch primary ANS name for the connected wallet
  useEffect(() => {
    if (!walletAddress || !connected) {
      setPrimaryName(null);
      return;
    }

    const fetchAnsName = async () => {
      try {
        const response = await fetch(
          `/api/wallet/ans?address=${encodeURIComponent(walletAddress)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPrimaryName(data.data.name);
          }
        }
      } catch (error) {
        console.error('Error fetching ANS name:', error);
      }
    };

    fetchAnsName();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnsName, 300000);

    return () => clearInterval(interval);
  }, [walletAddress, connected]);

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getPortfolioLabel = useCallback(() => {
    if (!connected) return 'Portfolio';
    if (primaryName)
      return primaryName.charAt(0).toUpperCase() + primaryName.slice(1);
    if (walletAddress) return truncateAddress(walletAddress);
    return 'Portfolio';
  }, [connected, primaryName, walletAddress]);

  const title = useMemo(() => {
    const pageKeys: Record<string, string> = {
      '/bitcoin': 'page_titles.bitcoin',
      '/lst': 'page_titles.lsts',
      '/stablecoins': 'page_titles.stablecoins',
      '/defi': 'page_titles.defi',
      '/rwas': 'page_titles.rwas',
      '/portfolio': 'page_titles.portfolio',
    };
    const translationKey = pageKeys[pathname] || 'page_titles.whats';
    const translation = t(translationKey);

    // If translation returns the key itself, provide language-appropriate fallback values
    if (translation === translationKey) {
      const fallbacks: Record<string, string> = {
        'page_titles.bitcoin': 'Bitcoin',
        'page_titles.lsts': 'LSTs',
        'page_titles.stablecoins': 'Stablecoins',
        'page_titles.defi': 'DeFi',
        'page_titles.rwas': 'RWAs',
        'page_titles.portfolio': 'Your Portfolio',
        'page_titles.whats': "What's",
      };
      return fallbacks[translationKey] || "What's";
    }

    return translation;
  }, [pathname, t]);

  const toggleMenu = useCallback(() => setMobileMenuOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Memoize protocol categories to prevent re-renders
  const protocolsByCategory = useMemo(() => {
    const categories = ['Trading', 'Credit', 'Yield', 'Multiple'];
    return categories.reduce((acc, category) => {
      acc[category] = defiProtocols.filter(
        p => p.status === 'Active' && p.category === category
      );
      return acc;
    }, {} as Record<string, typeof defiProtocols>);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Don't render header on homepage
  if (isHomePage) {
    return null;
  }

  return (
    <ErrorBoundary>
      <header className="relative">
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold">
            <Link
              href="/"
              className="hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
            >
              <span className="text-primary">{title}</span>{' '}
              <span className="text-muted-foreground">
                {t('landing.hero.title_suffix', 'on Aptos')}
              </span>
            </Link>
          </h1>

          {/* Desktop Navigation - Show on tablet and up */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative z-50">
              <NavigationMenu
                key="desktop-nav"
                value={navigationValue}
                onValueChange={setNavigationValue}
                delayDuration={0}
                className="[&_[data-slot=navigation-menu-viewport]]:overflow-visible [&_[data-slot=navigation-menu-viewport]]:h-auto"
              >
                <NavigationMenuList>
                  {/* Assets Dropdown */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-sm font-medium">
                      Assets
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[280px] lg:w-[320px] gap-2 p-4">
                        <ListItem
                          href="/stablecoins"
                          title={t('navigation.stablecoins', 'Stablecoins')}
                          icon={<Coins className="h-4 w-4" />}
                          active={pathname === '/stablecoins'}
                        >
                          Track USDT, USDC, USDe and other stablecoins on Aptos
                        </ListItem>
                        <ListItem
                          href="/bitcoin"
                          title={t('navigation.bitcoin', 'Bitcoin')}
                          icon={<Bitcoin className="h-4 w-4" />}
                          active={pathname === '/bitcoin'}
                        >
                          Monitor wrapped Bitcoin assets like xBTC, SBTC, and
                          aBTC
                        </ListItem>
                        <ListItem
                          href="/rwas"
                          title={t('navigation.rwas', 'RWAs')}
                          icon={<Building2 className="h-4 w-4" />}
                          active={pathname === '/rwas'}
                        >
                          Real-world assets tokenized on the Aptos blockchain
                        </ListItem>
                        <ListItem
                          href="/lst"
                          title={t('navigation.lsts', 'LSTs')}
                          icon={<TrendingUp className="h-4 w-4" />}
                          active={pathname === '/lst'}
                        >
                          Liquid staking tokens including amAPT and stAPT
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* DeFi Dropdown */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-sm font-medium">
                      {t('navigation.defi', 'DeFi')}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[320px]">
                        <ScrollArea className="h-[450px] rounded-md scroll-smooth">
                          <div className="p-4">
                            {/* Dashboard Category */}
                            <div className="relative">
                              <Link
                                href="/defi"
                                className="sticky top-0 bg-popover z-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 block hover:text-foreground transition-colors flex items-center gap-2"
                              >
                                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                                Dashboard
                              </Link>
                              <div className="pb-2"></div>
                            </div>

                            {/* Group protocols by category */}
                            {['Trading', 'Credit', 'Yield', 'Multiple'].map(
                              category => {
                                const categoryProtocols = protocolsByCategory[category];

                                if (!categoryProtocols || categoryProtocols.length === 0) return null;

                                return (
                                  <div key={category} className="relative">
                                    <h4 className="sticky top-0 bg-popover z-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
                                      {category}
                                    </h4>
                                    <div className="grid gap-1 pb-2">
                                      {categoryProtocols.map(protocol => (
                                        <Link
                                          key={protocol.title}
                                          href={protocol.href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={cn(
                                            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                                            'border border-transparent hover:border-border'
                                          )}
                                        >
                                          <div className="relative h-8 w-8 flex-shrink-0">
                                            <Image
                                              src={
                                                protocol.logo ||
                                                '/placeholder.jpg'
                                              }
                                              alt={`${protocol.title} logo`}
                                              fill
                                              className="object-contain rounded"
                                              onError={e => {
                                                const img =
                                                  e.target as HTMLImageElement;
                                                img.src = '/placeholder.jpg';
                                              }}
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="font-medium truncate">
                                                {protocol.title}
                                              </span>
                                              <div className="flex items-center gap-1 flex-shrink-0">
                                                {protocol.category ===
                                                  'Multiple' &&
                                                protocol.subcategory.includes(
                                                  ','
                                                ) ? (
                                                  protocol.subcategory
                                                    .split(',')
                                                    .map((sub, idx) => (
                                                      <Badge
                                                        key={idx}
                                                        variant="outline"
                                                        className="h-4 px-1 text-[10px] flex-shrink-0"
                                                      >
                                                        {sub.trim()}
                                                      </Badge>
                                                    ))
                                                ) : (
                                                  <Badge
                                                    variant="outline"
                                                    className="h-4 px-1 text-[10px] flex-shrink-0"
                                                  >
                                                    {protocol.subcategory}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Portfolio Link */}
                  <NavigationMenuItem>
                    {connected ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            navigationMenuTriggerStyle(),
                            'bg-transparent hover:bg-accent rounded-lg transition-all duration-200 px-3 py-2',
                            'font-mono text-sm'
                          )}
                        >
                          {getPortfolioLabel()}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              disconnect();
                            }}
                            className="cursor-pointer text-destructive"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Disconnect
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <NavigationMenuLink asChild>
                        <Link
                          href="/portfolio"
                          className={cn(
                            navigationMenuTriggerStyle(),
                            'bg-transparent hover:bg-accent rounded-lg transition-all duration-200 px-3 py-2'
                          )}
                        >
                          {getPortfolioLabel()}
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleMenu}
                  className="p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md transition-colors hover:bg-muted"
                  aria-label={t(
                    'navigation.toggle_menu',
                    'Toggle navigation menu'
                  )}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-navigation"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={closeMenu}
              aria-hidden="true"
            />

            {/* Mobile Menu */}
            <nav
              id="mobile-navigation"
              className="fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-background border-l border-border z-50 md:hidden shadow-xl"
              role="navigation"
              aria-label="Mobile navigation"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="font-semibold text-lg">
                    {t('navigation.mobile_menu', 'Navigation')}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={closeMenu}
                        className="p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md transition-colors hover:bg-muted"
                        aria-label={t(
                          'navigation.close_menu',
                          'Close navigation menu'
                        )}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Close navigation menu</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto">
                  <div className="py-2">
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Assets
                      </h3>
                    </div>
                    <MobileNavLink
                      href="/stablecoins"
                      active={pathname === '/stablecoins'}
                      onClick={closeMenu}
                    >
                      {t('navigation.stablecoins', 'Stablecoins')}
                    </MobileNavLink>
                    <MobileNavLink
                      href="/bitcoin"
                      active={pathname === '/bitcoin'}
                      onClick={closeMenu}
                    >
                      {t('navigation.bitcoin', 'Bitcoin')}
                    </MobileNavLink>
                    <MobileNavLink
                      href="/rwas"
                      active={pathname === '/rwas'}
                      onClick={closeMenu}
                    >
                      {t('navigation.rwas', 'RWAs')}
                    </MobileNavLink>
                    <MobileNavLink
                      href="/lst"
                      active={pathname === '/lst'}
                      onClick={closeMenu}
                    >
                      {t('navigation.lsts', 'LSTs')}
                    </MobileNavLink>
                  </div>

                  <div className="py-2 border-t border-border">
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        DeFi
                      </h3>
                    </div>
                    <MobileNavLink
                      href="/defi"
                      active={pathname === '/defi'}
                      onClick={closeMenu}
                    >
                      Dashboard
                    </MobileNavLink>
                  </div>

                  <div className="py-2 border-t border-border">
                    <MobileNavLink
                      href="/portfolio"
                      active={pathname === '/portfolio'}
                      onClick={closeMenu}
                    >
                      {connected
                        ? getPortfolioLabel()
                        : t('navigation.portfolio', 'Portfolio')}
                    </MobileNavLink>
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="border-t border-border p-4 flex items-center gap-2">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </div>
            </nav>
          </>
        )}
      </header>
    </ErrorBoundary>
  );
};

// Desktop Nav Link
const NavLink = ({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className={`text-sm font-medium transition-colors duration-200 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-1 ${
      active ? 'text-primary' : 'text-muted-foreground'
    }`}
  >
    {children}
  </Link>
);

// Mobile Nav Link
const MobileNavLink = ({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className={`block text-base font-medium py-4 px-6 transition-colors duration-200 hover:bg-muted focus:outline-none focus:bg-muted ${
      active
        ? 'text-primary bg-muted/70 border-r-2 border-primary'
        : 'text-foreground'
    }`}
  >
    {children}
  </Link>
);

// ListItem component for navigation menu
const ListItem = React.memo(React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & {
    title: string;
    icon?: React.ReactNode;
    active?: boolean;
  }
>(({ className, title, children, icon, active, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={href || '#'}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            active && 'bg-accent/50',
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2 text-sm font-medium leading-none">
            {icon}
            {title}
          </div>
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}));
ListItem.displayName = 'ListItem';

HeaderComponent.displayName = 'Header';
export const Header = React.memo(HeaderComponent);
