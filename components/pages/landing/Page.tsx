'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { GeistMono } from 'geist/font/mono';
import { HeroSection, IconSections, SocialLinks, PortfolioDistributionChart } from './index';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpRight,
  Search,
  DollarSign,
  BarChart3,
  TrendingUp,
  ChevronUp,
} from 'lucide-react';
import Image from 'next/image';
import { SimulatedChart } from './SimulatedChart';
import { cn } from '@/lib/utils';

const HomepageDesign = () => {
  const [mounted, setMounted] = useState(false);
  useTheme();

  useEffect(() => {
    setMounted(true);
    // Add smooth scrolling behavior to html element
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className={cn('min-h-screen relative', GeistMono.className)}>
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section - First Viewport */}
        <section className="relative overflow-hidden min-h-screen flex items-center">
          <HeroSection />
        </section>

        {/* Value Proposition Section - Second Viewport */}
        <section
          id="features"
          className="py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden min-h-screen flex items-center"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
              {/* Left: Features */}
              <div className="space-y-6 sm:space-y-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Track Your Entire Aptos Portfolio
                </h2>
                <div className="space-y-4 sm:space-y-6">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start gap-4 cursor-help">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Search className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            Real-Time Balance Detection
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Automatically discover your positions across all major
                            DeFi protocols including Thala, Amnis, PancakeSwap,
                            and more.
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Scans your wallet across all major protocols - no manual
                        input needed
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start gap-4 cursor-help">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <DollarSign className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            Live USD Values
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            See your total portfolio value with real-time price
                            updates and 24h performance tracking.
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Updates every few seconds with current market prices
                        from CoinMarketCap
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start gap-4 cursor-help">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">
                            DeFi Position Analytics
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Monitor lending positions, LP tokens, staking
                            rewards, and yield farming across all protocols.
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Detailed breakdowns of your earnings, rewards, and
                        position health
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Right: Simulated Portfolio Chart */}
              <div className="bg-card border rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base sm:text-lg font-semibold">
                      Portfolio Performance
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold">
                      $106,725.43
                    </span>
                    <span className="text-sm text-green-500 flex items-center">
                      <ArrowUpRight className="w-3 h-3" />
                      +6.7%
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <SimulatedChart />
                  <div className="mt-6 space-y-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href="/portfolio"
                          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors w-full"
                          aria-label="Go to portfolio page to start tracking your assets"
                        >
                          Start Tracking →
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Connect your wallet to see your real portfolio</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Portfolio Distribution Chart */}
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-center mb-4">
                        Portfolio Distribution
                      </h4>
                      <PortfolioDistributionChart />
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                          <span className="text-xs text-muted-foreground">Tokens</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                          <span className="text-xs text-muted-foreground">DeFi</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
                          <span className="text-xs text-muted-foreground">NFTs</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">
                          Real-time
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Price & Balance Updates
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">
                          6
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Analytics Dashboards
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* View Dashboards CTA */}
            <div className="mt-12 text-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="#icon-sections"
                    className="inline-flex items-center justify-center rounded-md bg-primary/10 hover:bg-primary/20 px-6 py-3 text-sm font-medium text-primary shadow-sm transition-all duration-200 hover:shadow-md"
                    aria-label="View analytics dashboards"
                  >
                    View Dashboards
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Explore our 6 specialized analytics dashboards</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </section>

        {/* Secondary Features - Third Viewport */}
        <section
          id="icon-sections"
          className="py-8 sm:py-12 overflow-hidden min-h-screen flex items-center"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <IconSections />

            {/* Back to Top Button */}
            <div className="mt-12 text-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={scrollToTop}
                    className="inline-flex items-center justify-center rounded-md bg-muted hover:bg-muted/80 px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground shadow-sm transition-all duration-200 hover:shadow-md"
                    aria-label="Back to top"
                  >
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Back to Top
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scroll back to the top of the page</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex flex-col items-center gap-4 sm:gap-6">
              <SocialLinks />
              {/* Powered by Aptos */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Powered by</span>
                <a
                  href="https://aptosfoundation.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                >
                  Aptos
                  <Image
                    src="/icons/apt.png"
                    alt="Aptos"
                    width={20}
                    height={20}
                    className="inline-block dark:invert"
                  />
                </a>
              </div>
              {/* Built by */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Built by</span>
                <a
                  href="https://x.com/zacharyr0th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:text-primary/80 transition-colors font-mono"
                >
                  zacharyr0th
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomepageDesign;
