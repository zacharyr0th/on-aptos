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
import { useMetricsData } from "@/hooks/useMetricsData";
import AdvancedBlockchainAnalytics from "./AdvancedBlockchainAnalytics";
import ComprehensiveAnalytics from "./ComprehensiveAnalytics";
import FocusedDashboards from "./FocusedDashboards";
import IntelligentAnalysis from "./IntelligentAnalysis";
import SimpleDataDisplay from "./SimpleDataDisplay";

export default function MetricsPage(): React.ReactElement {
  const { tableData, metrics, loading: metricsLoading, error } = useMetricsData();

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex flex-col relative ${GeistMono.className}`}>
        <main className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex-1 relative">
          {/* Single Table with All Metrics */}
          <div className="bg-card rounded-lg p-6">
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
                  {metricsLoading && (!tableData || tableData.length === 0)
                    ? Array.from({ length: 20 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-muted animate-pulse rounded w-48"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-muted animate-pulse rounded w-20 ml-auto"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    : tableData?.map((row, index) => (
                        <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
                              {row.category}
                            </span>
                          </TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {row.value}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">Error loading data: {error}</p>
              </div>
            )}

            {!metricsLoading && (!tableData || tableData.length === 0) && !error && (
              <div className="text-center py-8 text-muted-foreground">
                No metrics data available at the moment.
              </div>
            )}
          </div>

          {/* FOCUSED DASHBOARDS */}
          {metrics && (
            <div className="mt-8">
              <FocusedDashboards metrics={metrics} />
            </div>
          )}

          {/* ADVANCED BLOCKCHAIN ANALYTICS */}
          {metrics && (
            <div className="mt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Advanced Blockchain Analytics</h2>
                <p className="text-muted-foreground">
                  Institutional-grade MEV detection, whale tracking, and network analysis
                </p>
              </div>
              <AdvancedBlockchainAnalytics metrics={metrics} />
            </div>
          )}

          {/* INTELLIGENT ANALYSIS ENGINE */}
          {metrics && (
            <div className="mt-8">
              <IntelligentAnalysis metrics={metrics} />
            </div>
          )}

          {/* COMPREHENSIVE DEEP ANALYTICS - All 102 Metrics */}
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">🚀 Comprehensive Deep Analytics</h2>
              <p className="text-muted-foreground">
                102 metrics across 16 categories with real-time blockchain intelligence
              </p>
            </div>
            <ComprehensiveAnalytics />
          </div>

          {/* Protocol Registry & Query Information */}
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">📋 Protocol Registry & Queries</h2>
              <p className="text-muted-foreground">
                36 tracked protocols with Spellbook-optimized query examples
              </p>
            </div>
            <SimpleDataDisplay />
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
