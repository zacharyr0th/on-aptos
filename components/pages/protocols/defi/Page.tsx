"use client";

import { GeistMono } from "geist/font/mono";
import { Search } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { Input } from "@/components/ui/input";
import { useProtocolMetrics } from "@/lib/hooks/useProtocolMetrics";
import { usePageTranslation } from "@/lib/hooks/useTranslation";
import { FilterControls, LoadingState, ProtocolDisplay, StatsSection } from "./components";
import { categories } from "./data";
import { defiProtocols } from "./data/protocols";

export default function DefiPage(): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [refreshing] = useState(false);
  const { t } = usePageTranslation("defi");

  // Skip initial fetch - we'll load metrics on demand
  const { enrichedProtocols, loading: metricsLoading } = useProtocolMetrics(defiProtocols, {
    skipFetch: true,
  });

  // Calculate protocol counts per category
  const protocolCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((category) => {
      if (category !== "All") {
        counts[category] = enrichedProtocols.filter((p) => p.category === category).length;
      }
    });
    return counts;
  }, [enrichedProtocols]);

  // Calculate subcategory counts per category
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    categories.forEach((category) => {
      if (category !== "All") {
        counts[category] = {};
        // Get all unique subcategories for this category
        const protocolsInCategory = enrichedProtocols.filter((p) => p.category === category);
        protocolsInCategory.forEach((protocol) => {
          // Handle comma-separated subcategories
          const subcategories = protocol.subcategory.split(", ").map((s) => s.trim());
          subcategories.forEach((subcategory) => {
            if (!counts[category][subcategory]) {
              counts[category][subcategory] = 0;
            }
            counts[category][subcategory]++;
          });
        });
      }
    });
    return counts;
  }, [enrichedProtocols]);

  // Filter protocols based on category, subcategory, and search
  const filteredProtocols = enrichedProtocols.filter((protocol) => {
    const matchesCategory = selectedCategory === "All" || protocol.category === selectedCategory;

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
        return desc ? desc.toLowerCase().includes(searchQuery.toLowerCase()) : false;
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
      <div className={`min-h-screen flex flex-col relative ${GeistMono.className}`}>
        {/* Background gradient removed - using global textured background */}

        <div className="fixed top-0 left-0 right-0 h-1 z-30">
          {refreshing && <div className="h-full bg-muted animate-pulse"></div>}
        </div>

        <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex-1 relative">
          <>
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
                    protocolCounts={protocolCounts}
                    subcategoryCounts={subcategoryCounts}
                  />
                </div>

                {/* Right side: Search and count */}
                <div className="flex-shrink-0">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("defi:search.placeholder", "Search protocols...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10 text-sm bg-card shadow-sm border-border/50 focus:border-primary/50 w-64"
                      aria-label={t("defi:search.aria_label", "Search protocols")}
                    />
                  </div>

                  {/* Results count under search when filters active */}
                  {(selectedCategory !== "All" || selectedSubcategory) && (
                    <div className="mt-3 text-right">
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "defi:search.showing_protocols",
                          "Showing {{count}} of {{total}} protocols",
                          {
                            count: filteredProtocols.length,
                            total: defiProtocols.length,
                          }
                        )}
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
                protocolCounts={protocolCounts}
                subcategoryCounts={subcategoryCounts}
              />
            </div>

            <div
              className={`space-y-4 ${selectedCategory === "All" && !selectedSubcategory ? "mt-6 md:mt-8" : "mt-4"}`}
            >
              {/* Mobile search input */}
              <div className="block md:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("defi:search.placeholder", "Search protocols...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-12 text-base bg-card shadow-sm border-border/50 focus:border-primary/50 w-full rounded-lg"
                    aria-label={t("defi:search.aria_label", "Search protocols")}
                  />
                </div>

                {/* Mobile results count */}
                {(selectedCategory !== "All" || selectedSubcategory || searchQuery) && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "defi:search.showing_protocols",
                        "Showing {{count}} of {{total}} protocols",
                        {
                          count: filteredProtocols.length,
                          total: defiProtocols.length,
                        }
                      )}
                    </p>
                  </div>
                )}
              </div>

              <ProtocolDisplay
                filteredProtocols={filteredProtocols as typeof defiProtocols}
                onClearFilters={handleClearFilters}
              />
            </div>
          </>
        </main>
      </div>
    </ErrorBoundary>
  );
}
