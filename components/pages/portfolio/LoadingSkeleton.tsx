'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase } from 'lucide-react';

export const LoadingSkeleton = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center bg-card border rounded-lg py-3 sm:py-4 px-4 sm:px-6 gap-3 sm:gap-0">
        <div className="flex-grow">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <h1 className="text-xl sm:text-2xl font-bold">
              My Portfolio
            </h1>
          </div>
          <Skeleton className="h-3 sm:h-4 w-32 sm:w-48" />
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1">
          <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-6 sm:h-8 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 sm:h-16 w-full" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="space-y-4 sm:space-y-6">
            <Skeleton className="h-10 sm:h-12 w-full" />
            <Skeleton className="h-64 sm:h-80 lg:h-96 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};