"use client";

import { GeistMono } from "geist/font/mono";
import {
  Search,
  DollarSign,
  BarChart3,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { DEVELOPER_CONFIG } from "@/lib/config/app";
import { cn } from "@/lib/utils";

import { HeroSection } from "./HeroSection";
import { IconSections } from "./IconSections";
import { PortfolioDistributionChart } from "./PortfolioDistributionChart";
import { SocialLinks } from "./SocialLinks";

const HomepageDesign = () => {
  const [mounted, setMounted] = useState(false);
  useTheme();
  const { t } = useTranslation("common");

  useEffect(() => {
    setMounted(true);
    // Add smooth scrolling behavior to html element
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
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
    <div className={cn("min-h-screen relative", GeistMono.className)}>
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section - First Viewport */}
        <section className="relative overflow-hidden min-h-[100svh] flex items-center px-8 sm:px-12 md:px-20 lg:px-32">
          <HeroSection />
        </section>

        {/* Value Proposition Section - Second Viewport */}
        <section
          id="features"
          className="py-12 sm:py-8 md:py-12 lg:py-16 overflow-hidden min-h-[100svh] flex items-center"
        >
          <div className="container mx-auto px-6 sm:px-12 md:px-20 lg:px-32 xl:px-48 max-w-6xl">
            {/* Mobile Title - Above everything */}
            <h2 className="lg:hidden text-xl sm:text-2xl font-bold text-foreground text-center mb-6">
              {t("portfolio.features.title", "Portfolio Tracking")}
            </h2>
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-6 lg:gap-8 items-center">
              {/* Left: Features */}
              <div className="space-y-3 sm:space-y-4 lg:space-y-6 order-2 lg:order-1">
                {/* Desktop Title - In original position */}
                <h2 className="hidden lg:block text-3xl font-bold text-foreground text-left">
                  {t("portfolio.features.title", "Portfolio Tracking")}
                </h2>
                <div className="space-y-4 sm:space-y-5 lg:space-y-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3 cursor-help">
                        <div className="hidden lg:flex w-10 h-10 bg-primary/10 rounded-xl items-center justify-center flex-shrink-0">
                          <Search className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-center lg:text-left">
                          <h3 className="font-semibold mb-1 text-base lg:text-sm">
                            {t(
                              "portfolio.features.auto_discovery",
                              "Auto-Discovery",
                            )}
                          </h3>
                          <p className="text-muted-foreground text-sm lg:text-xs leading-relaxed">
                            {t(
                              "portfolio.features.auto_discovery_desc",
                              "Find all positions instantly.",
                            )}
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {t(
                          "portfolio.features.auto_discovery_tooltip",
                          "Covers Thala, Amnis, PancakeSwap, and 20+ more protocols",
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3 cursor-help">
                        <div className="hidden lg:flex w-10 h-10 bg-primary/10 rounded-xl items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-center lg:text-left">
                          <h3 className="font-semibold mb-1 text-base lg:text-sm">
                            {t(
                              "portfolio.features.live_pricing",
                              "Live Pricing",
                            )}
                          </h3>
                          <p className="text-muted-foreground text-sm lg:text-xs leading-relaxed">
                            {t(
                              "portfolio.features.live_pricing_desc",
                              "Real-time USD values.",
                            )}
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {t(
                          "portfolio.features.live_pricing_tooltip",
                          "Updates every few seconds with accurate market data",
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3 cursor-help">
                        <div className="hidden lg:flex w-10 h-10 bg-primary/10 rounded-xl items-center justify-center flex-shrink-0">
                          <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-center lg:text-left">
                          <h3 className="font-semibold mb-1 text-base lg:text-sm">
                            {t("portfolio.features.analytics", "Analytics")}
                          </h3>
                          <p className="text-muted-foreground text-sm lg:text-xs leading-relaxed">
                            {t(
                              "portfolio.features.analytics_desc",
                              "Track yields and rewards.",
                            )}
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {t(
                          "portfolio.features.analytics_tooltip",
                          "Comprehensive breakdowns of earnings and risks",
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Right: Circular Portfolio Chart */}
              <div className="order-1 lg:order-2 mb-6 sm:mb-8 lg:mb-0 flex items-center justify-center">
                <div className="w-56 h-56 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
                  <PortfolioDistributionChart />
                </div>
              </div>
            </div>

            {/* View Dashboards CTA */}
            <div className="mt-6 sm:mt-8 text-center">
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
        </section>

        {/* Secondary Features - Third Viewport */}
        <section
          id="icon-sections"
          className="py-4 sm:py-6 md:py-8 overflow-hidden"
        >
          <div className="container mx-auto px-8 sm:px-12 md:px-20 lg:px-32 xl:px-48 max-w-6xl">
            <IconSections />

            {/* Back to Top Button */}
            <div className="mt-4 sm:mt-6 text-center">
              <Button
                variant="ghost"
                size="lg"
                onClick={scrollToTop}
                className="font-medium text-muted-foreground hover:text-foreground"
                aria-label="Back to top"
              >
                <ChevronUp className="mr-2 h-4 w-4" />
                {t("actions.back_to_top", "Back to Top")}
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50">
          <div className="container mx-auto px-8 sm:px-12 md:px-20 lg:px-32 xl:px-48 max-w-6xl py-3 sm:py-4 lg:py-6">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <SocialLinks />
              {/* Powered by Aptos */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t("portfolio.landing.powered_by", "Powered by")}</span>
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
                <span>{t("portfolio.landing.built_by", "Built by")}</span>
                <a
                  href={DEVELOPER_CONFIG.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:text-primary/80 transition-colors font-mono"
                >
                  {DEVELOPER_CONFIG.twitterHandle}
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
