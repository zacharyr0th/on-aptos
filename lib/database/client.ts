import { sql } from "@vercel/postgres";
import { logger } from "@/lib/utils/core/logger";

// Database client using Vercel Postgres (works with Neon)
export { sql };

// Simplified types for database schema
export interface MetricSnapshot {
  id: number;
  category: string;
  metric: string;
  source: string;
  snapshot_date: string; // ISO date string
  value_numeric?: number;
  value_text?: string;
  formatted_value: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateMetricSnapshotInput {
  category: string;
  metric: string;
  source: string;
  snapshot_date?: string; // Optional, defaults to current date
  value_numeric?: number;
  value_text?: string;
  formatted_value: string;
  metadata?: Record<string, any>;
}

// Database operations
export class MetricsDatabase {
  // Initialize a fresh simple metrics table
  static async initializeSchema(): Promise<void> {
    try {
      // Create a new simple table with just date column
      await sql`
        CREATE TABLE IF NOT EXISTS simple_metrics (
          id SERIAL PRIMARY KEY,
          category VARCHAR(255),
          metric VARCHAR(255),
          source VARCHAR(255),
          metric_date DATE DEFAULT CURRENT_DATE,
          value_text TEXT,
          formatted_value TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Simple index
      await sql`
        CREATE INDEX IF NOT EXISTS idx_simple_metrics_date 
        ON simple_metrics(metric_date);
      `;

      logger.info("Simple metrics table created");
    } catch (error) {
      logger.error("Table creation error:", error);
    }
  }

  // Insert a simple metric
  static async upsertSnapshot(
    data: CreateMetricSnapshotInput,
  ): Promise<MetricSnapshot> {
    const currentDate =
      data.snapshot_date || new Date().toISOString().split("T")[0];

    const result = await sql`
      INSERT INTO simple_metrics (
        category, metric, source, metric_date,
        value_text, formatted_value, metadata
      ) VALUES (
        ${data.category}, ${data.metric}, ${data.source}, ${currentDate},
        ${data.value_text || null}, ${data.formatted_value}, ${JSON.stringify(data.metadata || {})}
      )
      RETURNING id, category, metric, source, metric_date as snapshot_date, 
               value_text, formatted_value, metadata, created_at, 
               created_at as updated_at, null as value_numeric;
    `;

    return result.rows[0] as MetricSnapshot;
  }

  // Get snapshots for a specific metric (simplified)
  static async getMetricSnapshots(
    category: string,
    metric: string,
    limit: number = 30,
  ): Promise<MetricSnapshot[]> {
    const result = await sql`
      SELECT id, category, metric, source, metric_date as snapshot_date,
             null as value_numeric, value_text, formatted_value, metadata,
             created_at, created_at as updated_at
      FROM simple_metrics
      WHERE category = ${category} 
        AND metric = ${metric}
      ORDER BY metric_date DESC
      LIMIT ${limit};
    `;

    return result.rows as MetricSnapshot[];
  }

  // Get all latest snapshots (one per metric)
  static async getLatestSnapshots(): Promise<MetricSnapshot[]> {
    const result = await sql`
      SELECT id, category, metric, source, metric_date as snapshot_date,
             null as value_numeric, value_text, formatted_value, metadata,
             created_at, created_at as updated_at
      FROM simple_metrics
      ORDER BY metric_date DESC, created_at DESC;
    `;

    return result.rows as MetricSnapshot[];
  }

  // Get snapshots with filters (simplified)
  static async getSnapshots(
    filters: {
      categories?: string[];
      metrics?: string[];
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {},
  ): Promise<MetricSnapshot[]> {
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (filters.categories?.length) {
      whereConditions.push(`category = ANY($${params.length + 1})`);
      params.push(filters.categories);
    }

    if (filters.metrics?.length) {
      whereConditions.push(`metric = ANY($${params.length + 1})`);
      params.push(filters.metrics);
    }

    if (filters.startDate) {
      whereConditions.push(`metric_date >= $${params.length + 1}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereConditions.push(`metric_date <= $${params.length + 1}`);
      params.push(filters.endDate);
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";
    const limitClause = filters.limit ? `LIMIT ${filters.limit}` : "";

    const result = await sql.query(
      `
      SELECT id, category, metric, source, metric_date as snapshot_date,
             null as value_numeric, value_text, formatted_value, metadata,
             created_at, created_at as updated_at
      FROM simple_metrics
      ${whereClause}
      ORDER BY category, metric, metric_date DESC
      ${limitClause};
    `,
      params,
    );

    return result.rows as MetricSnapshot[];
  }

  // Bulk insert snapshots (simplified)
  static async bulkInsertSnapshots(
    snapshots: CreateMetricSnapshotInput[],
  ): Promise<void> {
    if (snapshots.length === 0) return;

    const currentDate = new Date().toISOString().split("T")[0];

    // Use transaction for better performance and consistency
    for (const snapshot of snapshots) {
      await this.upsertSnapshot({
        ...snapshot,
        snapshot_date: snapshot.snapshot_date || currentDate,
      });
    }
  }

  // Get metrics summary (simplified)
  static async getMetricsSummary(): Promise<{
    totalMetrics: number;
    totalSnapshots: number;
    lastSnapshotDate: string;
    datesWithSnapshots: number;
  }> {
    const result = await sql`
      SELECT 
        COUNT(DISTINCT CONCAT(category, '|', metric)) as total_metrics,
        COUNT(*) as total_snapshots,
        MAX(metric_date) as last_snapshot_date,
        COUNT(DISTINCT metric_date) as dates_with_snapshots
      FROM simple_metrics;
    `;

    const row = result.rows[0];
    return {
      totalMetrics: parseInt(row.total_metrics || "0"),
      totalSnapshots: parseInt(row.total_snapshots || "0"),
      lastSnapshotDate: row.last_snapshot_date || "",
      datesWithSnapshots: parseInt(row.dates_with_snapshots || "0"),
    };
  }
}
