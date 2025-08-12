"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Menu,
  X,
  Bitcoin,
  Coins,
  Building2,
  BarChart,
  LogOut,
  User,
  Wallet,
  Copy,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { defiProtocols } from "@/components/pages/defi/data/protocols";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAnsName } from "@/hooks/useAnsName";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";

import { ErrorBoundary } from "../errors/ErrorBoundary";

const HeaderComponent = (): React.ReactElement | null => {
  const pathname = usePathname();
  const router = useRouter();
  const { account, disconnect, connect, wallets } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { ansName, ansData } = useAnsName();

  // Get wallet address
  const walletAddress = account?.address?.toString();
  const normalizedAddress =
    walletAddress && !walletAddress.startsWith("0x")
      ? `0x${walletAddress}`
      : walletAddress;
  const { t } = useTranslation(["common", "defi"]);

  // Consolidated navigation data
  const navigationItems = useMemo(
    () => [
      {
        href: "/stables",
        icon: <Coins className="h-4 w-4" />,
        title: t("navigation.stablecoins", "Stablecoins"),
        isActive: pathname === "/stables" || pathname === "/stablecoins",
      },
      {
        href: "/bitcoin",
        icon: <Bitcoin className="h-4 w-4" />,
        title: t("navigation.bitcoin", "Bitcoin"),
        isActive: pathname === "/bitcoin",
      },
      {
        href: "/rwas",
        icon: <Building2 className="h-4 w-4" />,
        title: t("navigation.rwas", "RWAs"),
        isActive: pathname === "/rwas",
      },
      {
        href: "/tokens",
        icon: <Coins className="h-4 w-4" />,
        title: t("navigation.tokens", "Tokens"),
        isActive: pathname === "/tokens",
      },
    ],
    [pathname, t],
  );

  const title = useMemo(() => {
    const pageConfig: Record<string, { key: string; fallback: string }> = {
      "/bitcoin": { key: "page_titles.bitcoin", fallback: "Bitcoin" },
      "/stables": { key: "page_titles.stablecoins", fallback: "Stablecoins" },
      "/stablecoins": {
        key: "page_titles.stablecoins",
        fallback: "Stablecoins",
      },
      "/defi": { key: "page_titles.defi", fallback: "DeFi" },
      "/rwas": { key: "page_titles.rwas", fallback: "RWAs" },
      "/tokens": { key: "page_titles.tokens", fallback: "Tokens" },
      "/yields": { key: "page_titles.yields", fallback: "Yields" },
      "/portfolio": {
        key: "page_titles.portfolio",
        fallback: "Your Portfolio",
      },
    };

    const config = pageConfig[pathname] || {
      key: "page_titles.whats",
      fallback: "What's",
    };
    const translation = t(config.key);
    return translation === config.key ? config.fallback : translation;
  }, [pathname, t]);

  const toggleMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMenu = () => setMobileMenuOpen(false);

  // Handle wallet address copy
  const handleCopyAddress = async () => {
    if (!normalizedAddress) {
      logger.warn("No address to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(normalizedAddress);
      toast.success("Address copied to clipboard");
      logger.debug(`Successfully copied address: ${normalizedAddress}`);
    } catch (error) {
      logger.warn(
        `Failed to copy address: ${error instanceof Error ? error.message : String(error)}`,
      );
      toast.error("Failed to copy address");
    }
  };

  // Handle Portfolio button click
  const handlePortfolioClick = () => {
    if (normalizedAddress) {
      // If wallet is connected, do nothing (dropdown handles it)
      return;
    } else {
      // If no wallet is connected, navigate to portfolio page
      router.push("/portfolio");
    }
  };

  // Handle wallet selection
  const handleWalletSelect = async (walletName: string) => {
    try {
      await connect(walletName as any);
      setShowWalletModal(false);
      // Redirect to portfolio page after successful connection
      router.push("/portfolio");
    } catch (error: any) {
      logger.warn(
        `Failed to connect to ${walletName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  // Get available wallets
  const extensionWallets =
    wallets?.filter((wallet) => {
      if (wallet.name === "Aptos Connect") return false;
      return wallet.readyState === "Installed";
    }) || [];

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Always render header

  return (
    <ErrorBoundary>
      <header className="relative py-3 sm:py-4 z-[9999] isolate">
        <div className="w-full px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
          <div className="flex items-center justify-between w-full">
            {/* Logo */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold">
              <Link
                href="/"
                className="hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
              >
                <span className="text-primary">{title}</span>{" "}
                <span className="text-muted-foreground">
                  {t("landing.hero.title_suffix", "on Aptos")}
                </span>
              </Link>
            </h1>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                <NavigationMenu delayDuration={0} viewport={false}>
                  <NavigationMenuList>
                    {/* Assets Dropdown */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="text-sm font-medium">
                        {t("navigation.assets", "Assets")}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="w-[160px] p-4">
                          <div className="grid gap-1">
                            {navigationItems.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                                  "border border-transparent hover:border-border",
                                  item.isActive && "bg-accent border-border",
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {item.icon}
                                <div className="font-medium">{item.title}</div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* DeFi Dropdown */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="text-sm font-medium">
                        {t("navigation.defi", "DeFi")}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="md:-ml-[230px]">
                        <div className="w-[280px]">
                          <ScrollArea className="h-[450px] rounded-md scroll-smooth">
                            <div className="p-4">
                              {/* DeFi Dashboard Link */}
                              <div className="mb-3">
                                <Link
                                  href="/defi"
                                  className={cn(
                                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                                    "border border-transparent hover:border-border",
                                    pathname === "/defi" &&
                                      "bg-accent border-border",
                                  )}
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <BarChart className="h-4 w-4" />
                                  <span>
                                    {t("navigation.dashboard", "Dashboard")}
                                  </span>
                                </Link>
                                {/* Yields Link */}
                                <Link
                                  href="/yields"
                                  className={cn(
                                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                                    "border border-transparent hover:border-border",
                                    pathname === "/yields" &&
                                      "bg-accent border-border",
                                  )}
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <TrendingUp className="h-4 w-4" />
                                  <span>
                                    {t("navigation.yields", "Yields")}
                                  </span>
                                </Link>
                              </div>
                              {/* Group protocols by category */}
                              {["Trading", "Credit", "Yield", "Multiple"].map(
                                (category) => {
                                  const categoryProtocols =
                                    defiProtocols.filter(
                                      (p) =>
                                        p.status === "Active" &&
                                        p.category === category,
                                    );

                                  if (categoryProtocols.length === 0)
                                    return null;

                                  return (
                                    <div key={category}>
                                      <h4 className="sticky top-0 bg-popover z-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 px-1">
                                        {t(
                                          `defi.categories.${category}.name`,
                                          category,
                                        )}
                                      </h4>
                                      <div className="grid gap-1 pb-2">
                                        {categoryProtocols.map((protocol) => (
                                          <Link
                                            key={protocol.title}
                                            href={protocol.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                                              "border border-transparent hover:border-border",
                                            )}
                                          >
                                            <div className="relative h-8 w-8 flex-shrink-0">
                                              <Image
                                                src={
                                                  protocol.logo ||
                                                  "/placeholder.jpg"
                                                }
                                                alt={`${protocol.title} logo`}
                                                fill
                                                className="object-contain rounded"
                                                onError={(e) => {
                                                  const img =
                                                    e.target as HTMLImageElement;
                                                  img.src = "/placeholder.jpg";
                                                }}
                                              />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <span className="font-medium truncate">
                                                  {protocol.title}
                                                </span>
                                                {protocol.category ===
                                                  "Multiple" &&
                                                protocol.subcategory.includes(
                                                  ",",
                                                ) ? (
                                                  protocol.subcategory
                                                    .split(",")
                                                    .map((sub, idx) => (
                                                      <Badge
                                                        key={idx}
                                                        variant="outline"
                                                        className="h-4 px-1 text-[10px] flex-shrink-0"
                                                      >
                                                        {t(
                                                          `defi.subcategories.${sub.trim().toLowerCase().replace(/ /g, "_")}`,
                                                          sub.trim(),
                                                        )}
                                                      </Badge>
                                                    ))
                                                ) : (
                                                  <Badge
                                                    variant="outline"
                                                    className="h-4 px-1 text-[10px] flex-shrink-0"
                                                  >
                                                    {t(
                                                      `defi.subcategories.${protocol.subcategory.toLowerCase().replace(/ /g, "_")}`,
                                                      protocol.subcategory,
                                                    )}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Portfolio Button */}
                    <NavigationMenuItem>
                      {normalizedAddress ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={navigationMenuTriggerStyle()}
                          >
                            {ansName ||
                              `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="font-normal">
                              <div className="flex flex-col space-y-3">
                                {/* ANS Information */}
                                {ansData && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 flex-shrink-0" />
                                      <div>
                                        <p className="text-sm font-semibold">
                                          {ansData.name}
                                        </p>
                                        {ansData.subdomain ? (
                                          <p className="text-xs text-muted-foreground">
                                            {t(
                                              "wallet.subdomain_of",
                                              "Subdomain of {{domain}}.apt",
                                              { domain: ansData.domain },
                                            )}
                                          </p>
                                        ) : (
                                          <p className="text-xs text-muted-foreground">
                                            {t(
                                              "wallet.primary_domain",
                                              "Primary domain",
                                            )}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Wallet Address */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">
                                        {t(
                                          "wallet.wallet_address",
                                          "Wallet Address",
                                        )}
                                      </p>
                                      <button
                                        onClick={handleCopyAddress}
                                        className="group flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded px-1 py-1 transition-colors"
                                        title="Click to copy address"
                                      >
                                        <p className="text-xs font-mono break-all leading-relaxed flex-1">
                                          {normalizedAddress}
                                        </p>
                                        <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {pathname !== "/portfolio" && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href="/portfolio"
                                    className="cursor-pointer"
                                  >
                                    {t(
                                      "actions.view_portfolio",
                                      "View Portfolio",
                                    )}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              className="cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => disconnect()}
                            >
                              <LogOut className="mr-2 h-4 w-4" />
                              {t("wallet.disconnect", "Disconnect")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <button
                          onClick={handlePortfolioClick}
                          className={navigationMenuTriggerStyle()}
                        >
                          {t("navigation.portfolio", "Portfolio")}
                        </button>
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
                      "navigation.toggle_menu",
                      "Toggle navigation menu",
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
                  <p>
                    {mobileMenuOpen ? "Close menu" : "Open navigation menu"}
                  </p>
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
                      {t("navigation.mobile_menu", "Navigation")}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={closeMenu}
                          className="p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md transition-colors hover:bg-muted"
                          aria-label={t(
                            "navigation.close_menu",
                            "Close navigation menu",
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
                      {navigationItems.map((item) => (
                        <MobileNavLink
                          key={item.href}
                          href={item.href}
                          active={item.isActive}
                          onClick={closeMenu}
                        >
                          {item.title}
                        </MobileNavLink>
                      ))}
                    </div>

                    <div className="py-2 border-t border-border">
                      <div className="px-4 py-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          DeFi
                        </h3>
                      </div>
                      <MobileNavLink
                        href="/defi"
                        active={pathname === "/defi"}
                        onClick={closeMenu}
                      >
                        Dashboard
                      </MobileNavLink>
                      <MobileNavLink
                        href="/yields"
                        active={pathname === "/yields"}
                        onClick={closeMenu}
                      >
                        Yields
                      </MobileNavLink>
                    </div>

                    <div className="py-2 border-t border-border">
                      {normalizedAddress ? (
                        <>
                          <MobileNavLink
                            href="/portfolio"
                            active={pathname === "/portfolio"}
                            onClick={closeMenu}
                          >
                            {t("navigation.portfolio", "Portfolio")}
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
                              closeMenu();
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
                          href="/portfolio"
                          active={pathname === "/portfolio"}
                          onClick={closeMenu}
                        >
                          {t("navigation.portfolio", "Portfolio")}
                        </MobileNavLink>
                      )}
                    </div>
                  </div>
                </div>
              </nav>
            </>
          )}

          {/* Wallet Connection Modal */}
          <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto fixed top-[50vh] left-[50%] translate-x-[-50%] translate-y-[-50%]">
              <DialogTitle>{t("wallet.connect", "Connect Wallet")}</DialogTitle>
              <div className="grid gap-3 py-4">
                {/* Extension Wallets */}
                {extensionWallets.map((wallet) => (
                  <Button
                    key={wallet.name}
                    variant="outline"
                    className="justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3 px-3 sm:px-4"
                    onClick={() => handleWalletSelect(wallet.name)}
                  >
                    <Image
                      src={wallet.icon}
                      alt={`${wallet.name} icon`}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = "/placeholder.jpg";
                      }}
                    />
                    <div className="flex-1 text-left">
                      <span className="font-medium">{wallet.name}</span>
                    </div>
                  </Button>
                ))}

                {/* Help text for users without wallets */}
                {extensionWallets.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      No wallet extensions detected. Please install a wallet
                      extension.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open("https://petra.app", "_blank")
                        }
                      >
                        Install Petra Wallet
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open("https://www.okx.com/web3", "_blank")
                        }
                      >
                        Install OKX Wallet
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>
    </ErrorBoundary>
  );
};

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
        ? "text-primary bg-muted/70 border-r-2 border-primary"
        : "text-foreground"
    }`}
  >
    {children}
  </Link>
);

// ListItem component for navigation menu
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
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
          href={href || "#"}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            active && "bg-accent/50",
            className,
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
});
ListItem.displayName = "ListItem";

HeaderComponent.displayName = "Header";
export const Header = HeaderComponent;
