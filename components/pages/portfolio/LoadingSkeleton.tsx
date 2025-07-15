'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const LoadingSkeleton = () => {
  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

      <div className="container-layout pt-6 relative z-10">
        <Header />
        {/* Portfolio Header Skeleton */}
        <div className="flex items-center bg-card border rounded-lg py-3 px-4 mb-6 mt-8">
          <div className="flex-grow">
            <Skeleton className="h-5 w-32 mb-1" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative z-10">
        <div className="container-layout">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              {/* View Selector Buttons */}
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>

              {/* Filter Button */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-40" />
              </div>

              {/* Assets/NFTs/DeFi Table Skeleton */}
              <div className="bg-card border rounded-lg p-4">
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <Skeleton className="h-10 w-full" />

              {/* Performance Chart */}
              <div className="bg-card border rounded-lg p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-[300px] w-full" />
              </div>

              {/* Gas Usage Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>

              {/* Asset Allocation Chart */}
              <div className="bg-card border rounded-lg p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer className="relative z-10" />
    </div>
  );
};
