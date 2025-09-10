// Database client stub - to be implemented when database is needed

export interface DatabaseClient {
  query: (sql: string, params?: any[]) => Promise<any[]>;
  close: () => Promise<void>;
}

export interface CreateMetricSnapshotInput {
  timestamp?: number;
  snapshot_date?: string;
  category?: string;
  metric?: string;
  source?: string;
  data?: Record<string, any>;
  value?: number;
  value_numeric?: number;
  value_text?: string;
  formatted_value?: string;
  metadata?: Record<string, any>;
}

// Stub implementation for build purposes
export const dbClient: DatabaseClient = {
  async query(sql: string, params?: any[]): Promise<any[]> {
    console.warn("Database client not implemented - returning empty result");
    return [];
  },

  async close(): Promise<void> {
    // No-op for stub
  },
};

export class MetricsDatabase {
  static async initializeSchema(): Promise<void> {
    console.warn("MetricsDatabase schema initialization not implemented");
  }

  static async upsertSnapshot(input: CreateMetricSnapshotInput): Promise<void> {
    console.warn("MetricsDatabase upsertSnapshot not implemented");
  }

  static async bulkInsertSnapshots(snapshots: CreateMetricSnapshotInput[]): Promise<void> {
    console.warn("MetricsDatabase bulkInsertSnapshots not implemented");
  }

  static async getMetricSnapshots(
    category?: string,
    metric?: string,
    limit?: number,
    offset?: number
  ): Promise<any[]> {
    console.warn("MetricsDatabase getMetricSnapshots not implemented");
    return [];
  }

  static async getMetricsSummary(): Promise<any> {
    console.warn("MetricsDatabase getMetricsSummary not implemented");
    return {};
  }

  static async getLatestSnapshots(): Promise<any[]> {
    console.warn("MetricsDatabase getLatestSnapshots not implemented");
    return [];
  }

  static async getTimeseries(
    category?: string,
    metric?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<any[]> {
    console.warn("MetricsDatabase getTimeseries not implemented");
    return [];
  }

  static async getSnapshots(options?: {
    limit?: number;
    offset?: number;
    categories?: string[];
    metrics?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    console.warn("MetricsDatabase getSnapshots not implemented");
    return [];
  }

  async createSnapshot(input: CreateMetricSnapshotInput): Promise<void> {
    console.warn("MetricsDatabase not implemented");
  }

  async getSnapshots(): Promise<any[]> {
    return [];
  }

  async getTimeseriesData(): Promise<any[]> {
    return [];
  }
}

// Export for backwards compatibility
export default dbClient;
