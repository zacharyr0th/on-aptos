import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { LoadingSkeleton } from "../shared/LoadingSkeletons";

export function PortfolioLoadingSkeleton() {
  return (
    <div className="flex flex-col relative">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

      <main className="w-full px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 flex-1 relative">
        <div className="mb-6">
          <div className="flex justify-center items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-background/80 backdrop-blur-md border border-border/40 rounded-lg shadow-sm">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        <div className="hidden lg:flex gap-6">
          <div className="w-80 xl:w-96 space-y-6">
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-40" />
              </div>
              <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-md" />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <LoadingSkeleton variant="asset-table" rows={8} />
            </div>
          </div>
        </div>

        <div className="lg:hidden space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-48 rounded-lg" />
          </div>

          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16 rounded-md" />
            ))}
          </div>

          <LoadingSkeleton variant="asset-table" rows={6} />
        </div>
      </main>
    </div>
  );
}
