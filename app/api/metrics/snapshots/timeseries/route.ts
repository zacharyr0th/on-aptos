import { NextRequest, NextResponse } from "next/server";

import { MetricsDatabase } from "@/lib/database/client";
import { apiLogger } from "@/lib/utils/core/logger";

// GET: Get snapshots data for metrics (simplified)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters - simplified
    const categories = searchParams
      .get("categories")
      ?.split(",")
      .filter(Boolean);
    const metrics = searchParams.get("metrics")?.split(",").filter(Boolean);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const limit = parseInt(searchParams.get("limit") || "30");

    // Get snapshots data using simplified method
    const snapshots = await MetricsDatabase.getSnapshots({
      categories,
      metrics,
      startDate,
      endDate,
      limit,
    });

    // Group snapshots by metric for easier consumption
    const groupedData: Record<string, any> = {};

    snapshots.forEach((snapshot) => {
      const key = `${snapshot.category}|${snapshot.metric}`;

      if (!groupedData[key]) {
        groupedData[key] = {
          category: snapshot.category,
          metric: snapshot.metric,
          source: snapshot.source,
          snapshots: [],
        };
      }

      groupedData[key].snapshots.push({
        date: snapshot.snapshot_date,
        value_numeric: snapshot.value_numeric,
        value_text: snapshot.value_text,
        formatted_value: snapshot.formatted_value,
        metadata: snapshot.metadata,
      });
    });

    // Sort snapshots chronologically for each metric
    Object.values(groupedData).forEach((metricData: any) => {
      metricData.snapshots.sort((a: any, b: any) =>
        a.date.localeCompare(b.date),
      );
    });

    const result = Object.values(groupedData);

    return NextResponse.json({
      success: true,
      metrics: result,
      totalMetrics: result.length,
      totalSnapshots: snapshots.length,
      filters: {
        categories,
        metrics,
        startDate,
        endDate,
        limit,
      },
    });
  } catch (error) {
    apiLogger.error("Error fetching time-series data:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch time-series data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST: Get latest snapshots (simplified)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      categories,
      metrics,
      startDate,
      endDate,
      limit = 50,
      includeCalculations = false,
    } = body;

    // Get snapshots data using simplified method
    const snapshots = await MetricsDatabase.getSnapshots({
      categories,
      metrics,
      startDate,
      endDate,
      limit,
    });

    // Group and process data
    const groupedData: Record<string, any> = {};

    snapshots.forEach((snapshot) => {
      const key = `${snapshot.category}|${snapshot.metric}`;

      if (!groupedData[key]) {
        groupedData[key] = {
          category: snapshot.category,
          metric: snapshot.metric,
          source: snapshot.source,
          snapshots: [],
        };
      }

      groupedData[key].snapshots.push({
        date: snapshot.snapshot_date,
        value_numeric: snapshot.value_numeric,
        value_text: snapshot.value_text,
        formatted_value: snapshot.formatted_value,
        metadata: snapshot.metadata,
      });
    });

    // Sort snapshots and calculate day-over-day changes if requested
    Object.values(groupedData).forEach((metricData: any) => {
      metricData.snapshots.sort((a: any, b: any) =>
        a.date.localeCompare(b.date),
      );

      if (includeCalculations && metricData.snapshots.length > 1) {
        metricData.snapshots.forEach((snapshot: any, index: number) => {
          if (
            index > 0 &&
            snapshot.value_numeric &&
            metricData.snapshots[index - 1].value_numeric
          ) {
            const current = snapshot.value_numeric;
            const previous = metricData.snapshots[index - 1].value_numeric;
            const change = ((current - previous) / previous) * 100;

            snapshot.day_change = {
              absolute: current - previous,
              percentage: change,
              formatted: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
            };
          }
        });
      }
    });

    const result = Object.values(groupedData);

    return NextResponse.json({
      success: true,
      metrics: result,
      totalMetrics: result.length,
      totalSnapshots: snapshots.length,
      includeCalculations,
      filters: {
        categories,
        metrics,
        startDate,
        endDate,
        limit,
      },
    });
  } catch (error) {
    apiLogger.error("Error fetching snapshots via POST:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch snapshots data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
