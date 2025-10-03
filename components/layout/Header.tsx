"use client";

import { BarChart3, Bitcoin, Building2, Coins, GitBranch, TrendingUp } from "lucide-react";
import { usePathname } from "next/navigation";
import type React from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { ErrorBoundary } from "../errors/ErrorBoundary";
import { HeaderLogo } from "./header/HeaderLogo";
import { MobileMenu } from "./header/MobileMenu";
import { DesktopNavigationMenu } from "./header/NavigationMenu";
import { WalletModal } from "./wallet/WalletModal";

const HeaderComponent = (): React.ReactElement | null => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { t } = useTranslation(["common", "defi"]);

  // Assets dropdown navigation data (excluding Metrics and Repos which are now standalone)
  const navigationItems = useMemo(
    () => [
      {
        href: "/markets/stables",
        icon: <Coins className="h-4 w-4" />,
        title: t("navigation.stablecoins", "Stablecoins"),
        isActive: pathname === "/markets/stables" || pathname === "/stablecoins",
      },
      {
        href: "/markets/bitcoin",
        icon: <Bitcoin className="h-4 w-4" />,
        title: t("navigation.bitcoin", "Bitcoin"),
        isActive: pathname === "/markets/bitcoin",
      },
      {
        href: "/markets/rwas",
        icon: <Building2 className="h-4 w-4" />,
        title: t("navigation.rwas", "RWAs"),
        isActive: pathname === "/markets/rwas",
      },
      {
        href: "/markets/tokens",
        icon: <Coins className="h-4 w-4" />,
        title: t("navigation.tokens", "Tokens"),
        isActive: pathname === "/markets/tokens",
      },
    ],
    [pathname, t]
  );

  const toggleMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <ErrorBoundary>
      <header className="relative py-1 sm:py-2 z-[9999] bg-gradient-to-b from-primary/5 to-transparent">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="flex items-center justify-between w-full">
            <HeaderLogo />

            <DesktopNavigationMenu navigationItems={navigationItems} onMenuClose={closeMenu} />

            <MobileMenu
              isOpen={mobileMenuOpen}
              onToggle={toggleMenu}
              onClose={closeMenu}
              navigationItems={navigationItems}
            />
          </div>

          <WalletModal open={showWalletModal} onOpenChange={setShowWalletModal} />
        </div>
      </header>
    </ErrorBoundary>
  );
};

HeaderComponent.displayName = "Header";
export const Header = HeaderComponent;
