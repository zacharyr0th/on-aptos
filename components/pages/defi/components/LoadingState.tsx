"use client";

import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="space-y-6">
      {/* Stats Section Skeleton */}
      <div className="mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative flex flex-col bg-card border rounded-xl p-4 md:p-5 shadow-sm min-h-[100px] md:min-h-[120px]"
            >
              <div className="mb-3">
                <Skeleton className="h-4 md:h-5 w-32" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <Skeleton className="h-6 md:h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="absolute bottom-2 right-2 h-5 w-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Filter Controls Skeleton */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-24 flex-shrink-0" />
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20 flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="mt-6 md:mt-8 space-y-4">
        <div className="relative">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Protocol Table Skeleton */}
      <div className="overflow-x-auto mt-6">
        {/* Mobile Cards Skeleton */}
        <div className="block sm:hidden space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border rounded-lg bg-card p-4">
              <div className="flex items-start gap-3 mb-3">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-24 mb-2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex items-start gap-2">
                  <Skeleton className="h-3 w-20" />
                  <div className="flex gap-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Skeleton */}
        <div className="hidden sm:block">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">
                  <Skeleton className="h-4 w-16" />
                </th>
                <th className="text-left py-3 px-2">
                  <Skeleton className="h-4 w-16" />
                </th>
                <th className="text-left py-3 px-2">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="text-left py-3 px-2">
                  <Skeleton className="h-4 w-12" />
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <tr key={i} className="border-b">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
