"use client";

import Autoplay from "embla-carousel-autoplay";
import { GeistMono } from "geist/font/mono";
import {
  Search,
  DollarSign,
  BarChart3,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Users,
  Star,
  Github,
  CheckCircle2,
  Bitcoin,
  Building2,
  Coins,
  ArrowUpRight,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { defiProtocols } from "@/components/pages/defi/data/protocols";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useTranslation } from "@/hooks/useTranslation";
import { DEVELOPER_CONFIG } from "@/lib/config/app";
import { cn } from "@/lib/utils";

import { IconSections } from "./IconSections";

const HomepageDesign = () => {
  const [mounted, setMounted] = useState(false);
  const [showAllProtocols, setShowAllProtocols] = useState(false);
  const [githubStats, setGithubStats] = useState({
    stars: 0,
    forks: 0,
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const [currentShowcase, setCurrentShowcase] = useState(0);
  useTheme();
  const { t } = useTranslation("common");

  // GitHub stats removed - API endpoint no longer exists
  // TODO: Implement GitHub stats fetching if needed

  useEffect(() => {
    setMounted(true);
    // Add smooth scrolling behavior to html element
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);
    onSelect();

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  // Auto-rotate showcase images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShowcase((prev) => (prev + 1) % 4);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-primary/70 rounded-full animate-pulse [animation-delay:150ms]" />
            <div className="w-2 h-2 bg-primary/40 rounded-full animate-pulse [animation-delay:300ms]" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Background gradient - same as portfolio, stables, and BTC pages */}
      {/* Background gradient removed - using global textured background */}

      <div className={cn("min-h-screen relative", GeistMono.className)}>
        {/* Main Content */}
        <div className="relative z-10">
          {/* Announcement Banner */}
          <div className="w-full bg-muted/50 border-b">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <div className="flex items-center justify-center py-2.5 sm:py-3 gap-2 text-sm">
                <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                  New
                </Badge>
                <span className="text-muted-foreground">
                  Introducing DeFi Analytics Dashboard
                </span>
                <Link
                  href="/defi"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  Explore now
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Hero Section - Centered with clean design */}
          <section className="relative overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative">
              <div className="mx-auto max-w-4xl">
                <div className="text-center">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                    Track Your Complete
                    <br />
                    Aptos Portfolio
                  </h1>
                  <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                    The modern portfolio tracking platform for DeFi positions,
                    NFT collections, and token analytics.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <Link href="/portfolio">
                      <Button
                        size="lg"
                        className="h-12 px-8 text-base font-medium min-w-[160px]"
                      >
                        Start Tracking Now
                      </Button>
                    </Link>
                    <Link href="#demo">
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-12 px-8 text-base font-medium min-w-[160px]"
                      >
                        View Analytics
                      </Button>
                    </Link>
                  </div>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <span className="text-orange-600 dark:text-orange-400">
                          🔗
                        </span>
                      </div>
                      <span className="font-medium">DeFi Positions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400">
                          📊
                        </span>
                      </div>
                      <span className="font-medium">Portfolio Analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                        <span className="text-purple-600 dark:text-purple-400">
                          🎨
                        </span>
                      </div>
                      <span className="font-medium">NFT Collections</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Dashboard Preview Carousel */}
          <section
            id="demo"
            className="relative pb-16 sm:pb-20 md:pb-24 lg:pb-32"
          >
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <div className="mx-auto max-w-6xl">
                <Carousel
                  className="w-full"
                  opts={{
                    loop: true,
                    align: "start",
                  }}
                  plugins={[
                    Autoplay({
                      delay: 5000,
                      stopOnInteraction: true,
                      stopOnMouseEnter: true,
                    }),
                  ]}
                  setApi={setCarouselApi}
                >
                  <CarouselContent>
                    {/* Portfolio Dashboard */}
                    <CarouselItem>
                      <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card">
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-background/95 backdrop-blur-sm text-foreground border shadow-sm">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Portfolio Dashboard
                          </Badge>
                        </div>
                        <Image
                          src="/readme/landing.png"
                          alt="Portfolio Dashboard"
                          width={1920}
                          height={1080}
                          className="w-full h-auto"
                          priority
                        />
                      </div>
                    </CarouselItem>

                    {/* DeFi Dashboard */}
                    <CarouselItem>
                      <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card">
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-background/95 backdrop-blur-sm text-foreground border shadow-sm">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            DeFi on Aptos
                          </Badge>
                        </div>
                        <Image
                          src="/readme/defi-dashboard.png"
                          alt="DeFi Dashboard"
                          width={1920}
                          height={1080}
                          className="w-full h-auto"
                        />
                      </div>
                    </CarouselItem>

                    {/* Stablecoins Dashboard */}
                    <CarouselItem>
                      <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card">
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-background/95 backdrop-blur-sm text-foreground border shadow-sm">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Stablecoins on Aptos
                          </Badge>
                        </div>
                        <Image
                          src="/readme/stables.png"
                          alt="Stablecoins Dashboard"
                          width={1920}
                          height={1080}
                          className="w-full h-auto"
                        />
                      </div>
                    </CarouselItem>

                    {/* Bitcoin Dashboard */}
                    <CarouselItem>
                      <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card">
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-background/95 backdrop-blur-sm text-foreground border shadow-sm">
                            <Bitcoin className="h-3 w-3 mr-1" />
                            Bitcoin on Aptos
                          </Badge>
                        </div>
                        <Image
                          src="/readme/btc.png"
                          alt="Bitcoin Dashboard"
                          width={1920}
                          height={1080}
                          className="w-full h-auto"
                        />
                      </div>
                    </CarouselItem>

                    {/* RWAs Dashboard */}
                    <CarouselItem>
                      <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card">
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-background/95 backdrop-blur-sm text-foreground border shadow-sm">
                            <Building2 className="h-3 w-3 mr-1" />
                            RWAs on Aptos
                          </Badge>
                        </div>
                        <Image
                          src="/readme/rwa.png"
                          alt="RWAs Dashboard"
                          width={1920}
                          height={1080}
                          className="w-full h-auto"
                        />
                      </div>
                    </CarouselItem>

                    {/* Tokens Dashboard */}
                    <CarouselItem>
                      <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card">
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-background/95 backdrop-blur-sm text-foreground border shadow-sm">
                            <Coins className="h-3 w-3 mr-1" />
                            Tokens on Aptos
                          </Badge>
                        </div>
                        <Image
                          src="/readme/tokens.png"
                          alt="Tokens Dashboard"
                          width={1920}
                          height={1080}
                          className="w-full h-auto"
                        />
                      </div>
                    </CarouselItem>

                    {/* NFTs View */}
                    <CarouselItem>
                      <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card">
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-background/95 backdrop-blur-sm text-foreground border shadow-sm">
                            <span className="mr-1">🎨</span>
                            NFT Collections
                          </Badge>
                        </div>
                        <Image
                          src="/readme/nfts.png"
                          alt="NFT Collections"
                          width={1920}
                          height={1080}
                          className="w-full h-auto"
                        />
                      </div>
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>

                {/* Carousel Indicators */}
                <div className="flex justify-center mt-6 gap-2">
                  <div className="flex gap-1.5">
                    {[
                      "Portfolio",
                      "DeFi",
                      "Stables",
                      "Bitcoin",
                      "RWAs",
                      "Tokens",
                      "NFTs",
                    ].map((item, index) => (
                      <button
                        key={item}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          currentSlide === index
                            ? "w-8 bg-primary"
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                        )}
                        onClick={() => carouselApi?.scrollTo(index)}
                        aria-label={`Go to ${item} slide`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Protocol Logos & Value Proposition - Second Viewport */}
          <section
            id="features"
            className="py-16 sm:py-20 md:py-24 lg:py-32 overflow-hidden lg:min-h-[100svh] flex flex-col justify-center"
          >
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <div className="mx-auto max-w-6xl">
                {/* Protocol Logos Grid */}
                <div className="mb-16 sm:mb-20 lg:mb-24">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-12 md:gap-16 items-center justify-items-center opacity-60">
                    {[
                      { name: "Thala", logo: "/icons/protocols/thala.avif" },
                      { name: "Amnis", logo: "/icons/protocols/amnis.avif" },
                      {
                        name: "PancakeSwap",
                        logo: "/icons/protocols/pancake.webp",
                      },
                      {
                        name: "Liquidswap",
                        logo: "/icons/protocols/liquidswap.webp",
                      },
                      { name: "Aries", logo: "/icons/protocols/aries.avif" },
                      {
                        name: "Cellana",
                        logo: "/icons/protocols/cellana.webp",
                      },
                      { name: "Panora", logo: "/icons/protocols/panora.webp" },
                      { name: "Sushi", logo: "/icons/protocols/sushi.webp" },
                      {
                        name: "VibrantX",
                        logo: "/icons/protocols/vibrantx.webp",
                      },
                      {
                        name: "Echelon",
                        logo: "/icons/protocols/echelon.avif",
                      },
                    ].map((protocol) => (
                      <div
                        key={protocol.name}
                        className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all"
                      >
                        <Image
                          src={protocol.logo}
                          alt={protocol.name}
                          width={32}
                          height={32}
                          className="rounded-lg"
                        />
                        <span className="font-medium text-sm hidden md:inline">
                          {protocol.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Content */}
                <div className="text-center max-w-4xl mx-auto">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                    Portfolio tracking isn't just about balances.
                    <br />
                    It's about insights.
                  </h2>

                  <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
                    On Aptos is the modern portfolio platform that unifies{" "}
                    <span className="inline-flex items-center gap-1 text-foreground font-medium">
                      DeFi positions
                      <span className="text-orange-500">🔗</span>
                    </span>{" "}
                    <span className="inline-flex items-center gap-1 text-foreground font-medium">
                      real-time analytics
                      <span className="text-green-500">📊</span>
                    </span>{" "}
                    and{" "}
                    <span className="inline-flex items-center gap-1 text-foreground font-medium">
                      NFT collections
                      <span className="text-purple-500">🎨</span>
                    </span>{" "}
                    – all in one place.
                  </p>

                  <p className="text-lg sm:text-xl text-muted-foreground mb-12">
                    It's fast. It's reliable. It's beautiful.
                    <br />
                    And it scales with you.
                  </p>

                  <p className="text-base sm:text-lg text-muted-foreground/80">
                    Because you deserve more than
                    <br />
                    vanity metrics. You deserve clarity.
                  </p>
                </div>

                {/* View Dashboards CTA */}
                <div className="mt-12 sm:mt-16 text-center">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="font-medium text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      document
                        .getElementById("icon-sections")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    aria-label="View analytics dashboards"
                  >
                    {t("portfolio.landing.cta_dashboards", "View Dashboards")}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Feature Showcase - Third Viewport */}
          <section
            id="icon-sections"
            className="py-16 sm:py-20 md:py-24 lg:py-32 overflow-hidden bg-muted/30"
          >
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <div className="mx-auto max-w-6xl">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                  {/* Left: Feature Details */}
                  <div className="order-2 lg:order-1">
                    <Badge className="mb-4" variant="secondary">
                      <Coins className="h-3 w-3 mr-1" />
                      Complete Analytics Suite
                    </Badge>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                      It starts with your portfolio
                    </h2>

                    <p className="text-lg text-muted-foreground mb-8">
                      Track every asset with powerful features: DeFi position
                      auto-discovery, real-time price updates, NFT collections,
                      and more.
                    </p>

                    <Link href="/portfolio">
                      <Button size="lg" variant="outline" className="mb-12">
                        Explore Portfolio
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        {
                          icon: <Search className="h-5 w-5" />,
                          title: "Auto-Discovery",
                          description: "Find all DeFi positions instantly",
                        },
                        {
                          icon: <TrendingUp className="h-5 w-5" />,
                          title: "Yield Tracking",
                          description: "Monitor APY and rewards",
                        },
                        {
                          icon: <BarChart3 className="h-5 w-5" />,
                          title: "Performance",
                          description: "Track P&L over time",
                        },
                        {
                          icon: <DollarSign className="h-5 w-5" />,
                          title: "Real-time Prices",
                          description: "Live market data updates",
                        },
                      ].map((feature, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              {feature.icon}
                            </div>
                          </div>
                          <h3 className="font-semibold text-sm">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Rotating Images */}
                  <div className="order-1 lg:order-2">
                    <div className="relative">
                      {/* Main showcase image */}
                      <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card aspect-video">
                        {[
                          {
                            src: "/readme/landing.png",
                            alt: "Portfolio Overview",
                          },
                          { src: "/readme/defi.png", alt: "DeFi Positions" },
                          { src: "/readme/nfts.png", alt: "NFT Collections" },
                          { src: "/readme/tokens.png", alt: "Token Analytics" },
                        ].map((img, index) => (
                          <div
                            key={index}
                            className={cn(
                              "transition-opacity duration-1000",
                              currentShowcase === index
                                ? "opacity-100"
                                : "opacity-0 absolute inset-0",
                            )}
                          >
                            <Image
                              src={img.src}
                              alt={img.alt}
                              width={1920}
                              height={1080}
                              className="w-full h-full object-cover"
                              priority={index === 0}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Showcase indicators */}
                      <div className="flex justify-center mt-6 gap-2">
                        {[0, 1, 2, 3].map((index) => (
                          <button
                            key={index}
                            className={cn(
                              "w-2 h-2 rounded-full transition-all duration-300",
                              currentShowcase === index
                                ? "w-8 bg-primary"
                                : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                            )}
                            onClick={() => setCurrentShowcase(index)}
                            aria-label={`View showcase ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Features Section */}
                <div className="mt-20 pt-20 border-t">
                  <div className="text-center mb-12">
                    <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                      Comprehensive Market Analytics
                    </h3>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                      Beyond portfolio tracking - dive deep into ecosystem-wide
                      analytics
                    </p>
                  </div>

                  <IconSections />
                </div>
              </div>
            </div>
          </section>

          {/* Protocol Integration */}
          <section id="protocols" className="py-12 sm:py-16 lg:py-20 relative">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <div className="text-center mb-10 sm:mb-12 lg:mb-16">
                <Badge
                  variant="outline"
                  className="mb-3 sm:mb-4 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1.5 sm:mr-2 text-green-500" />
                  23+ Protocols
                </Badge>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
                  Complete Protocol Coverage
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
                  Automatically scan and track positions across every major
                  Aptos DeFi protocol
                </p>
              </div>

              {/* Featured protocols */}
              <div className="max-w-5xl mx-auto px-2 sm:px-4">
                <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                  {(showAllProtocols
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
                        { name: "vibrantx", ext: "webp" },
                        { name: "trufin", ext: "webp" },
                        { name: "echelon", ext: "avif" },
                        { name: "kana", ext: "webp" },
                        { name: "thetis", ext: "webp" },
                        { name: "anqa", ext: "webp" },
                        { name: "hyperion", ext: "webp" },
                        { name: "tapp", ext: "webp" },
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
                        { name: "vibrantx", ext: "webp" },
                        { name: "trufin", ext: "webp" },
                        { name: "echelon", ext: "avif" },
                      ]
                  ).map((protocol) => (
                    <div
                      key={protocol.name}
                      className="text-center p-2 sm:p-3 md:p-4 hover:scale-105 transition-all duration-200 group"
                    >
                      <div className="relative">
                        <Image
                          src={`/icons/protocols/${protocol.name}.${protocol.ext}`}
                          alt={protocol.name}
                          width={48}
                          height={48}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mx-auto mb-1.5 sm:mb-2 md:mb-3 group-hover:shadow-lg transition-shadow"
                        />
                      </div>
                      <div className="text-[10px] sm:text-xs font-medium capitalize text-muted-foreground group-hover:text-foreground transition-colors">
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
                        + 6 more
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
                        View All DeFi Protocols
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 lg:mt-12 text-center">
                <h4 className="font-semibold mb-4 sm:mb-6 text-sm sm:text-base">
                  Need another protocol?
                </h4>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                  <Button variant="outline" asChild>
                    <Link
                      href={DEVELOPER_CONFIG.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      DM @{DEVELOPER_CONFIG.twitterHandle} on X
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link
                      href={`${DEVELOPER_CONFIG.github}/issues/new?title=Protocol%20Request:%20&body=Please%20add%20support%20for%20[PROTOCOL_NAME]`}
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

          {/* FAQ */}
          <section className="py-10 sm:py-12 md:py-16 relative">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <div className="text-center mb-8 sm:mb-10 lg:mb-12">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                  FAQ
                </h2>
              </div>

              <div className="max-w-2xl mx-auto px-2 sm:px-4">
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
                      This doesn't do your taxes, but it gives you the ability
                      to export all your data in CSV format compatible with tax
                      software.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>
                      Can I contribute to this?
                    </AccordionTrigger>
                    <AccordionContent>
                      Yes - The entire project is open source under MIT license.
                      Fork it, customize it, or contribute back to the main{" "}
                      <a
                        href={DEVELOPER_CONFIG.github}
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
          <section className="py-16 sm:py-20 lg:py-24 border-t relative">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <div className="max-w-4xl mx-auto text-center">
                <Badge
                  variant="outline"
                  className="mb-4 sm:mb-6 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
                >
                  <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1.5 sm:mr-2" />
                  Join 1000+ Active Users
                </Badge>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 leading-[1.15] px-2">
                  Start Tracking Your
                  <span className="text-primary block mt-1">
                    {" "}
                    Complete Portfolio
                  </span>
                </h2>

                <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-4 sm:px-6">
                  Connect your wallet and see all your DeFi positions, staking
                  rewards, and NFTs in seconds. No registration, no fees, no
                  limits.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center mb-8 sm:mb-10 lg:mb-12 px-4 sm:px-0">
                  <Link href="/portfolio" className="w-full sm:w-auto">
                    <WalletConnectButton
                      size="lg"
                      className="h-11 sm:h-12 px-4 sm:px-6 text-sm sm:text-base w-full sm:min-w-[260px] md:min-w-[280px]"
                    />
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto sm:min-w-[260px] md:min-w-[280px] h-11 sm:h-12 text-sm sm:text-base font-semibold"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <PlayCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    View Demo Above
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-muted-foreground px-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    <span>100% Free Forever</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    <span>Read-Only Access</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    <span>Open Source</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    <span>Aptos Foundation</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HomepageDesign;
