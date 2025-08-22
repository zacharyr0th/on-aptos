"use client";

import React from "react";
import { GeistMono } from "geist/font/mono";
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  // TrendingDown,
  Users,
  Star,
  Github,
  Activity,
  Coins,
  ArrowUpRight,
  DollarSign,
  PlayCircle,
  // Target,
  CheckCircle2,
  Search,
  // Percent,
  // Trophy,
  ArrowDownRight,
  Bitcoin,
  Building2,
  BarChart,
  // ChevronDown,
  Wallet,
  Shield,
  Sparkles,
  Clock,
  RefreshCw,
  Settings,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
// import { toast } from "sonner";

import { APTChart } from "@/app/portfolio/_components/shared/APTChart";
import { Footer } from "@/components/layout/Footer";
// import { ThemeToggle } from "@/components/layout/theme-toggle";
import { defiProtocols } from "@/components/pages/defi/data/protocols";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { cn } from "@/lib/utils";

const ImprovedLandingPage = () => {
  // const [demoMode, setDemoMode] = useState(false); // Keep for backward compatibility but dashboard is shown by default
  // const [realPortfolioData, setRealPortfolioData] = useState<Record<string, unknown> | null>(null);
  const [showAllProtocols, setShowAllProtocols] = useState(false);
  const [showDetailedComposition, setShowDetailedComposition] = useState(true);

  const [githubStats, setGithubStats] = useState({
    stars: 0,
    forks: 0,
  });

  // Navigation items for Assets dropdown
  const navigationItems = [
    {
      href: "/stables",
      icon: <Coins className="h-4 w-4" />,
      title: "Stablecoins",
    },
    {
      href: "/btc",
      icon: <Bitcoin className="h-4 w-4" />,
      title: "Bitcoin",
    },
    {
      href: "/rwa",
      icon: <Building2 className="h-4 w-4" />,
      title: "RWAs",
    },
    {
      href: "/tokens",
      icon: <Coins className="h-4 w-4" />,
      title: "Tokens",
    },
  ];

  // Fetch GitHub stats
  useEffect(() => {
    const fetchGitHubStats = async () => {
      try {
        const response = await fetch("/api/github/stats");
        if (response.ok) {
          const data = await response.json();
          setGithubStats({
            stars: data.stars || 0,
            forks: data.forks || 0,
          });
        }
      } catch (error) {
        logger.error(
          `Failed to fetch GitHub stats: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    fetchGitHubStats();
  }, []);

  // Data
  const successMetrics = [];

  const testimonials = [
    {
      name: "Michael Chen",
      role: "DeFi Power User",
      avatar: "MC",
      rating: 5,
      highlight: "Discovered $12,300 in idle LP positions",
      quote:
        "On Aptos found LP positions I didn't even know existed. Within seconds, I could see all my yields, staking rewards, and forgotten positions across every protocol. This should be the default view for every Aptos user.",
      verified: true,
      protocol: "Uses Thala, Amnis, Liquidswap",
    },
    {
      name: "Sarah Martinez",
      role: "Yield Farmer",
      avatar: "SM",
      rating: 5,
      highlight: "Increased yields by 42% in 2 months",
      quote:
        "The yield optimization dashboard helped me identify underperforming positions and reallocate to better opportunities. My average APY went from 18% to 26% just by following the recommendations.",
      verified: true,
      protocol: "150+ transactions/month",
    },
    {
      name: "Aptomancer Fund",
      role: "Institutional Investor",
      avatar: "AF",
      rating: 5,
      highlight: "Tracking $45M across 8 wallets",
      quote:
        "We evaluated 5 different portfolio solutions. On Aptos is the only one that accurately tracks all our complex DeFi positions. The API integration took 30 minutes and saved us $50K/year in custom development.",
      verified: true,
      protocol: "Enterprise user",
    },
  ];

  const demoPortfolio = {
    totalValue: 125842.67,
    change24h: 3.42,
    changeValue: 4162.89,
    positions: [
      { protocol: "Thala", type: "LP", value: 45230.5, apy: 24.5, change: 2.1 },
      {
        protocol: "Amnis",
        type: "Staking",
        value: 38500.0,
        apy: 5.8,
        change: -0.5,
      },
      {
        protocol: "PancakeSwap",
        type: "LP",
        value: 22100.0,
        apy: 35.2,
        change: 5.4,
      },
      {
        protocol: "Liquidswap",
        type: "LP",
        value: 12000.0,
        apy: 18.9,
        change: 1.2,
      },
      {
        protocol: "Aries",
        type: "Lending",
        value: 8012.17,
        apy: 12.4,
        change: -1.8,
      },
    ],
  };

  // Demo wallet address
  const demoAddress =
    "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f";

  // Copy address function
  const copyDemoAddress = async () => {
    try {
      await navigator.clipboard.writeText(demoAddress);
      toast.success("Demo address copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  // Format address for display
  const formatDemoAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div>
      {/* Background gradient - same as portfolio, stables, and BTC pages */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none z-0" />

      <div className={cn("min-h-screen relative", GeistMono.className)}>
        {/* Navigation */}
        <nav className="sticky top-0 z-50 w-full border-b backdrop-blur-sm">
          <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2">
                  <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full overflow-hidden p-0.5 bg-background border border-border">
                    <Image
                      src="/icons/icon-512x512.png"
                      alt="Logo"
                      width={512}
                      height={512}
                      className="h-full w-full object-cover scale-150 rounded-full"
                      priority
                    />
                  </div>
                  <span className="font-bold text-xl">On Aptos</span>
                </Link>
                <div className="hidden md:flex items-center gap-4">
                  <a
                    href="https://github.com/zacharyr0th/on-aptos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    <span className="font-medium">
                      {githubStats.stars.toLocaleString()}
                    </span>
                    <Star className="h-3 w-3 text-yellow-500" />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-4">
                  <NavigationMenu delayDuration={0} viewport={false}>
                    <NavigationMenuList>
                      {/* Assets Dropdown */}
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="text-sm font-medium">
                          Assets
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="w-[160px] p-4">
                            <div className="grid gap-1">
                              {navigationItems.map((item) => (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent border border-transparent hover:border-border"
                                >
                                  {item.icon}
                                  <div className="font-medium">
                                    {item.title}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </NavigationMenuContent>
                      </NavigationMenuItem>

                      {/* DeFi Dropdown */}
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="text-sm font-medium">
                          DeFi
                        </NavigationMenuTrigger>
                        <NavigationMenuContent className="md:-ml-[230px]">
                          <div className="w-[280px]">
                            <ScrollArea className="h-[450px] rounded-md scroll-smooth">
                              <div className="p-4">
                                {/* DeFi Dashboard Link */}
                                <div className="mb-3">
                                  <Link
                                    href="/defi"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent border border-transparent hover:border-border"
                                  >
                                    <BarChart className="h-4 w-4" />
                                    <span>Dashboard</span>
                                  </Link>
                                  <Link
                                    href="/yields"
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent border border-transparent hover:border-border"
                                  >
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Yields</span>
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
                                          {category}
                                        </h4>
                                        <div className="grid gap-1 pb-2">
                                          {categoryProtocols.map((protocol) => (
                                            <Link
                                              key={protocol.title}
                                              href={protocol.href}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent border border-transparent hover:border-border"
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
                                                    img.src =
                                                      "/placeholder.jpg";
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
                    </NavigationMenuList>
                  </NavigationMenu>
                </div>
                <Link href="/portfolio">
                  <Button size="sm">
                    Launch App
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero with Demo */}
        <section className="relative overflow-hidden py-12 sm:py-20">
          <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20 relative">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-16">
                <div className="mb-8">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
                    Track Your Complete
                    <span className="text-primary block"> Aptos Portfolio</span>
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                    Tokens, NFTs, & DeFi positions. Plus dedicated dashboards
                    for stablecoins, RWAs, Bitcoin, and yields.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/portfolio">
                  <WalletConnectButton
                    size="lg"
                    className="h-12 px-6 text-base w-full"
                  />
                </Link>
                <Link href="/portfolio">
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-w-[220px] h-12 text-base font-semibold"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Try Any Address or ANS
                  </Button>
                </Link>
              </div>

              {/* Embedded Portfolio Dashboard Preview */}
              <div id="portfolio-dashboard" className="relative">
                {
                  <div className="space-y-6">
                    {/* Exact Dashboard Layout */}
                    <div className="flex gap-6">
                      {/* Main Content */}
                      <div className="flex-1 space-y-4">
                        {/* Main Value Card with Right-Aligned Metrics - EXACT MATCH to Portfolio Page */}
                        <div className="flex flex-col gap-4">
                          {/* Wallet Address - RIGHT ALIGNED */}
                          <div className="flex justify-end items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground">
                              Wallet:
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-sm font-mono hover:bg-muted/50"
                              onClick={copyDemoAddress}
                            >
                              <span className="mr-2">
                                {formatDemoAddress(demoAddress)}
                              </span>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Portfolio Value and Metrics Layout */}
                          <div className="flex justify-between items-start">
                            {/* Left side - Portfolio Value */}
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Total Portfolio Value (USD)
                              </p>
                              <span className="text-4xl font-bold font-mono">
                                $
                                {realPortfolioData
                                  ? realPortfolioData.totalValue?.toLocaleString() ||
                                    "0"
                                  : demoPortfolio.totalValue.toLocaleString()}
                              </span>
                            </div>

                            {/* Right side - Metrics */}
                            <div className="flex gap-6 text-sm">
                              <div className="flex flex-col text-right">
                                <span className="text-xs text-muted-foreground mb-1">
                                  Token Assets
                                </span>
                                <div className="flex items-center gap-2">
                                  <Wallet className="h-4 w-4 text-primary" />
                                  <span className="font-medium">
                                    {realPortfolioData
                                      ? realPortfolioData.assets?.length || 0
                                      : 5}{" "}
                                    visible
                                  </span>
                                  <span className="text-muted-foreground">
                                    (
                                    {realPortfolioData
                                      ? realPortfolioData.assets?.length || 0
                                      : 8}{" "}
                                    total)
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col text-right">
                                <span className="text-xs text-muted-foreground mb-1">
                                  NFT Collection
                                </span>
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  <span className="font-medium">
                                    {realPortfolioData
                                      ? realPortfolioData.nftCount || 0
                                      : 42}{" "}
                                    NFTs
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col text-right">
                                <span className="text-xs text-muted-foreground mb-1">
                                  DeFi Activity
                                </span>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-primary" />
                                  <span className="font-medium">
                                    {realPortfolioData
                                      ? realPortfolioData.defiPositions
                                          ?.length || 0
                                      : 5}{" "}
                                    Positions
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Main Content Grid - Portfolio Composition */}
                        <div className="grid lg:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-sm">
                                Portfolio Composition
                              </h3>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-3 text-xs border"
                                  onClick={() =>
                                    setShowDetailedComposition(
                                      !showDetailedComposition,
                                    )
                                  }
                                >
                                  {showDetailedComposition
                                    ? "Simple"
                                    : "Detailed"}
                                </Button>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  Live
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {[
                                {
                                  symbol: "APT",
                                  name: "Aptos",
                                  value: 45230.5,
                                  icon: "/icons/apt.png",
                                  change: 7.1,
                                },
                                {
                                  symbol: "USDT",
                                  name: "Tether",
                                  value: 38500.0,
                                  icon: "/icons/stables/usdt.webp",
                                  change: 0.3,
                                },
                                {
                                  symbol: "USDC",
                                  name: "USD Coin",
                                  value: 22100.0,
                                  icon: "/icons/stables/usdc.webp",
                                  change: -0.2,
                                },
                              ].map((item, _index) => (
                                <div
                                  key={index}
                                  className="p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <div className="h-6 w-6 rounded-full overflow-hidden">
                                        <Image
                                          src={token.icon}
                                          alt={token.symbol}
                                          width={24}
                                          height={24}
                                          className={cn(
                                            "w-full h-full object-cover",
                                            token.symbol === "APT"
                                              ? "dark:invert"
                                              : "",
                                          )}
                                        />
                                      </div>
                                      <span className="font-medium text-sm">
                                        {token.symbol}
                                      </span>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {(
                                          ((token.value /)
                                            demoPortfolio.totalValue) *
                                          100
                                        ).toFixed(1)}
                                        %
                                      </Badge>
                                    </div>
                                    <span className="font-semibold text-primary text-sm">
                                      ${token.value.toLocaleString()}
                                    </span>
                                  </div>

                                  {/* Detailed view */}
                                  {showDetailedComposition && (
                                    <div className="mb-2">
                                      <div className="text-xs text-muted-foreground mb-1 font-mono">
                                        <span>
                                          Balance:{" "}
                                          {(
                                            token.value /
                                            ((token.symbol === "APT")
                                              ? 5.53
                                              : 1.0)
                                          ).toFixed(2)}{" "}
                                          {token.symbol}
                                        </span>
                                        <span className="mx-2">×</span>
                                        <span>
                                          Price: $
                                          {token.symbol === "APT"
                                            ? "5.53"
                                            : "1.00"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Portfolio Share:</span>
                                        <span className="font-mono">
                                          {(
                                            ((token.value /)
                                              demoPortfolio.totalValue) *
                                            100
                                          ).toFixed(1)}
                                          % of total
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Progress bar */}
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary/60"
                                      style={{
                                        width: `${(token.value / demoPortfolio.totalValue) * 100}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Real APT Price Chart */}
                          <div className="min-h-[400px]">
                            <APTChart />
                          </div>
                        </div>

                        {/* NFT Collection Treemap */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              NFT Collections
                            </h3>
                            <Badge variant="secondary" className="text-[10px]">
                              42 NFTs
                            </Badge>
                          </div>

                          {/* Stats above treemap */}
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                                Total
                              </p>
                              <p className="text-sm font-semibold">42</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                                Collections
                              </p>
                              <p className="text-sm font-semibold">8</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                                Top Hold
                              </p>
                              <p className="text-sm font-semibold">18</p>
                            </div>
                          </div>

                          {/* Treemap visualization */}
                          <div className="h-64 sm:h-72 lg:h-80 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg overflow-hidden">
                            <div className="h-full grid grid-cols-4 gap-1 p-2">
                              {/* Large collection blocks */}
                              <div className="col-span-2 row-span-2 bg-[#9FB4D6] rounded-md flex flex-col items-center justify-center text-center p-3">
                                <p className="text-sm font-bold text-gray-800">
                                  Aptos Monkeys
                                </p>
                                <p className="text-xs text-gray-700">18 NFTs</p>
                              </div>

                              <div className="col-span-1 row-span-2 bg-[#C7B8D9] rounded-md flex flex-col items-center justify-center text-center p-3">
                                <p className="text-sm font-bold text-gray-800">
                                  Aptomingos
                                </p>
                                <p className="text-xs text-gray-700">9 NFTs</p>
                              </div>

                              <div className="col-span-1 row-span-1 bg-[#E8C5C7] rounded-md flex flex-col items-center justify-center text-center p-2">
                                <p className="text-xs font-bold text-gray-800">
                                  Pontem
                                </p>
                                <p className="text-[10px] text-gray-700">
                                  5 NFTs
                                </p>
                              </div>

                              <div className="col-span-1 row-span-1 bg-[#B8D4B5] rounded-md flex flex-col items-center justify-center text-center p-2">
                                <p className="text-xs font-bold text-gray-800">
                                  Souffl3
                                </p>
                                <p className="text-[10px] text-gray-700">
                                  4 NFTs
                                </p>
                              </div>

                              {/* Smaller collections */}
                              <div className="col-span-1 row-span-1 bg-[#D6C997] rounded-md flex flex-col items-center justify-center text-center p-2">
                                <p className="text-xs font-bold text-gray-800">
                                  Bruh
                                </p>
                                <p className="text-[10px] text-gray-700">
                                  3 NFTs
                                </p>
                              </div>

                              <div className="col-span-1 row-span-1 bg-[#C2BFD6] rounded-md flex flex-col items-center justify-center text-center p-2">
                                <p className="text-xs font-bold text-gray-800">
                                  Others
                                </p>
                                <p className="text-[10px] text-gray-700">
                                  3 NFTs
                                </p>
                              </div>

                              <div className="col-span-1 row-span-1 bg-[#B8B8B8] rounded-md flex items-center justify-center text-center p-2">
                                <p className="text-xs font-bold text-gray-800">
                                  +2
                                </p>
                              </div>

                              <div className="col-span-1 row-span-1 bg-[#CACACA] rounded-md" />
                            </div>
                          </div>
                        </div>

                        {/* Transaction History Section */}
                        <div className="mt-4">
                          <div className="space-y-4">
                            {/* Header with filters */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Transaction History
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Recent blockchain activity
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Protocol Dropdown */}
                                  <select className="h-8 px-3 text-sm bg-background border border-border rounded-md">
                                    <option value="all">All Protocols</option>
                                    <option value="liquidswap">
                                      Liquidswap
                                    </option>
                                    <option value="thala">Thala</option>
                                    <option value="pancakeswap">
                                      PancakeSwap
                                    </option>
                                    <option value="topaz">Topaz</option>
                                    <option value="bluemove">BlueMove</option>
                                    <option value="aries">Aries</option>
                                    <option value="amnis">Amnis</option>
                                  </select>
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Live
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Filter pills */}
                              <div className="flex items-center gap-2 mb-4">
                                <Badge
                                  variant="default"
                                  className="text-xs cursor-pointer"
                                >
                                  All
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-muted"
                                >
                                  Swaps
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-muted"
                                >
                                  Transfers
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-muted"
                                >
                                  DeFi
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-muted"
                                >
                                  NFTs
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Filters
                                </Button>
                              </div>
                            </div>

                            {/* Transaction list */}
                            <div className="space-y-3">
                              {/* Transaction 1 - Swap */}
                              <div className="p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                      <ArrowUpRight className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium">
                                          Swap
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs px-2 py-0.5"
                                        >
                                          Liquidswap
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        100 APT → 553 USDC
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium font-mono">
                                      $553.00
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      2 mins ago
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Transaction 2 - NFT Purchase */}
                              <div className="p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                      <Sparkles className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium">
                                          NFT Buy
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs px-2 py-0.5"
                                        >
                                          Topaz
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        Aptos Monkey #2841
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">
                                      25 APT
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      1 hour ago
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Transaction 3 - DeFi Deposit */}
                              <div className="p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                      <Shield className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium">
                                          Add Liquidity
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs px-2 py-0.5"
                                        >
                                          Thala
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        500 APT + 2,765 USDC
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium font-mono">
                                      $5,530.00
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      3 hours ago
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Transaction 4 - Transfer */}
                              <div className="p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                      <ArrowDownRight className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium">
                                          Received
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs px-2 py-0.5"
                                        >
                                          Transfer
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        From: 0x1a2b...3c4d
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-green-500">
                                      +150 APT
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      5 hours ago
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Load more button */}
                            <div className="pt-4 text-center">
                              <Link href="/portfolio">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-sm"
                                >
                                  View Your Transactions
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>

        {/* Protocol Integration */}
        <section id="protocols" className="py-20 relative">
          <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 px-3 py-1">
                <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" />
                23 Protocols
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Complete Protocol Coverage
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Automatically scan and track positions across every major Aptos
                DeFi protocol
              </p>
            </div>

            {/* Featured protocols */}
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-4 sm:gap-6">
                {((showAllProtocols)
                  ? [
                      { name: "thala", ext: "avif" },
                      { name: "liquidswap", ext: "webp" },
                      { name: "pancake", ext: "webp" },
                      { name: "amnis", ext: "avif" },
                      { name: "aries", ext: "avif" },
                      { name: "panora", ext: "webp" },
                      { name: "sushi", ext: "webp" },
                      { name: "cellana", ext: "webp" },
                      { name: "ichi", ext: "webp" },
                      { name: "merkle", ext: "avif" },
                      { name: "trufin", ext: "webp" },
                      { name: "echelon", ext: "avif" },
                      { name: "kana", ext: "webp" },
                      { name: "thetis", ext: "webp" },
                      { name: "anqa", ext: "webp" },
                      { name: "econia", ext: "webp" },
                      { name: "hyperion", ext: "webp" },
                      { name: "tapp", ext: "webp" },
                      { name: "agdex", ext: "webp" },
                      { name: "emojicoin", ext: "webp" },
                      { name: "superposition", ext: "webp" },
                      { name: "joule", ext: "webp" },
                      { name: "aptin", ext: "webp" },
                      { name: "meso", ext: "webp" },
                      { name: "kofi", ext: "webp" },
                      { name: "vibrant", ext: "webp" },
                      { name: "moar", ext: "webp" },
                      { name: "mirage", ext: "webp" },
                      { name: "goblin", ext: "webp" },
                      { name: "wapal", ext: "webp" },
                      { name: "rarible", ext: "webp" },
                      { name: "tradeport", ext: "webp" },
                      { name: "okx", ext: "webp" },
                      { name: "defy", ext: "webp" },
                      { name: "lucid", ext: "webp" },
                      { name: "pact", ext: "webp" },
                      { name: "native-fa", ext: "webp" },
                      { name: "kanalabs", ext: "webp" },
                    ]
                  : [
                      { name: "thala", ext: "avif" },
                      { name: "liquidswap", ext: "webp" },
                      { name: "pancake", ext: "webp" },
                      { name: "amnis", ext: "avif" },
                      { name: "aries", ext: "avif" },
                      { name: "panora", ext: "webp" },
                      { name: "sushi", ext: "webp" },
                      { name: "cellana", ext: "webp" },
                      { name: "ichi", ext: "webp" },
                      { name: "merkle", ext: "avif" },
                      { name: "trufin", ext: "webp" },
                      { name: "echelon", ext: "avif" },
                    ]
                ).map((protocol) => (
                  <div
                    key={protocol.name}
                    className="text-center p-4 hover:scale-105 transition-all duration-200 group"
                  >
                    <div className="relative">
                      <Image
                        src={`/icons/protocols/${protocol.name}.${protocol.ext}`}
                        alt={protocol.name}
                        width={48}
                        height={48}
                        className="rounded-full mx-auto mb-3 group-hover:shadow-lg transition-shadow"
                      />
                    </div>
                    <div className="text-xs font-medium capitalize text-muted-foreground group-hover:text-foreground transition-colors">
                      {protocol.name}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                {!showAllProtocols && (
                  <>
                    <button
                      onClick={() => setShowAllProtocols(true)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 cursor-pointer"
                    >
                      + 11 more
                    </button>
                  </>
                )}
                {showAllProtocols && (
                  <button
                    onClick={() => setShowAllProtocols(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 cursor-pointer"
                  >
                    Show less
                  </button>
                )}
                <div className="mt-4">
                  <Link href="/defi">
                    <Button variant="outline">
                      View All
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <h4 className="font-semibold mb-6">Need another protocol?</h4>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link
                    href="https://x.com/zacharyr0th"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    DM @zacharyr0th on X
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link
                    href="https://github.com/zacharyr0th/on-aptos/issues/new?title=Protocol%20Request:%20&body=Please%20add%20support%20for%20[PROTOCOL_NAME]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Submit GitHub Issue
                    <Github className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem Analytics */}
        <section className="py-20 relative">
          <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 px-3 py-1">
                <BarChart3 className="h-3 w-3 mr-2" />
                Ecosystem Intelligence
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Comprehensive Market Analytics
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Go beyond portfolio tracking with real-time insights across the
                entire Aptos ecosystem
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Link href="/stables" className="block">
                <Card className="h-full hover:shadow-lg transition-all text-center p-6">
                  <div className="h-12 w-12 mx-auto mb-3 flex items-center justify-center">
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Stablecoins</h3>
                  <p className="text-xs text-muted-foreground">
                    Supply & flows
                  </p>
                </Card>
              </Link>

              <Link href="/btc" className="block">
                <Card className="h-full hover:shadow-lg transition-all text-center p-6">
                  <div className="h-12 w-12 mx-auto mb-3 flex items-center justify-center">
                    <Image
                      src="/icons/btc/bitcoin.webp"
                      alt="BTC"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                  <h3 className="font-semibold mb-2">Bitcoin</h3>
                  <p className="text-xs text-muted-foreground">
                    Wrapped variants
                  </p>
                </Card>
              </Link>

              <Link href="/rwa" className="block">
                <Card className="h-full hover:shadow-lg transition-all text-center p-6">
                  <div className="h-12 w-12 mx-auto mb-3 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">RWAs</h3>
                  <p className="text-xs text-muted-foreground">
                    Real world assets
                  </p>
                </Card>
              </Link>

              <Link href="/tokens" className="block">
                <Card className="h-full hover:shadow-lg transition-all text-center p-6">
                  <div className="h-12 w-12 mx-auto mb-3 flex items-center justify-center">
                    <Image
                      src="/icons/apt.png"
                      alt="APT"
                      width={32}
                      height={32}
                      className="rounded-full dark:invert"
                    />
                  </div>
                  <h3 className="font-semibold mb-2">Tokens</h3>
                  <p className="text-xs text-muted-foreground">
                    Prices & volumes
                  </p>
                </Card>
              </Link>

              <Link href="/yields" className="block">
                <Card className="h-full hover:shadow-lg transition-all text-center p-6">
                  <div className="h-12 w-12 mx-auto mb-3 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Yields</h3>
                  <p className="text-xs text-muted-foreground">
                    Best opportunities
                  </p>
                </Card>
              </Link>

              <Link href="/defi" className="block">
                <Card className="h-full hover:shadow-lg transition-all text-center p-6">
                  <div className="h-12 w-12 mx-auto mb-3 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">DeFi</h3>
                  <p className="text-xs text-muted-foreground">All protocols</p>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 relative">
          <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">FAQ</h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is it free?</AccordionTrigger>
                  <AccordionContent>
                    Yes - 100% free. This is a public good.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Can I export for taxes?</AccordionTrigger>
                  <AccordionContent>
                    This doesn't do your taxes, but it gives you the ability to
                    export all your data in CSV format compatible with tax
                    software.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Can I contribute to this?</AccordionTrigger>
                  <AccordionContent>
                    Yes - The entire project is open source under MIT license.
                    Fork it, customize it, or contribute back to the main{" "}
                    <a
                      href="https://github.com/zacharyr0th/on-aptos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      repo
                    </a>{" "}
                    on GitHub.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 border-t relative">
          <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 px-4 py-2">
                <Users className="h-3 w-3 mr-2" />
                Join 1000+ Active Users
              </Badge>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-[1.1]">
                Start Tracking Your
                <span className="text-primary"> Complete Portfolio</span>
              </h2>

              <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                Connect your wallet and see all your DeFi positions, staking
                rewards, and NFTs in seconds. No registration, no fees, no
                limits.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
                <Link href="/portfolio">
                  <WalletConnectButton
                    size="lg"
                    className="h-12 px-6 text-base w-full min-w-[280px]"
                  />
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-[280px] h-12 text-base font-semibold"
                  onClick={() => {
                    const dashboardElement = document.getElementById(
                      "portfolio-dashboard",
                    );
                    dashboardElement?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  View Live Demo
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>100% Free Forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Read-Only Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Open Source</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Aptos Foundation Backed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer className="border-t" />
      </div>
    </div>
  );
};

export default ImprovedLandingPage;
