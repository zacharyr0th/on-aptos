"use client";

import { BarChart, BarChart3, GitBranch, Network, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

import { defiProtocols } from "@/components/pages/protocols/defi/data/protocols";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { cn } from "@/lib/utils";

import { WalletDropdown } from "../wallet/WalletDropdown";

interface NavigationMenuProps {
  navigationItems: Array<{
    href: string;
    icon: React.ReactElement;
    title: string;
    isActive: boolean;
  }>;
  onMenuClose: () => void;
}

export function DesktopNavigationMenu({ navigationItems, onMenuClose }: NavigationMenuProps) {
  const pathname = usePathname();
  const { t } = useTranslation(["common", "defi"]);

  return (
    <div className="hidden md:flex items-center gap-4 ml-auto">
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
                          item.isActive && "bg-accent border-border"
                        )}
                        onClick={onMenuClose}
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
                          href="/protocols/defi"
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                            "border border-transparent hover:border-border",
                            pathname === "/protocols/defi" && "bg-accent border-border"
                          )}
                          onClick={onMenuClose}
                        >
                          <BarChart className="h-4 w-4" />
                          <span>{t("navigation.defi_dashboard", "DeFi Dashboard")}</span>
                        </Link>
                        {/* Yields Link */}
                        <Link
                          href="/protocols/yields"
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                            "border border-transparent hover:border-border",
                            pathname === "/protocols/yields" && "bg-accent border-border"
                          )}
                          onClick={onMenuClose}
                        >
                          <TrendingUp className="h-4 w-4" />
                          <span>{t("navigation.yield_opportunities", "Yield Opportunities")}</span>
                        </Link>
                      </div>
                      {/* Group protocols by category */}
                      {["Trading", "Lending", "Yield", "Derivatives", "Launchpad", "Multiple"].map(
                        (category) => {
                          const categoryProtocols = defiProtocols.filter(
                            (p) => p.category === category
                          );

                          if (categoryProtocols.length === 0) return null;

                          return (
                            <div key={category}>
                              <h4 className="sticky top-0 bg-popover/90 backdrop-blur-sm z-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 px-1">
                                {t(`defi.categories.${category}.name`, category)}
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
                                      "border border-transparent hover:border-border"
                                    )}
                                  >
                                    <div className="relative h-8 w-8 flex-shrink-0">
                                      <Image
                                        src={protocol.logo || "/placeholder.jpg"}
                                        alt={`${protocol.title} logo`}
                                        fill
                                        className="object-contain rounded"
                                        onError={(e) => {
                                          const img = e.target as HTMLImageElement;
                                          img.src = "/placeholder.jpg";
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="font-medium truncate">
                                          {protocol.title}
                                        </span>
                                        {protocol.category === "Multiple" &&
                                        protocol.subcategory.includes(",") ? (
                                          protocol.subcategory.split(",").map((sub, idx) => (
                                            <Badge
                                              key={idx}
                                              variant="outline"
                                              className="h-4 px-1 text-[10px] flex-shrink-0"
                                            >
                                              {t(
                                                `defi.subcategories.${sub.trim().toLowerCase().replace(/ /g, "_")}`,
                                                sub.trim()
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
                                              protocol.subcategory
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
                        }
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Blockchain Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-sm font-medium">
                {t("navigation.blockchain", "Blockchain")}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[160px] p-4">
                  <div className="grid gap-1">
                    <Link
                      href="/performance"
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                        "border border-transparent hover:border-border",
                        pathname === "/performance" && "bg-accent border-border"
                      )}
                      onClick={onMenuClose}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <div className="font-medium">
                        {t("navigation.performance", "Performance")}
                      </div>
                    </Link>
                    <Link
                      href="/metrics"
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                        "border border-transparent hover:border-border",
                        pathname === "/metrics" && "bg-accent border-border"
                      )}
                      onClick={onMenuClose}
                    >
                      <Network className="h-4 w-4" />
                      <div className="font-medium">{t("navigation.network", "Network")}</div>
                    </Link>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Portfolio/Wallet Button */}
            <NavigationMenuItem>
              <WalletDropdown className={navigationMenuTriggerStyle()} />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
