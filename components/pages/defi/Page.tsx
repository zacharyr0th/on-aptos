"use client";

import { GeistMono } from "geist/font/mono";
import { Search } from "lucide-react";
import React, { useState } from "react";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { Input } from "@/components/ui/input";
import { useProtocolMetrics } from "@/hooks/useProtocolMetrics";
import { usePageTranslation } from "@/hooks/useTranslation";

import {
  StatsSection,
  FilterControls,
  SearchBar,
  ProtocolDisplay,
  LoadingState,
} from "./components";
import { defiProtocols, categories } from "./data";

export default function DefiPage(): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    string | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [refreshing] = useState(false);
  const { t } = usePageTranslation("defi");

  // Enrich protocols with real-time metrics
  const { enrichedProtocols, loading: metricsLoading } =
    useProtocolMetrics(defiProtocols);

  // Filter protocols based on category, subcategory, and search
  const filteredProtocols = enrichedProtocols.filter((protocol) => {
    const matchesCategory =
      selectedCategory === "All" || protocol.category === selectedCategory;

    // Handle comma-separated subcategories
    const matchesSubcategory =
      !selectedSubcategory ||
      protocol.subcategory
        .split(", ")
        .map((sub) => sub.trim())
        .includes(selectedSubcategory);

    const matchesSearch =
      searchQuery === "" ||
      protocol.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (() => {
        const desc = t(protocol.description, "");
        return desc
          ? desc.toLowerCase().includes(searchQuery.toLowerCase())
          : false;
      })() ||
      protocol.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  const handleClearFilters = () => {
    setSelectedCategory("All");
    setSelectedSubcategory(undefined);
    setSearchQuery("");
    setMobileSearchOpen(false);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Clear subcategory when changing category
    if (category === "All") {
      setSelectedSubcategory(undefined);
    }
  };

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen flex flex-col relative ${GeistMono.className}`}
      >
        {/* Background gradient removed - using global textured background */}

        <div className="fixed top-0 left-0 right-0 h-1 z-30">
          {refreshing && <div className="h-full bg-muted animate-pulse"></div>}
        </div>

        <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex-1 relative">
          {metricsLoading ? (
            <LoadingState />
          ) : (
            <>
              <ErrorBoundary
                fallback={
                  <div className="p-4 rounded-md bg-destructive/10 text-destructive mb-6">
                    <h3 className="font-semibold mb-2">
                      {t(
                        "defi:errors.failed_load_metrics",
                        "Failed to load DeFi metrics",
                      )}
                    </h3>
                    <p className="text-sm">
                      {t(
                        "defi:errors.please_refresh",
                        "Please refresh the page to try again",
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

              {/* Desktop: Filter Controls and Search on same line */}
              <div className="hidden md:block">
                <div className="flex items-start justify-between gap-4">
                  {/* Left side: Filters */}
                  <div className="flex-1">
                    <FilterControls
                      categories={categories}
                      selectedCategory={selectedCategory}
                      selectedSubcategory={selectedSubcategory}
                      onCategoryChange={handleCategoryChange}
                      onSubcategoryChange={setSelectedSubcategory}
                    />
                  </div>

                  {/* Right side: Search and count */}
                  <div className="flex-shrink-0">
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t(
                          "defi:search.placeholder",
                          "Search protocols...",
                        )}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 text-sm bg-card shadow-sm border-border/50 focus:border-primary/50 w-64"
                        aria-label={t(
                          "defi:search.aria_label",
                          "Search protocols",
                        )}
                      />
                    </div>

                    {/* Results count under search when filters active */}
                    {(selectedCategory !== "All" || selectedSubcategory) && (
                      <div className="mt-3 text-right">
                        <p className="text-sm text-muted-foreground">
                          Showing {filteredProtocols.length} of{" "}
                          {defiProtocols.length} protocols
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile: Keep existing layout */}
              <div className="block md:hidden">
                <FilterControls
                  categories={categories}
                  selectedCategory={selectedCategory}
                  selectedSubcategory={selectedSubcategory}
                  onCategoryChange={handleCategoryChange}
                  onSubcategoryChange={setSelectedSubcategory}
                />
              </div>

              <div
                className={`space-y-4 ${selectedCategory === "All" && !selectedSubcategory ? "mt-6 md:mt-8" : "mt-4"}`}
              >
                {/* Mobile search bar */}
                <div className="block md:hidden">
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
                </div>

                <ProtocolDisplay
                  filteredProtocols={filteredProtocols as typeof defiProtocols}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
