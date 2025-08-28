import { NextRequest, NextResponse } from "next/server";

import { MetricsDatabase } from "@/lib/database/client";
import { apiLogger } from "@/lib/utils/core/logger";

// GET: Get database summary and statistics
export async function GET(request: NextRequest) {
  try {
    const summary = await MetricsDatabase.getMetricsSummary();

    // Get latest snapshots (simplified)
    const latestSnapshots = await MetricsDatabase.getLatestSnapshots();

    // Get sample of recent snapshots for preview
    const recentSnapshots = await MetricsDatabase.getSnapshots({
      limit: 10,
    });

    return NextResponse.json({
      success: true,
      summary,
      latestSnapshotsCount: latestSnapshots.length,
      recentSnapshots: recentSnapshots.slice(0, 5).map((snapshot) => ({
        category: snapshot.category,
        metric: snapshot.metric,
        date: snapshot.snapshot_date,
        value: snapshot.formatted_value,
        source: snapshot.source,
      })),
      databaseHealth: {
        connected: true,
        lastUpdate: summary.lastSnapshotDate,
        status: summary.totalSnapshots > 0 ? "healthy" : "no_data",
        totalDatesTracked: summary.datesWithSnapshots,
      },
    });
  } catch (error) {
    apiLogger.error("Error fetching metrics summary:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch summary",
        details: error instanceof Error ? error.message : "Unknown error",
        databaseHealth: {
          connected: false,
          status: "error",
        },
      },
      { status: 500 },
    );
  }
}
