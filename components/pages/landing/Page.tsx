'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { HeroSection, IconSections, SocialLinks } from './index';
import { useDataPrefetch } from '@/hooks/useDataPrefetching';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const HomepageDesign = () => {
  const [mounted, setMounted] = useState(false);
  useTheme();

  // Prefetch data for likely next pages
  useDataPrefetch();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="min-h-screen bg-background">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-grid-pattern opacity-5 dark:opacity-10" />
      
      {/* Main Content */}
      <div className="relative">
        {/* Hero Section */}
        <section className="relative">
          <div className="container mx-auto px-4 py-16 sm:py-20 lg:py-24">
            <div className="flex flex-col items-center text-center space-y-8">
              <HeroSection />
            </div>
          </div>
          
          {/* Separator */}
          <div className="container mx-auto px-4">
            <Separator className="opacity-20" />
          </div>
        </section>

        {/* Value Proposition Section */}
        <section id="features" className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Features */}
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-foreground">
                  Track Your Entire Aptos Portfolio
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary text-sm font-bold">🔍</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Real-Time Balance Detection</h3>
                      <p className="text-muted-foreground text-sm">
                        Automatically discover your positions across 25+ DeFi protocols including Thala, Amnis, PancakeSwap, and more.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary text-sm font-bold">💰</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Live USD Values</h3>
                      <p className="text-muted-foreground text-sm">
                        See your total portfolio value with real-time price updates and 24h performance tracking.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary text-sm font-bold">📊</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">DeFi Position Analytics</h3>
                      <p className="text-muted-foreground text-sm">
                        Monitor lending positions, LP tokens, staking rewards, and yield farming across all protocols.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: CTA */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 text-center">
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">Get Started in Seconds</h3>
                    <p className="text-muted-foreground mb-6">
                      Connect your wallet to see your complete Aptos portfolio instantly
                    </p>
                  </div>
                  <div className="space-y-4">
                    <a 
                      href="/portfolio" 
                      className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors w-full"
                    >
                      Track Your Portfolio →
                    </a>
                    <p className="text-xs text-muted-foreground">
                      No signup required • Works with all Aptos wallets
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Stats */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-foreground">25+</div>
                <div className="text-sm text-muted-foreground mt-1">DeFi Protocols Tracked</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">Real-time</div>
                <div className="text-sm text-muted-foreground mt-1">Price & Balance Updates</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">Free</div>
                <div className="text-sm text-muted-foreground mt-1">Always & Forever</div>
              </div>
            </div>
          </div>
        </section>

        {/* Secondary Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Everything You Need to Track Aptos DeFi
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Beyond portfolio tracking, explore comprehensive analytics across the entire Aptos ecosystem
              </p>
            </div>
            <IconSections />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50">
          <div className="container mx-auto px-4 py-8">
            <SocialLinks />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomepageDesign;