"use client";

import { GeistMono } from "geist/font/mono";
import type React from "react";
import { useState } from "react";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMetricsData } from "@/lib/hooks/useMetricsData";
import KeyMetricCards from "./KeyMetricCards";

export default function MetricsPage(): React.ReactElement {
  const { tableData, metrics, loading: metricsLoading, error } = useMetricsData();

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex flex-col relative ${GeistMono.className}`}>
        <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex-1 relative">
          {/* Key Metrics Cards */}
          <KeyMetricCards />

          {/* Single Clean Metrics Table */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Network Metrics</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricsLoading ? (
                    Array.from({ length: 15 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted animate-pulse rounded w-48"></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="h-4 bg-muted animate-pulse rounded w-20 ml-auto"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-destructive py-8">
                        Error loading metrics: {error}
                      </TableCell>
                    </TableRow>
                  ) : tableData && tableData.length > 0 ? (
                    tableData.map((item, index) => (
                      <TableRow
                        key={index}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          if (item.queryUrl) {
                            window.open(item.queryUrl, "_blank", "noopener,noreferrer");
                          }
                        }}
                      >
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
                            {item.category}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {item.value}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No metrics data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
