'use client';

import React, { useState } from 'react';
import { GeistMono } from 'geist/font/mono';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import {
  StatsSection,
  FilterControls,
  SearchBar,
  ProtocolDisplay,
} from './components';
import { defiProtocols, categories } from './data';
import { usePageTranslation } from '@/hooks/useTranslation';

export default function DefiPage(): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    string | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = usePageTranslation('defi');

  // Filter protocols based on category, subcategory, and search
  const filteredProtocols = defiProtocols.filter(protocol => {
    const matchesCategory =
      selectedCategory === 'All' || protocol.category === selectedCategory;

    // Handle comma-separated subcategories
    const matchesSubcategory =
      !selectedSubcategory ||
      protocol.subcategory
        .split(', ')
        .map(sub => sub.trim())
        .includes(selectedSubcategory);

    const matchesSearch =
      searchQuery === '' ||
      protocol.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (() => {
        const desc = t(protocol.description, '');
        return desc
          ? desc.toLowerCase().includes(searchQuery.toLowerCase())
          : false;
      })() ||
      protocol.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedSubcategory(undefined);
    setSearchQuery('');
    setMobileSearchOpen(false);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Clear subcategory when changing category
    if (category === 'All') {
      setSelectedSubcategory(undefined);
    }
  };

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen flex flex-col relative ${GeistMono.className}`}
      >
        {/* Background gradient - fixed to viewport */}
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

        <div className="fixed top-0 left-0 right-0 h-1 z-30">
          {refreshing && <div className="h-full bg-muted animate-pulse"></div>}
        </div>

        <div className="container-layout pt-6 relative">
          <Header />
        </div>

        <main className="container-layout py-4 md:py-3 flex-1 relative px-4 md:px-0">
          <ErrorBoundary
            fallback={
              <div className="p-4 rounded-md bg-destructive/10 text-destructive mb-6">
                <h3 className="font-semibold mb-2">
                  {t(
                    'defi:errors.failed_load_metrics',
                    'Failed to load DeFi metrics'
                  )}
                </h3>
                <p className="text-sm">
                  {t(
                    'defi:errors.please_refresh',
                    'Please refresh the page to try again'
                  )}
                </p>
              </div>
            }
          >
            <StatsSection
              protocolCount={defiProtocols.length}
              filteredCount={filteredProtocols.length}
              totalCount={defiProtocols.length}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
            />
          </ErrorBoundary>

          <FilterControls
            categories={categories}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onCategoryChange={handleCategoryChange}
            onSubcategoryChange={setSelectedSubcategory}
          />

          <div className="mt-6 md:mt-8 space-y-4">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filteredCount={filteredProtocols.length}
              totalCount={defiProtocols.length}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              mobileSearchOpen={mobileSearchOpen}
              onMobileSearchToggle={() =>
                setMobileSearchOpen(!mobileSearchOpen)
              }
            />

            <ProtocolDisplay
              filteredProtocols={filteredProtocols}
              onClearFilters={handleClearFilters}
            />
          </div>
        </main>

        <Footer className="relative" />
      </div>
    </ErrorBoundary>
  );
}
