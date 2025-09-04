"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface MetricsLoadingSkeletonProps {
  rows?: number;
  columns?: number;
}

export const MetricsLoadingSkeleton: React.FC<MetricsLoadingSkeletonProps> = ({
  rows = 10,
  columns = 5,
}) => {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          {[...Array(columns)].map((_, j) => (
            <Skeleton 
              key={j} 
              className={`h-4 ${
                j === 0 ? 'w-32' :
                j === 1 ? 'w-48' :
                j === 2 ? 'w-24' :
                j === 3 ? 'w-20' :
                'w-16'
              }`} 
            />
          ))}
        </div>
      ))}
    </div>
  );
};