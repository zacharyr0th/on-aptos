"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAnsName } from "@/lib/hooks/useAnsName";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  navigationItems: Array<{
    href: string;
    title: string;
    isActive: boolean;
  }>;
}

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
      active ? "text-primary bg-muted/70 border-r-2 border-primary" : "text-foreground"
    }`}
  >
    {children}
  </Link>
);

export function MobileMenu({ isOpen, onToggle, onClose, navigationItems }: MobileMenuProps) {
  const pathname = usePathname();
  const { account, disconnect } = useWallet();
  const { ansName } = useAnsName();
  const { t } = useTranslation("common");

  const walletAddress = account?.address?.toString();
  const normalizedAddress =
    walletAddress && !walletAddress.startsWith("0x") ? `0x${walletAddress}` : walletAddress;

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="flex items-center gap-2 md:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggle}
              className="p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md transition-colors hover:bg-muted"
              aria-label={t("navigation.toggle_menu", "Toggle navigation menu")}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOpen ? "Close menu" : "Open navigation menu"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
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
                  {t("navigation.mobile_menu", "Navigation")}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onClose}
                      className="p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md transition-colors hover:bg-muted"
                      aria-label={t("navigation.close_menu", "Close navigation menu")}
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
                <div className="py-2 border-t border-border">
                  <div className="px-4 py-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Assets
                    </h3>
                  </div>
                  {navigationItems.map((item) => (
                    <MobileNavLink
                      key={item.href}
                      href={item.href}
                      active={item.isActive}
                      onClick={onClose}
                    >
                      {item.title}
                    </MobileNavLink>
                  ))}
                </div>

                <div className="py-2 border-t border-border">
                  <div className="px-4 py-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Performance
                    </h3>
                  </div>
                  <MobileNavLink
                    href="/performance"
                    active={pathname === "/performance"}
                    onClick={onClose}
                  >
                    USDT Performance
                  </MobileNavLink>
                </div>

                <div className="py-2 border-t border-border">
                  <div className="px-4 py-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      DeFi
                    </h3>
                  </div>
                  <MobileNavLink
                    href="/protocols/defi"
                    active={pathname === "/protocols/defi"}
                    onClick={onClose}
                  >
                    DeFi Dashboard
                  </MobileNavLink>
                  <MobileNavLink
                    href="/protocols/yields"
                    active={pathname === "/protocols/yields"}
                    onClick={onClose}
                  >
                    Yield Opportunities
                  </MobileNavLink>
                </div>

                <div className="py-2 border-t border-border">
                  {normalizedAddress ? (
                    <>
                      <MobileNavLink
                        href="/tools/portfolio"
                        active={pathname === "/tools/portfolio"}
                        onClick={onClose}
                      >
                        Portfolio
                      </MobileNavLink>
                      <div className="px-4 py-2">
                        <p className="text-xs text-muted-foreground">
                          {ansName ||
                            `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {normalizedAddress.slice(0, 8)}...
                          {normalizedAddress.slice(-6)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          disconnect();
                          onClose();
                        }}
                        className="w-full text-left text-base font-medium py-4 px-6 text-destructive hover:bg-destructive/10 transition-colors duration-200"
                      >
                        <span className="flex items-center gap-2">
                          <LogOut className="h-4 w-4" />
                          {t("wallet.disconnect", "Disconnect")}
                        </span>
                      </button>
                    </>
                  ) : (
                    <MobileNavLink
                      href="/tools/portfolio"
                      active={pathname === "/tools/portfolio"}
                      onClick={onClose}
                    >
                      {pathname === "/" ? "Launch App" : "Portfolio"}
                    </MobileNavLink>
                  )}
                </div>
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
