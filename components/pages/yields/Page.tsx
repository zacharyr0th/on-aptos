"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { YieldTable } from "@/components/pages/portfolio/YieldTable";

function YieldsContent() {
  const searchParams = useSearchParams();
  const walletAddress = searchParams.get("wallet") || undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex-1 relative">
        {/* Yield Table */}
        <YieldTable walletAddress={walletAddress} />
      </main>

      {/* Footer */}
    </div>
  );
}

export default function YieldsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex-1 relative">
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
          </main>
        </div>
      }
    >
      <YieldsContent />
    </Suspense>
  );
}
