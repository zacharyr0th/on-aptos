'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { FloatingOrbs, HeroSection, IconSections, SocialLinks } from './index';
import { useDataPrefetch } from '@/hooks/useDataPrefetching';

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
      <div className="w-full min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="w-3 h-3 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="w-3 h-3 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black relative overflow-hidden">
      {/* Background floating orbs */}
      <FloatingOrbs />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero section centered in viewport */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="w-full max-w-7xl mx-auto">
            <div className="text-center space-y-12 sm:space-y-14 lg:space-y-16">
              {/* Hero section */}
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: '200ms', animationFillMode: 'both' }}
              >
                <HeroSection />
              </div>

              {/* Icon sections */}
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: '400ms', animationFillMode: 'both' }}
              >
                <IconSections />
              </div>
            </div>
          </div>
        </div>

        {/* Footer section - sits at bottom */}
        <footer className="relative z-10">
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: '600ms', animationFillMode: 'both' }}
          >
            <SocialLinks />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomepageDesign;
