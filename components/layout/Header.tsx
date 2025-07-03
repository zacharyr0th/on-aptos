'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { ErrorBoundary } from '../errors/ErrorBoundary';
import { Menu, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const HeaderComponent = (): React.ReactElement | null => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHomePage = pathname === '/';
  const { t } = useTranslation('common');

  const title = useMemo(() => {
    const pageKeys: Record<string, string> = {
      '/bitcoin': 'page_titles.bitcoin',
      '/lst': 'page_titles.lsts',
      '/stablecoins': 'page_titles.stablecoins',
      '/defi': 'page_titles.defi',
      '/rwas': 'page_titles.rwas',
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
        'page_titles.whats': "What's",
      };
      return fallbacks[translationKey] || "What's";
    }

    return translation;
  }, [pathname, t]);

  const toggleMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMenu = () => setMobileMenuOpen(false);

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
      <header className="relative mb-4 sm:mb-6 md:mb-8">
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center space-x-6">
              <NavLink href="/stablecoins" active={pathname === '/stablecoins'}>
                {t('navigation.stablecoins', 'Stablecoins')}
              </NavLink>
              <NavLink href="/bitcoin" active={pathname === '/bitcoin'}>
                {t('navigation.bitcoin', 'Bitcoin')}
              </NavLink>
              <NavLink href="/rwas" active={pathname === '/rwas'}>
                {t('navigation.rwas', 'RWAs')}
              </NavLink>
              <NavLink href="/lst" active={pathname === '/lst'}>
                {t('navigation.lsts', 'LSTs')}
              </NavLink>
              <NavLink href="/defi" active={pathname === '/defi'}>
                {t('navigation.defi', 'DeFi')}
              </NavLink>
            </nav>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle />
            <ThemeToggle />
            <button
              onClick={toggleMenu}
              className="p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md transition-colors hover:bg-muted"
              aria-label={t('navigation.toggle_menu', 'Toggle navigation menu')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
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
            <nav className="fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-background border-l border-border z-50 md:hidden shadow-xl">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="font-semibold text-lg">
                    {t('navigation.mobile_menu', 'Navigation')}
                  </span>
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
                </div>

                {/* Navigation Links */}
                <div className="flex-1 py-4">
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
                  <MobileNavLink
                    href="/defi"
                    active={pathname === '/defi'}
                    onClick={closeMenu}
                  >
                    {t('navigation.defi', 'DeFi')}
                  </MobileNavLink>
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

HeaderComponent.displayName = 'Header';
export const Header = React.memo(HeaderComponent);
