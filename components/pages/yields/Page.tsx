"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { YieldTable } from "@/app/portfolio/_components/tables/YieldTable";

function YieldsContent() {
  const searchParams = useSearchParams();
  const walletAddress = searchParams.get("wallet") || undefined;

  return (
    <div className="w-full px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8">
      <YieldTable walletAddress={walletAddress} />
    </div>
  );
}

export default function YieldsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-64 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 dark:bg-gray-800 rounded"
                ></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <YieldsContent />
    </Suspense>
  );
}
