'use client';

import HomepageDesign from '@/components/pages/landing/Page';
import { Header } from '@/components/layout/Header';

export default function Home() {
  return (
    <div className="min-h-screen w-full relative">
      {/* Header - will not render on homepage */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-800/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Header />
        </div>
      </div>

      {/* Full-screen homepage design */}
      <HomepageDesign />
    </div>
  );
}
