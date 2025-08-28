import { NextRequest, NextResponse } from "next/server";

import {
  MetricsDatabase,
  CreateMetricSnapshotInput,
} from "@/lib/database/client";
import { apiLogger } from "@/lib/utils/core/logger";

// POST: Store metric snapshots
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { snapshots, initializeSchema = false } = body;

    // Initialize schema if requested (first-time setup)
    if (initializeSchema) {
      await MetricsDatabase.initializeSchema();
      apiLogger.info("Database schema initialized");
    }

    // Validate the snapshots data
    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      return NextResponse.json(
        { error: "Invalid snapshots data. Expected non-empty array." },
        { status: 400 },
      );
    }

    // Validate each snapshot
    const validatedSnapshots: CreateMetricSnapshotInput[] = snapshots.map(
      (snapshot, index) => {
        if (
          !snapshot.category ||
          !snapshot.metric ||
          !snapshot.source ||
          !snapshot.formatted_value
        ) {
          throw new Error(
            `Snapshot at index ${index} is missing required fields`,
          );
        }

        if (
          !snapshot.period_type ||
          !["daily", "weekly", "monthly", "quarterly"].includes(
            snapshot.period_type,
          )
        ) {
          throw new Error(`Snapshot at index ${index} has invalid period_type`);
        }

        if (!snapshot.snapshot_date || !snapshot.period_label) {
          throw new Error(
            `Snapshot at index ${index} is missing date information`,
          );
        }

        return {
          category: snapshot.category,
          metric: snapshot.metric,
          source: snapshot.source,
          snapshot_date: snapshot.snapshot_date,
          period_type: snapshot.period_type,
          period_label: snapshot.period_label,
          value_numeric: snapshot.value_numeric,
          value_text: snapshot.value_text,
          formatted_value: snapshot.formatted_value,
          metadata: snapshot.metadata || {},
        };
      },
    );

    // Bulk insert snapshots
    await MetricsDatabase.bulkInsertSnapshots(validatedSnapshots);

    apiLogger.info(
      `Successfully stored ${validatedSnapshots.length} metric snapshots`,
    );

    return NextResponse.json({
      success: true,
      message: `Stored ${validatedSnapshots.length} snapshots`,
      count: validatedSnapshots.length,
    });
  } catch (error) {
    apiLogger.error("Error storing metric snapshots:", error);

    return NextResponse.json(
      {
        error: "Failed to store snapshots",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET: Get stored snapshots (for testing/debugging)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const metric = searchParams.get("metric");
    const periodType = searchParams.get("periodType") as
      | "daily"
      | "weekly"
      | "monthly"
      | "quarterly";
    const limit = parseInt(searchParams.get("limit") || "12");

    if (!category || !metric || !periodType) {
      return NextResponse.json(
        { error: "Missing required parameters: category, metric, periodType" },
        { status: 400 },
      );
    }

    const snapshots = await MetricsDatabase.getMetricSnapshots(
      category,
      metric,
      limit,
    );

    return NextResponse.json({
      success: true,
      snapshots: snapshots.reverse(), // Return in chronological order
      count: snapshots.length,
    });
  } catch (error) {
    apiLogger.error("Error fetching metric snapshots:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch snapshots",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
