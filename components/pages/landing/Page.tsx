'use client';

import { GeistMono } from 'geist/font/mono';
import {
  ArrowUpRight,
  Search,
  DollarSign,
  BarChart3,
  TrendingUp,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { SimulatedChart } from './SimulatedChart';

import {
  HeroSection,
  IconSections,
  SocialLinks,
  PortfolioDistributionChart,
} from './index';

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
        <section className="relative overflow-hidden min-h-[100svh] flex items-center px-4 sm:px-6">
          <HeroSection />
        </section>

        {/* Value Proposition Section - Second Viewport */}
        <section
          id="features"
          className="py-6 sm:py-8 md:py-12 lg:py-16 overflow-hidden min-h-[100svh] flex items-center"
        >
          <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 xl:px-32">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center">
              {/* Left: Features */}
              <div className="space-y-3 sm:space-y-4 lg:space-y-6 order-1">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground text-center lg:text-left">
                  Complete Aptos Portfolio Visibility
                </h2>
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start gap-3 cursor-help">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Search className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1 text-sm sm:text-base">
                            Auto-Discovery
                          </h3>
                          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                            Instantly finds all your positions across every
                            major protocol. Zero setup required.
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Covers Thala, Amnis, PancakeSwap, and 20+ more protocols
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start gap-3 cursor-help">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1 text-sm sm:text-base">
                            Real-Time Pricing
                          </h3>
                          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                            Live USD values with performance tracking. See
                            exactly how your portfolio is performing.
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Updates every few seconds with accurate market data</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-start gap-3 cursor-help">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1 text-sm sm:text-base">
                            Smart Analytics
                          </h3>
                          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                            Deep insights into yields, rewards, and position
                            health across all your DeFi activities.
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Comprehensive breakdowns of earnings and risks</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Right: Simulated Portfolio Chart */}
              <div className="bg-card border rounded-xl overflow-hidden order-2 mb-4 lg:mb-0">
                <div className="p-3 sm:p-4 lg:p-6 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold">
                      Portfolio
                    </h3>
                    <div className="flex items-center justify-center">
                      <Image
                        src="/icons/apt.png"
                        alt="APT"
                        width={24}
                        height={24}
                        className="dark:invert sm:w-8 sm:h-8"
                      />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold">
                      $106,725.43
                    </span>
                    <span className="text-xs sm:text-sm text-green-500 flex items-center">
                      <ArrowUpRight className="w-3 h-3" />
                      +6.7%
                    </span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 lg:p-6">
                  {/* Charts side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 h-full">
                    {/* Performance Chart */}
                    <div className="w-full h-full">
                      <SimulatedChart />
                    </div>

                    {/* Portfolio Distribution Chart */}
                    <div className="flex flex-col">
                      <div className="flex-1 flex items-center justify-center">
                        <PortfolioDistributionChart />
                      </div>
                      <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-3 sm:mt-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                            style={{ backgroundColor: 'hsl(200, 70%, 85%)' }}
                          />
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            Tokens
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                            style={{ backgroundColor: 'hsl(280, 60%, 85%)' }}
                          />
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            DeFi
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                            style={{ backgroundColor: 'hsl(50, 80%, 85%)' }}
                          />
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            NFTs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href="/portfolio"
                          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:shadow-xl active:scale-95 w-full touch-manipulation"
                          aria-label="Go to portfolio page to start tracking your assets"
                        >
                          Start Tracking →
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Connect your wallet to see your real portfolio</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>

            {/* View Dashboards CTA */}
            <div className="mt-6 sm:mt-8 text-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="#icon-sections"
                    className="inline-flex items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-primary shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation"
                    aria-label="View analytics dashboards"
                  >
                    View Dashboards
                    <ChevronDown className="ml-2 h-4 w-4" />
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
          className="py-6 sm:py-8 md:py-12 overflow-hidden min-h-[100svh] flex items-center"
        >
          <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 xl:px-32">
            <IconSections />

            {/* Back to Top Button */}
            <div className="mt-6 sm:mt-8 text-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={scrollToTop}
                    className="inline-flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-muted-foreground hover:text-foreground shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation"
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
          <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24 xl:px-32 py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
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
