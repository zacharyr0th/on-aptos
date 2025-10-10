import { GeistMono } from "geist/font/mono";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { MetricsCharts } from "@/components/metrics/MetricsCharts";
import { QueryExplorer } from "@/components/metrics/QueryExplorer";
import { MetricsCategory } from "@/components/metrics/MetricsCategory";
import { RefreshButton } from "@/components/metrics/RefreshButton";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getMetricsData } from "@/lib/services/metrics";
import { categorizeMetrics } from "@/lib/utils/metrics";

// Enable ISR with 60 second revalidation
export const revalidate = 60;

export default async function MetricsPage() {
  const apiData = await getMetricsData();
  const metrics = apiData.metrics || {};
  const categorizedMetrics = categorizeMetrics(apiData.tableData || []);

  return (
    <ErrorBoundary>
      <div
        className={GeistMono.className}
        style={{
          transform: 'rotate(90deg)',
          transformOrigin: 'center',
          width: '100vh',
          height: '100vw',
          position: 'fixed',
          top: '50%',
          left: '50%',
          marginTop: '-50vw',
          marginLeft: '-50vh'
        }}
      >
        {/* Mobile/Tablet Layout (< lg) */}
        <div className="block lg:hidden">
            {/* Hero Section with Title */}
            <section className="pt-8 sm:pt-10 md:pt-12 pb-4 sm:pb-6">
              <div className="mb-4 sm:mb-6">
                <div className="flex items-start justify-between gap-4 mb-2 sm:mb-3">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1E1870] via-[#F4603E] to-[#1E1870] bg-clip-text text-transparent leading-tight">
                    Aptos Network Metrics
                  </h1>
                  <div className="flex-shrink-0 pt-1">
                    <RefreshButton />
                  </div>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                  Live blockchain analytics powered by Dune.
                </p>
              </div>
            </section>

            {/* Main Content Area */}
            <div className="pb-12 sm:pb-16">
              {/* Activity Chart */}
              <div className="mb-8 sm:mb-10">
                <MetricsCharts activityPatterns={metrics.activityPatterns || []} />
              </div>

              <div className="space-y-8 sm:space-y-10">
                {Object.entries(categorizedMetrics)
                  .map(([category, categoryMetrics]) => (
                    <MetricsCategory
                      key={category}
                      category={category}
                      metrics={categoryMetrics}
                      gridCols="grid-cols-1 sm:grid-cols-2"
                      compact
                    />
                  ))}
                <div className="mt-8 sm:mt-10">
                  <QueryExplorer />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout (>= lg) - Rotated display */}
          <div className="hidden lg:flex lg:flex-col h-full">
            {/* Custom Dune-styled Header */}
            <header className="flex-shrink-0 border-b-2 border-[#F4603E]/20 bg-gradient-to-r from-[#FEEFEC] via-white to-[#F2F2FF] dark:from-[#1E1870]/10 dark:via-card dark:to-[#F4603E]/10 px-8 py-4">
              <div className="flex items-center justify-between">
                {/* Left: Logos */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white">
                    <img src="/Dune-IconLarge.png" alt="Dune Analytics" className="w-full h-full object-cover scale-150" />
                  </div>
                  <div className="w-px h-10 bg-[#F4603E]/30"></div>
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white">
                    <img src="/icons/apt.png" alt="Aptos" className="w-full h-full object-contain scale-110" />
                  </div>
                </div>

                {/* Center: Title */}
                <div className="flex-1 text-center mx-8">
                  <h1 className="text-3xl xl:text-4xl font-bold bg-gradient-to-r from-[#1E1870] via-[#F4603E] to-[#1E1870] bg-clip-text text-transparent leading-tight">
                    Aptos Network Metrics
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    Live blockchain analytics powered by Dune
                  </p>
                </div>

                {/* Right: Buttons */}
                <div className="flex items-center gap-3">
                  <RefreshButton />
                  <ThemeToggle />
                </div>
              </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-auto px-8 py-5 space-y-4">
              {/* Activity Chart */}
              <div className="w-full">
                <MetricsCharts activityPatterns={metrics.activityPatterns || []} />
              </div>

              {/* All Metrics Categories - Stacked vertically */}
              <div className="space-y-4">
                {Object.entries(categorizedMetrics)
                  .map(([category, categoryMetrics]) => (
                    <MetricsCategory
                      key={category}
                      category={category}
                      metrics={categoryMetrics}
                      gridCols="grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                      compact
                    />
                  ))}
              </div>

              {/* Query Explorer */}
              <div className="w-full pb-8">
                <QueryExplorer />
              </div>
            </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
