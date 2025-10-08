"use client";

import { Menu, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { navigationSections } from "@/components/landing/data/landing-data";
import { STABLECOIN_SYMBOLS } from "@/lib/constants/tokens/stablecoins";
import type { TokenData } from "@/lib/types/tokens";

// Dynamic imports for code splitting - hero loads immediately, rest are lazy
const HeroSection = dynamic(() => import("@/components/landing/sections/HeroSection"));
const WhyAptosSection = dynamic(() => import("@/components/landing/sections/WhyAptosSection"), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
});
const GettingStartedSection = dynamic(
  () => import("@/components/landing/sections/GettingStartedSection"),
  {
    loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
  }
);
const DefiSection = dynamic(() => import("@/components/landing/sections/DefiSection"), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
});
const TokensSection = dynamic(() => import("@/components/landing/sections/TokensSection"), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
});
const YieldSection = dynamic(() => import("@/components/landing/sections/YieldSection"), {
  loading: () => <div className="h-64 animate-pulse bg-muted/20" />,
});
const DevelopersSection = dynamic(() => import("@/components/landing/sections/DevelopersSection"), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
});
const CommunitySection = dynamic(() => import("@/components/landing/sections/CommunitySection"), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
});
const CTASection = dynamic(() => import("@/components/landing/sections/CTASection"), {
  loading: () => <div className="h-64 animate-pulse bg-muted/20" />,
});

export function OnboardingPage() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [assetValues, setAssetValues] = useState<{
    stables: { value: number; label: string; description: string };
    rwas: { value: number; label: string; description: string };
    btc: { value: number; label: string; description: string };
    tokens: { value: number; label: string; description: string };
  } | null>(null);
  const [isLoadingValues, setIsLoadingValues] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTokenCount, setTotalTokenCount] = useState<number>(0);

  useEffect(() => {
    fetchInitialData();

    // Ensure page loads at the top (overview section)
    window.scrollTo(0, 0);

    // Clear any hash in the URL
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Throttle scroll handler for better performance
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        const sections = navigationSections.map((section) => document.getElementById(section.id));
        const scrollPosition = window.scrollY + 200;

        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i];
          if (section && section.offsetTop <= scrollPosition) {
            const newSection = navigationSections[i].id;
            setActiveSection(newSection);

            // Update URL hash without triggering scroll
            const newHash = `#${newSection}`;
            if (window.location.hash !== newHash) {
              window.history.replaceState(null, "", newHash);
            }
            break;
          }
        }

        rafId = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingTokens(true);
      setIsLoadingValues(true);
      setError(null);

      // Fetch both APIs in parallel for faster loading
      const [tokensResponse, assetValuesResponse] = await Promise.all([
        fetch("/api/markets/tokens?limit=100&all=true"),
        fetch("/api/defi/asset-values"),
      ]);

      // Process tokens
      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json();
        if (tokensData.tokens) {
          const processedTokens = tokensData.tokens.map((token: any) => ({
            name: token.name,
            symbol: token.symbol,
            price: token.price ? parseFloat(token.price) : 0,
            marketCap: token.marketCap || 0,
            fdv: token.fullyDilutedValuation || token.marketCap || 0,
            supply: token.supply || 0,
            priceChange: token.priceChange24H || 0,
            category: token.category || "other",
            bridge: token.bridge || null,
            logoUrl: token.logoUrl,
            panoraSymbol: token.panoraSymbol,
            panoraTags: token.panoraTags || [],
            panoraUI: token.panoraUI,
            websiteUrl: token.websiteUrl,
            faAddress: token.faAddress,
            tokenAddress: token.tokenAddress,
            coinGeckoId: token.coinGeckoId,
            rank: token.rank || 0,
            isVerified: token.isVerified || false,
          }));
          setTokens(processedTokens);
          setTotalTokenCount(tokensData.totalTokens || 0);
        }
      } else {
        console.error("Failed to fetch tokens:", tokensResponse.status, tokensResponse.statusText);
      }

      // Process asset values
      if (assetValuesResponse.ok) {
        const assetData = await assetValuesResponse.json();
        setAssetValues(assetData);
      } else {
        console.error(
          "Failed to fetch asset values:",
          assetValuesResponse.status,
          assetValuesResponse.statusText
        );
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoadingTokens(false);
      setIsLoadingValues(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const offset = 80;
      const sectionPosition = section.offsetTop - offset;
      window.scrollTo({ top: sectionPosition, behavior: "smooth" });
      setIsNavOpen(false);
    }
  };

  const stableTokens = useMemo(() => {
    return tokens.filter((token) => token.symbol !== "APT");
  }, [tokens]);

  const displayMetrics = useMemo(() => {
    if (!stableTokens.length)
      return {
        marketCap: 0,
        tokenCount: 0,
        averageMarketCap: 0,
        medianMarketCap: 0,
      };

    const tokenMarketCaps = stableTokens
      .map((token) => token.fdv || token.marketCap || 0)
      .filter((cap) => cap > 0);

    const totalMarketCap = tokenMarketCaps.reduce((sum, cap) => sum + cap, 0);
    const tokenCount = stableTokens.length;
    const averageMarketCap = tokenCount > 0 ? totalMarketCap / tokenCount : 0;

    const sortedCaps = [...tokenMarketCaps].sort((a, b) => a - b);
    const mid = Math.floor(sortedCaps.length / 2);
    const medianMarketCap = sortedCaps.length
      ? sortedCaps.length % 2 === 0
        ? (sortedCaps[mid - 1] + sortedCaps[mid]) / 2
        : sortedCaps[mid]
      : 0;

    return {
      marketCap: totalMarketCap,
      tokenCount,
      averageMarketCap,
      medianMarketCap,
    };
  }, [stableTokens]);

  return (
    <div className="min-h-screen">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-16">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2 bg-background/30 backdrop-blur-lg rounded-full px-2 py-2 border border-border/30">
              {navigationSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`px-4 py-2 text-sm rounded-full transition-all duration-200 ${
                    activeSection === section.id
                      ? "bg-background/80 text-foreground font-medium shadow-sm"
                      : "text-foreground/70 hover:text-foreground hover:bg-background/40"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="lg:hidden p-2 text-foreground hover:bg-muted rounded-md"
            >
              {isNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isNavOpen && (
            <div className="lg:hidden py-4 border-t border-border">
              <div className="grid grid-cols-2 gap-2">
                {navigationSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors text-left ${
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="relative">
        <HeroSection assetValues={assetValues} isLoadingValues={isLoadingValues} />
        <WhyAptosSection />
        <GettingStartedSection />
        <DefiSection />
        <TokensSection
          tokens={tokens}
          loadingTokens={loadingTokens}
          error={error}
          displayMetrics={displayMetrics}
          totalTokenCount={totalTokenCount}
          stableTokens={stableTokens}
          fetchInitialData={fetchInitialData}
        />
        <YieldSection />
        <DevelopersSection />
        <CommunitySection />
        <CTASection />
      </div>
    </div>
  );
}
