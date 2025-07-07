'use client';

import React, { useState } from 'react';
import { GeistMono } from 'geist/font/mono';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RootErrorBoundary } from '@/components/errors/RootErrorBoundary';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import {
  StatsSection,
  FilterControls,
  SearchBar,
  ProtocolDisplay,
} from './components';
import { defiProtocols, categories } from './data';
import { usePageTranslation } from '@/hooks/useTranslation';
import { useDataPrefetch } from '@/hooks/useDataPrefetching';
// Simplified for better compatibility

export default function DefiPage(): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    string | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { t, getText } = usePageTranslation('defi');

  // Prefetch related data for this page
  useDataPrefetch('defi');

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
    <RootErrorBoundary>
      <div
        className={`min-h-screen flex flex-col bg-background dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiMyMjIiIHN0cm9rZS13aWR0aD0iMC41Ij48L3BhdGg+Cjwvc3ZnPg==')] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiNlZWUiIHN0cm9rZS13aWR0aD0iMC41Ij48L3BhdGg+Cjwvc3ZnPg==')] ${GeistMono.className}`}
      >
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
          <Header />
        </div>

        <main className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 flex-1">
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
              viewMode={viewMode}
              onCategoryChange={handleCategoryChange}
              onSubcategoryChange={setSelectedSubcategory}
              onViewModeChange={setViewMode}
            />

            <div className="mt-4 md:mt-8 space-y-4">
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
                viewMode={viewMode}
                filteredProtocols={filteredProtocols}
                onClearFilters={handleClearFilters}
              />
            </div>
        </main>

        <Footer />
      </div>
      </div>
    </RootErrorBoundary>
  );
}
